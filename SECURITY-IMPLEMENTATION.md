# MAPS Security Implementation

This document summarizes the security controls currently implemented in the
MAPS placement-preparation dashboard and the remaining production-hardening
work.

## 1. Supabase session authentication

### [middleware.ts](./middleware.ts)

The middleware refreshes Supabase sessions using request cookies:

```ts
await supabase.auth.getUser()
```

This keeps authenticated sessions current across requests.

## 2. Request-aware server authentication

### [lib/auth/current-user.ts](./lib/auth/current-user.ts)

The `getCurrentUser()` helper:

1. Reads the Supabase session from request cookies.
2. Verifies the authenticated Supabase user.
3. Looks up the matching Prisma user through `authUserId`.
4. Rejects users without an application profile.
5. Rejects users whose status is not `ACTIVE`.

The `requireCurrentUser()` helper throws an `UnauthorizedError` when
authentication is missing.

## 3. Admin authorization

### [lib/auth/require-admin.ts](./lib/auth/require-admin.ts)

The `requireAdmin()` helper:

1. Authenticates the current user.
2. Checks that the Prisma role is `ADMIN`.
3. Returns `401` for unauthenticated requests.
4. Returns `403` for authenticated non-admin users.

This helper protects the admin APIs for:

- [Users](./app/api/admin/users/route.ts)
- [User mutations](./app/api/admin/users/[id]/route.ts)
- [Agents](./app/api/admin/agents/route.ts)
- [Agent configuration](./app/api/admin/agents/[agentName]/route.ts)
- [Settings](./app/api/admin/settings/route.ts)
- [Announcements](./app/api/admin/announcements/route.ts)
- [Audit log](./app/api/admin/audit-log/route.ts)
- [Overview](./app/api/admin/overview/route.ts)

## 4. Student creation validation

### [app/api/admin/users/route.ts](./app/api/admin/users/route.ts)

The admin student-creation endpoint validates:

- Request body type.
- Name length between 2 and 120 characters.
- Email format.
- Password length between 8 and 72 characters.
- Branch and year length.
- Duplicate email accounts.

The endpoint creates both:

1. A Supabase Auth login account.
2. A linked Prisma `User` record.

If database creation fails after the Supabase user is created, the new
Supabase Auth user is deleted to avoid an orphaned login.

## 5. Protected AI routes

AI routes call `requireCurrentUser()` before processing requests.

Protected routes include:

- [Resume agent](./app/api/agents/resume/route.ts)
- [Coding agent](./app/api/agents/coding/route.ts)
- [Aptitude agent](./app/api/agents/aptitude/route.ts)
- [Interview agent](./app/api/agents/interview/route.ts)
- [Coach agent](./app/api/agents/coach/route.ts)
- [Company agent](./app/api/agents/company/route.ts)
- [Chat agent](./app/api/agents/chat/route.ts)
- [Problem generator](./app/api/agents/generate-problem/route.ts)
- [Question generator](./app/api/agents/generate-questions/route.ts)
- [Orchestrator](./app/api/agents/orchestrator/route.ts)
- [Document parser](./app/api/parse-document/route.ts)

Unauthenticated requests receive a `401` response.

## 6. Coding evaluator protections

### [app/api/agents/coding/route.ts](./app/api/agents/coding/route.ts)

The coding evaluator blocks dangerous operations such as:

```python
import os
import subprocess
import socket
import requests
open(...)
eval(...)
exec(...)
sys.exit(...)
sys.path
sys.modules
```

Normal programming input remains supported:

```python
input()
sys.stdin.read()
sys.stdin.readline()
```

Additional controls include:

- Python isolated mode using `-I`.
- A three-second execution timeout.
- A 100 KB stdout limit.
- A 100 KB stderr limit.
- Temporary source-file cleanup.
- Python interpreter fallback support through `PYTHON_EXECUTABLE`, `py`,
  `python3`, and `python`.
- Test-by-test expected and actual output reporting.

The evaluator is restricted but is not a complete production-grade sandbox.
Public deployment should use an isolated container or external judge service.

## 7. API input validation

The API routes validate request structure, allowed values, and field lengths.

Examples include:

### Agent configuration

### [app/api/admin/agents/[agentName]/route.ts](./app/api/admin/agents/[agentName]/route.ts)

- Agent names must be in an allowlist.
- Model names must be strings of an allowed length.
- Temperature must be between `0` and `1`.
- Maximum tokens must be an integer between `256` and `8192`.

### Admin settings

### [app/api/admin/settings/route.ts](./app/api/admin/settings/route.ts)

Only supported settings groups can be updated:

- `featureFlags`
- `security`
- `platform`

### Announcements

### [app/api/admin/announcements/route.ts](./app/api/admin/announcements/route.ts)

Announcement messages are length-limited and the audience is validated.

## 8. User status enforcement

### [prisma/schema.prisma](./prisma/schema.prisma)

Users contain:

```prisma
authUserId String @unique
role       Role
status     UserStatus
```

Allowed statuses are:

```prisma
enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

Only `ACTIVE` users can authenticate into the application. Suspended and
deleted users are denied access.

Student deletion is implemented as a soft delete, preserving the audit trail.

## 9. Audit logging

Privileged admin actions are stored in the database.

Logged actions include:

- Student creation.
- Student update.
- Student suspension.
- Student reactivation.
- Student deletion.
- Agent configuration changes.
- Settings changes.
- Announcement creation.

Examples:

- [Student creation audit](./app/api/admin/users/route.ts)
- [User mutation audit](./app/api/admin/users/[id]/route.ts)
- [Agent configuration audit](./app/api/admin/agents/[agentName]/route.ts)
- [Settings audit](./app/api/admin/settings/route.ts)
- [Announcement audit](./app/api/admin/announcements/route.ts)

Audit entries are created inside database transactions where appropriate.
Administrators can view them through:

### [app/api/admin/audit-log/route.ts](./app/api/admin/audit-log/route.ts)

## 10. Service-role key protection

### [lib/supabase/server.ts](./lib/supabase/server.ts)

The Supabase service-role client is created only in server-side code:

```ts
process.env.SUPABASE_SERVICE_ROLE_KEY
```

The service-role key must never be:

- Used in client components.
- Stored in `NEXT_PUBLIC_*` variables.
- Included in browser code.
- Committed to Git.
- Shared in screenshots or chat.

Real secrets belong in `.env` or `.env.local`, while tracked environment
templates must contain placeholders only.

## 11. Database constraints

### [prisma/schema.prisma](./prisma/schema.prisma)

Important constraints include:

```prisma
authUserId String @unique
email      String @unique
```

These constraints prevent duplicate application identities.

Related preparation records use controlled deletion behavior such as cascade
deletion or `SetNull`, depending on the relationship.

## 12. Current limitations

The project has a security foundation, but it is not yet fully production
hardened. Remaining work includes:

1. General API rate limiting.
2. Request IDs and correlation logging.
3. Fully isolated coding execution using containers or an external judge.
4. Consistent runtime schemas for every AI response.
5. Complete persistence for every student activity module.
6. Reliable client IP capture for audit records.
7. Full enforcement of the stored MFA settings.
8. Comprehensive automated security and integration tests.

## Review summary

The project currently implements:

- Supabase session authentication.
- Role-based admin authorization.
- Protected student and AI APIs.
- Input validation and size limits.
- User status enforcement.
- Soft deletion.
- Admin audit logging.
- Server-only service-role access.
- Restricted coding execution.
- Database uniqueness constraints.

For a review presentation, describe the coding evaluator as a restricted local
runner rather than a complete security sandbox. Explain that production
deployment requires isolated execution, rate limiting, runtime AI schemas, and
additional security monitoring.
