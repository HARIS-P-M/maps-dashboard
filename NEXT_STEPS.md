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
- `npm run lint` is currently not runnable until ESLint and the Next.js ESLint
  configuration are added to the project. Do not claim lint validation passed
  until that setup exists.
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
2. Install and configure lint/test tooling if it is not already present. The
   current repository does not include an `eslint` executable or a `test`
   script. Then run:

   ```cmd
   npm install
   npm install --save-dev eslint eslint-config-next
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
`DATABASE_URL` and `DIRECT_URL`, create the first migration:

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

## 11. Phase 7: improve the adaptive learning loop

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

## 12. Phase 8: agent guardrails and runtime safety

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

## 13. Phase 9: frontend integration

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

## 14. Phase 10: rate limiting, observability, and privacy

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

## 15. Phase 11: testing requirements

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

## 16. Definition of done

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

## 17. Recommended implementation order

Complete the work in this order:

1. Baseline lint/build and dependency cleanup.
2. Supabase project and environment configuration.
3. Supabase Auth integration.
4. Server-side current-user helper and authorization utilities.
5. Prisma migrations and preparation models.
6. Replace localStorage persistence with database-backed APIs.
7. Add runtime schemas for every agent response.
8. Persist resume, coding, aptitude, interview, and roadmap data.
9. Implement coordinator-driven adaptive roadmap updates.
10. Add rate limiting, observability, and privacy/deletion flows.
11. Improve code rendering and frontend loading/error states.
12. Add unit, API, sandbox, and end-to-end tests.
13. Run a clean production build and deployment smoke test.

Do not begin with visual redesign or additional AI agents. Correct identity,
data ownership, persistence, structured outputs, and evaluation reliability are
more important than adding more model prompts.
