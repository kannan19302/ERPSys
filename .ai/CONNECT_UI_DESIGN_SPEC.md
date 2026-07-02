# Connect Module — UI/UX Design Spec (Phase A/B/C surfaces)

> **Owner**: uiux-designer
> **Consumes**: `.ai/CONNECT_MODULE_REQUIREMENTS.md` (US-A1 through US-C3) — do not re-derive requirements from this doc, only design decisions
> **Target files**: `apps/web/app/(dashboard)/connect/page.tsx`, `apps/web/app/(dashboard)/connect/connectData.ts`
> **Status**: Ready for frontend-developer. No application code in this document — component names, layout, states, and tokens only.

---

## 0. Pre-existing pattern audit (read before building)

Two consistency findings that affect every section below:

1. **`connect/page.tsx` has its own local `Modal` component** (bottom of file, ~line 1558) that is a plain
   `position:fixed` overlay with hardcoded `20px`/`14px` radii and `rgba(0,0,0,.4)` overlay — it does **not**
   use `@unerp/ui`'s `Modal`. This is a pre-existing inconsistency, not something to copy forward.
   **All new modals in this spec (Browse Channels, Manage Channel, Forward) must use `@unerp/ui`'s `Modal`
   / `ConfirmDialog` / `Drawer`**, not the local one. This is a design-debt fix, flag it to frontend-developer
   explicitly in the handoff (§8).
2. **`@unerp/ui` already ships `Drawer`** (`packages/ui/src/components/navigation.tsx`) — right-side slide-over,
   ESC-to-close, footer slot. The existing in-page "Channel info" panel (§10 of page.tsx, `channelInfo` state)
   is a **hand-rolled inline panel**, not the `Drawer` component. The new **Manage Channel** surface must use
   `@unerp/ui`'s `Drawer` (reuse, don't invent a second bespoke panel implementation). Do not touch the existing
   "Details" info panel in this pass — it's out of scope — but do not duplicate its hand-rolled style either.

Existing component inventory used throughout this spec (nothing new needs to be added to `packages/ui` for
Phase A/B/C — see reuse map per section):
`Modal`, `ConfirmDialog`, `Drawer`, `Tabs`, `Tooltip`, `Pagination` (`components/navigation.tsx`), `Button`,
`Badge`, `StatusBadge`, `Spinner`, `Skeleton`/`SkeletonText`, `EmptyState`, `FormField`/`Input`/`Textarea`/`Select`,
`DataTable`, `ToastProvider`/`useToast`.

Color/spacing/radius tokens referenced below (from `design-tokens.css`, already in use throughout `connect/page.tsx`):
`--color-bg`, `--color-bg-elevated`, `--color-bg-hover`, `--color-bg-sunken`, `--color-border`,
`--color-border-strong`, `--color-text`, `--color-text-secondary`, `--color-text-tertiary`, `--color-primary`,
`--color-primary-light`, `--color-warning`, `--color-danger` (confirm exact danger token name in
`design-tokens.css` before use — do not invent `--color-error`), `--space-1` … `--space-6`, `--radius-sm/md/lg/xl`,
`--text-xs/sm/base`, `--weight-medium/semibold/bold`.

---

## 1. Real file upload in the composer

### Reuse map
- Staged-attachment chip row already exists (`staged` state, page.tsx ~L728-738) — **extend it**, do not
  rebuild it.
- `Spinner` (`@unerp/ui`) for the in-progress state.
- `useToast` (`@unerp/ui`) for the terminal error toast (size/type rejection) in addition to inline chip error.
- Icons already imported: `Image`, `FileText`, `X`, `Paperclip`, `Download` (lucide-react) — reuse; do not add
  a new icon library.

### Data model addition (frontend-only state, coordinate with backend-developer for the real shape)
Replace the current `staged: Attachment[]` (which is populated synchronously via `URL.createObjectURL`) with a
richer client-side staging item that tracks upload lifecycle:

```
type StagedAttachment = {
  localId: string;          // client-generated key, stable across re-renders
  file: File;                // original File object
  name: string;
  size: number;
  mime: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;          // 0-100, from XHR/fetch upload progress
  previewUrl?: string;       // local blob URL for optimistic image thumbnail only, discarded once `documentId` returns
  documentId?: string;       // set on success — the durable Drive document id
  url?: string;              // durable download URL, set on success
  errorMessage?: string;     // set on error, e.g. "File exceeds 25 MB limit" or "File type not allowed"
};
```

`staged` becomes `StagedAttachment[]`. The composer's send button stays disabled while any item has
`status === 'uploading'` — do not allow sending a message with an in-flight upload (prevents an
attachment silently missing from the sent message).

### States — staged attachment chip (composer, above textarea)

Reuse the existing chip container (`flex, gap:8, flexWrap, padding: '8px 16px 0'`). Each chip becomes a
fixed-width card (raise from single-line pill to a **2-line card**, ~168px wide) so progress bar and
filename both fit without truncation surprises:

**Uploading state**
```
┌─────────────────────────────┐
│ [Image/FileText icon]  [x]  │  <- icon left, remove (X) right (disabled/hidden while uploading — see a11y note)
│ filename.png                │  <- var(--text-xs), ellipsis truncate
│ ▓▓▓▓▓▓▓▓░░░░░░  62%          │  <- thin progress bar, var(--color-primary) fill, var(--color-border) track
└─────────────────────────────┘
```
- Progress bar: `height: 3px`, `border-radius: var(--radius-full)`, track `background: var(--color-border)`,
  fill `background: var(--color-primary)`, width transitions via CSS `width` percentage — no new component
  needed, this is a 4-line inline div pair (track + fill), not worth adding to `packages/ui` for one usage.
  If a second consumer appears later (e.g. Drive module reuse), propose extracting to `packages/ui` as
  `ProgressBar` then — not now.
- Remove (X) button: disabled during upload (cannot cancel mid-upload in this pass — no cancel-upload
  endpoint scoped in the requirements doc; ship send-blocking instead of a half-built cancel affordance).
  If product wants cancel later, that's a new user story, not a gap in this spec.
- Cursor: default (not pointer) on the card body during upload.

**Success (done) state**
- Card collapses back to the original **single-line pill** styling (matches today's staged chip look):
  icon + filename + size + remove (X), `X` now enabled (removes from the outgoing message before send).
- Icon: `Image` (blue/primary tinted) for images, `FileText` (secondary color) for everything else — unchanged
  from today.
- Add a subtle **fade-in** using existing `var(--duration-fast) var(--ease-out)` transition tokens (no new
  animation keyframes required beyond what's already declared in `globals.css` for `modal-overlay`; a plain
  `opacity` transition suffices).

**Error state (size/type rejection)**
- Card border turns `1px solid var(--color-danger)` (confirm token name — likely `--color-danger` or
  `--color-error`, check `design-tokens.css` directly; do not hardcode a hex red).
- Icon replaced with a warning glyph (`AlertCircle`, already imported in page.tsx) in danger color.
- Second line shows the rejection reason instead of a progress bar, e.g. "Exceeds 25 MB limit" or
  "File type .exe not allowed", `font-size: var(--text-xs)`, `color: var(--color-danger)`.
- Remove (X) is enabled (must be able to dismiss a failed chip).
- **Reject before upload attempt starts, not after a failed request** — validate size/type client-side
  immediately on file selection (reuse Drive's existing max-size/allowed-mime constants; backend-developer
  should expose these as a shared constant so the client check and server check use one source of truth,
  not two hand-copied numbers). This gives an instant error state, not a spinner-then-fail.
- Also fire a toast via `useToast` (`variant: 'error'`) for the rejection, since a chip embedded in a
  composer that's not currently visible (e.g. drag-drop while scrolled) could otherwise go unnoticed.

### Inline image thumbnail preview (in the sent message, not the composer)
- Already implemented at page.tsx ~L1487-1496 (`<img>` in an anchor, `maxWidth 300 / maxHeight 200`) — **this
  part does not need redesign**, it needs its `src`/`href` to point at the durable Drive URL instead of a
  blob URL once Phase A upload work lands. No visual change required here.
- Add a **loading skeleton** for the brief window between message-send and the image finishing its own
  browser-level decode: wrap the `<img>` in a container with a fixed aspect-conscious min-height
  (e.g. `minHeight: 120`) and use `@unerp/ui`'s `Skeleton` as the `<img>`'s `onLoad`-gated placeholder
  (render `Skeleton` until `onLoad` fires, then swap to the real `<img>`). This avoids layout jump.

### Generic file-icon card (non-image attachment, sent message)
- Already implemented at ~L1499-1512 — reuse as-is. One addition: when `a.url` is not yet present (edge
  case: message optimistically rendered before upload confirmation echoes back over the socket), render the
  card in a **disabled/pending** visual (opacity 0.6, no `Download` icon, small `Spinner` in its place) rather
  than a dead link. This only matters once Phase A's WS wiring makes optimistic send-before-ack possible;
  note it here so frontend-developer doesn't ship a broken-looking link in that race window.

### Accessibility
- Progress bar: `role="progressbar"` with `aria-valuenow`/`aria-valuemin={0}`/`aria-valuemax={100}` on the
  fill container, `aria-label="Uploading {filename}"`.
- Error chip: the error text must be programmatically associated — use `aria-describedby` linking the chip's
  error message id, or simplest, put the error text directly as the chip's `aria-label` override so screen
  readers announce it on focus.
- All remove (X) buttons: `aria-label="Remove {filename}"`, not a bare icon with only a `title` tooltip
  (title alone is not reliably exposed to all AT).
- Color must not be the only signal for error — the `AlertCircle` icon + text label already satisfy this
  (do not rely on border-color-only red as the sole indicator).

---

## 2. Channel management ("Manage channel" drawer)

### Reuse map
- **`Drawer`** from `@unerp/ui` (`packages/ui/src/components/navigation.tsx`) — right-side slide-over,
  already has `open`/`onClose`/`title`/`width`/`footer`. Use this, not a new bespoke panel.
- **`Tabs`** from `@unerp/ui` for the drawer's internal sections (General / Members) — Hick's Law: don't dump
  rename+archive+members all in one unbroken scroll; two tabs chunk it (Miller's Law, per the component's own
  doc comment).
- **`FormField` + `Input`** from `@unerp/ui` (`components/form.tsx`) for the rename field.
- **`ConfirmDialog`** from `@unerp/ui` for the archive confirmation (danger variant).
- **`StatusBadge`** or **`Badge`** from `@unerp/ui` for role badges (Owner/Admin/Member) — check
  `badge.tsx`/`status-badge.tsx` variant props before inventing new badge colors; map:
  - Owner → `Badge` variant that resolves to `--color-primary` tint (this is the "top" role, use the
    system's existing "primary/emphasis" badge variant, not a custom gold/crown color)
  - Admin → neutral/secondary badge variant
  - Member → no badge at all (Hick's Law — don't visually tag the default/majority case; only exceptions
    need a badge)
- **`ProtectedComponent`** (`@unerp/ui`) wraps the entire rename/archive/add/remove affordances per
  AGENTS.md rule 16 — gate on the relevant permission string (`communication.channel.manage`,
  `communication.channel.member.manage`), not just a client-side role check. The role check (owner/admin)
  still drives which buttons render for UX, but `ProtectedComponent` is the actual enforcement wrapper.
- **`Avatar`** (already defined locally in `connect/page.tsx`, not in `@unerp/ui`) — reuse the page-local
  `Avatar` function for member rows, matching every other member list in Connect (sidebar, channel info
  panel, thread panel). Do not create a second avatar rendering path.

### Entry point
Add a "Manage channel" item to the channel header's existing overflow — today the header has a bare
`Info` icon button (page.tsx ~L664-666) that toggles the "Details" panel. Do **not** overload that same
icon with two different behaviors. Instead:
- Add a new icon-less **text** trigger inside the existing "Details" panel (the `channelInfo` panel, L811+)
  — a `Button variant="secondary"` row at the top of that panel labeled "Manage channel" (visible only to
  owner/admin, via `ProtectedComponent`). This keeps the header icon count unchanged (Hick's Law — the header
  already has Members/Search/Pin/Mute/Video/Info, six affordances; do not add a seventh icon for a
  management action that most members will never use).
- Members (non-owner/admin) see no such entry — the drawer is not reachable for them at all, not just
  disabled-looking (disabled-but-visible invites confused "why can't I click this" reports).

### Layout — "Manage channel" Drawer

```
Drawer (open, width=440, title="Manage #general")
├─ Tabs: [General] [Members (12)]
│
├─ General tab
│   ├─ FormField label="Channel name" → Input value={name}, prefixed with "#" glyph (reuse the existing
│   │    Hash icon already used in the channel header, not a new icon)
│   ├─ FormField label="Topic" (optional) → Input
│   ├─ (spacing --space-6)
│   ├─ divider (1px var(--color-border))
│   ├─ "Danger zone" label (--text-xs, --color-text-tertiary, uppercase — matches existing section-label
│   │    styling used in the channel info panel, e.g. "Members (12)" label at L844)
│   └─ Button variant="danger" full-width: "Archive this channel"
│        → opens ConfirmDialog:
│           title: "Archive #general?"
│           message: "Members will no longer see this channel in their sidebar. Message history is kept
│                     and remains searchable. This can be undone by an owner later." 
│           confirmLabel: "Archive channel", variant="danger"
│
├─ Members tab
│   ├─ Search input (reuse FormField/Input, placeholder "Add people…") — inline "add member" combobox:
│   │    typing filters the tenant directory (same directory source as the existing "New message"/"New
│   │    group" people picker at page.tsx `people` state, ~L1280+) excluding current members.
│   │    Selecting a directory result immediately calls the add-member endpoint (optimistic add + toast on
│   │    failure), matching the existing add-to-group interaction pattern already in the codebase (no new
│   │    interaction paradigm invented here).
│   ├─ Member list (below search), each row:
│   │    [Avatar 28px] Name (you)?      [Owner|Admin badge, or nothing for Member]      [Remove icon, gated]
│   │    - Remove icon: only rendered for rows where (I am owner/admin) AND (target is not the sole owner).
│   │      Clicking opens ConfirmDialog: "Remove {name} from #general?" (variant default, not danger — 
│   │      removal is reversible via re-add, unlike archive).
│   │    - Reuse the existing member-row visual from the channel info panel (page.tsx L847-855) as the
│   │      base — same avatar size (28), same typography — just add the role badge and remove affordance.
│
└─ Footer: none required (all actions are inline, not a bulk "Save" — matches the rest of Connect's
    optimistic-save pattern, e.g. star/mute toggle immediately instead of a form submit)
```

Rename/topic edits: save on blur (matches the app's existing optimistic-immediate-save pattern for
star/mute rather than introducing a "Save" button pattern nowhere else in Connect uses). Show a small
inline "Saved" fade (reuse `useToast` with a short `success` toast, 1.5s auto-dismiss) rather than a modal
confirmation for a low-stakes text edit.

### States
- **Loading** (drawer just opened, member list not yet fetched): `Skeleton` rows (3× avatar+text skeleton
  rows) inside the Members tab, matching `skeleton.tsx`'s existing row pattern.
- **Empty** (search finds no directory matches while adding): reuse `EmptyState` compact inline variant if
  the component supports a compact/inline size, otherwise a simple centered `--color-text-tertiary` line
  "No matching people" — check `empty-state.tsx` props before deciding; don't force the full-page `EmptyState`
  into a 440px drawer if it's only designed for page-level emptiness.
- **Error** (add/remove member call fails): `useToast` `variant: 'error'`, message from the API's error body
  (already standardized per `.ai/CONVENTIONS.md` §5.2 error shape) — do not swallow the error silently.
- **403 (member attempts action)**: this case should be structurally impossible in the UI (buttons are gated
  by `ProtectedComponent` + never rendered for non-owners) — but if a role change happens mid-session and a
  stale client attempts an action anyway, surface the resulting 403 as a toast, not a silent no-op.

### Accessibility
- Drawer already handles ESC-to-close and is `role="dialog" aria-modal="true"` (built into `@unerp/ui`
  `Drawer`) — no extra work needed there.
- Tabs: `@unerp/ui` `Tabs` already sets `role="tablist"`/`role="tab"`/`aria-selected` — reuse as-is.
- Role badges must not be color-only: `Badge`/`StatusBadge` should render the text label ("Owner"/"Admin"),
  not just a colored dot — confirm the badge component always renders text (it does, per `badge.tsx` usage
  patterns elsewhere in the app).
- Remove-member button: `aria-label="Remove {name} from channel"`, not a bare icon.

---

## 3. "Browse channels" modal

### Reuse map
- **`Modal`** from `@unerp/ui`, `size="lg"` (760px) — enough width for a scannable list without being a
  full-bleed takeover.
- **`DataTable`** (`@unerp/ui`) is likely overkill/wrong shape here (this is a card-list of joinable channels
  with a topic blurb, not tabular data) — use a simple list of rows instead, matching the visual density of
  the existing sidebar channel list (Hash icon + name + secondary line), not a data grid.
- **`FormField`/`Input`** for the search/filter box.
- **`Button`** (`variant="secondary"`, size matching the app's compact 32px height per Fitts's Law rule
  in AGENTS.md) for the "Join" action per row.
- **`Pagination`** (`@unerp/ui`) if the tenant has enough public channels to paginate — otherwise a simple
  scrollable list capped at, say, `maxHeight: 420` is sufficient; only add `Pagination` if
  backend-developer's endpoint returns paginated results (confirm with data-architect/backend-developer
  before wiring — don't build client-side-only pagination for a server response that's already fully loaded).

### Entry point
Add a "Browse channels" trigger next to the existing "New channel" action. Locate it: the empty-state CTA
row already has `New message` / `New channel` buttons (page.tsx ~L618-621); the sidebar likely has an
equivalent "+ " control near the Channels section header (check the collapsed-section header rendering,
`collapsedSections` state, ~L544-561, for the exact insertion point — add a third small icon-button
"Browse channels" using the `Search` or a directory-style icon *only if* it adds meaning; per Hick's Law,
prefer **text** "Browse channels" over a bare icon if space allows, consistent with the "Text with a simple
chevron is preferred for dropdowns" rule in `.ai/CONVENTIONS.md` §8.1).

### Layout

```
Modal (size="lg", title="Browse channels")
├─ Input placeholder="Search channels by name or topic…" (full width, icon-prefixed Search, matches the
│    existing sidebarSearch/convSearch input visual treatment: 5px 8px 5px 26px padding, --radius-md border)
├─ (optional) filter chip row: "All" / "My space" / other ConnectSpace groupings if the tenant has multiple
│    spaces (Space model already exists — reuse Space.name as filter labels, do not invent new grouping
│    concepts)
├─ Scrollable list (maxHeight ~420px), each row:
│    [Hash icon]  #channel-name                              [Join button]
│                 topic text, truncated, --color-text-secondary, --text-xs
│                 N members · Public                          (secondary metadata line, --text-xs tertiary)
│
│    - Already-joined channels are excluded from this list entirely (per US-B3, "not yet a member of") —
│      do not show them grayed-out, just omit them; showing unreachable/greyed rows the user can't act on
│      adds noise without value.
│    - "Join" button: on click, optimistically disable + show `Spinner` inline in place of the label,
│      then either (a) closes modal and switches to the channel (recommended — matches the "join and go"
│      mental model of Teams/Slack), or (b) row transitions to a "Joined ✓" transient state before modal
│      auto-navigates. Prefer (a) for fewer clicks (Fitts's Law — don't make the user close-then-click-again
│      to reach the channel they just asked to join).
└─ Empty state (no public channels exist beyond ones you've joined, or search yields nothing):
     `EmptyState` component, message "No channels to join" / "No channels match your search", with a
     secondary action button "Create a channel instead" that closes this modal and opens the existing
     new-channel flow (reuses `newChannel()` already defined in page.tsx).
```

### States
- **Loading** (list fetching): `Skeleton` rows (icon+text pairs), 4-5 placeholder rows, matches loading
  pattern used elsewhere (`skeleton.tsx`).
- **Error** (fetch fails): inline error row with `AlertCircle` icon + retry button — reuse the existing
  error-state visual language already present in the page for workspace load failure (`loadErr` state,
  check its rendering block for the established error-card pattern and mirror it, not a new one).
- **Success**: row removed from list (see above) + toast "Joined #channel-name".

### Accessibility
- List rows are actual `<button>` elements (or the row wraps a `<button>` for the Join action specifically,
  with the row itself not being the entire click target unless the whole row also opens/joins — decide one
  click target per row, not two overlapping ones, to avoid ambiguous click semantics).
- Search input: `aria-label="Search public channels"` if no visible `<label>` is present (placeholder text
  alone is not a substitute for a label per WCAG 2.1 — pair with `aria-label`).

---

## 4. Search UI

### 4a. Channel-scoped search (make the existing input real)

**Current state**: `convSearch` input (page.tsx ~L649-652) already exists visually but only filters
already-loaded client messages. This section describes what changes once `GET /communication/search` exists.

**Reuse map**: no new component — evolve the existing input + results rendering area.

**Behavior change**: on typing (debounced ~300ms, matches typical search-input UX and avoids hammering the
new endpoint), call the search endpoint scoped to the active channel
(`GET /communication/search?q=...&channelId=...`) instead of (or in addition to, as a fallback while the
request is in flight) the current client-side `.filter()`.

**Layout — results surface**: Do not replace the main message feed with results in a way that's jarring.
Instead, when `convSearch` is non-empty and results have loaded, overlay a **results panel** below the
search input, anchored top-right of the message feed (similar positioning to the pinned-messages dropdown
that already exists in this codebase):

```
┌───────────────────────────────────────────┐
│  🔍  12 results in #general                │  <- count header, --text-xs, --color-text-secondary
├───────────────────────────────────────────┤
│  Author Name        3 days ago             │  <- --text-xs bold name + tertiary timestamp, same line
│  "...matched snippet with **query** bold…" │  <- snippet, query term bolded (reuse existing bold-render
│                                             │      pattern already used for markdown **bold**, i.e. wrap
│                                             │      the matched substring in <strong>)
├───────────────────────────────────────────┤
│  (next result...)                          │
└───────────────────────────────────────────┘
```
- Container styling: match the existing dropdown visual language already used for the mention-suggestion
  popover (page.tsx ~L718-726: `var(--color-bg-elevated)`, `1px solid var(--color-border)`, `--radius-lg`
  equivalent `10px`, `boxShadow` matching that popover's shadow value) — do not invent a new popover shape.
- Each result row is clickable → "jump to message": close the results panel, scroll the message feed to
  that message's position (requires the message to be loaded into `messages` state first if it's outside
  the currently-fetched window — coordinate with backend-developer/frontend-developer on whether jump-to
  triggers a fetch-around-message call, or the search endpoint returns enough context; this is an
  implementation detail for frontend-developer, not a design decision), then briefly highlight the target
  message row with a **flash background** (reuse `var(--color-primary-light)` as a 1200ms fade-out
  background transition on that specific `MessageRow`, then return to transparent) so the user's eye finds
  it immediately (Gestalt — figure-ground pop for the "found" item).
- **Loading** (debounce window / request in flight): keep the current results panel visible but show a
  small `Spinner` (16px) inline in the results-header row instead of the count, e.g. "Searching…" — do not
  blank the panel and cause layout jump.
- **Empty**: "No messages match \"{query}\"" — reuse the exact copy/style already at page.tsx ~L703, just
  swap client-filter-driven emptiness for server-driven.
- **Error**: small inline error line inside the results panel, "Search failed. Try again." + retry — do not
  silently fall back to client-only substring filtering as if nothing went wrong (this masks a real backend
  problem from the user and from you when triaging bug reports).

### 4b. Global switcher (Ctrl+K) — mixing people/conversations/messages

**Current state**: `switcher` modal (page.tsx ~L1314-1358) already groups results into "Conversations" and
"People" sections with uppercase section labels. **Add a third section: "Messages."**

**Layout addition**:
```
Modal (existing switcher modal, width=580 — unchanged)
├─ Search input (existing, unchanged)
├─ Results, now three sections instead of two:
│   CONVERSATIONS   (existing rendering, unchanged)
│   PEOPLE          (existing rendering, unchanged)
│   MESSAGES        (new)
│     [Hash/MessageSquare icon]  Channel name › Author Name             3d ago
│                                 "...matched snippet…"
```
- Each message result row: leading icon indicates the **conversation kind** (reuse `Hash`/`Users`/
  `MessageSquare` exactly as the Conversations section already does), then `Channel name › Author Name` as
  the primary line (the `›` separator matches the breadcrumb chevron convention already used elsewhere in
  the app's `.frappe-breadcrumb`, so it reads as familiar wayfinding, not a new symbol), then the snippet as
  a secondary line, then relative timestamp right-aligned (matches the Conversations section's existing
  right-aligned unread-badge slot position, for visual column alignment across all three sections).
- Clicking a message result: closes the switcher, calls `switchConv(channelId)` (already exists), then
  performs the same "jump to message + flash highlight" behavior described in §4a.
- Section ordering: Conversations, People, Messages — messages last, since they're the most numerous/noisy
  and least likely to be the top intent for a short query (Hick's Law — put the most probable target
  first). If a query looks message-like (multi-word phrase) versus name-like (single token), that's a
  ranking/backend concern, not a layout one — this spec only fixes visual grouping order, not relevance
  ranking logic.
- **Do not add a 4th visual weight tier or a "Best match" merged section** — keeping three clearly labeled
  sections is more scannable than a cleverly-merged single ranked list, especially since the three result
  types have structurally different metadata (a "message" needs a snippet + channel context; a "person"
  needs presence + email). Forcing them into one undifferentiated list would lose that context.

### Accessibility (both 4a/4b)
- Results lists: each row is a real `<button>` (already the case in the switcher; carry the same pattern
  into the new channel-scoped results panel).
- `aria-live="polite"` region wrapping the result count text so screen reader users hear "12 results" or
  "No results" without needing to re-navigate into the list.
- Bolded query-match snippets: use `<mark>` semantically (or `<strong>`, but `<mark>` is the more correct
  element for "this is the part that matched a search"), styled via CSS to just inherit bold/primary color
  rather than the browser default yellow highlight (which would clash with the token palette).

---

## 5. Per-channel notification-level picker

### Reuse map
- No existing dropdown/segmented-control primitive exists in `@unerp/ui` for a 3-option enum picker — check
  `packages/ui/src/components` again: `Tabs` is close but is styled as page-level underline tabs, wrong
  register for a compact inline control. **Do not add a new component to `packages/ui` for this** — a native
  `<select>` styled via the existing `Select` component (`components/form.tsx`, already exported) is the
  correct reuse: it's already token-styled, accessible by default (native select semantics), and used
  elsewhere for enum pickers. Use `Select` with three options, not a custom segmented-button control.

### Replacement location
Today: a single `Bell`/`BellOff` icon-button toggle in two places — the channel header (page.tsx ~L660-662)
and the channel info panel (~L827-830, the "Mute/Unmute" square button). **Both must be replaced** with the
same `Select`-based control so the two surfaces stay in sync/consistent (do not fix one and leave the other
as a binary toggle — that would reintroduce exactly the inconsistency this phase is meant to remove).

**Channel header** (compact context — this is a dense toolbar, per Fitts's/Hick's Law don't blow up its
width): replace the icon button with a small `Select` sized to content (`width: auto` or a fixed ~130px),
using text labels, not icons, per the "Text with a simple chevron is preferred for dropdowns" rule:
```
[▾ All messages]      (options: "All messages" | "Mentions only" | "Nothing")
```
Keep the existing `Bell`/`BellOff` icon **removed** from the header once this ships — a `Select` already
communicates the current state via its visible text, so the icon becomes redundant decoration (Hick's Law:
remove icons that don't add meaning, per the pushback protocol).

**Channel info panel** ("Manage channel" drawer's General tab is also an appropriate home — but the
requirements doc says "near the channel header or in a channel settings area," so placing it in the header
directly, as above, is sufficient; do not duplicate the control in three places. Recommend: header only,
remove the old mute button from the info-panel's icon-row (~L826-839) and replace that slot with the same
compact `Select`, OR simply drop it from the info panel entirely since the header now owns it — prefer
dropping it from the info panel to avoid a second interactive copy of the same state that could visually
desync during optimistic updates.)

### States
- Immediate optimistic update on selection change (matches every other toggle in this codebase — star,
  mute, pin — no "Save" button pattern).
- Brief inline confirmation not required for this one (it's not a destructive/irreversible action) — the
  `Select`'s own updated visible value is sufficient feedback.
- **Error** (API call fails): revert the `Select`'s visible value to the prior state and fire a `useToast`
  error — do not leave the UI showing a value that didn't actually persist server-side.

### Accessibility
- Native `<select>` (via `Select`) already provides full keyboard operability and screen-reader semantics —
  this is a deliberate reason to prefer it over a custom segmented-control widget, which would require
  hand-rolled `role="radiogroup"`/arrow-key handling to reach the same accessibility baseline for no visual
  benefit at this control's size.
- `aria-label="Notification level for #{channelName}"` on the select element itself, since its visible
  label ("All messages" etc.) doesn't self-describe *which channel* it applies to out of context.

---

## 6. Typing indicator and live presence

### 6a. Typing indicator ("X is typing…")

**Placement**: directly above the composer, below the message feed — a single-line, low-emphasis strip that
appears/disappears without shifting the composer's own height (reserve a fixed-height slot, e.g.
`height: 20px`, that's empty/collapsed when nobody's typing, so the composer doesn't jump up and down as
indicators appear — this is a Gestalt/stability concern: layout shift right above where the user is about
to click "send" is actively harmful).

```
(message feed, scrollable)
─────────────────────────────
  Jane Doe is typing…          <- fixed-height strip, fades in/out, does not push composer
─────────────────────────────
[ Aa  📎  Message #general…  😊  ➤ ]   <- composer, unaffected by strip's presence/absence
```

- Typography: `--text-xs`, `--color-text-tertiary`, `font-style: italic` optional (matches the existing
  "(edited)" and system-message secondary-text register already used in `MessageRow`).
- Multiple people typing: "Jane and Alex are typing…" (2 people) / "Jane, Alex, and 2 others are typing…"
  (3+) — standard truncation pattern, avoid an unbounded name list.
- Animation: a subtle 3-dot pulse (●‧●‧●) to the left of the text is optional polish, not required — do not
  spend design/build effort on a bespoke typing-dots SVG animation when the text alone satisfies the user
  story; if added, keep it to a simple CSS `opacity` keyframe on 3 static dots, reusing
  `--duration-slow`/`--ease-default` tokens, not a new animation library.
- Appears within ~1s of the `typing` WS event per US-A4; disappears after 3s of inactivity (already
  specified in the requirements doc as the timeout — this is a backend/frontend timer detail, not a design
  decision, just confirming the visual disappearance should be an instant unmount, not a fade-out long
  enough to feel laggy — keep any fade under `--duration-fast` (100ms) if used at all).

### 6b. Live presence dot — visual treatment for live vs. poll-based updates

**Current state**: `PresenceDot` (page.tsx ~L26-35) already renders a colored dot with a border and an
optional "ring" glow for DND. This visual design **does not need to change** — the requirements doc (US-A5)
is about the *data freshness* (live via WS vs. 15s poll), not the dot's appearance. Confirm/adjust per the
task: no new visual state is needed for "live" vs "polled" — a presence dot should never visibially
distinguish its own transport mechanism to the end user (that's an implementation leak, not a UI need).

**One adjustment worth making**: add a **brief transition** when a presence dot's color changes (e.g. green
→ gray on going offline) so simultaneous multi-user presence updates (once live via WS, potentially several
directory rows updating within the same second) don't feel like a jarring flicker across the whole
directory list. Use a `background-color` CSS transition of `var(--duration-normal)` on the dot element —
purely additive, no markup change needed, one CSS property.

**Do not** add a "live" badge, pulsing animation, or "connected" indicator elsewhere in the UI for the
socket connection status **in this pass** — that's a legitimate future affordance (e.g. a small
connection-state icon in the app header) but is not one of the 7 requested surfaces and would be scope
creep on a spec meant to stay implementable directly.

---

## 7. Message forward dialog, link-preview card, upgraded emoji picker

### 7a. Forward dialog

**Reuse map**: `Modal` (`@unerp/ui`, `size="md"`), the same conversation-list-with-search pattern already
built for the People picker (`people` state block, page.tsx ~L1280+) — **do not build a second
"pick-a-conversation" search UI from scratch**; extract the interaction pattern (search input filtering a
combined channel+DM+group list, single-select) and reuse its shape for forwarding, changing only the
destination action from "start DM/group" to "forward here."

**Trigger**: add "Forward" to the existing hover-action icon row on a message (page.tsx ~L1536-1542,
alongside React/Reply/Pin/Bookmark/Edit/Delete). Use `Forward` icon (already imported at the top of
page.tsx, line 9 — currently unused, confirming it was pre-provisioned for exactly this). Available to any
member for any non-deleted message (forwarding isn't owner/admin-gated — it's a personal action, like
reply).

```
Modal (title="Forward message")
├─ Preview of the original message being forwarded (compact, read-only):
│    [Avatar 24px] Author Name · original timestamp
│    "message content preview, truncated to ~2 lines"
│    [attachment chip if any, non-interactive preview]
├─ divider
├─ Input placeholder="Search conversations or people…" (reuses the People-picker search pattern)
├─ Scrollable result list (channels/DMs/groups, single-select — click selects and immediately shows a
│    selected/highlighted state, does not auto-submit on click, since forwarding is a more deliberate act
│    than starting a DM)
└─ Footer: Button variant="secondary" "Cancel", Button variant="primary" "Forward" (disabled until a
    target is selected)
```

**Rendering the forwarded message** (per US-C1 — "referencing the original... not a duplicate raw copy that
hides its origin"):
```
┌────────────────────────────────────────┐
│ ↪ Forwarded from #original-channel      │  <- small header strip, Forward icon + source label,
│                                          │     --text-xs --color-text-tertiary
│ [Avatar] Original Author · original ts  │  <- the ORIGINAL author/timestamp shown, not the forwarder's
│ original message content                │
└────────────────────────────────────────┘
```
This nested-card treatment reuses the same visual language as the existing `ThreadMsg` sub-component
(page.tsx ~L1411) — small avatar, name, timestamp, content — wrapped in a bordered card
(`1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, `padding: var(--space-3)`, subtle
`background: var(--color-bg)` to recess it slightly from the outer message bubble, per the Gestalt
figure-ground principle already codified in `.ai/CONVENTIONS.md` §8.1). The *forwarder's own* message row
wraps this card exactly like a normal message would wrap an attachment — same author line, same timestamp,
same hover actions, just with this nested card as its "content."

**States**: loading (forwarding in flight) — disable the Forward button + show `Spinner` in its place, same
pattern as every other async button in this spec. Error — `useToast`, keep modal open so the user can retry
without re-selecting.

### 7b. Link-preview card

**Reuse map**: no existing component — this is a genuinely new visual pattern, but it's a **static content
card**, not an interactive component, so it does not need registration as a reusable `@unerp/ui` primitive
unless a second consumer emerges (e.g. Drive comments, CRM notes) — build it as a local sub-component in
`connect/page.tsx` (or a small colocated file) for now, following the same "local sub-component" precedent
already set by `ThreadMsg`/`MessageRow`/`IconBtn` in this same file.

**Layout** (rendered below the message text, above attachments, when the message content contains a URL and
the server-fetched OpenGraph metadata is available):
```
┌───────────────────────────────────────────────┐
│ ┌──────────┐  Page Title (bold, --text-sm)     │
│ │  og:image │  Description text, 2-line clamp, │
│ │  96×96    │  --text-xs --color-text-secondary│
│ └──────────┘  domain.com  (--text-xs tertiary) │
└───────────────────────────────────────────────┘
```
- Whole card is a single `<a>` wrapping all of it, `target="_blank" rel="noopener"` (matches the existing
  attachment-card link pattern already used for file downloads).
- Card border/radius matches the existing attachment file-card exactly (`1px solid var(--color-border)`,
  `border-radius: var(--radius-lg)` /`8px` per current inline values, `padding: var(--space-2)`  to
  `var(--space-3)`) — this is a sibling of the attachment card visually, not a new visual family, so reusing
  its exact metrics keeps the message feed visually coherent (Gestalt similarity).
- If no `og:image`, omit the thumbnail slot entirely (text-only card, image column collapses) — do not show
  a placeholder/broken-image box.
- **Max one link preview per message** even if multiple URLs are present, to avoid a message becoming a wall
  of preview cards (Hick's Law adjacent concern — information density control). If backend-developer's
  fetch-and-cache only unfurls the first URL, that already matches this design constraint; confirm with
  backend-developer rather than assuming.
- **Loading**: while the server-side unfurl is pending (message just sent, preview not yet fetched), show
  nothing extra (not a skeleton card) — the plain link text (already rendered via the existing
  `parseMarkdown` autolinking) is sufficient in the interim; the preview card appears once ready via a
  soft fade-in. Do not block message send/render on the unfurl completing.
- **Failure** (URL doesn't unfurl — 404, blocked robots.txt, etc.): render nothing — fall back silently to
  the plain link text. Do not show a broken-preview error card; a bare hyperlink is a perfectly good
  degraded state and doesn't need to announce the failure to the user.

### 7c. Upgraded emoji picker (categories + search)

**Reuse map**: replaces the fixed `EMOJI_PALETTE` grid used in three places (composer reaction trigger
~L771-775, message hover-react ~L1543-1547, thread — confirm no fourth usage). Build **one shared
sub-component** (e.g. `EmojiPicker`) used in all three call sites instead of three separately inlined grids
— this consolidates what's currently copy-pasted markup into a single reusable piece, satisfying the
"propose components... for genuinely missing patterns" guidance from this role's brief. Since it's reused
3× within this one page/feature, it can live as a local component in `connect/page.tsx`'s sub-components
section (alongside `MessageRow`, `ThreadMsg`) — it does not need to graduate to `@unerp/ui` unless another
module (e.g. CRM activity reactions) independently needs an emoji picker; don't speculatively promote it.

**Layout**:
```
┌─────────────────────────────────────────┐
│ 🔍  Search emoji…                         │  <- Input, matches existing small-input styling
├─────────────────────────────────────────┤
│ 🕐 😀 🐻 🍔 ⚽ 🚗 💡 🚩                       │  <- category tab strip (icons-as-tabs is acceptable HERE
│                                            │     specifically because these ARE the universally recognized
│                                            │     glyphs for their categories — Recent/Smileys/Animals/
│                                            │     Food/Activities/Travel/Objects/Symbols — this is the one
│                                            │     place in Connect where an icon-only tab strip doesn't
│                                            │     violate Hick's-Law text-preferred guidance, because emoji
│                                            │     category glyphs are the actual content being picked, not
│                                            │     decorative chrome)
├─────────────────────────────────────────┤
│ 😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊           │  <- grid, 6-8 cols depending on popover width, reuse the
│ (scrollable grid, current category)      │     existing grid metrics already used for EMOJI_PALETTE
│                                            │     (repeat(6, 1fr), gap 2, button padding 4, fontSize 20)
└─────────────────────────────────────────┘
```
- "Recent" category (first tab) shows the user's last-used emoji, persisted in `localStorage` client-side
  (no backend endpoint needed for this — it's a per-browser convenience, not synced data) — reuse the same
  `localStorage` access pattern already used for the auth token in `connectData.ts` (`window.localStorage`).
- Search: filters across all categories by emoji short-name (e.g. typing "fire" surfaces 🔥) — requires a
  static emoji-name dataset; recommend a small, dependency-free curated list scoped to common workplace-chat
  emoji (not the full Unicode 5000+ set) to keep the picker fast and the bundle light — this is explicitly
  *not* "every emoji ever," matching the existing `EMOJI_PALETTE`'s curated-subset philosophy, just a much
  larger curated subset with categories. Confirm exact dataset size/source with frontend-developer at build
  time; out of scope for this design spec to dictate a specific npm package.
- Popover container: same shell as today's fixed grid (`var(--color-bg-elevated)`, `1px solid
  var(--color-border)`, `border-radius: 12px`, `boxShadow` matching existing), just taller
  (~320px total) to fit search + category tabs + scrollable grid, and positioned identically to today
  (composer: `position: absolute, bottom: 100%, right: 16`; message hover: `position: absolute, top: 100%,
  right: 0`).
- **Keyboard**: search input autofocused on open (matches switcher modal precedent), Escape closes the
  picker (reuse the same outside-click-to-close pattern the current fixed grid presumably relies on via a
  page-level click listener — confirm that listener exists and extend it, don't add a second one).

### Accessibility (7a-7c)
- Forward modal: standard `Modal` accessibility (focus trap, ESC) already provided by `@unerp/ui`.
- Link preview card: the whole card is one focusable link (`<a>`), so screen readers announce it once with
  its accessible name being the page title — do not additionally wrap internal pieces in separate
  interactive elements.
- Emoji picker: grid buttons need `aria-label="{emoji-name}"` (e.g. `aria-label="fire"`), not just the raw
  glyph, since many screen readers announce emoji glyphs inconsistently or verbosely — an explicit label
  gives a clean, predictable announcement. Category tabs need `aria-label` too, since they're icon-only
  (e.g. `aria-label="Food & drink category"`), which is the specific carve-out justifying icon-only tabs
  here per the note above — the accessible name must still be textual even though the visual is iconic.

---

## 8. Handoff notes for frontend-developer

1. **Fix the Modal inconsistency while you're in this file**: `connect/page.tsx` has a local `Modal`
   function (bottom of file) that duplicates `@unerp/ui`'s `Modal`. Every new surface in this spec (Browse
   Channels, Forward dialog) should use `@unerp/ui`'s `Modal`/`ConfirmDialog`. Consider (separately, or as
   part of this work if scope allows) migrating the *existing* local-Modal call sites
   (People picker, Quick switcher, Profile card, Keyboard shortcuts) to `@unerp/ui`'s `Modal` too, so the
   page has one modal implementation, not two. Flag this to code-reviewer if you decide it's out of scope
   for this pass — don't silently leave two competing implementations without a note.
2. **Manage Channel must use `@unerp/ui`'s `Drawer`**, not a third bespoke panel pattern (the existing
   "Details" info panel is already a second hand-rolled pattern; don't add a fourth).
3. **New reusable local sub-component**: consolidate the three inline `EMOJI_PALETTE` grids into one
   `EmojiPicker` sub-component (§7c) before wiring in categories/search — don't triplicate the new, larger
   implementation.
4. **Shared size/type validation constants**: coordinate with backend-developer so the client-side
   pre-upload validation (§1) and the server's actual enforcement use one shared constant/config, not two
   independently maintained numbers that can drift.
5. **Confirm exact danger-color token name** in `packages/ui/src/tokens/design-tokens.css` before using it
   for error-state chip borders (§1) — this document deliberately did not hardcode a guess.
6. **`ProtectedComponent` gating**: rename/archive/add-remove-member controls in the Manage Channel drawer
   (§2) must be wrapped per AGENTS.md rule 16, using the permission strings backend-developer registers in
   `packages/shared/src/permissions/registry.ts` per the requirements doc's cross-cutting section — do not
   ship the drawer before those permission strings exist and are registered, or `ProtectedComponent` has
   nothing correct to check against.
7. **`@TrackChanges`**: rename/archive changes need the change-history hookup per AGENTS.md rule 13/14 —
   this is a backend+frontend joint concern (`<ChangeHistory entityType="Channel" entityId={id} />` should
   appear somewhere reachable, likely in the Manage Channel drawer's General tab, below the danger zone, or
   omit if channel detail has no dedicated "record page" today — confirm with backend-developer whether
   Channel is tracked as a `TrackChanges` entity at all before adding a `ChangeHistory` component that would
   render empty).

## 9. Accessibility checklist (roll-up, WCAG 2.1 AA)

- [ ] All new interactive elements are real `<button>`/`<a>`/`<select>` elements, not `<div onClick>`.
- [ ] All icon-only buttons have `aria-label` (not just `title`).
- [ ] Color is never the sole signal (error states pair icon/text with color; role badges show text).
- [ ] Focus trap + ESC-to-close on all new modals/drawers (inherited free from `@unerp/ui` `Modal`/`Drawer`
      — do not bypass by using a different container).
- [ ] Progress bar has `role="progressbar"` + `aria-valuenow`/min/max.
- [ ] Search result regions use `aria-live="polite"` for result-count announcements.
- [ ] Text contrast ≥ 4.5:1 — verify against `--color-text-tertiary` on `--color-bg-elevated` specifically,
      since several new secondary-line treatments in this spec (snippets, metadata lines) use tertiary text
      color at `--text-xs` size, the combination most likely to fail contrast checks if the token values
      ever shift — flag to qa-tester as a specific check, not just a general contrast pass.
- [ ] Keyboard-only path exists for: staging/removing an attachment, opening/closing Manage Channel,
      joining a channel from Browse Channels, selecting a search result (channel-scoped and global),
      changing notification level, forwarding a message, picking an emoji by category and by search.
