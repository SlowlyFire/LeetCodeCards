// Spaced-repetition logic — PURE functions only (no DB, no side effects) so the
// fiddly bits are trivial to test and reason about. Used by drill.controller and
// stats.controller.

export type SrBucket = 'Hot' | 'Warm' | 'Mastered';
export type Grade = 'got_it' | 'hmm' | 'forgot';

// How long a card "rests" in each bucket before it's due again (in days).
// Hot = 0 means a Hot card is always due.
export const REVIEW_INTERVAL_DAYS: Record<SrBucket, number> = {
  Hot: 0,
  Warm: 3,
  Mastered: 14,
};

// Drill ordering priority — lower is drilled first.
export const BUCKET_PRIORITY: Record<SrBucket, number> = {
  Hot: 0,
  Warm: 1,
  Mastered: 2,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The transition table from the spec:
//            got_it        forgot      hmm
//   Hot   →  Warm          Hot         Hot
//   Warm  →  Mastered      Hot         Warm
//   Master→  Mastered      Hot         Mastered
export function nextBucket(current: SrBucket, grade: Grade): SrBucket {
  if (grade === 'hmm') return current; // neither promote nor demote
  if (grade === 'forgot') return 'Hot'; // any bucket demotes to Hot
  // grade === 'got_it' → promote one step (Mastered is the ceiling)
  if (current === 'Hot') return 'Warm';
  if (current === 'Warm') return 'Mastered';
  return 'Mastered';
}

// A card is due when its rest interval has elapsed since the last review, or it
// has never been reviewed.
export function isDue(
  bucket: SrBucket,
  lastReviewedAt: Date | null,
  now: Date,
): boolean {
  if (lastReviewedAt == null) return true;
  const elapsedDays = (now.getTime() - lastReviewedAt.getTime()) / MS_PER_DAY;
  return elapsedDays >= REVIEW_INTERVAL_DAYS[bucket];
}

// Days-since-epoch in UTC — used to bucket timestamps into calendar days.
function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

// Streak = number of consecutive calendar days (UTC) ending today (or yesterday,
// as a grace day) on which at least one card was reviewed. 0 if the most recent
// review day is older than yesterday.
export function computeStreak(reviewDates: Date[], now: Date): number {
  if (reviewDates.length === 0) return 0;

  const days = new Set(reviewDates.map(utcDayNumber));
  const today = utcDayNumber(now);

  // The run must reach today or yesterday to count as a live streak.
  let cursor: number;
  if (days.has(today)) cursor = today;
  else if (days.has(today - 1)) cursor = today - 1;
  else return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
