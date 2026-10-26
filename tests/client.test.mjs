import test from 'node:test';
import assert from 'node:assert/strict';
import { transactionFromDocument, validateTransactionInput } from '../services/transactionValidation.js';

test('stored data cannot replace the canonical document ID', () => {
  const tx = transactionFromDocument({ id: 'real-document', data: () => ({ id: 'victim-document', amount: 10 }) });
  assert.equal(tx.id, 'real-document');
  assert.equal(tx.amount, 10);
});

test('valid positive amount and leap day are accepted', () => {
  assert.doesNotThrow(() => validateTransactionInput('Lunch', 0.01, '2024-02-29', 'EXPENSE'));
});

for (const amount of [NaN, Infinity, -Infinity, 0, -1, 1000000000001]) {
  test(`invalid amount ${amount} is rejected before saving`, () => {
    assert.throws(() => validateTransactionInput('Lunch', amount, '2026-10-25', 'EXPENSE'));
  });
}

for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-10-00', '10/25/2026', '']) {
  test(`invalid calendar date ${JSON.stringify(date)} is rejected`, () => {
    assert.throws(() => validateTransactionInput('Lunch', 10, date, 'EXPENSE'));
  });
}

test('empty or oversized descriptions and unknown types are rejected', () => {
  for (const description of ['', '   ', 'x'.repeat(2001)]) {
    assert.throws(() => validateTransactionInput(description, 10, '2026-10-25', 'EXPENSE'));
  }
  assert.throws(() => validateTransactionInput('Lunch', 10, '2026-10-25', 'ADMIN'));
});
