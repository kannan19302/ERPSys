# Connect Module — QA Report (Teams/GChat Parity Pass, Phase A/B)

> **Tester**: qa-tester agent
> **Date**: 2026-07-02
> **Scope**: Backend `apps/api/src/modules/communication` + `notifications.gateway.ts`, frontend `apps/web/app/(dashboard)/connect/`
> **Method**: ran existing automated suite, added no new test files (see "Coverage gap" below for what should be added), did a live manual API smoke test against the running dev stack (Postgres/Redis/MinIO up, API on :3001, Web on :3000, logged in as `admin@unerp.dev` / seeded "System Tenant").
> **Requirements source**: `.ai/CONNECT_MODULE_REQUIREMENTS.md` (Given/When/Then per user story) — read in full before testing, not re-derived.

---

## 0. Overall result

**60 / 60 existing automated tests pass.** Live API smoke testing found **one new P0 functional bug** (channel-owner assignment is missing entirely) that the existing test suite does not catch, plus confirms the previously-flagged **P0 UI-invisibility bug** (no `PermissionContext.Provider` anywhere in `apps/web`) is real and currently blocks all `ProtectedComponent`-gated UI for all users, including Super Admin.

**Recommendation: NO-GO for UAT sign-off on Phase B (channel/space management + roles) as currently shipped.** Phase A (file attachments, WebSocket wiring, search) is solid and **GO** for UAT. See §7 for the full breakdown.

---

## 11. RE-VERIFICATION PASS (2026-07-02, same day) — Both P0s CLOSED

> Re-verified after backend-developer/frontend-developer fixes landed. Method: direct code read of both diffs, re-ran the full automated suite (module-scoped and full `api` package), and live API calls against the same running dev stack (no restart needed — hot reload picked up the changes).

### 11.1 Bug #1 (channel creator never seeded as OWNER) — **CLOSED, verified three ways**

1. **Code read** — `apps/api/src/modules/communication/communication.service.ts` `createChannel` (line ~227) now includes:
   ```ts
   members: { create: [{ tenantId, userId, role: 'OWNER' }] },
   ```
   matching the existing `getOrCreateDM`/`createGroup` seeding pattern exactly as the suggested fix in §2 specified.

2. **New tests, real assertions (not the weak try/catch coverage-spec pattern flagged in §1)** — `communication.channel-management.spec.ts` now has:
   - `createChannel seeds the creator as a ChannelMember with role OWNER` — asserts `prisma.channel.create` was called with `members: { create: [{ tenantId: 't1', userId: 'creator-1', role: 'OWNER' }] }`, and asserts the returned object's `members` array matches. This is a tight assertion — it would fail if `createChannel` were reverted to a no-op or if `role` defaulted to `MEMBER`.
   - `creator of a freshly created channel can immediately list members, rename, and archive it (no 403)` — end-to-end unit-level walkthrough of `getChannelMembers` → `updateChannel` (rename) → `updateChannel` (archive), all as the creator, all resolving without throwing.

   Ran `pnpm --filter api exec vitest run src/modules/communication`:
   ```
   ✓ src/modules/communication/tests/communication.service.coverage.spec.ts (31 tests)
   ✓ src/modules/communication/tests/communication.channel-management.spec.ts (16 tests)
   ✓ src/modules/communication/tests/communication.attachments-and-realtime.spec.ts (7 tests)
   ✓ src/modules/communication/tests/communication.service.spec.ts (8 tests)

   Test Files  4 passed (4)
        Tests  62 passed (62)
   ```
   (62 vs. the original 60 — the +2 are the new owner-seeding tests above; channel-management went from 14→16.)

3. **Live API re-test against the running dev stack** (`admin@unerp.dev`, System Tenant), repeating the exact repro from §2 verbatim:
   ```
   POST /api/v1/communication/channels {"name":"qa-verify-owner-fix","topic":"QA re-verify P0 fix"}
   → 201, id cmr2tlet000177ktoixdo7wmr, createdBy = admin's userId

   GET /api/v1/communication/channels/cmr2tlet000177ktoixdo7wmr/members
   → 200 [{"userId":"cmqnnhrdf00087kkszxl02ric","role":"OWNER"}]   (was 403 before the fix)

   PATCH /api/v1/communication/channels/cmr2tlet000177ktoixdo7wmr {"name":"qa-verify-owner-fix-renamed"}
   → 200, name updated                                              (was 403 before the fix)

   PATCH /api/v1/communication/channels/cmr2tlet000177ktoixdo7wmr {"archived":true}
   → 200, archived: true                                            (was 403 before the fix)
   ```
   All three previously-403ing calls now succeed, in the same session, against the same live stack, for a brand-new channel — not a pre-seeded one. **Bug #1 is closed.**

### 11.2 Bug #2 (`PermissionContext` never provided in `apps/web`) — **CLOSED, verified by code + live `/auth/me`, browser click-through deferred**

1. **Code read** — `apps/web/src/components/PermissionProvider.tsx` is new: hydrates `permissions` synchronously from the `user` object already in `localStorage` (set at login), then refreshes in the background from `GET /auth/me`. Wraps `PermissionContext.Provider` from `@unerp/ui`'s `protected-component.tsx`.
2. **Wiring confirmed** — `apps/web/app/(dashboard)/layout.tsx` imports `PermissionProvider` (line 99) and wraps the dashboard tree with it (lines 636/1656). This is the exact gap called out in §3 ("Checked `apps/web/app/(dashboard)/layout.tsx` for any provider wiring — none found") — now present.
3. **`usePermission` wildcard handling confirmed** — `packages/ui/src/components/protected-component.tsx`'s `usePermission` treats `p === '*'` as always-true (line 29), and `admin@unerp.dev`'s `/auth/me` and `/auth/login` responses both return `"permissions":["*"]` (confirmed live below). Combined with the provider now being mounted, `communication.channel.manage`/`communication.channel.member.manage` gates on "Manage channel" will resolve to `true` for this user — closing the invisibility bug by direct code-path tracing.
4. **Live re-test of the prerequisite tenant-scope fix** (`packages/database/src/tenant-scope.ts` adding `'UserRole'` to `MODELS_WITHOUT_TENANT`, which `PermissionProvider`'s background refresh depends on via `/auth/me`):
   ```
   GET /api/v1/auth/me  (Bearer token from a fresh /auth/login)
   → 200 {"id":"...","email":"admin@unerp.dev","roles":["Super Admin"],"permissions":["*"], ...}
   ```
   Confirms `/auth/me` (and by extension `RbacGuard`, which shares the same tenant-scoped Prisma extension) is not broken by the `UserRole` fix — it resolves roles/permissions correctly end-to-end, live.
5. **Not performed**: an actual browser click-through (open Connect, screenshot "Manage channel" visible, click rename/archive/add-member in the UI). Per `AGENTS.md` rule #20 ("Never run browser testing subagents unless explicitly requested by the user"), this QA pass did not launch a browser automation subagent. Everything above is verified via code path + live API, which is sufficient to close the bug from a backend/logic-correctness standpoint, but **actual visual/interactive confirmation in a browser is recommended as a final manual check by a human or an explicitly-requested browser session** before UAT sign-off, since a JS runtime error or a hydration mismatch in `PermissionProvider` itself would not be caught by this method. Flagging this explicitly rather than claiming full closure without having seen it render.

### 11.3 Full regression check — `tenant-scope.ts`'s `UserRole` change is shared/global

Ran the **entire** `api` package test suite (not just communication), since `tenant-scope.ts` is consumed by every module's Prisma calls:
```
pnpm --filter api exec vitest run
Test Files  129 passed (129)
     Tests  1761 passed (1761)
Duration    33.16s
```
No failures, no OOM, no timeout. (Some expected/intentional `[ERROR] BuilderService ... DB Error` log lines appear in the output — these are deliberately-thrown-and-caught error-path tests in `builder.service.spec.ts`, not real failures; the file itself reports `✓ ... (65 tests)`.)

**Coverage gap found and flagged (not fixed in this pass, real gap)**: `packages/database/src/tenant-scope.ts` — the file containing `MODELS_WITHOUT_TENANT` and `applyTenantScope`, i.e. the exact logic that was patched to fix this bug — has **zero direct unit tests**. `packages/database` declares a `test` script (`vitest run`) but there are no `*.spec.ts` files anywhere under `packages/database/src`. Nothing in the automated suite would fail if `'UserRole'` were silently removed from `MODELS_WITHOUT_TENANT` again in a future change; the only current defense against a regression here is `rbac.guard.spec.ts` (which mocks Prisma directly and never touches the tenant-scope extension) and this manual live `/auth/me` check. Recommend a follow-up: add `packages/database/src/tests/tenant-scope.spec.ts` asserting, for each model in `MODELS_WITHOUT_TENANT` (including `UserRole`), that `applyTenantScope` is bypassed/no-op'd, and conversely that a tenant-scoped model like `Channel` or `Invoice` gets `tenantId` injected into `where`/`data`/`create`/`upsert` as expected. This is a five-line, high-value regression guard for a change that touches every module in the system — it should not be deferred further.

### 11.4 Updated Go/No-Go recommendation

| Item | Status |
|---|---|
| Bug #1 — channel creator not seeded as OWNER | **CLOSED** — code fix verified, 2 new real-assertion tests added and passing, live API re-test confirms all three previously-403ing operations (list members, rename, archive) now succeed for a freshly created channel. |
| Bug #2 — `PermissionContext` never provided | **CLOSED** (backend/logic-correctness level) — `PermissionProvider` exists and is wired into the dashboard layout, `usePermission` wildcard logic confirmed correct, live `/auth/me` confirms the provider's data source works end-to-end. **Not independently confirmed via an actual rendered browser session** in this pass (deferred per AGENTS.md rule #20) — recommend one manual browser click-through (login → Connect → confirm "Manage channel" visible → rename/archive/add-member) before final UAT sign-off, as a cheap final sanity check, not because there's a known open defect. |
| Global regression — `tenant-scope.ts` `UserRole` fix | **PASS** — full `api` suite (129 files / 1761 tests) green, `/auth/me` and implicitly `RbacGuard` confirmed working live. **Gap flagged**: no dedicated unit test for `tenant-scope.ts` itself — recommend adding one (see §11.3) so this class of regression is caught automatically next time, not just by manual re-verification like this pass. |
| Phase A (file sharing, WebSocket, search) | Unchanged from original pass — **GO** |

**Bottom line: clean GO for UAT sign-off.** Both P0s from the original pass are closed and re-verified through code, automated tests, and live API calls against the running dev stack. The one remaining recommendation before scheduling business-analyst-uat's script is non-blocking: do one manual browser click-through of "Manage channel" as a final visual sanity check (5 minutes, no code changes expected), and separately, backend-developer/data-architect should pick up the `tenant-scope.ts` unit-test gap as follow-up hardening since it's a shared/global file with outsized blast radius and currently zero direct test coverage.

---

## 1. Automated test suite results

Ran: `pnpm --filter api exec vitest run src/modules/communication`

```
✓ src/modules/communication/tests/communication.channel-management.spec.ts (14 tests)
✓ src/modules/communication/tests/communication.service.coverage.spec.ts (31 tests)
✓ src/modules/communication/tests/communication.attachments-and-realtime.spec.ts (7 tests)
✓ src/modules/communication/tests/communication.service.spec.ts (8 tests)

Test Files  4 passed (4)
     Tests  60 passed (60)
```

All green, run twice for determinism, no flakiness observed. No finance-style test-harness gotcha applies here — this module doesn't share prisma mocks across models the way `advanced-finance.service.spec.ts` does (each spec file declares its own scoped `vi.mock('@unerp/database')`).

### Coverage quality note (pushback)
`communication.service.coverage.spec.ts`'s `createChannel` test (line ~6184) is a **weak assertion** that should not be counted as real coverage of the acceptance criterion "first creator = OWNER":

```ts
it('createChannel', async () => {
  try {
    const result = await service.createChannel('t1', 't1', 't1', {});
    expect(result).toBeDefined();
  } catch (e) {
    // Method exercised for coverage even if it throws due to incomplete mocks
    expect(e).toBeDefined();
  }
});
```

This only proves the function runs without crashing the test process — it doesn't assert `channelMember.create` was called, doesn't assert a `role: 'OWNER'` payload, and its try/catch means it would pass unchanged even if `createChannel` were deleted and replaced with a no-op. This pattern recurs across the coverage spec file for many other methods; flagging it here because it's precisely why the bug in §2 wasn't caught.

---

## 2. NEW BUG FOUND — P0 — Channel creator is never made an OWNER (or a member at all)

**Repro** (live API, dev stack, `admin@unerp.dev` token):

```
POST /communication/channels  { "name": "qa-owner-test", "topic": "QA role test" }
→ 201, channel id cmr2t1b4100287kegi9qfdpb6, createdBy = admin's userId

GET /communication/channels/cmr2t1b4100287kegi9qfdpb6/members  (as the creator, same token)
→ 403 "You are not a member of this channel."

PATCH /communication/channels/cmr2t1b4100287kegi9qfdpb6  { "name": "renamed" }
→ 403 "You do not have permission to manage this channel."

PATCH /communication/channels/cmr2t1b4100287kegi9qfdpb6  { "archived": true }
→ 403 "You do not have permission to manage this channel."
```

**Expected** (per `.ai/CONNECT_MODULE_REQUIREMENTS.md` §"Schema change required" under Phase B): *"`ChannelMember.role` (`OWNER | ADMIN | MEMBER`, default `MEMBER`, first creator = `OWNER`)."*

**Root cause** (`apps/api/src/modules/communication/communication.service.ts`):
- `createChannel` (line 227) calls `prisma.channel.create({ data: {...} })` with **no `members: { create: [...] }` block at all** — unlike the two sibling creation methods in the same file, `getOrCreateDM` (line 246) and `createGroup` (line 261), which both explicitly seed `ChannelMember` rows for participants.
- Grepping the entire service file for the literal `'OWNER'` string shows it is **only ever read** (in `assertRole(...)` checks and the "cannot remove owner" guard at line 348) — it is **never written**. No code path in `communication.service.ts` ever creates a `ChannelMember` with `role: 'OWNER'`. `addChannelMember` (line 331) and `joinChannel` (line 402) both hardcode `role: 'MEMBER'`.

**Impact**:
- Every channel created via the normal `POST /communication/channels` flow has **zero owners, forever** — archive (OWNER-only per `updateChannel`'s `assertRole(membership, ['OWNER'])`) becomes **permanently unreachable** for any such channel, by anyone, including the creator, including a Super Admin platform role.
- Rename and member add/remove (OWNER **or** ADMIN) are also unreachable, since the creator isn't even seeded as a MEMBER, let alone ADMIN/OWNER.
- This blocks US-B1, US-B2 end-to-end for any newly created channel — not an edge case, this is the primary/only path a user has for creating a channel today.
- Pre-existing seeded channels (`announcements`/`general`/`random`) do have the admin as a `MEMBER` (confirmed via `GET /members` → `role: "MEMBER"`), presumably from `prisma/seed.ts` directly inserting rows — so this bug is specific to the runtime `createChannel` code path, not a universal absence of membership rows.

**This is a product bug, not a test-side issue — flagging to backend-developer for a fix, not fixing it myself** per QA mandate. Suggested minimal fix shape (for the follow-up dev, not applied by me): seed `members: { create: [{ tenantId, userId, role: 'OWNER' }] }` in the `channel.create` call in `createChannel`, mirroring the `members: { create: [...] }` pattern already used in `getOrCreateDM`/`createGroup`.

**Test gap to close alongside the fix**: a real assertion-based test (not the coverage-spec try/catch pattern) asserting `prisma.channelMember.create` (or the `channel.create`'s nested `members.create`) is called with `{ userId: creatorId, role: 'OWNER' }` when `createChannel` succeeds, plus an integration-level check that the creator can immediately rename/archive/add-members/list-members on the channel they just created.

---

## 3. CONFIRMED — P0 — `PermissionContext.Provider` is not wired anywhere in `apps/web`

Verified directly, not just trusted from the frontend agent's note:

- `grep -rn "PermissionContext" apps/` → **zero matches** anywhere under `apps/web` or `apps/api`. The only two matches for `PermissionContext` in the repo are the definition itself (`packages/ui/src/components/protected-component.tsx`) and a reference in `.ai/MODULE_REGISTRY.md`'s prose.
- `packages/ui/src/components/protected-component.tsx`'s `PermissionContext` default value is `{ permissions: [], resolvedAccess: null }` — with no provider mounted anywhere, `usePermission(code)` always evaluates `[].some(...)` → **always `false`**, for every user, every permission, every page, all the time.
- Confirmed the "Manage channel" entry point in `connect/page.tsx` (lines 1193, 1795, 1821, 1865 — all `<ProtectedComponent permission="communication.channel.manage">` / `communication.channel.member.manage`) is therefore invisible in the browser for every user today, including the seeded Super Admin (`admin@unerp.dev`, `permissions: ["*"]` per the login response) — the wildcard permission is never even reaching the component because there's no provider supplying it to context in the first place.
- Checked `apps/web/app/(dashboard)/layout.tsx` for any provider wiring — none found.

**This is app-wide infrastructure debt, not Connect-specific**, exactly as flagged — but it is a real, live regression risk: any module that has adopted `ProtectedComponent` for privileged actions (Connect's channel management being the concrete instance tested here) is silently hiding those controls from 100% of users, with no error, no console warning, nothing — a UI feature can ship, pass code review, and be completely unreachable in the browser. Rating: **P0 / severity: high** — not because it's a security hole (the backend still enforces RBAC correctly and independently, confirmed in §5), but because it makes a shipped, spec'd feature (channel rename/archive/member management UI) **100% unusable via the UI** for every role, which is a hard blocker for any UAT script that expects to click through this flow in a browser.

**Practical consequence for this QA pass**: manual UI-based testing of channel management was not possible (as anticipated). Verified the same functionality entirely through direct API calls instead (see §5); the backend logic itself is sound modulo the bug in §2.

**Not fixed by me** (infra-scope, not Connect-scope, per instructions) — flagged here for a follow-up frontend/platform pass: needs a provider that resolves the current user's permission list (e.g. from the JWT's `permissions` claim already present in the login response, or a dedicated `/auth/me/permissions` endpoint) and wraps the dashboard layout tree.

---

## 4. File attachments (US-A1/US-A2) — PASS

Automated (7/7 passing in `communication.attachments-and-realtime.spec.ts`) + live manual verification:

| Check | Result |
|---|---|
| Valid upload (`.txt`, 32 bytes) via `POST /communication/channels/:id/attachments` | **PASS** — `201`, returns `{ documentId, attachment: { id, name, size, mime, url } }` |
| Returned URL is durable, not blob | **PASS** — `url: "/drive/documents/versions/<verId>/download"`, confirmed `not.toMatch(/^blob:/)` in unit test and manually |
| Download round-trip through the returned URL | **PASS** — `GET /api/v1/drive/documents/versions/<verId>/download` → `200`, `Content-Disposition: attachment; filename="qa-upload.txt"`, exact original bytes (`test file content for QA upload`) returned |
| Oversized file (26MB, cap is 25MB) rejected before hitting Drive | **PASS** — `400 BAD_REQUEST "File exceeds the 25MB attachment limit."`, confirmed both in unit test (mocked) and live (real 26MB buffer) — rejected in ~150ms, well before any Drive call |
| Missing file | **PASS** (unit) — `"No file provided."` |
| Cross-tenant channel upload rejected | **PASS** (unit) — `channel.findFirst` scoped by `{ id, tenantId }`, throws `"Conversation not found"` when the channel belongs to a different tenant |
| Image thumbnail (US-A2) | Not independently re-verified in this pass (relies on client-side `isImageMime` helper, no server behavior to test) — low risk, cosmetic |

---

## 5. Channel management + RBAC (US-B1/B2/B3) — PARTIAL PASS (backend logic correct; owner-seeding bug blocks it in practice, see §2)

Tested via direct API calls (UI inaccessible per §3):

| Scenario | Result |
|---|---|
| Plain MEMBER blocked from rename (unit) | **PASS** — 403 `"You do not have permission to manage this channel."` |
| ADMIN blocked from archive, OWNER-only (unit) | **PASS** |
| ADMIN allowed to rename (unit) | **PASS** |
| OWNER allowed to archive (unit) | **PASS** |
| Live: admin (role=MEMBER on a pre-seeded channel) attempts rename | **PASS as a negative case** — correctly 403'd, confirming platform "Super Admin" role does NOT bypass channel-level RBAC (this is correct/intended separation of concerns) |
| Live: creator of a brand-new channel attempts to view members/rename/archON their own channel | **FAILS — see bug in §2.** Creator is not a member at all, so every self-service management action 403s |
| MEMBER blocked from add/remove member (unit) | **PASS** |
| OWNER/ADMIN add member → system message posted (unit) | **PASS** |
| Remove member retains history, posts departure system message (unit) | **PASS** |
| Blocks removing the channel OWNER (unit) | **PASS** |
| Browse only lists PUBLIC channels in-tenant, not-yet-joined (unit) | **PASS** |
| Join rejects PRIVATE channel directly (unit) | **PASS** |
| Join PUBLIC channel posts join announcement (unit) | **PASS** |

---

## 6. Tenant isolation — PASS (unit-level; live cross-tenant test not possible — see note)

| Scenario | Result |
|---|---|
| `updateChannel` never finds a channel belonging to another tenant (unit) | **PASS** — `channel.findFirst` called with `{ id, tenantId }`, throws `"Channel not found"` on cross-tenant mismatch |
| `searchMessages` scoped to caller's tenant + channel memberships (unit) | **PASS** |
| `searchMessages` returns `[]` (not an error, not other tenants' data) when caller has zero channel memberships (unit) | **PASS** — and crucially, `$queryRaw` is asserted **not called** in that case, so there's no accidental full-table scan |
| Attachment upload rejects a channel in a different tenant (unit) | **PASS** |
| Live cross-tenant negative test via two real tenants | **Not performed** — the seeded dev DB has exactly one tenant ("System Tenant"). No `/admin/tenants` endpoint exists to provision a second tenant via API in this environment, and creating one manually was out of scope for a non-destructive QA pass. Unit-level coverage above is solid (all cross-tenant scoping goes through the same `findFirst({ where: { id, tenantId } })` pattern consistently used elsewhere in this codebase), so residual risk is **low**, but this is a genuine gap versus "test with two different tenant contexts" instruction — flagging rather than skipping it silently. |

Live SQL-injection-style and empty-string search queries were also tried directly against the running API (`q="' OR 1=1; --"`, `q=""`) — both returned `200 []` safely, no error, confirming the query path is parameterized (raw SQL is only interpolated with the trigram/ILIKE pattern, not string-concatenated with user input, consistent with the codebase's `$queryRaw` usage pattern elsewhere).

---

## 7. Real-time (US-A3/A4/A5) and polling fallback

| Check | Result |
|---|---|
| `createMessage` broadcasts persisted message (real id/createdAt, not ephemeral) via `broadcastChatMessage` into `channel:<id>` room (unit) | **PASS** |
| Broadcast does not fire when message creation fails validation (empty content) (unit) | **PASS** |
| `setPresence` broadcasts via `broadcastPresenceUpdate` into `tenant:<id>` room (unit) | **PASS** |
| Frontend socket wiring exists and is not dead code | **PASS (code review)** — `connect/page.tsx` opens `io(`${WS_BASE}/ws`, { auth: { token }, transports: ['websocket','polling'] })` on mount, joins/leaves `channel:<id>` rooms on conversation switch (separate `useEffect` keyed on `activeId`), live-appends `chat:message` with dedupe against optimistic/polled state, live-merges `presence`, and prunes `typing` entries after 3s of inactivity |
| Polling fallback still runs independently of socket state | **PASS (code review)** — the `setInterval(loadWorkspace, 15000)` polling effect (line ~240) has no dependency on socket connection state and is registered in a separate `useEffect` from the socket-connect effect; it is not gated behind "if socket failed" logic, so it runs unconditionally as a genuine fallback rather than a normally-dead code path that only activates on failure. This matches the spec's "graceful degradation, not a hard failure" requirement. Did not spin up a second browser session to visually confirm sub-1s delivery latency (would require the UI, which is separately blocked per §3 for privileged actions only — message send/receive itself is not `ProtectedComponent`-gated, so this part of manual testing *would* be possible in-browser, but was deprioritized in favor of the API-level verification given time constraints). |

---

## 8. Mutation / CSRF fix verification (US general) — PASS

Confirmed live, not just trusted from the implementing agent's note:
- `POST /auth/login` sets both `auth_token` (httpOnly cookie) and `csrf_token` (readable cookie).
- `connectData.ts`'s `req()` now sends `credentials: 'include'` + `x-csrf-token` header sourced from the `csrf_token` cookie for all non-GET requests.
- Live test: `POST /communication/channels/:id/messages` (send message) succeeded end-to-end with the bearer token + csrf header + cookie combination exactly as the frontend constructs it — **201, message persisted, then found again via `GET /communication/search`.**
- Live test: `POST /communication/channels/:id/attachments` (file upload, also non-GET/mutating) succeeded the same way.
- This confirms the previously-broken silent-403 bug is genuinely fixed for at least these two mutation types. Did not re-test every single mutating endpoint (react, star, mute, notify-level change) individually since they all funnel through the same `req()`/`headers()` helper — the fix is structural, not per-endpoint, so spot-checking two representative mutations (message send, file upload) is sufficient to validate the fix without duplicating effort per-endpoint.

---

## 9. Permission registry — PASS (already fixed, contrary to stale note in requirements doc)

`.ai/CONNECT_MODULE_REQUIREMENTS.md` §1.3 claims zero `communication.*` permissions are registered. This is **stale** — verified directly against `packages/shared/src/permissions/registry.ts`:

```
communication.read / create / update / delete           (legacy coarse)
communication.channel.read / create / manage / join
communication.channel.member.manage
communication.message.read / create / search
communication.message-attachment.upload
communication.notification.read / create / update
communication.email-template.read / create
```

Every `@Permissions(...)` string used in `communication.controller.ts` has a matching registry entry (cross-checked by generating the `${module}.${resource}.${action}` code via the same `p()` helper the registry uses). This gap is closed — no action needed. Flagging that the requirements doc's §1.3 and the MODULE_REGISTRY.md prose should be updated by tech-writer to stop citing this as an open item.

**Minor note (not a bug, just an observation)**: several controller endpoints declare `@Permissions(...)` twice (e.g. `getWorkspace` has both `@Permissions('communication.read')` and `@Permissions('communication.channel.read')` stacked on the same method, lines 36 and 38 of `communication.controller.ts`). NestJS decorator metadata for a repeated decorator on the same target generally has the last one win, so this likely doesn't break RBAC (the more specific `communication.channel.read` is applied second/last), but it's confusing and should be cleaned up to declare intent once. Not blocking, just a code-quality nit for code-reviewer.

---

## 10. Go/No-Go recommendation

| Phase | Status | Recommendation |
|---|---|---|
| Phase A — File sharing (US-A1/A2) | All tests pass, live-verified | **GO** |
| Phase A — WebSocket wiring (US-A3/A4/A5) | Unit-verified, code-reviewed, fallback confirmed non-dead | **GO**, with a note that live two-browser latency wasn't manually timed |
| Phase A — Message search (US-A6) | Unit + live verified, tenant/membership scoping solid, injection-safe | **GO** |
| Phase B — Channel management + roles (US-B1/B2/B3) | Backend RBAC logic is correct in isolation, but **the owner-seeding bug in §2 makes it non-functional for any newly created channel** | **NO-GO** until §2 is fixed. This is not a cosmetic gap — it makes archive functionally unreachable for 100% of new channels and blocks the entire self-service management flow for channel creators. |
| Cross-cutting: UI entry point for channel management | `ProtectedComponent` invisible to all users (§3) | **NO-GO for UI-based UAT** of channel management until `PermissionContext.Provider` is wired; **API-based UAT is viable today** (fully exercised in this report) |

**Bottom line**: recommend routing §2 (owner-seeding bug) back to backend-developer as a P0 fix before scheduling business-analyst-uat's channel-management UAT script. Recommend routing §3 (PermissionContext provider) to whichever agent owns app-wide frontend infra, flagged as blocking *any* future `ProtectedComponent` adoption across the app, not just Connect — this should probably get its own ticket independent of the Connect module's registry status.
