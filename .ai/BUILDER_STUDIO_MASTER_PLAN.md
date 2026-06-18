# 🚀 Universal ERP: Builder Studio Master Plan (40 Phases)

> **Document Purpose**: A comprehensive, 40-phase strategic and technical execution plan to build the "Builder Studio" module. This plan is designed to not only reach parity with top market players (Salesforce, Odoo, Retool, Frappe) but to completely surpass them by addressing current market gaps and introducing next-gen capabilities (AI, Real-time Collaboration, Zero-Code Microservices).

---

## 📊 End-to-End Market Analysis

### Top Players & Their Strengths
- **Salesforce Lightning**: Massive ecosystem, complex workflow automation, mature object relations.
- **Odoo Studio**: Tightly coupled with core ERP modules, instant schema generation.
- **Retool**: High developer productivity, instant REST/SQL integrations, great for internal tools.
- **Bubble**: Pixel-perfect UI control, complete full-stack visual logic without code.
- **Frappe Framework**: Metadata-driven, instantaneous reflection in UI and DB, standard `Link` and `Table` fields.

### 🛑 The Market Gap (What Top Players are Missing)
1. **The "Developer vs. Business User" Chasm**: Platforms are either too restrictive (Airtable) or require JavaScript/SQL knowledge (Retool). There is no smooth graduation path.
2. **True Monorepo + Zero-Code Hybrid**: No platform seamlessly marries a strictly-typed Next.js/NestJS enterprise monorepo with a dynamic DB-backed Zero-Code UI builder.
3. **Collaborative Data Modeling**: Multiplayer (Figma-like) schema and UI building is completely absent in enterprise ERP builders.
4. **AI-Native Construction**: Competitors use AI as a side-car chatbot. True AI integration requires the engine to auto-migrate schemas, infer relationships, and generate UI dynamically based on intent.
5. **Instant Tenant Overrides**: Multi-tenant SaaS builders fail to cleanly handle base-template vs. tenant-specific customizations without duplicating massive amounts of data.

---

## 🏗️ Builder Studio Architecture

- **Frontend Builder Shell**: Next.js 15 App Router, Radix UI Primitives, `dnd-kit` for drag-and-drop, and Zustand for complex canvas state management.
- **UI Renderer Engine**: A recursive component tree parser (`DynamicFormRenderer`) that translates JSON definitions into live React components strictly utilizing the `frappe-*` utility CSS classes.
- **Backend Metadata Engine**: NestJS APIs to handle CRUD on `PageRegistry` and `SchemaRegistry`.
- **Dynamic Database Layer**: Uses Prisma for core tables, but relies on a secure Postgres JSONB or dynamically generated schema approach (Tenant-isolated) for custom builder entities.
- **Event Bus**: Redis + BullMQ to trigger background workflows when custom Builder forms are submitted.

---

## 📅 The 40-Phase Roadmap (Deep Functional Inclusion)

### Phase Block I: Foundation & Core UI (Catching up to Baseline)

**Phase 1: Visual Canvas & Global Grid System**
* **Functional Inclusion Details:**
  - **Infinite Canvas Area**: A droppable workspace supporting pan, zoom, and dynamic height scaling.
  - **Drag-and-Drop Engine**: Integration of `dnd-kit` supporting collision detection, sortable zones, and ghost UI rendering during drag.
  - **Grid Alignment System**: Enforcement of the `frappe-grid-12` standard. Users can resize components to occupy 1 to 12 columns.
  - **Property Inspector Shell**: A contextual right sidebar that binds to the active selected node and dynamically renders its specific configuration options.
  - **Component Tree Browser**: A left sidebar outlining the hierarchical DOM-like structure of the form with expand/collapse and reorder capabilities.
* **Effort**: High (2 Weeks)
* **Testing**: E2E simulation of node dragging, collision checks, and responsive wrapping verifications.

**Phase 2: Standard Inputs & Field Types**
* **Functional Inclusion Details:**
  - **Base Field Components**: Text (Single/Multi-line), Number (Integer/Decimal), Date (with standard Picker), Time, Select (Dropdown), Checkbox, and Radio Groups.
  - **Field Metadata Settings**: Configurable Labels, Placeholder text, Default values, Help text/Tooltips, and CSS class overrides.
  - **Data Binding Shell**: Mechanism to bind a field's visual UI to a specific JSON key in the resulting form payload.
* **Effort**: Medium (1 Week)
* **Testing**: Unit tests on value propagation from UI node to the central Zustand store.

**Phase 3: Schema Registry (The DB Modeler)**
* **Functional Inclusion Details:**
  - **Entity Creator**: Visual wizard to define a new Custom Record Type (e.g., "Vehicle Maintenance").
  - **Field-to-Column Mapping**: Automatically translates UI Fields from Phase 2 into underlying PostgreSQL schema columns (or JSONB keys depending on tenant setup).
  - **Migration Executor**: Generates safe, non-destructive migration commands in the NestJS backend and applies them without dropping existing data.
  - **Schema Viewer**: Visual representation of the active table structure with indexing options.
* **Effort**: High (2.5 Weeks)
* **Testing**: Backend tests ensuring safe ALTER TABLE executions and proper Prisma/Raw SQL routing.

**Phase 4: Form Layout Controls**
* **Functional Inclusion Details:**
  - **Section Breaks**: Visual separators with optional collapsibility.
  - **Tab Groups**: Multi-tab containers to split long forms into logical pages.
  - **Column Wrappers**: Nested grid structures (e.g., a 6-col area split into two 3-col areas).
  - **HTML/Divider Blocks**: Read-only descriptive text blocks, horizontal rules, and alert banners (`frappe-alert`).
* **Effort**: Medium (1 Week)
* **Testing**: Rendering engine recursion depth tests to ensure nested tabs/columns do not trigger infinite loops.

**Phase 5: Page Registry & Dynamic Routing**
* **Functional Inclusion Details:**
  - **Save/Publish Workflow**: Writes the JSON DOM tree to the `PageRegistry` DB table.
  - **Wildcard Route Handler**: Implement `/app/[module]/[slug]` in Next.js which queries the `PageRegistry` and feeds the JSON into the `DynamicFormRenderer`.
  - **404/Fallback States**: Graceful error handling if a custom page slug is invalid or unpublished.
* **Effort**: Medium (1.5 Weeks)
* **Testing**: E2E URL fetching and dynamic hydration assertions.

### Phase Block II: Relational Data & Advanced Controls (Matching Frappe/Odoo)

**Phase 6: Relational Field Types (Link/Lookup)**
* **Functional Inclusion Details:**
  - **Link Field**: Equivalent to Frappe's Link. Allows selecting a single record from another Entity (e.g., Selecting a `Customer`).
  - **Multi-Select Link**: Allows tagging multiple records (Many-to-Many).
  - **Dynamic Search Fetcher**: Auto-populating dropdown that queries the NestJS backend with debounced text search, respecting RLS and Tenant limits.
  - **Cross-Entity Validation**: Prevents deletion of the parent record if linked by a required field.
* **Effort**: High (2 Weeks)

**Phase 7: Child Tables (Sub-forms/Grids)**
* **Functional Inclusion Details:**
  - **Inline Editable Grid**: A table component embedded inside the form for entering 1-to-N relationships (e.g., Invoice Line Items).
  - **Grid Action Bar**: Add row, duplicate row, delete row, reorder rows via drag handles.
  - **Aggregators**: Automatic footer calculations (e.g., Sum of `Amount` column).
* **Effort**: High (2 Weeks)

**Phase 8: Basic Validation Rules**
* **Functional Inclusion Details:**
  - **Constraint Configurator**: Toggles for Required (mandatory), Min Length, Max Length, Min Value, Max Value.
  - **Regex Engine**: Input custom Regular Expressions (e.g., for standardizing ZIP codes).
  - **Custom Error Overrides**: Ability to type custom error messages that appear in standard `Toast` popups on failed submission.
* **Effort**: Medium (1 Week)

**Phase 9: Action Buttons & Basic Submit Logic**
* **Functional Inclusion Details:**
  - **Button Component**: Draggable button with configurable actions (Save Draft, Submit, Cancel, Delete).
  - **CRUD Event Emitters**: Hooks the Button click directly to the NestJS generic CRUD controller (`POST /api/custom/{slug}`).
  - **Post-Submit Redirects**: Visual option to "Redirect to List View" or "Reload Form" upon successful 200 OK.
* **Effort**: Medium (1 Week)

**Phase 10: Dynamic Sidebar Integration**
* **Functional Inclusion Details:**
  - **Menu Injection**: Form configuration includes "Parent Module" (e.g., CRM). The global sidebar dynamically reads this and injects the link.
  - **Icon Selector**: Choose an SVG icon from the Radix/Lucide icon set to display in the menu.
* **Effort**: Low (0.5 Weeks)

### Phase Block III: Advanced Logic & Interactivity (Matching Retool/Airtable)

**Phase 11: Calculated & Formula Fields**
* **Functional Inclusion Details:**
  - **Expression Editor**: A specialized input box accepting Excel-like syntax (e.g., `SUM({line_items.total}) * (1 - {discount_rate})`).
  - **Client-Side AST Parser**: Real-time evaluation of the formula as the user types in dependent fields.
  - **Server-Side Verification**: Re-evaluation of the formula on the backend during the `POST` payload to prevent tampering.
* **Effort**: High (2.5 Weeks)

**Phase 12: Conditional Visibility & State**
* **Functional Inclusion Details:**
  - **Rule Builder UI**: An IF/THEN query builder attached to any field (e.g., `IF {Type} == "Other" THEN Show {Description}`).
  - **Cascading Updates**: Ensuring that when a parent field is hidden, its required validations are bypassed.
* **Effort**: Medium (1.5 Weeks)

**Phase 13: Dynamic Read-only / Mandatory Rules**
* **Functional Inclusion Details:**
  - **State Policies**: IF/THEN rules specifically for mutating the `disabled` or `required` HTML attributes dynamically based on the form's data state.
* **Effort**: Medium (1 Week)

**Phase 14: ListView Builder & Column Selector**
* **Functional Inclusion Details:**
  - **Table Layout Configurator**: Build the default list/table view for the custom entity.
  - **Column Chooser**: Select which fields from the schema appear as columns.
  - **Default Sort & Filter**: Set predefined backend queries (e.g., Default Filter: `Status != 'Closed'`).
  - **Bulk Actions Area**: Configure buttons that operate on multiple selected checkboxes in the list.
* **Effort**: High (2 Weeks)

**Phase 15: Custom Views (Kanban & Calendar)**
* **Functional Inclusion Details:**
  - **Kanban Mapper**: Select a `Status/Select` field to serve as columns, and map Title/Description fields to the cards.
  - **Calendar Mapper**: Map `Start Date` and `End Date` fields to render records on a month/week visual calendar.
* **Effort**: High (2 Weeks)

### Phase Block IV: Security & Rich Content

**Phase 16: Field-Level RBAC (Role-Based Access Control)**
* **Functional Inclusion Details:**
  - **Permission Matrix**: A grid mapping every form field against global System Roles.
  - **Read/Write/Hide Toggles**: Specify if a "Sales Rep" can edit, view, or cannot even see the "Commission Rate" field.
  - **Backend Enforcement**: NestJS guards scrub unauthorized fields from the incoming payload and outgoing API responses.
* **Effort**: High (2 Weeks)

**Phase 17: File & Attachment Blocks**
* **Functional Inclusion Details:**
  - **Dropzone UI**: Visual component accepting file drags.
  - **S3/MinIO Integration**: Hooks into the ERP's core storage bucket.
  - **Config Options**: Limit file sizes (MBs), limit file types (e.g., `image/jpeg, application/pdf`), allow multiple files.
* **Effort**: Medium (1.5 Weeks)

**Phase 18: Rich Text & Markdown Editors**
* **Functional Inclusion Details:**
  - **WYSIWYG Block**: Integration of a robust editor (like Tiptap) for large-form content (e.g., terms and conditions, descriptions).
  - **Markdown Mode**: Toggle for developer-friendly markdown syntax.
* **Effort**: Medium (1 Week)

**Phase 19: Signature & Canvas Inputs**
* **Functional Inclusion Details:**
  - **Drawing Pad**: An HTML5 Canvas wrapper that records touch/mouse strokes.
  - **Base64 Converter**: Auto-converts the signature to a PNG buffer and uploads it as an attachment on save.
* **Effort**: Low (1 Week)

**Phase 20: Version Control & Drafts**
* **Functional Inclusion Details:**
  - **Builder History**: Tracks every save of the form layout in a version history table (`PageRegistryVersions`).
  - **Diff Viewer**: See what fields were added/removed between versions.
  - **Publish/Rollback Flow**: One-click restoration of previous UI layouts.
* **Effort**: High (2 Weeks)

### Phase Block V: Integrations & Connectors (Matching Salesforce/ServiceNow)

**Phase 21: Visual Webhook Configuration**
* **Functional Inclusion Details:**
  - **Endpoint Configurator**: UI to paste a URL and set Headers (Auth tokens).
  - **Payload Mapper**: Map form fields to the outgoing JSON payload structure.
  - **Trigger Events**: Hook the webhook to OnSubmit, OnUpdate, or OnDelete.
* **Effort**: Medium (1.5 Weeks)

**Phase 22: REST API Data Sources**
* **Functional Inclusion Details:**
  - **External Fetcher**: Define a GET request to a 3rd party API.
  - **Response Pathing**: Use JSONPath to extract the exact array of data needed from the response.
  - **UI Binding**: Bind the fetched data array to a Dropdown options list or a read-only Grid.
* **Effort**: High (2.5 Weeks)

**Phase 23: Visual Event Handlers**
* **Functional Inclusion Details:**
  - **Action Chains**: A step-by-step UI to chain actions (1. Run Query, 2. Show Toast, 3. Clear Form, 4. Close Modal).
  - **Conditionals in Chains**: Add IF checks before proceeding to the next step in the chain.
* **Effort**: Medium (1.5 Weeks)

**Phase 24: Global State & Variables**
* **Functional Inclusion Details:**
  - **State Store UI**: Define temporary variables that persist during the user's session (e.g., `current_step`, `temp_calc`).
  - **Two-Way Binding**: Bind fields to these global variables instead of DB columns for transient calculator forms.
* **Effort**: Medium (1 Week)

**Phase 25: Multi-step Wizards & Funnels**
* **Functional Inclusion Details:**
  - **Wizard Layout Component**: A specialized container that shows progress steps (1 of 4).
  - **Validation Gates**: Prevents moving to Step 2 until Step 1's required fields are valid.
* **Effort**: Medium (1.5 Weeks)

### Phase Block VI: Automation & Output Generation

**Phase 26: Workflow Engine Hookup**
* **Functional Inclusion Details:**
  - **Transition Mapper**: Visually connect custom form states (Draft -> Pending Approval -> Approved).
  - **Approval Chains**: Assign specific roles required to click the transition buttons.
  - **Audit Logs**: Auto-generate timeline tracking of who transitioned the state and when.
* **Effort**: High (2.5 Weeks)

**Phase 27: Email & Notification Builder Integration**
* **Functional Inclusion Details:**
  - **Trigger Configurator**: On form submission, trigger a system notification or email.
  - **Variables in Templates**: Inject `{Customer_Name}` into the subject line and body of the Email template.
* **Effort**: Medium (1.5 Weeks)

**Phase 28: Document Template (PDF) Mapping**
* **Functional Inclusion Details:**
  - **Print Format Builder**: Drag and drop form fields onto an A4 sized canvas representing a PDF layout.
  - **PDF Generator Hook**: Connect the layout to the backend `React-PDF` engine to generate downloadable files.
* **Effort**: Medium (2 Weeks)

**Phase 29: Chart & Dashboard Widget Builder**
* **Functional Inclusion Details:**
  - **Widget Types**: Pie, Bar, Line, Single Metric.
  - **Data Aggregation**: Group Custom Entity records by Date/Status and map to X/Y axes.
  - **Dashboard Pinning**: Save the chart widget and pin it to the global ERP analytics dashboard.
* **Effort**: High (2 Weeks)

**Phase 30: Custom Actions (Serverless Snippets)**
* **Functional Inclusion Details:**
  - **Code Editor**: Monaco editor embedded in the builder for raw TypeScript.
  - **V8 Isolate Execution**: Execute the user's custom script securely in an isolated Node `vm` context to prevent server compromises.
  - **Context APIs**: Expose safe API wrappers (e.g., `uni.db.update()`, `uni.email.send()`) to the script.
* **Effort**: Very High (3 Weeks)

### Phase Block VII: Market Dominance (Surpassing Competitors)

**Phase 31: Real-Time Collaborative Builder (Multiplayer)**
* **Functional Inclusion Details:**
  - **WebSocket Cursor Engine**: Broadcast X/Y mouse coordinates and node selection events via Socket.io/Redis.
  - **Live DOM Syncing**: Merge structural changes made by User A to User B's screen in real time using CRDTs (Conflict-free Replicated Data Types) or Yjs.
  - **Presence Indicators**: Show avatars of who is currently editing the form.
* **Effort**: Very High (4 Weeks)

**Phase 32: Multi-Tenant Global vs. Local Overrides**
* **Functional Inclusion Details:**
  - **Base Template Distribution**: Super-Admin publishes a master "CRM Lead Form".
  - **Tenant Diffing**: Tenant A modifies the form. Instead of duplicating the entire form, the system saves a "Patch/Diff" (e.g., `+ Field X, - Field Y`).
  - **Seamless Upgrades**: When the Super-Admin updates the Base Template, the Tenant diffs are reapplied cleanly.
* **Effort**: High (3 Weeks)

**Phase 33: Custom Component Registry (CLI)**
* **Functional Inclusion Details:**
  - **Developer CLI**: `npx unierp-builder init my-component`.
  - **React Wrapper**: Developers write standard React code, run `publish`, and the component binary is uploaded.
  - **Dynamic Import**: The Builder Studio dynamically imports the remote component and adds it to the drag-and-drop toolkit.
* **Effort**: High (3 Weeks)

**Phase 34: Visual State Machine Builder**
* **Functional Inclusion Details:**
  - **Node/Edge Graph Editor**: Visual flowchart to map complex lifecycles (e.g., XState visualizer).
  - **Guard Clauses**: Visual rules preventing transitions (e.g., Cannot go to "Shipped" if "Payment" is False).
* **Effort**: High (2.5 Weeks)

**Phase 35: A/B Testing & Analytics for Forms**
* **Functional Inclusion Details:**
  - **Traffic Splitter**: Route 50% of users to Form Layout A, 50% to Layout B.
  - **Analytics Engine**: Track time-to-completion, drop-off rates per field, and error rates to determine the better UI.
* **Effort**: Medium (2 Weeks)

### Phase Block VIII: Future-Proofing & AI (The Number 1 Spot)

**Phase 36: Accessibility (a11y) & i18n Auto-Compliance**
* **Functional Inclusion Details:**
  - **a11y Linter**: Scans the builder canvas and flags missing `aria-labels` or poor color contrast.
  - **Translation Key Generator**: Automatically extracts all hardcoded labels into a JSON dictionary file for instant translation.
* **Effort**: Medium (1.5 Weeks)

**Phase 37: Offline-First Mode Configuration**
* **Functional Inclusion Details:**
  - **PWA Service Worker Configurator**: Visual UI to select which custom tables should be synced to `IndexedDB` for offline use.
  - **Conflict Resolution UI**: When coming back online, a visual interface to resolve edit collisions.
* **Effort**: High (3 Weeks)

**Phase 38: Zero-Code Microservices (API Builder)**
* **Functional Inclusion Details:**
  - **Endpoint Designer**: Define a custom REST route (`GET /api/my-custom-endpoint`).
  - **Visual Data Transformer**: Query the database, apply visual data mapping/formatting, and output a custom JSON structure.
  - **OpenAPI Generator**: Automatically add the newly created visual endpoint to the global Swagger Docs.
* **Effort**: Very High (3 Weeks)

**Phase 39: AI-Assisted Form & Schema Generation**
* **Functional Inclusion Details:**
  - **LLM Prompt Interface**: User types "Create an intake form for a Veterinary Clinic".
  - **Schema Synthesis**: AI generates the Prisma schema equivalent (Pets, Owners, Appointments tables) via function calling.
  - **UI Layout Generation**: AI constructs the JSON DOM tree with Tabs, Columns, and inputs, rendering the entire application in 5 seconds.
* **Effort**: Very High (4 Weeks)

**Phase 40: AI Workflow & Intent Auto-Resolution**
* **Functional Inclusion Details:**
  - **Behavioral Analysis**: AI runs in the background analyzing user interaction times.
  - **Proactive Suggestions**: "Users spend 40 seconds on the 'Address' section. Would you like me to add an auto-complete Google Maps integration?" -> 1-click apply.
* **Effort**: Very High (3 Weeks)

---

## 🧪 Comprehensive Test Plan

Testing the Builder Studio requires extreme rigor, as bugs here break the entire dynamic ecosystem.

### 1. Unit Testing (Vitest)
- **Renderer Tests**: Pass mock JSON layouts to `DynamicFormRenderer` and assert the correct React nodes are rendered.
- **Formula Engine**: Exhaustive tests on the expression parser ensuring mathematical correctness and preventing code injection.

### 2. Integration Testing
- **Schema Provisioning**: Test the APIs that generate Postgres tables/JSONB schemas to ensure they rollback correctly on failure.
- **Tenant Isolation**: Ensure tenant A cannot load or view the Page Registry JSON of tenant B.

### 3. End-to-End (E2E) Testing (Playwright)
- **Builder Flow**: Simulates a user dragging a Text field, saving the form, navigating to the dynamic route, and filling out the form.
- **Collaboration Sync**: Spin up two browser instances to verify real-time layout syncing (Phase 31).

### 4. Performance & Load Testing (k6)
- Ensure the `DynamicFormRenderer` can process a layout with 200+ fields in under 50ms.
- Test Redis/WebSocket load balancing when 1,000 users are simultaneously editing forms.

---

## 🎯 Summary

This 40-phase approach takes UniERP's Builder Studio from a basic form tool to an enterprise-grade, AI-native, zero-code application platform. By strictly adhering to the `frappe-*` UI conventions and the Next.js/NestJS monorepo architecture, we ensure that outputted applications feel entirely native, indistinguishable from hardcoded modules.
