# MAPS Dashboard

MAPS (Multi-Agent Placement Preparation System) is a Next.js dashboard that
coordinates specialized AI agents for resume analysis, coding practice,
aptitude training, interview preparation, company research, and personalized
roadmaps.

## Groq model policy

All AI calls use Groq through the shared client in
`lib/agents/groq-client.ts`. Models are selected centrally in
`lib/agents/model-registry.ts`:

| Tier | Agents | Default |
| --- | --- | --- |
| Fast | ARIA chat, coordinator, aptitude, interview-question generation | `openai/gpt-oss-20b` |
| Reasoning | Resume, coding evaluation, interview scoring, company, coach, problem generation | `openai/gpt-oss-120b` |

Set `GROQ_MODEL_FAST` and `GROQ_MODEL_REASONING` in `.env.local` when your
Groq account enables newer model IDs. This keeps model migrations isolated to
configuration rather than individual API routes. Use a fast model for
high-volume short structured responses and a reasoning model for long,
personalized analysis and code-related evaluation.

## Grounded ARIA context

After a resume or job description is parsed in the Resume section, ARIA can use
that text when answering follow-up questions. The chat route bounds the attached
context to 12,000 characters and labels it as untrusted reference material, so
instructions embedded in uploaded documents are not treated as agent commands.
This is intentionally a local, request-scoped retrieval step; a durable vector
store should only be introduced alongside document ownership, deletion, and
retention controls.

## Persistence and authentication status

The application now contains the server-side authentication foundation:

- Supabase Auth sessions are read from request cookies.
- Application users map to Supabase Auth users through `User.authUserId`.
- `/api/me` returns the verified application user.
- Admin overview, user listing, user mutations, and announcements use server-side
  admin authorization and audit logging.
- Agent Control loads and saves persisted agent configuration through the protected
  admin API.
- Admin navigation is preserved across authentication refreshes and client remounts.
- Student dashboard summaries, notifications, analytics, leaderboard, and profile
  panels no longer display seeded demo records; they show persisted activity or
  an explicit empty state until the student generates real data.
- The student leaderboard reads active cohort members and their persisted `UserStats`
  XP/streak values through `/api/leaderboard`.
- The coding evaluator keeps OS, network, and file-access protections while allowing
  normal contest input through `input()` and `sys.stdin`; it returns test results
  without exposing an unrestricted process runner.

Before running the first migration, rotate any credentials that were previously
placed in a tracked environment file. Copy `.env.example` to `.env.local`, add
the replacement values, and keep `.env.local` uncommitted. The initial Prisma migration has been applied in the configured database. Student
preparation activity and operational telemetry are still separate follow-up work;
the admin screens explicitly show unavailable telemetry rather than presenting
fabricated production metrics.

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_u9bctOfayuooahtZul08n6t2VYtL)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
