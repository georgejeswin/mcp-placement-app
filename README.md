# Campus Placement + MCP

Two NestJS + Prisma services backed by local PostgreSQL, plus an MCP server that lets AI agents match students to jobs.

| Package | Port | Database | What it serves |
|---|---|---|---|
| `job-portal-api` | 3001 | `job_portal` | 100 job openings |
| `campus-placement-api` | 3002 | `campus_placement` | 200 students preparing for placement |
| `placement-mcp-server` | stdio | - | Matching / eligibility tools for AI agents (calls both APIs) |

## Setup

Requires Node 20+ and PostgreSQL on `localhost:5432` with user `postgres` / password `postgres`
(edit `*/.env` to change).

```bash
npm install
npm run db:setup     # creates both DBs, applies migrations, seeds 100 jobs + 200 students
npm run build
npm run dev          # both APIs in watch mode (or `npm start` for the built version)
```

- Jobs: <http://localhost:3001/jobs> · Swagger: <http://localhost:3001/docs>
- Students: <http://localhost:3002/students> · Swagger: <http://localhost:3002/docs>

Re-seed any time with `npm run db:seed` (deterministic: same data every run).

## REST API

`GET /jobs` returns every job unless `page`/`limit` are given. Filters: `q`, `roleCategory`, `location`,
`workMode`, `employmentType`, `status`, `skills` (comma-separated, any), `branch`, `gradYear`,
`cgpa` (cut-off at or below), `minSalaryLpa`, `sortBy`, `order`. `GET /jobs/:id`.

`GET /students` returns every student unless `page`/`limit` are given. Filters: `q`, `branch`, `degree`,
`graduationYear`, `minCgpa`, `maxBacklogs`, `skills` (any), `allSkills` (all), `preferredRole`,
`placementStatus`, `sortBy`, `order`. `GET /students/:id`, `GET /students/roll/:rollNo`.

Both have `GET /health`.

## MCP server

| Tool | Answers |
|---|---|
| `search_jobs`, `get_job` | Job lookups with filters |
| `search_students`, `get_student` | Student lookups (id or roll number) |
| `check_eligibility` | Is student X eligible for job Y? Rule-by-rule, plus score breakdown |
| `match_students_for_job` | Best candidates for a job, and why others are ineligible |
| `match_jobs_for_student` | Best jobs for a student, plus "near misses" blocked by one rule |
| `find_placeable_students` | Who can be placed now, and why the rest can't (skills gap vs CGPA/backlogs) |
| `recommend_upskilling` | Greedy learning plan: which skills unlock the most jobs |
| `placement_insights` | Cohort overview: by branch, role supply vs demand, skill demand vs supply |

**Eligibility** (hard rules): job open, degree, branch, graduation year, CGPA cut-off, active backlogs,
min 10th/12th %.
**Score** (0-100): required skills 50, preferred skills 15, CGPA margin over cut-off 15,
role/location preference 10, internships + relevant projects 10. Fit: strong ≥75, good ≥55, moderate ≥40.
A **placeable** student is available (not placed/opted out) and eligible for at least one open job
covering ≥60% of its required skills (tunable via `minSkillCoverage`).

### Use it

The APIs must be running. Claude Code picks up `.mcp.json` in this folder automatically
(approve the `placement` server when prompted). For Claude Desktop, add to `claude_desktop_config.json`:

```json
{ "mcpServers": { "placement": { "command": "node", "args": ["/ABSOLUTE/PATH/placement-mcp-server/dist/index.js"] } } }
```

Debug with the inspector: `npm run mcp:inspect`. Unit tests: `npm test`.

Example prompts:
- "Who are the top 5 candidates for job 45, and what are they missing?"
- "Which CSE students can be placed right now? Which ones can't and why?"
- "What jobs suit 27AD010, and what should they learn next?"
- "Give me a placement summary for the 2027 batch: which roles are short of candidates?"
