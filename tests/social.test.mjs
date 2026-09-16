import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRatingAggregate, markPlayRecorded, normaliseComment, shouldRecordPlay } from '../src/social.js';

test('a first rating creates a one-person aggregate', () => {
  assert.deepEqual(calculateRatingAggregate({ ratingCount: 0, ratingTotal: 0 }, null, 4), {
    ratingCount: 1,
    ratingTotal: 4,
    rating: 4,
  });
});

test('changing a rating keeps its voter count and replaces its value', () => {
  assert.deepEqual(calculateRatingAggregate({ ratingCount: 2, ratingTotal: 9 }, 5, 2), {
    ratingCount: 2,
    ratingTotal: 6,
    rating: 3,
  });
});

test('rating input and comments are bounded before a Firestore write', () => {
  assert.throws(() => calculateRatingAggregate({ ratingCount: 0, ratingTotal: 0 }, null, 6), /invalid-rating/);
  assert.equal(normaliseComment('  작품이 정말 좋아요!  '), '작품이 정말 좋아요!');
  assert.equal(normaliseComment('x'.repeat(510)).length, 500);
});

test('play count is throttled per project in the same browser', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(shouldRecordPlay('app-1', 1_000, storage), true);
  markPlayRecorded('app-1', 1_000, storage);
  assert.equal(shouldRecordPlay('app-1', 1_000 + 29 * 60 * 1000, storage), false);
  assert.equal(shouldRecordPlay('app-1', 1_000 + 30 * 60 * 1000, storage), true);
});
