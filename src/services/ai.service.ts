import Anthropic, { APIError } from '@anthropic-ai/sdk';
import { Pattern } from '../models/Pattern.js';
import { AppError } from '../lib/AppError.js';
import type { AnalyzeQuestionInput } from '../schemas/ai.schema.js';

// Single SDK client. `new Anthropic()` reads ANTHROPIC_API_KEY from the environment
// automatically (loaded by dotenv in index.ts) — never hardcode the key.
const anthropic = new Anthropic();

// Decisions (Session 5):
// - Model: Sonnet 4.6 — strong at structured extraction, ~$0.02–0.04 per call (under budget).
// - temperature 0.3 — low randomness for consistent, structured output.
// - Structured Outputs (output_config.format) — the model is FORCED to return JSON
//   matching the schema below, which eliminates the "malformed JSON" failure mode.
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.3;

// The exact shape we want back. This mirrors the JSON schema passed to the API.
export interface AnalyzeQuestionResult {
  title: string;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  suggestedPattern: {
    // Name of an EXISTING pattern, or 'NEW' if none match.
    name: string;
    newPatternSuggestion: null | {
      name: string;
      globalCategory: string;
      whenToUse: string;
      keyInsight: string;
      template: string;
      pitfalls: string;
      signalWords: string[];
    };
  };
  mySolutionSkeleton: string;
  notes: string;
}

// JSON Schema for Structured Outputs. Rules the API enforces:
// - every object needs additionalProperties:false and lists all keys in `required`
// - nullable fields are expressed with anyOf [ null, {...} ]
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    section: { type: 'string' },
    difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
    timeComplexity: { type: 'string' },
    spaceComplexity: { type: 'string' },
    suggestedPattern: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        newPatternSuggestion: {
          anyOf: [
            { type: 'null' },
            {
              type: 'object',
              properties: {
                name: { type: 'string' },
                globalCategory: { type: 'string' },
                whenToUse: { type: 'string' },
                keyInsight: { type: 'string' },
                template: { type: 'string' },
                pitfalls: { type: 'string' },
                signalWords: { type: 'array', items: { type: 'string' } },
              },
              required: [
                'name',
                'globalCategory',
                'whenToUse',
                'keyInsight',
                'template',
                'pitfalls',
                'signalWords',
              ],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ['name', 'newPatternSuggestion'],
      additionalProperties: false,
    },
    mySolutionSkeleton: { type: 'string' },
    notes: { type: 'string' },
  },
  required: [
    'title',
    'section',
    'difficulty',
    'timeComplexity',
    'spaceComplexity',
    'suggestedPattern',
    'mySolutionSkeleton',
    'notes',
  ],
  additionalProperties: false,
} as const;

// Builds the system prompt, injecting a compact list of existing patterns as context
// so Claude can either match one or propose a genuinely new pattern.
function buildSystemPrompt(
  patterns: { name: string; whenToUse: string; signalWords: string[] }[],
): string {
  const patternList = patterns
    .map(
      (p) =>
        `- ${p.name}: ${p.whenToUse || '(no description)'} [signals: ${
          p.signalWords.join(', ') || 'none'
        }]`,
    )
    .join('\n');

  return `You are an interview-prep assistant that analyzes coding problems (LeetCode / HackerRank style) for a student building a study deck.

Here are the algorithm patterns already in the student's database:
${patternList}

Analyze the given problem and return structured data. Follow these rules precisely:

- title: a concise problem title (use the provided title if one is given).
- section: the topic area, e.g. "Arrays", "Hash Tables", "Graphs", "Dynamic Programming".
- difficulty: "Easy", "Medium", or "Hard".
- timeComplexity / spaceComplexity: the OPTIMAL complexity (e.g. "O(n)", "O(n log n)"), not a naive one. If genuinely unclear, use "Unknown".
- suggestedPattern.name: if the problem clearly maps to one of the EXISTING patterns above, use that pattern's exact name and set newPatternSuggestion to null. Otherwise set name to "NEW" and fully populate newPatternSuggestion.
- newPatternSuggestion (only when name is "NEW"): a complete new pattern — name, globalCategory, whenToUse, keyInsight, a multi-line TypeScript template skeleton, pitfalls, and 2-4 signalWords.
- mySolutionSkeleton: a TypeScript function signature with comments outlining the approach. This is a SKELETON to guide the student's own thinking — do NOT write the full solution. Include the signature, key steps as comments, and return statement, but leave the core logic for the student.
- notes: 2-3 concise hints, gotchas, or things to watch out for.

Anti-hallucination: if you are uncertain about any field, prefer "Unknown" over inventing details. Be accurate, not impressive.`;
}

// Pulls the first text block out of the response. With Structured Outputs the first
// block is guaranteed to be text containing valid JSON.
function extractText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new AppError(500, 'AI returned no text content');
  }
  return block.text;
}

export async function analyzeQuestion(
  input: AnalyzeQuestionInput,
): Promise<AnalyzeQuestionResult> {
  // 1. Fetch existing patterns — only the fields we need, to keep the prompt small.
  const patterns = await Pattern.find({}, 'name whenToUse signalWords').lean();

  // 2. Call Claude. Anything the SDK throws (auth, rate limit, network) becomes a 502.
  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: buildSystemPrompt(patterns),
      output_config: {
        format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: input.title
            ? `Title: ${input.title}\n\nProblem statement:\n${input.problemStatement}`
            : `Problem statement:\n${input.problemStatement}`,
        },
      ],
    });
  } catch (err) {
    if (err instanceof APIError) {
      throw new AppError(502, `AI service error: ${err.message}`);
    }
    throw err;
  }

  // 3. Guard against model-side stops that would yield unusable output.
  if (message.stop_reason === 'refusal') {
    throw new AppError(502, 'The AI declined to analyze this problem.');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new AppError(
      502,
      'AI response was cut off (too long). Try a shorter problem statement.',
    );
  }

  // 4. Parse. Structured Outputs makes this safe, but we still guard defensively.
  try {
    return JSON.parse(extractText(message)) as AnalyzeQuestionResult;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(500, 'AI returned a malformed response. Please try again.');
  }
}
