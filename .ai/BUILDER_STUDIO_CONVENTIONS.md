# Builder Studio Conventions

The Builder Studio in UniERP is designed to democratize application development by providing a strictly **Zero-Code / Low-Code environment** for non-technical users. 

When working on features related to the Builder Studio, all AI Agents MUST adhere to the following critical principles:

## 1. No Code Required for Users
Never build UI or features that require the end-user to manually write, copy, or paste code snippets (like React components, JSX, or complex configuration objects). 
* **If a user wants to publish a form**, provide a visual wizard that deploys the form to a dynamic route or overrides an existing route automatically.
* **If a user wants to add custom logic**, provide a visual workflow builder or rule engine, not a JavaScript eval box.

## 2. Dynamic over Hardcoded
When a user builds a form or a page in the Builder Studio, it must integrate seamlessly with the rest of the application without requiring a server restart or manual file edits.
* **Page Registry**: Custom pages and forms are stored in a database (or `localStorage` during prototyping) and rendered dynamically using wildcard catch-all routes (e.g., `apps/web/app/(dashboard)/app/[module]/[slug]/page.tsx`).
* **Sidebar Integration**: The sidebar navigation dynamically queries the Page Registry to inject newly created pages into the correct Module headers automatically.

## 3. Direct Visual Manipulation
Users should interact with UI elements directly on the canvas.
* Prefer drag-and-drop handles for resizing columns and heights.
* Provide contextual floating menus or property sidebars instead of hidden JSON configurations.
* Elements should snap to the 12-column global grid (`frappe-grid-12`) to ensure responsiveness and alignment.

## 4. Developer Mode (Minimal)
If a technical feature must be exposed (like webhook URLs or iframe embed codes for external websites), it must be clearly separated from the primary "Internal ERP" deployment flows. 
* Label these features clearly as "For Developers".
* Provide one-click "Copy to Clipboard" buttons.

## 5. Summary
The success of the Builder Studio is measured by how quickly a non-technical manager can build a custom CRM Lead Form and deploy it to their team's dashboard without ever seeing a line of code. Everything you build must serve this goal.
