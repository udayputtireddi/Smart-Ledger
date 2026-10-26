# Firestore security audit and validation

Status: proposed hardening; CI passed all 47 emulator authorization tests,
15 client tests, TypeScript checking and production build. Live verification and
deployment approval remain outstanding. [Current PR checks](https://github.com/udayputtireddi/Smart-Ledger/pull/1/checks)
include revalidation after committing the resolved test-tool lockfile.
Reviewed base: `498afb69f6fd0fd41764808293a9c5b8f8206c13`.

## Scope and evidence

Reviewed the complete repository tree and all source files. The only Firestore
operations were the listener and CRUD handlers in `App.tsx`, plus batch deletes
and inserts in `components/DataManagementModal.tsx`. They all targeted
`users/{uid}/transactions/{id}`. No Admin SDK/backend implementation was present.

The repository had no rules, emulator configuration, authorization tests or CI.
`firebase.json` configured Hosting only. `.firebaserc` names `smart-ledgerr`, while
the browser's project ID comes from build environment variables; the deployed
frontend's actual target is unverified.

Firebase Console access was blocked by the execution environment with
"Forbidden. Calls to this URL are not allowed." Deployed rules, database identity,
IAM and live data were not inspected. Missing repository rules do not prove open
production access. No requests were made against production Firestore data.
Desktop/ChatGPT shared/project instructions were inaccessible; no repository
`AGENTS.md` or `INSTRUCTIONS.md` was present. The user approved the proposed changes.

## Changes and compatibility

- Rules enforce Firebase Auth UID ownership on the exact transaction path, with
  default denial elsewhere. No email-verification requirement or new admin bypass
  is introduced. Security Rules do not constrain trusted Admin SDK/IAM access.
- Writes require the five existing core fields; additional fields are rejected
  except optional `isAutoCategorized`, `createdAt` and `updatedAt`. Amounts must be
  positive and at most 1e12; descriptions at most 2,000 characters and categories
  at most 100. Dates have basic format/range validation; client validation also
  checks calendar validity. Rules do not validate month-specific day counts.
- Numeric timestamps remain supported, including records without timestamps.
  `createdAt` cannot be added, changed or removed on update. These client-provided
  timestamps are metadata, not trusted audit timestamps.
- Owner reads/deletes of legacy records remain allowed. Updates must produce a
  compliant document. Zero/negative amounts, unknown fields and other malformed
  legacy records may require a separately approved remediation. No migration ran.
- The ordered owner query needs no new composite index. Collection-group and
  unrelated paths remain denied. Unknown consumers outside this repository have
  not been checked.
- Client writes now await completion and surface errors. Listener failures clear
  displayed data and show an error. Auth changes clear transactions and modal
  state; stale callbacks are ignored. Firebase Auth is the session source.
- Snapshot IDs override any stored `id`, preventing document-data ID spoofing.
- Restore was broken because its required user prop was missing. Its internal
  implementation deleted all existing data before inserting weakly validated
  imports. Restore is now explicitly unavailable; backup export remains.
- Hosting-only deployment instructions prevent an ordinary website release from
  also deploying the newly registered rules. No CI deployment is configured.

## Validation

| Check | Result |
| --- | --- |
| Source/operation inventory | Complete |
| Client validation/document-ID regression tests | 15 passed locally |
| Rules test JavaScript syntax | Passed `node --check` |
| Patch whitespace check | Passed `git diff --check` |
| Rules compilation and emulator suite | 47 passed in GitHub Actions |
| TypeScript and production build | Both passed in GitHub Actions |
| Live rules comparison / production smoke test | Not performed; Console blocked |
| Deployment / merge / production mutation | None |

Initial successful run: [CI 40263000870](https://github.com/udayputtireddi/Smart-Ledger/actions/runs/40263000870).

Local npm registry access returned HTTP 403. Java 17 is available locally; CI
provisions Java 21 and Node 22. The isolated test tooling uses exact direct versions
and a lockfile resolved in GitHub Actions run 40263103224. Its artifact SHA-256,
root dependency versions and registry download origins were verified before
committing. CI now installs both dependency trees with `npm ci`.

The emulator suite covers owner CRUD/query/listener success, unauthenticated and
cross-user denial, unrelated/nested paths, collection-group denial, field injection,
types, sizes, amounts, required fields, legacy timestamps, createdAt immutability,
legacy reads/deletes and mixed-owner batch atomicity. It refuses any emulator host
other than `127.0.0.1:8080` and hardcodes `demo-smart-ledger`.

Run the commands in [README](../README.md#firestore-security-and-validation).
CI results must be reviewed before approval; this report does not claim that
syntactic checks establish Firestore authorization correctness. Browser-level
account-switch, error-message and backup smoke tests remain manual release gates.

## Release gates and next work

1. Obtain and compare the actual deployed rules for the correct project/database.
2. Require successful CI and review legacy schema compatibility without changing data.
3. Exercise login, account switching, CRUD errors and export in a non-production environment.
4. Request explicit deployment approval only after the above gates are satisfied.
   Merging this PR alone does not deploy rules. No rules deployment command was run.

Next highest-priority security issue: Gemini API key exposure in the client.
`vite.config.ts` injects `GEMINI_API_KEY` into browser code; the Gemini service also
reads `VITE_API_KEY` and directly sends descriptions/amounts to Gemini. A configured
key can be extracted from a deployed frontend. Actual deployed key exposure and
restrictions are unverified. Move calls to a backend that verifies Firebase ID
tokens, validates inputs and enforces quotas/rate limits. Rotate any exposed key
only with approval after the replacement path is ready.

CI also reported 21 advisories in the existing application dependency tree
(1 low, 4 moderate, 14 high, 2 critical). This was the npm install summary, not an
exploitability assessment. Dependency advisory triage is a separate urgent
follow-up; this PR does not claim to remediate those packages.

Follow-up reliability issue: redesign restore with full prevalidation, explicit
confirmation, recoverability and safe failure handling before re-enabling it.

## References

- [Rule conditions and ownership](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Field validation](https://firebase.google.com/docs/firestore/security/rules-fields)
- [Security Rules unit tests](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)
