import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRatingAggregate, normaliseComment } from '../src/social.js';

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
