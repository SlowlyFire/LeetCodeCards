import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pattern } from '../models/Pattern.js';
import { Question } from '../models/Question.js';

// ES modules don't have __dirname — reconstruct it from the file's URL
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Types matching the shape of seed-data.json ────────────────────────────────

interface SeedPattern {
  name: string;
  globalCategory?: string;
  whenToUse?: string;
  keyInsight?: string;
  template?: string;
  pitfalls?: string;
  signalWords?: string[];
}

interface SeedQuestion {
  number: number;
  title: string;
  patternName?: string; // resolved to patternId during seeding
  section?: string;
  difficulty?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  myDifficulty?: number;
  status?: string;
  problemStatement?: string;
  mySolution?: string;
  notes?: string;
}

interface SeedData {
  patterns: SeedPattern[];
  questions: SeedQuestion[];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  // ── Load seed data ────────────────────────────────────────────────────────
  // Script lives at src/scripts/seed.ts → ../../seed/seed-data.json from here
  const dataPath = join(__dirname, '../../seed/seed-data.json');
  const raw = await readFile(dataPath, 'utf-8');
  const data: SeedData = JSON.parse(raw);

  // ── Connect ───────────────────────────────────────────────────────────────
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment');

  await mongoose.connect(uri);
  const dbName = mongoose.connection.name;
  console.log(`Connected → ${mongoose.connection.host} / ${dbName}`);

  // ── Optional reset ────────────────────────────────────────────────────────
  if (reset) {
    console.log('--reset: clearing patterns and questions...');
    await Pattern.deleteMany({});
    await Question.deleteMany({});
    console.log('Collections cleared.\n');
  }

  // ── Phase 1: Patterns ─────────────────────────────────────────────────────
  // Build map from existing patterns first so we don't re-insert anything
  const patternMap = new Map<string, mongoose.Types.ObjectId>();

  const existing = await Pattern.find({}, { name: 1, _id: 1 }).lean();
  for (const p of existing) {
    patternMap.set(p.name, p._id as mongoose.Types.ObjectId);
  }

  let pInserted = 0;
  let pSkipped = 0;

  for (const sp of data.patterns) {
    if (patternMap.has(sp.name)) {
      pSkipped++;
      continue;
    }
    const doc = await Pattern.create(sp);
    patternMap.set(doc.name, doc._id as mongoose.Types.ObjectId);
    pInserted++;
  }

  console.log(`Patterns  → inserted ${pInserted}, skipped ${pSkipped} (already existed)`);

  // ── Phase 2: Questions ────────────────────────────────────────────────────
  // Fetch existing question numbers so we can skip duplicates
  const existingNums = new Set<number>(
    (await Question.find({}, { number: 1 }).lean()).map(
      (q) => (q as { number: number }).number,
    ),
  );

  let qInserted = 0;
  let qSkipped = 0;
  let qWarned = 0;

  for (const sq of data.questions) {
    // Skip if a question with this number already exists
    if (existingNums.has(sq.number)) {
      qSkipped++;
      continue;
    }

    // Separate patternName (seed-only field) from the rest
    const { patternName, ...qData } = sq;

    let patternId: mongoose.Types.ObjectId | undefined;
    if (patternName) {
      patternId = patternMap.get(patternName);
      if (!patternId) {
        // Unknown pattern name — log a clear warning and skip this question
        console.warn(
          `  ⚠  #${sq.number} "${sq.title}" — unknown patternName "${patternName}", skipping`,
        );
        qWarned++;
        continue;
      }
    }

    await Question.create({ ...qData, patternId });
    qInserted++;
  }

  console.log(
    `Questions → inserted ${qInserted}, skipped ${qSkipped} (already existed), warned ${qWarned} (unknown pattern)`,
  );

  // ── Disconnect ────────────────────────────────────────────────────────────
  await mongoose.disconnect();
  console.log('\nDone.');
  process.exit(0);
}

seed().catch((err: Error) => {
  console.error('Fatal error during seed:', err.message);
  process.exit(1);
});
