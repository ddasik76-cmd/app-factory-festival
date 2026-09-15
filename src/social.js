/**
 * @param {{ ratingCount: number, ratingTotal: number }} current
 * @param {number | null} previousValue
 * @param {number} nextValue
 */
export function calculateRatingAggregate(current, previousValue, nextValue) {
  if (!Number.isInteger(nextValue) || nextValue < 1 || nextValue > 5) throw new Error('invalid-rating');
  const ratingCount = Math.max(0, Math.floor(Number(current.ratingCount) || 0));
  const ratingTotal = Math.max(0, Number(current.ratingTotal) || 0);
  const previous = Number.isInteger(previousValue) && previousValue !== null && previousValue >= 1 && previousValue <= 5
    ? previousValue
    : null;
  const nextCount = previous === null ? ratingCount + 1 : ratingCount;
  const nextTotal = ratingTotal - (previous ?? 0) + nextValue;
  return { ratingCount: nextCount, ratingTotal: nextTotal, rating: nextTotal / nextCount };
}

/** @param {string} body */
export function normaliseComment(body) {
  return body.trim().slice(0, 500);
}
