import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { reserveQuota } from '../functions/src/security.mjs';

// Never allow this suite to use a real project or cloud endpoint.
assert.equal(process.env.GCLOUD_PROJECT, 'demo-smart-ledger');
assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
delete process.env.GEMINI_API_KEY;
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-smart-ledger' });
const { aiGateway } = require('../functions/lib/index.cjs');
const server = createServer(aiGateway);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const endpoint = `http://127.0.0.1:${server.address().port}/api/ai`;
const authEndpoint = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`;
const payload = {operation:'categorize',input:{description:'Lunch',amount:12,type:'EXPENSE'}};
async function signup(anonymous = false) {
  const response = await fetch(authEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(anonymous ? {returnSecureToken:true} : {email:`test-${crypto.randomUUID()}@example.test`,password:'emulator-only-password',returnSecureToken:true})});
  assert.equal(response.status,200);
  return response.json();
}
async function call(token, body = payload) {
  return fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
}
test('real gateway rejects absent and invalid tokens',async()=>{
  assert.equal((await call()).status,401);
  assert.equal((await call('not-a-jwt')).status,401);
});
test('Admin SDK verifies emulator identity; missing server secret fails closed',async()=>{
  const user=await signup();
  assert.equal((await call(user.idToken)).status,503);
  assert.equal((await call(user.idToken,{operation:'unsupported',input:{}})).status,400);
});
test('disabled and anonymous accounts cannot use AI',async()=>{
  const user=await signup();
  await getAuth(app).updateUser(user.localId,{disabled:true});
  assert.equal((await call(user.idToken)).status,401);
  assert.equal((await call((await signup(true)).idToken)).status,401);
});
test('named quota database denies signed-in client reads and writes',async()=>{
  const user=await signup();
  const url=`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-smart-ledger/databases/ai-security/documents/aiUsage/test`;
  const headers={Authorization:`Bearer ${user.idToken}`,'Content-Type':'application/json'};
  assert.equal((await fetch(url,{headers})).status,403);
  assert.equal((await fetch(url,{method:'PATCH',headers,body:JSON.stringify({fields:{used:{integerValue:'0'}}})})).status,403);
});
test('real Firestore transactions enforce atomic quota reservations',async()=>{
  const db=getFirestore(app,'ai-security');
  const id='test-'+crypto.randomUUID();
  // Two requests at cost 40 compete for a minute allowance of 60.
  const results=await Promise.allSettled([reserveQuota(db,id,'alice',40,0),reserveQuota(db,id,'alice',40,0)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.status===429).length,1);
  assert.equal((await db.collection('aiUsage').doc(id+'-global-day').get()).data().used,40);
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await deleteApp(app);});
