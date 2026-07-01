# UniERP Subagent Team

Role-based Claude Code subagents for solo development of the Universal ERP System. Each file is a subagent: YAML frontmatter (`name`, `description`, optional `tools`/`model`) + a system prompt that makes it act as a domain expert.

## Roles

**Plan** — `product-manager` (what/why, stories, acceptance criteria)
**Design** — `uiux-designer` (UI/UX, design system), `data-architect` (schema, migrations)
**Build** — `backend-developer`, `frontend-developer`, `fullstack-developer`, `devops-engineer`
**Verify** — `qa-tester` (tests), `code-reviewer` (diff review), `security-auditor` (appsec), `business-analyst-uat` (user sign-off)
**Document** — `tech-writer` (`.ai/` docs)

## How to use

- Claude Code auto-delegates based on each agent's `description`, or invoke explicitly: "Use the backend-developer subagent to build the invoices endpoint."
- Every agent reads `AGENTS.md` + relevant `.ai/` files first, since subagents run in their own context.
- Suggested feature flow: product-manager → data-architect → backend/frontend (or fullstack) → qa-tester → code-reviewer → security-auditor → business-analyst-uat → tech-writer.

## Editing

Tweak an agent by editing its `.md` file. Keep `description` action-oriented (it drives auto-delegation), and keep project rules pointing back to `AGENTS.md` rather than duplicating them here.
