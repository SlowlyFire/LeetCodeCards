// Mongoose .populate('patternId') replaces the ObjectId with the full Pattern doc,
// but the key stays "patternId". This renames it to "pattern" so every question
// response (list, single, drill) has the same, cleaner shape for the frontend.
export function renamePatternField(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const { patternId, ...rest } = doc;
  return { ...rest, pattern: patternId ?? null };
}
