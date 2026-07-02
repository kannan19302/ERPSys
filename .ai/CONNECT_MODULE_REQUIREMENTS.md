# Connect Module — Teams/Google Chat Parity Gap Analysis & Requirements

> **Owner**: product-manager
> **Module**: Connect (Communication) — `apps/api/src/modules/communication`, `apps/web/app/(dashboard)/connect/`
> **Registry status**: 🟡 IN_PROGRESS (parity completion pass — see `.ai/MODULE_REGISTRY.md` row 13)
> **Last updated**: 2026-07-02
> **Read this before touching Connect**: this is a gap-fill spec, not a rebuild. Section 1 is
> what already exists and must NOT be re-specced or reimplemented.

---

## 1. Verified current state (read from actual code, not memory)

Verified by reading `communication.controller.ts`, `communication.service.ts`,
`notifications.gateway.ts`, `connect/page.tsx`, `connect/connectData.ts` directly on 2026-07-02.
Prior memory describing this module was accurate on data model but **understates two critical
gaps**: attachments are not really uploaded, and a real WebSocket gateway exists but Connect
doesn't use it.

### 1.1 Real and working
- **Spaces/channels/DMs/groups**: `ConnectSpace`, `Channel` (kind: CHANNEL/DM/GROUP), deterministic
  `dm:<sortedIds>` naming, `ChannelMember` (starred/muted flags).
- **Threaded messages**: `parentId` self-relation, reply counts, thread panel in UI.
- **Reactions**: `MessageReaction`, grouped by emoji with userId list, emoji picker in UI (fixed palette).
- **Edit/soft-delete/pin**: `editedAt`, `deletedAt` (content wiped), `pinned` boolean + pinned-messages bar.
- **Presence**: `UserPresence` (ACTIVE/AWAY/BRB/DND/OOO/INACTIVE), auto-away after 5 min idle (client-side
  timer + `PUT /communication/presence`), status text/emoji.
- **Meetings**: `ConnectMeeting` — code generation, start/end, posts a `SYSTEM` message with a join link
  into the originating channel. **No actual audio/video/screen-share** — the "meeting" UI
  (`meetingState` in `page.tsx`) is a fully client-side mock: mic/cam/recording/hand-raise/captions
  are local React state with zero WebRTC, zero media stream, zero signaling. It looks like a call but
  nobody is actually connected.
- **Calendar**: `CalendarEvent` model, CRUD, meeting-linked events (`withMeet`), recurrence field
  (stored but not expanded into occurrences).
- **Unread tracking**: `ChannelRead` (`lastReadAt` per user/channel), `unreadCount` + `lastMessage`
  preview computed server-side in `getConversationActivity`.
- **@mention notifications**: regex `@\w+` matched against first names, creates `Notification` rows
  (type `CHAT`). Crude (first-name-only, no disambiguation between two "John"s, no `@channel`/`@here`).
- **Bookmarks / star / mute**: `MessageBookmark`, `ChannelMember.starred/muted`.
- **Markdown-lite rendering**: `parseMarkdown` in `connectData.ts` — bold/italic/strike/code/links, client-only.

### 1.2 Exists but is fake / broken — do not confuse with "done"
- **File attachments are not uploaded anywhere.** `connect/page.tsx` `onFiles()` does
  `URL.createObjectURL(f)` — a browser-local blob URL. It is sent as the message's `attachments` JSON
  and rendered, but the actual file bytes are never sent to the API, never stored in Drive/S3/MinIO.
  Refresh the page, or have a second user open the same conversation, and the "attachment" is a broken
  link or gone entirely. This is the single biggest gap for "fully packed" parity — nothing analogous
  to Teams/GChat file sharing exists today.
- **A real Socket.IO gateway exists and is unused by Connect.** `notifications.gateway.ts` (namespace
  `/ws`) already implements `join:channel`/`leave:channel` rooms, a `chat:message` broadcast event, and
  a `typing` event with `@SubscribeMessage('typing')` — built, presumably, for this exact purpose — but
  `apps/web/app/(dashboard)/connect/page.tsx` never opens a socket connection. It polls
  `GET /communication/channels/:id/messages` every 5s and `GET /communication/workspace` every 15s.
  Typing indicators are therefore **impossible today** even though the server-side event exists,
  because the client never subscribes.
- **Meeting UI is a client-only illusion.** No WebRTC peer connection, no media server/SFU, no
  signaling exchange between participants. Two users "in the same meeting" do not see or hear each
  other. This must be called out explicitly to the user: it is not a partial video-calling feature,
  it is a non-functional mock that happens to share a `ConnectMeeting` row and a join link.

### 1.3 Missing entirely (confirmed by grep — no matching routes/services)
- No space/channel management surface: no rename, no archive/unarchive, no add/remove member, no
  channel roles (owner/admin/member), no public-channel directory/browse-to-join. Channels are
  create-only; `ChannelMember` has no `role` column.
- No message search endpoint (`/communication` has zero `search` route; the UI's "Search in chat"
  input filters only the messages already loaded client-side for the active conversation — it cannot
  search across channels, cannot search history not yet fetched, cannot search file names).
  There's also no global switcher search beyond client-side substring match on already-loaded
  directory/conversation names.
  read receipts — no "seen by" list, no last-seen-per-user
- No message forwarding.
- No slash commands / bot or integration framework.
- No do-not-disturb-aware notification suppression tie-in (presence has a `DND` value, but nothing
  reads it to suppress push/email notifications).
- No per-channel notification preference (all-messages / mentions-only / muted) — today `muted` is
  a single boolean, not a tri-state preference.
- No org-chart / directory search beyond the flat member list already in the sidebar.
- No guest/external user access model — `Channel.type` has PUBLIC/PRIVATE but no concept of
  cross-tenant guest membership.
- No link-preview unfurling for URLs pasted into messages.
- Permission strings (`communication.channel.*`, `communication.message.*`,
  `communication.notification.*`, `communication.email-template.*`) are used via `@Permissions(...)`
  in the controller but **are not registered** in `packages/shared/src/permissions/registry.ts` —
  confirmed by grep (zero matches for `communication` in that file, case-insensitive). RBAC checks
  work at runtime (`RbacGuard` doesn't require registry membership to function) but these permissions
  are invisible to the Access Control admin UI, so admins cannot see or assign them explicitly. This
  is a cross-cutting gap that should be fixed regardless of which feature phase ships first.

---

## 2. What "fully packed Teams/GChat parity" means here — scoping

This is too broad to build as one unit. Splitting into phases by buildability within this codebase's
existing patterns (NestJS/Prisma/Next.js, REST + the pre-existing-but-unused Socket.IO gateway).
**Real-time voice/video calling (WebRTC/SFU) is out of scope for this pass** — it requires a media
server (e.g. LiveKit/mediasoup) that doesn't exist anywhere in this codebase yet, is a distinct
infra/vendor decision, and shouldn't be bolted on inside a "parity gap-fill" pass. It is flagged as a
separate, larger initiative (see §6).

### In scope for this requirements doc (P0 + P1, phased)
Real file sharing, real-time delivery (wire the existing gateway into Connect), message search,
channel/space management with roles, typing indicators, read receipts, notification preferences,
message forwarding, saved/starred parity cleanup, emoji picker upgrade, link previews, DND-aware
notification suppression, permission registry hardening.

### Explicitly out of scope for this pass (backlog / later)
- Actual audio/video calling and screen sharing (needs WebRTC/SFU infra decision — separate spec).
- Slash commands / bot & integrations framework (needs a plugin/extension architecture decision).
- External/guest cross-tenant access (needs a multi-tenant guest-identity model — security-sensitive,
  needs its own spec with security-auditor).
- Mobile native app (this is a responsive web app; PWA/mobile is Phase 18 territory, not Connect).
- Recurrence expansion for calendar events (cosmetic gap, not core chat parity).

---

## 3. User stories & acceptance criteria, sequenced

### Phase A (P0) — Real file sharing
**Problem**: A user attaching a file today believes it was shared; it wasn't. This is a trust-breaking
bug in a shipped, "ACTIVE" feature, not just a missing nice-to-have.

- **US-A1**: As a Connect user, I want to attach a real file to a message so that other members can
  open/download it later, including after I've closed my browser.
  - Given I select a file in the composer, When I send the message, Then the file bytes are uploaded
    to the existing Drive/MinIO storage backend (reuse `FileInterceptor` pattern from
    `drive.controller.ts`) under a tenant-scoped path, and the message's `attachments` JSON stores a
    durable `documentId`/download URL, not a blob URL.
  - Given another tenant member opens the same conversation from a different browser, When they view
    the message, Then they can download the same file.
  - Given the file exceeds a configured max size (reuse Drive's existing validation), When upload is
    attempted, Then it is rejected with a clear error before the message is sent.
- **US-A2**: As a user, I want image attachments to show an inline thumbnail/preview so I don't have to
  download every image to see it.
  - Given an attachment's mime type is `image/*`, When the message renders, Then a thumbnail preview
    is shown inline (reuse `isImageMime` helper already in `connectData.ts`).

**Dependencies**: Drive module (`apps/api/src/modules/documents`) already ACTIVE — reuse its storage
service, do not reimplement S3/MinIO plumbing. Event-driven boundary: Connect calls Drive's public
service methods/HTTP endpoints, does not import Drive internals directly.

### Phase A (P0) — Wire the existing WebSocket gateway into Connect
**Problem**: The infra for real-time exists (`notifications.gateway.ts`) and is entirely unused by the
one feature that most needs it.

- **US-A3**: As a Connect user, I want new messages to appear instantly without a 5-second delay so
  conversations feel real-time.
  - Given I have a conversation open, When another member sends a message, Then it appears in my feed
    within ~1s via a `chat:message` WebSocket event, not the next poll cycle.
  - Given the socket disconnects, Then the client falls back to the existing polling behavior
    (graceful degradation, not a hard failure).
- **US-A4**: As a Connect user, I want to see when someone else is typing.
  - Given another member is actively typing in the conversation I have open, When they type, Then I
    see a "X is typing…" indicator within 1s, using the existing `typing` WS event.
  - Given typing stops for 3s with no keystroke, Then the indicator disappears.
- **US-A5**: As a Connect user, I want my presence (online/away/DND) to update live for others watching
  the directory, not just on their next 15s poll.
  - Given I go offline, When another user is viewing the directory, Then their view updates via the
    gateway's existing `presence` event within ~1s.

**Dependencies**: none new — the gateway exists in `notifications` module; Connect's frontend needs a
socket client wired to `/ws` namespace with channel-room join/leave on conversation switch. Confirm
`notifications.gateway.ts`'s `chat:message` handler is extended (or a parallel emit added from
`CommunicationService.createMessage`) to actually broadcast **persisted** messages, since today
`chat:message` broadcasts an ephemeral payload that was never designed to be the persistence path.

### Phase A (P0) — Message search
- **US-A6**: As a Connect user, I want to search message content across a channel (and ideally across
  all my channels) so I can find something someone said last week.
  - Given I open channel search and type a query, When I submit, Then the API returns matching
    messages (content `ILIKE`/full-text) scoped to my tenant and to channels I'm a member of, with
    channel name + author + timestamp + jump-to-message.
  - Given I search from the global switcher (Ctrl+K), When results include messages (not just
    conversations/people), Then selecting one opens that conversation scrolled to the message.
  - Given a message was soft-deleted, Then it is excluded from search results.

New endpoint: `GET /communication/search?q=...` — tenant + membership-scoped.

### Phase B (P0) — Channel/Space management + roles
**Problem**: Channels can only be created, never managed. No Teams/GChat parity is credible without
this.

- **US-B1**: As a channel owner, I want to rename or archive a channel.
  - Given I am the channel's `owner` (new `ChannelMember.role`), When I rename/archive via
    `PATCH /communication/channels/:id`, Then the change is applied and (for archive) the channel
    moves out of the active sidebar list but remains readable in history.
  - Given I am a `member` (not owner/admin), When I attempt rename/archive, Then the API returns 403.
- **US-B2**: As a channel owner/admin, I want to add or remove members.
  - Given I add a user via `POST /communication/channels/:id/members`, Then they gain access and a
    system message announces the join.
  - Given I remove a member via `DELETE /communication/channels/:id/members/:userId`, Then they lose
    access to future messages (history retention policy: keep, matching Teams behavior) and a system
    message announces the departure.
- **US-B3**: As any user, I want to browse and join public channels I'm not yet a member of (channel
  discovery), instead of only ever creating new ones.
  - Given a channel's `type` is `PUBLIC`, When I open "Browse channels", Then I see it listed with
    member count/topic and a Join button, without needing an invite.

**Schema change required**: `ChannelMember.role` (`OWNER | ADMIN | MEMBER`, default `MEMBER`, first
creator = `OWNER`). Data-architect to design migration — additive, non-breaking.

### Phase B (P1) — Read receipts beyond unread counts
- **US-B4**: As a user, I want to see who has read my message in a small group/DM (not just an unread
  badge on my own client).
  - Given a DM or small group (<= configurable N members, e.g. 8, to bound cost — large channels stay
    unread-count-only like Teams does), When I open the message's "Seen by" affordance, Then I see the
    list of members whose `ChannelRead.lastReadAt` is >= this message's `createdAt`.

### Phase B (P1) — Notification preferences per channel + DND-aware suppression
- **US-B5**: As a user, I want to set per-channel notification level (All messages / Mentions only /
  Nothing) instead of a single mute toggle.
  - Given I set a channel to "Mentions only", When someone posts without @me, Then no notification
    fires for me, but my unread count still increments.
- **US-B6**: As a user in DND presence, I want notifications suppressed (or silently queued) instead of
  firing normally.
  - Given my presence is `DND`, When I'm @mentioned, Then the in-app notification is still recorded
    (for the notification center) but push/email delivery (if configured) is suppressed until DND ends.

**Schema change**: extend `ChannelMember` with `notifyLevel` enum, or a new
`ChannelNotificationPreference` model if reused elsewhere — data-architect call.

### Phase C (P1) — Message forwarding, link previews, emoji picker upgrade
- **US-C1**: As a user, I want to forward a message to another channel/DM.
  - Given I choose "Forward" on a message, When I pick a target conversation, Then a new message is
    created there referencing the original (author + original timestamp shown), not a duplicate raw copy
    that hides its origin.
- **US-C2**: As a user, I want pasted links to show a small preview (title/description/image) rather
  than raw URL text.
  - Given a message contains a URL, When rendered, Then a link-preview card appears below the text
    (server-side fetch + cache of OpenGraph tags, to avoid client-side SSRF/CORS problems).
- **US-C3**: As a user, I want a real emoji picker (search/categories) instead of the current fixed
  palette in `EMOJI_PALETTE`.

### Phase D (P2) — Org chart / directory search, saved-message parity polish
- **US-D1**: As a user, I want to search the directory by name/department/title, not just scroll a flat
  list.
- **US-D2**: As a user, I want a dedicated "Saved messages" view (rename/repurpose the existing
  Bookmarks feature to match Teams "Saved" terminology) — mostly a UI/naming pass, backend already exists.

---

## 4. Cross-cutting requirements (apply to every phase above)

- **Multi-tenancy**: every new/changed query must be `tenantId`-scoped exactly like existing
  `CommunicationService` methods (`prisma.channel.findFirst({ where: { id, tenantId } })` pattern).
  New search/read-receipt/role queries must follow the same pattern — no exceptions.
- **RBAC**: new endpoints need `@Permissions('communication.<resource>.<action>')`, e.g.
  `communication.channel.manage` (rename/archive), `communication.channel.member.manage` (add/remove),
  `communication.message.search`, `communication.channel.join`. **Register all of these — old and
  new — in `packages/shared/src/permissions/registry.ts`**, closing the gap noted in §1.3; this is a
  prerequisite task, not optional cleanup, because the Access Control admin UI currently cannot show
  or assign any Connect permission.
- **Change history**: `@TrackChanges('Channel')` on rename/archive/role-change endpoints per AGENTS.md
  rule 13.
- **i18n**: new UI strings (search placeholder, role labels, notification-level labels, forward dialog)
  must go through the existing i18n dictionary structure (Phase 17 already ACTIVE per registry).
- **Audit**: member add/remove and role changes should also emit a system message into the channel
  (existing pattern already used for meeting-start messages) so the audit trail is visible in-context,
  not just in the change-history admin view.
- **Event-driven boundaries**: Connect must not import Drive/Notifications internals directly — call
  their service-layer public methods or emit/consume domain events, per AGENTS.md rule 6. The gateway
  wiring in Phase A is a legitimate exception since `notifications.gateway.ts` is explicitly the
  shared real-time transport, not a domain module being reached into.

---

## 5. Sequencing summary

| Phase | Priority | Depends on | Why this order |
|---|---|---|---|
| A — Real file sharing | P0 | Drive module (already ACTIVE) | Fixes an active trust-breaking bug in a shipped feature; highest-severity gap |
| A — Wire existing WS gateway (real-time + typing + presence) | P0 | `notifications.gateway.ts` (already ACTIVE) | Infra already built and idle; cheapest big perceived-quality win |
| A — Message search | P0 | none new | Core parity feature with zero backend today |
| B — Channel/space management + roles | P0 | `ChannelMember.role` migration | Blocks channel discovery, member management, and read-receipt scoping (needs role for permission checks) |
| B — Read receipts | P1 | Phase B roles (for permission gating in larger channels) | |
| B — Notification preferences + DND suppression | P1 | none new beyond schema | |
| C — Forwarding, link previews, emoji picker | P1 | Phase A (uses same message pipeline) | |
| D — Directory search, saved-message polish | P2 | none | Lowest severity, cosmetic/UX only |
| (Backlog) Real audio/video/screen share via WebRTC/SFU | Separate initiative | Infra/vendor decision | Not part of this pass — see §6 |
| (Backlog) Slash commands / bot framework | Backlog | Plugin architecture decision | Nice-to-have, no current user story blocks on it |
| (Backlog) Guest/external access | Backlog | Multi-tenant guest identity model + security review | Security-sensitive, needs its own spec |

---

## 6. Explicit pushback / scope calls

- **Real-time video calling is NOT a "finish the meeting feature" task** — it is a net-new
  infrastructure decision (WebRTC signaling server + SFU/media server such as LiveKit, mediasoup, or a
  managed provider like Daily/Twilio Video). Nothing in this codebase provides that today. Treat it as
  its own phase/spec with its own dependency and cost analysis; do not let it block or bloat this
  gap-fill pass.
- **Slash commands/bots/integrations** are being deliberately deferred to backlog: no current user
  story in the ERP depends on them, and they require a plugin/extension-point architecture decision
  that doesn't exist yet (unlike, say, Web Studio's block registry, which was purpose-built for
  extensibility). Nice-to-have, not must-have for internal ERP-wide chat.
- **Guest/external access** is flagged but deliberately not scoped in detail here — it's a
  multi-tenant security question (can a "guest" see tenant data outside the one channel they were
  invited to?) that needs `security-auditor` and `data-architect` input before a spec is safe to write.

---

## 7. Success metrics

- Zero "attachment vanished/broken" reports after Phase A ships (today: 100% of attachments are
  ephemeral blob URLs).
- P50 message-delivery latency to other open clients < 2s after Phase A WS wiring (today: up to 5s
  poll interval, worse under load).
- Message search returns results in < 500ms for a single-channel query on realistic tenant data volumes.
- Channel management (rename/archive/add/remove member) usable without direct DB access — currently
  impossible via any UI or API.
- 100% of Connect's in-use permission strings appear in the Access Control admin matrix (today: 0%).

---

## 8. Next agents

- **data-architect**: design the additive migration for `ChannelMember.role` (OWNER/ADMIN/MEMBER),
  `ChannelMember.notifyLevel` (or new `ChannelNotificationPreference` model), and a message full-text
  search index (Postgres `tsvector` or `ILIKE` with a trigram index) on `Message.content` scoped by
  `tenantId`. Confirm indexing strategy for search performance.
- **backend-developer**: (1) real file upload — call into Drive's storage service from
  `CommunicationService.createMessage`/a new attachment endpoint, replacing blob URLs; (2) extend
  `notifications.gateway.ts` (or add a dedicated `CommunicationGateway`) so `createMessage` actually
  broadcasts the persisted message over `chat:message`, and wire `typing`/`presence` consumption; (3)
  `GET /communication/search`; (4) channel management endpoints (`PATCH /channels/:id`,
  member add/remove, browse/join); (5) register all `communication.*` permission strings in
  `packages/shared/src/permissions/registry.ts`.
- **frontend-developer**: (1) real upload flow in the composer (replace `URL.createObjectURL`) with
  upload progress + inline image thumbnails; (2) Socket.IO client wired into `connect/page.tsx`
  (join/leave channel rooms on conversation switch, live message append, typing indicator UI,
  live presence updates), with graceful fallback to existing polling on disconnect; (3) search UI
  (channel-scoped + global switcher results); (4) channel management UI (rename/archive dialog,
  member management drawer with role badges, browse-public-channels modal); (5) per-channel
  notification-level picker replacing the single mute toggle; (6) message forward dialog, link-preview
  card rendering, upgraded emoji picker.
- **qa-tester**: tenant-isolation tests for search and channel management (cannot search/manage
  channels outside your tenant); RBAC tests for role-gated actions (member vs owner/admin); regression
  tests proving polling fallback still works if the socket fails to connect; upload size/type
  validation tests reusing Drive's existing test patterns.
- **business-analyst-uat**: UAT script covering — send a file, refresh, confirm it's still there and
  downloadable by a second seeded user; two-browser live-typing and live-message-delivery demo;
  channel rename/archive/add-remove-member as an owner vs. a blocked attempt as a plain member;
  search returning a message sent 3 days ago.
- **security-auditor**: review the file-upload path for the same validation Drive already enforces
  (type/size, tenant-scoped storage path) before Connect reuses it; review the deferred guest-access
  backlog item before it is ever scheduled.
