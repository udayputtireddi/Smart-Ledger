import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection, collectionGroup, deleteDoc, deleteField, doc, getDoc, getDocs,
  orderBy, query, setDoc, updateDoc, writeBatch, onSnapshot
} from 'firebase/firestore';

// Never use a configured live project or a remote emulator endpoint.
const projectId = 'demo-smart-ledger';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
  throw new Error('Run npm run test:rules with the local Firestore emulator at 127.0.0.1:8080.');
}

let env;
const valid = () => ({
  description: 'Lunch', amount: 12.50, date: '2026-10-25',
  type: 'EXPENSE', category: 'Food & Drink', isAutoCategorized: true,
  createdAt: 1792886400000
});
const dbFor = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
const txRef = (db, uid = 'alice', id = 'tx') => doc(db, 'users', uid, 'transactions', id);

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') }
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(txRef(context.firestore()), valid());
    await setDoc(txRef(context.firestore(), 'bob'), valid());
  });
});

test('owner can create, get, list ordered by date, update and delete', async () => {
  const db = dbFor('alice');
  const ref = txRef(db, 'alice', 'new');
  await assertSucceeds(setDoc(ref, valid()));
  await assertSucceeds(getDoc(ref));
  const result = await assertSucceeds(getDocs(query(collection(db, 'users/alice/transactions'), orderBy('date', 'desc'))));
  assert.equal(result.size, 2);
  await assertSucceeds(updateDoc(ref, { amount: 15, updatedAt: 1792886400001 }));
  await assertSucceeds(deleteDoc(ref));
});

for (const uid of [null, 'bob']) {
  for (const operation of ['get', 'list', 'create', 'update', 'delete']) {
    test(`${uid ?? 'unauthenticated'} cannot ${operation} Alice transactions`, async () => {
      const db = dbFor(uid);
      const operations = {
        get: () => getDoc(txRef(db)),
        list: () => getDocs(query(collection(db, 'users/alice/transactions'), orderBy('date', 'desc'))),
        create: () => setDoc(txRef(db, 'alice', 'new'), valid()),
        update: () => updateDoc(txRef(db), { amount: 99 }),
        delete: () => deleteDoc(txRef(db))
      };
      await assertFails(operations[operation]());
    });
  }
}

test('realtime query works for owner and fails for another user', async () => {
  function firstSnapshot(db) {
    return new Promise((resolve, reject) => {
      const stop = onSnapshot(query(collection(db, 'users/alice/transactions'), orderBy('date', 'desc')),
        snapshot => { stop(); resolve(snapshot); }, error => { stop(); reject(error); });
    });
  }
  await assertSucceeds(firstSnapshot(dbFor('alice')));
  await assertFails(firstSnapshot(dbFor('bob')));
});

for (const path of ['users/alice', 'users/bob', 'transactions/tx', 'admin/settings', 'users/alice/transactions/tx/private/secret']) {
  test(`default deny protects ${path}`, async () => {
    const ref = doc(dbFor('alice'), path);
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, valid()));
    await assertFails(updateDoc(ref, { amount: 5 }));
    await assertFails(deleteDoc(ref));
  });
}

test('unrestricted collection-group and users queries are denied', async () => {
  const db = dbFor('alice');
  await assertFails(getDocs(collectionGroup(db, 'transactions')));
  await assertFails(getDocs(collection(db, 'users')));
});

const invalidPatches = [
  ['forged ID', { id: 'other-document' }], ['forged owner', { ownerUid: 'alice' }],
  ['role injection', { role: 'admin' }], ['negative amount', { amount: -1 }],
  ['zero amount', { amount: 0 }], ['amount string', { amount: '10' }],
  ['NaN', { amount: NaN }], ['infinity', { amount: Infinity }],
  ['oversized amount', { amount: 1000000000001 }],
  ['empty description', { description: '' }], ['oversized description', { description: 'x'.repeat(2001) }],
  ['description type', { description: 5 }], ['invalid date', { date: '2026-13-01' }],
  ['date type', { date: 1792886400000 }], ['unknown type', { type: 'TRANSFER' }],
  ['category type', { category: [] }], ['empty category', { category: '' }],
  ['oversized category', { category: 'x'.repeat(101) }], ['flag type', { isAutoCategorized: 'true' }],
  ['timestamp type', { updatedAt: 'now' }], ['negative timestamp', { updatedAt: -1 }]
];
for (const [name, patch] of invalidPatches) {
  test(`owner cannot create or update invalid data: ${name}`, async () => {
    const db = dbFor('alice');
    await assertFails(setDoc(txRef(db, 'alice', 'invalid'), { ...valid(), ...patch }));
    await assertFails(updateDoc(txRef(db), patch));
  });
}

for (const field of ['description', 'amount', 'date', 'type', 'category']) {
  test(`required field ${field} cannot be omitted or removed`, async () => {
    const db = dbFor('alice');
    const data = valid(); delete data[field];
    await assertFails(setDoc(txRef(db, 'alice', 'missing'), data));
    await assertFails(updateDoc(txRef(db), { [field]: deleteField() }));
  });
}

test('optional legacy timestamps remain compatible; createdAt is immutable', async () => {
  const db = dbFor('alice');
  const data = valid(); delete data.createdAt; delete data.isAutoCategorized;
  const legacy = txRef(db, 'alice', 'legacy');
  await assertSucceeds(setDoc(legacy, data));
  await assertSucceeds(updateDoc(legacy, { amount: 2, updatedAt: 1792886400001 }));
  await assertFails(updateDoc(legacy, { createdAt: 123 }));
  await assertFails(updateDoc(txRef(db), { createdAt: 123 }));
  await assertFails(updateDoc(txRef(db), { createdAt: deleteField() }));
});

test('nonconforming legacy records can be read/deleted but invalid edits fail', async () => {
  await env.withSecurityRulesDisabled(context => setDoc(txRef(context.firestore(), 'alice', 'old'), { ...valid(), amount: -1 }));
  const ref = txRef(dbFor('alice'), 'alice', 'old');
  await assertSucceeds(getDoc(ref));
  await assertFails(updateDoc(ref, { description: 'Still invalid' }));
  await assertSucceeds(deleteDoc(ref));
});

test('valid owner batch succeeds; mixed-owner batch fails atomically', async () => {
  const db = dbFor('alice');
  const allowed = writeBatch(db);
  allowed.set(txRef(db, 'alice', 'batch-one'), valid());
  allowed.update(txRef(db), { amount: 20 });
  await assertSucceeds(allowed.commit());
  const denied = writeBatch(db);
  denied.set(txRef(db, 'alice', 'must-not-exist'), valid());
  denied.delete(txRef(db, 'bob'));
  await assertFails(denied.commit());
  assert.equal((await getDoc(txRef(db, 'alice', 'must-not-exist'))).exists(), false);
  assert.equal((await getDoc(txRef(dbFor('bob'), 'bob'))).exists(), true);
});
