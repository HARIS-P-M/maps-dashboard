# MAPS Project Handoff and Completion Plan

## 1. Project objective

MAPS (Multi-Agent Placement Preparation System) is a student-focused platform
that helps students prepare for placements through an adaptive AI learning
path.

The core product loop is:

```text
student profile and target role
        -> resume and performance analysis
        -> skill-gap identification
        -> personalized roadmap
        -> coding, aptitude, and interview practice
        -> evaluation and progress tracking
        -> roadmap adaptation
```

The system must provide useful preparation guidance, not make guaranteed
hiring or placement predictions.

## 2. Scope decision

Study-document RAG, Pinecone, handwritten-PDF OCR, Gemini OCR, and the Python
OCR bridge were intentionally removed from the project.

Do not reintroduce them unless the product scope is explicitly changed.
Document upload is currently needed for resume and job-description parsing only.

The core modules are:

- Dashboard
- AI Agents
- Resume Analyzer
- Coding Arena
- Aptitude Lab
- Mock Interview
- Company Insights
- Skill Gap Analysis
- Personalized Roadmap
- Progress Analytics
- Leaderboard
- Notifications
- Profile and Settings
- Admin views

## 3. Current implementation status

### Plain-language status

The project is **not production-complete yet**. The dashboard and admin page
can be opened, but the admin page is currently a UI prototype. It must not
yet be used to manage real students.

The admin database foundation has been started in
`prisma/schema.prisma`, but the database tables, authentication, admin APIs,
and real UI integration are still unfinished.

The work must be completed in this order:

1. Configure Supabase and verify the environment variables.
2. Choose npm as the only package manager and clean up the lockfiles.
3. Generate and apply the Prisma migration.
4. Replace localStorage login with Supabase Auth.
5. Add server-side current-user and admin authorization helpers.
6. Build and test the admin API routes.
7. Replace hardcoded admin data with database-backed API data.
8. Persist student progress and agent results.
9. Add runtime validation, rate limiting, logging, privacy, and deletion.
10. Add automated tests and complete lint/build/deployment validation.

Do not skip authentication or server-side authorization in order to make the
admin screens appear functional. Client-side role checks and localStorage are
not security controls.

### Implemented

- Next.js application with dashboard navigation and section routing.
- Shared Groq client for normal and streaming agent calls.
- Central model registry in `lib/agents/model-registry.ts`.
- Specialist agent API routes for resume, coding, aptitude, interview, company,
  coach, question generation, problem generation, chat, and orchestration.
- Resume/JD parsing for PDF, DOCX, and TXT.
- Client-side Zustand student intelligence store.
- Resume, coding, aptitude, interview, roadmap, analytics, and admin UI
  surfaces.
- Shared AI guardrails in `lib/agents/groq-client.ts`.
- Coding evaluator input validation, timeout, output limits, and restricted
  Python execution mode.
- Removal of the optional Study Documents/RAG module and its OCR dependencies.
- Removal of the obsolete `patch-pdf-parse.js` postinstall workaround.
- Production builds are no longer configured to ignore TypeScript errors.
- New local demo users start with zero performance metrics instead of fabricated
  non-zero scores.
- Prisma schema now includes user status, admin audit logs, announcements,
  system settings, and per-agent configuration models. These changes still
  require a database migration after Supabase is configured.
- `npm run build` has been verified successfully after the latest TypeScript
  fix. The build currently lists the expected dashboard, admin, agent API, and
  document-parser routes.

### Important current limitation

The current login flow stores user identity in browser `localStorage`, and
most student data is persisted in browser state. This is suitable only for a
prototype. It is not secure authentication and is not durable multi-user
storage.

The next developer must replace this with Supabase Auth and PostgreSQL before
calling the system production-ready.

### What to do immediately

Do not expose or commit `.env.local`. From a terminal in the project root,
verify that the required variables exist without printing their secret values.
After confirming that the Prisma schema contains the Supabase Auth user
mapping described in Phase 3, run:

```cmd
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name initial_database
```

If the migration command fails, fix the database connection or schema error
before writing admin API code. Do not replace a failed migration with mock
data. After the migration succeeds, implement `current-user` and
`require-admin` helpers before adding any admin mutation.

The first functional admin milestone is:

- A real admin can sign in.
- An unauthenticated request receives `401`.
- An authenticated student receives `403`.
- An authorized admin can list persisted students with pagination.
- Every privileged mutation is recorded in `AdminAuditLog`.

Only after that milestone should the admin UI be changed from hardcoded data.

### Audit findings and known cleanup

- The active route inventory is consistent with navigation and section routing.
- No active Study/RAG/Pinecone/OCR route or import remains.
- There are currently no Prisma migration files. The first migration must be
  created after the Supabase connection is configured.
- Both `package-lock.json` and `pnpm-lock.yaml` exist. They have previously
  resolved different dependency graphs, and the pnpm lockfile still contains
  stale OCR package entries. Select one package manager before deployment and
  regenerate/remove the other lockfile; do not alternate package managers.
- `app/api/parse-document/route.ts` intentionally imports
  `pdf-parse/lib/pdf-parse.js` to bypass the package's broken debug harness.
  Do not change it back to the package-root import without testing the exact
  installed version.
- The local Python coding evaluator is improved for demonstration use but is
  not a production sandbox. Replace it with an isolated judge before public
  deployment.
- ESLint and `eslint-config-next` are listed in `package.json`, but no
  `eslint.config.mjs` file currently exists. Add the configuration and run
  `npm run lint`; do not claim lint validation passed until it succeeds.
- No test script or test suite is currently present in `package.json`; add the
  test tooling and tests before claiming full validation.

## 4. Required technology architecture

Use the existing stack:

- Next.js App Router
- TypeScript
- React
- Supabase Auth
- Supabase PostgreSQL
- Prisma ORM
- Groq for language-model calls
- Zustand for temporary client UI state and cache only

Do not add Pinecone or another vector database for the current scope.

### Data ownership rules

- The browser must never be trusted to provide the authenticated user ID.
- API routes must derive the current user from a verified server session.
- Every database read and write must be scoped to the authenticated user.
- Admin operations must verify the authenticated user's `ADMIN` role on the
  server.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Never send API keys, credentials, or private server configuration to an AI
  model.

## 5. Phase 1: establish environment and baseline

Before changing features:

1. Select one package manager. The current recommendation is npm because
   `package-lock.json` is present and the documented commands use npm. Keep
   `package-lock.json`, regenerate it from `package.json`, and remove or stop
   tracking `pnpm-lock.yaml` only after confirming the team has chosen npm.
   If the team chooses pnpm instead, do the opposite and update every command
   in this document.
2. Install dependencies and configure lint/test tooling. ESLint and
   `eslint-config-next` are already listed in `package.json`, but the project
   still needs an ESLint configuration and a test script. Run:

   ```cmd
   npm install
   npm run lint
   npm run build
   ```

3. If ESLint reports that no configuration exists, add the current flat-config
   format supported by the installed Next.js version (for example
   `eslint.config.mjs`) and ignore generated directories such as `.next` and
   `node_modules`.
4. Record and fix only errors caused by the current source or dependency
   configuration. Do not hide new errors with broad TypeScript exclusions.
5. Verify that no removed RAG/OCR imports remain:

   ```cmd
   findstr /S /I "pinecone tesseract pdfjs @napi-rs/canvas api/study" *.ts *.tsx *.js *.mjs *.json *.md
   ```

6. Confirm the development server starts and the main dashboard loads.

If the build fails because of a missing test fixture or unrelated stale
configuration, repair the owning code or fixture rather than adding a fake
runtime fallback.

## 6. Phase 2: configure Supabase

Create a Supabase project and configure local environment variables in
`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>

DATABASE_URL=<pooled-supabase-postgres-connection>
DIRECT_URL=<direct-supabase-postgres-connection>

GROQ_API_KEY=<groq-key>
GROQ_MODEL_FAST=openai/gpt-oss-20b
GROQ_MODEL_REASONING=openai/gpt-oss-120b
```

Do not commit `.env.local`.

Use `lib/supabase/client.ts` only for browser-safe Supabase operations and
`lib/supabase/server.ts` only for server-side operations. Review the server
client before production because a service-role client bypasses Row Level
Security and must never be callable from a browser.

## 7. Phase 3: implement real authentication

Replace the localStorage login implementation in
`components/dashboard/auth-context.tsx` with Supabase Auth.

Required behavior:

1. Sign up with email and password.
2. Sign in with email and password.
3. Sign out.
4. Restore the session after refresh.
5. Listen for auth state changes.
6. Redirect unauthenticated users to the login screen.
7. Load the application user profile by the verified Supabase auth user ID.
8. Keep admin role checks server-side.

Add a server helper such as `lib/auth/current-user.ts` that:

- Creates a request-aware Supabase server client.
- Reads the authenticated session.
- Returns the authenticated database user.
- Throws or returns an explicit unauthorized result when no session exists.

Do not accept `userId` from request JSON as an identity source.

The Prisma `User` record must have an explicit, unique mapping to the
Supabase Auth user, for example:

```prisma
authUserId String @unique
```

Use that mapping for every session-to-application-user lookup. Do not assume
that the Prisma `cuid()` primary key is the same value as the Supabase Auth
user ID unless the schema is deliberately changed to use the Auth UUID.

Define and document a secure admin bootstrap procedure before enabling the
admin panel. The first admin must be created or promoted through a controlled
server-side/database operation, never by accepting a client-supplied role.

## 8. Phase 4: complete the Prisma data model

The existing schema is in `prisma/schema.prisma`. Keep the existing core
models and add the missing preparation records.

Required models:

### User and profile

- `User`
- `UserStats`
- `TargetProfile` or equivalent:
  - target role
  - target company
  - graduation year
  - branch/degree
  - available minutes per day
  - target placement date

### Resume

- `Resume`
  - owner
  - original filename
  - extracted text
  - created/updated timestamps
- `ResumeAnalysis`
  - overall score
  - JD match score
  - section scores
  - keyword gaps
  - ATS fixes
  - rewritten bullets
  - model/version metadata

### Practice and evaluation

- `CodingAttempt`
  - problem identifier
  - language
  - submitted code
  - pass/fail result
  - complexity
  - safe evaluation feedback
- `AptitudeAttempt`
  - topic
  - difficulty
  - correctness
  - response time
- `InterviewSession`
- `InterviewEvaluation`
  - STAR score
  - clarity
  - confidence
  - relevance
  - feedback

### Planning and audit

- `RoadmapItem`
- `AgentSession`
- `Notification`
- `Leaderboard`

Store only the minimum necessary personal data. Add indexes for owner/user ID
and created timestamps. Add cascade behavior deliberately and test deletion.

Change new-user score defaults from fabricated non-zero values to zero or null.
The UI must display `Not assessed yet` when a metric has no evidence.

There are currently no migrations in the repository. After configuring
`DATABASE_URL` and `DIRECT_URL`, adding the Auth-user mapping, and reviewing
the complete schema, create the first migration:

```cmd
npx prisma generate
npx prisma migrate dev --name initial_database
```

After later schema changes, create a new migration with a descriptive name.
For deployment:

```cmd
npx prisma migrate deploy
```

Never edit an applied migration manually. The schema defaults in the repository
do not change an already-created database until a migration is applied.

## 9. Phase 5: move agent routes to persistent data

Every agent route must:

1. Authenticate the request.
2. Validate the request body.
3. Load only the current user's permitted data.
4. Call the shared Groq client.
5. Validate the model output against a schema.
6. Save the meaningful result to PostgreSQL.
7. Return a stable response shape.
8. Log safe diagnostic information without logging secrets or full private
   documents.

Suggested persistence:

- Resume Agent -> `ResumeAnalysis`
- Coding Agent -> `CodingAttempt`
- Aptitude Agent -> `AptitudeAttempt`
- Interview Agent -> `InterviewEvaluation`
- Coach Agent -> `RoadmapItem`
- Coordinator Agent -> `AgentSession` and/or a plan record
- Company Agent -> bounded analysis history if useful

Do not persist every casual ARIA chat message forever. Add a retention policy
or store only explicitly saved sessions.

## 10. Phase 6: enforce structured agent contracts

Do not rely on `JSON.parse` alone or accept arbitrary model output.

For each JSON-producing agent, define a runtime schema using the project's
preferred validation approach. Each schema must validate:

- Required fields
- Primitive types
- Allowed enum values
- Numeric ranges
- Array size limits
- String length limits
- No unexpected sensitive fields

Required response contracts:

- Resume analysis
- Coding hint/evaluation
- Aptitude question/result
- Interview evaluation
- Company analysis
- Coach roadmap
- Coordinator plan
- Generated problem/questions

If validation fails:

- Do not save the invalid result.
- Return a clear 502-style provider-response error.
- Log the validation reason on the server without logging private input.

The coordinator must only select known agent names and must return valid order
values. Never execute an arbitrary agent name returned by the model.

## 11. Phase 7: implement the admin dashboard completely

The current admin screens are UI prototypes with hardcoded data and local
component state. They must not be used to manage real students until the
server-side admin layer is implemented.

### Secure admin authorization

Before every admin operation:

1. Read the authenticated Supabase session on the server.
2. Load the application user by the verified auth user ID.
3. Confirm `User.role = ADMIN`.
4. Return `401` when unauthenticated and `403` when authenticated but not an
   administrator.
5. Never authorize from the `/admin` URL, a client-side role value, a username,
   or localStorage.

Create a reusable server helper such as
`lib/auth/require-admin.ts`. Every admin API route must use it.

### Admin API routes

Add authenticated, validated routes for:

- `GET /api/admin/overview`
  - total users
  - active users
  - recent activity
  - aggregate preparation metrics
  - agent request/error counts
- `GET /api/admin/users`
  - pagination
  - search
  - role/status filtering
- `GET /api/admin/users/[id]`
  - profile
  - target role
  - resume summary
  - coding, aptitude, interview, and roadmap progress
- `PATCH /api/admin/users/[id]`
  - approved profile fields
  - account status
- `DELETE /api/admin/users/[id]`
  - require explicit confirmation
  - delete or anonymize owned application data
- `GET /api/admin/agents`
  - approved agent configuration and health metrics
- `PATCH /api/admin/agents/[agentName]`
  - validated enable/disable state
  - approved model configuration
  - bounded temperature/token settings
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`
  - feature flags
  - registration state
  - maintenance mode
- `POST /api/admin/announcements`
  - create a persisted announcement or notification

Do not allow arbitrary database field updates. Use explicit allowlists and
runtime validation for every route.

### Admin data model

Add or complete these models as required:

- `User.status` with an explicit enum such as `ACTIVE`, `SUSPENDED`, and
  `DELETED` or an equivalent safe deletion strategy.
- `SystemSetting`
  - key
  - typed value
  - updated by
  - updated timestamp
- `Announcement`
  - message
  - audience
  - created by
  - published/expiry timestamps
- `AdminAuditLog`
  - admin user
  - action
  - target type and target ID
  - safe metadata
  - timestamp
- `AgentConfig`
  - stable agent name
  - enabled state
  - approved model ID
  - bounded generation settings
  - updated by

Never store API keys in these tables. Keep secrets in server environment
variables.

### Admin UI requirements

Replace the mock behavior in:

- `components/sections/admin/admin-overview.tsx`
- `components/sections/admin/admin-users.tsx`
- `components/sections/admin/admin-agents.tsx`
- `components/sections/admin/admin-settings.tsx`

The UI must:

- Load data from the admin API routes.
- Show loading, empty, error, and unauthorized states.
- Use pagination rather than loading every student at once.
- Require confirmation for suspension, deletion, cache resets, and maintenance
  mode.
- Display `Not available` instead of fabricated monitoring values.
- Show timestamps and the source of aggregate metrics.
- Refresh data after successful mutations.
- Prevent duplicate submissions.
- Never expose stack traces, secrets, or raw provider errors.
- Show a visible audit-friendly success message after mutations.

### Admin dashboard behavior

Implement these real capabilities:

- Overview cards based on database queries, not constants.
- Student search, filtering, pagination, and detail view.
- Progress monitoring across resume, coding, aptitude, interview, and roadmap.
- Account suspension/reactivation.
- Safe data deletion.
- Persisted announcements delivered through `Notification`.
- Persisted feature flags read by student-facing routes/components.
- Agent configuration read by the shared server agent client.
- Agent health/error metrics from server-side request records.
- Admin audit history for all privileged mutations.

Do not claim to show CPU, RAM, uptime, or live node health unless a real
monitoring provider supplies those values. Use an explicit `Unavailable` state
for infrastructure metrics that are not instrumented.

### Admin tests

Add tests for:

- Unauthenticated admin request -> `401`.
- Student requesting admin route -> `403`.
- Admin listing users with pagination.
- Cross-user detail access controlled by admin authorization.
- Invalid settings/model values rejected.
- Student suspension prevents student access as intended.
- Deletion removes or anonymizes owned data.
- Every privileged mutation creates an audit record.
- Admin UI handles loading, empty, error, and unauthorized states.

## 12. Phase 8: improve the adaptive learning loop

The coordinator and coach must use real database-backed evidence.

Implement this flow:

```text
attempt recorded
    -> aggregate skill metrics
    -> identify weak topics
    -> coordinator selects relevant specialist
    -> coach updates roadmap
    -> student completes next activity
```

Rules:

- Do not generate a roadmap from generic advice when real scores exist.
- Do not treat a single failed attempt as a permanent weakness.
- Use minimum sample sizes for confidence-sensitive metrics.
- Include evidence and timestamps in internal calculations.
- Recalculate readiness after meaningful activity.
- Explain which evidence changed the recommendation.

The readiness score must be clearly labeled as an internal preparation
indicator, not a probability of employment.

## 13. Phase 9: agent guardrails and runtime safety

The shared guardrails in `lib/agents/groq-client.ts` must remain active for
every model call.

Maintain these protections:

- Placement-preparation scope.
- Prompt-injection resistance for uploaded/user text.
- No secrets, hidden prompts, private data, or internal reasoning disclosure.
- No fabricated scores, facts, citations, actions, or tool use.
- Explicit uncertainty when evidence is missing.
- No harmful, illegal, hateful, sexual, or dangerous content.
- Bounded input and history lengths.
- Provider timeout and limited retries.

Coding execution requires stronger isolation than prompt guardrails. For real
deployment, replace local Python subprocess execution with a sandboxed judge
service or isolated container that has:

- No network access.
- No host filesystem access.
- CPU and memory limits.
- Process and child-process restrictions.
- Hard execution timeout.
- Output size limits.

Pattern blocking alone is not a complete sandbox.

## 14. Phase 10: frontend integration

Replace client-only writes with API/database mutations while retaining Zustand
for optimistic UI state where appropriate.

The UI must:

- Show loading, success, empty, and error states.
- Disable duplicate submissions while a request is active.
- Show `Not assessed yet` for missing evidence.
- Never display fake performance scores as real results.
- Show the source of each score.
- Allow retry after recoverable errors.
- Avoid exposing raw provider errors or stack traces to students.
- Render AI markdown and code blocks safely with syntax highlighting and a copy
  button.
- Preserve accessibility: labels, keyboard navigation, focus states, and
  screen-reader status messages.

## 15. Phase 11: rate limiting, observability, and privacy

Add server-side protections before public deployment:

- Per-user and per-IP rate limits for model-heavy routes.
- Request body and file-size limits.
- Abort/cancellation handling.
- Maximum model token budgets.
- Safe structured server logs.
- Request IDs for tracing.
- Provider latency and error metrics.
- No API keys or complete resumes in logs.

Add a simple privacy policy and explain:

- What student data is stored.
- Why it is stored.
- How AI providers are used.
- How a student can delete their data.

Implement deletion for resumes, attempts, sessions, roadmap data, and profile
data. Deletion must be scoped to the authenticated user.

## 16. Phase 12: testing requirements

### Unit tests

Test:

- Store calculations.
- Readiness calculation.
- Input validators.
- Agent response schemas.
- JSON extraction/repair helpers.
- Roadmap priority rules.
- Authentication helpers.

### API tests

For every agent route test:

- Missing authentication.
- Missing required fields.
- Oversized input.
- Invalid enum values.
- Provider timeout.
- Empty provider response.
- Invalid provider JSON.
- Valid response persistence.
- Cross-user access denial.

### Coding sandbox tests

Verify rejection or termination of:

- File access.
- Network access.
- Subprocess creation.
- Infinite loops.
- Excessive output.
- Oversized code.

### End-to-end tests

Test the main user journey:

1. Create account.
2. Complete profile and select target role.
3. Upload resume.
4. Run resume analysis.
5. Review skill gaps.
6. Generate roadmap.
7. Complete coding and aptitude activities.
8. Complete a mock interview.
9. Confirm scores and roadmap update.
10. Sign out and sign in again.
11. Confirm data remains available only to the correct user.

Run before delivery:

```cmd
npm run lint
npm run build
npm test
```

If `npm test` reports that no script exists, add a test script and a real test
suite before claiming the project is complete. A successful production build
does not replace linting or automated tests.

## 17. Definition of done

The project is complete only when all of the following are true:

- Authentication is server-verified.
- Database data persists across refreshes and devices.
- All API routes authorize the current user.
- Admin routes enforce admin role server-side.
- No fake non-zero student metrics are shown without evidence.
- All agent outputs are runtime-validated.
- Coordinator output cannot execute arbitrary agent names.
- Coding execution is isolated or explicitly limited to local demonstration use.
- Agent calls have timeouts, bounded inputs, and safe error handling.
- Resume, coding, aptitude, interview, and roadmap data persist correctly.
- The adaptive loop uses real stored performance data.
- Students can delete their data.
- RAG/Pinecone/OCR code is absent unless the scope is intentionally changed.
- Lint, build, unit tests, API tests, and the main end-to-end flow pass.
- Environment secrets are documented but never committed.

## 18. Recommended implementation order

Complete the work in this order:

1. Baseline lint/build and dependency cleanup.
2. Supabase project and environment configuration.
3. Supabase Auth integration.
4. Server-side current-user helper and authorization utilities.
5. Prisma migrations and preparation models.
6. Replace localStorage persistence with database-backed APIs.
7. Add runtime schemas for every agent response.
8. Implement secure admin authorization and admin API routes.
9. Replace mock admin data and controls with database-backed behavior.
10. Persist resume, coding, aptitude, interview, and roadmap data.
11. Implement coordinator-driven adaptive roadmap updates.
12. Add rate limiting, observability, and privacy/deletion flows.
13. Improve code rendering and frontend loading/error states.
14. Add unit, API, admin, sandbox, and end-to-end tests.
15. Run a clean production build and deployment smoke test.

Do not begin with visual redesign or additional AI agents. Correct identity,
data ownership, persistence, structured outputs, and evaluation reliability are
more important than adding more model prompts.

## 19. Final handoff checklist

Use this checklist to determine whether the entire project is actually
complete. Every item must be verified; a successful `next build` alone is not
enough.

### Foundation and environment

- [ ] One package manager is selected and documented.
- [ ] Only the selected lockfile is maintained and regenerated.
- [ ] `.env.local` is ignored and `.env.example` contains names only.
- [ ] Supabase, database, and Groq variables are configured locally.
- [ ] The Prisma `User` model has a unique Supabase Auth user mapping.
- [ ] `npx prisma validate` and `npx prisma generate` pass.
- [ ] The initial Prisma migration is created, applied locally, and reviewed.
- [ ] ESLint is installed, configured, and passing.

### Authentication and data ownership

- [ ] Sign-up, sign-in, sign-out, and session restoration use Supabase Auth.
- [ ] The browser cannot choose its own user ID or role.
- [ ] A controlled server-side procedure exists for creating the first admin.
- [ ] Every student API derives identity from the server session.
- [ ] Suspended or deleted users cannot use protected student functionality.
- [ ] Student data persists across refreshes and different devices.
- [ ] Students can view and delete their own stored data.

### Admin panel

- [ ] `/admin` is protected by server-side authorization.
- [ ] Admin APIs return `401` for unauthenticated requests and `403` for
      non-admin users.
- [ ] Overview metrics come from database queries or are shown as unavailable.
- [ ] Student search, filters, pagination, details, and progress are real.
- [ ] Suspension, reactivation, and safe deletion work persistently.
- [ ] Agent configuration and system settings are validated and persisted.
- [ ] Announcements are stored and delivered through notifications.
- [ ] Every privileged mutation creates an audit-log entry.
- [ ] Admin UI has loading, empty, error, unauthorized, and success states.

### Agents and learning loop

- [ ] Every agent request is authenticated, validated, bounded, and persisted
      where appropriate.
- [ ] Every JSON model response is validated at runtime before use or storage.
- [ ] The coordinator can execute only an allowlisted agent and order.
- [ ] Resume, coding, aptitude, interview, and roadmap records are durable.
- [ ] The coach and coordinator use actual student performance evidence.
- [ ] Readiness values are labeled as preparation indicators, not hiring
      probabilities.
- [ ] The coding evaluator is isolated before public deployment.

### Reliability, privacy, and release

- [ ] Rate limits exist for model-heavy and expensive endpoints.
- [ ] Request IDs, safe logs, provider timeouts, and error metrics exist.
- [ ] Secrets, full resumes, prompts, and stack traces are not logged.
- [ ] Privacy and data-deletion behavior are documented and tested.
- [ ] Unit, API, authorization, sandbox, and end-to-end tests pass.
- [ ] `npm run lint`, `npm run build`, and `npm test` pass from a clean install.
- [ ] A deployment smoke test confirms authentication, student flow, admin
      flow, and database persistence.
- [ ] No RAG/Pinecone/OCR code is present unless the product scope is
      intentionally changed and documented.
