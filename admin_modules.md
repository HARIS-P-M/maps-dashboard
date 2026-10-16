# MAPS — Admin Modules Documentation

> **Multi-Agent Placement Preparation System (MAPS)**  
> Comprehensive guide covering the Admin Module implementation, architecture, current capabilities, future roadmap, and execution instructions.

---

## 1. Overview of the Admin Module

The **MAPS Admin Module** is a dedicated administrative and operations control center embedded within the MAPS dashboard. It allows administrators, university placement coordinators, and system operators to oversee cohort progress, manage candidate permissions, inspect and fine-tune multi-agent LLM parameters, configure platform features, and audit all privileged system activities.

The Admin Module is designed to match the **exact design language and glassmorphic aesthetic** of the student dashboard, utilizing Framer Motion animations, glowing cards, theme tokens, and responsive side-by-side inspection layouts.

---

## 2. What Has Been Done

### A. Routing & Access Control
- **Dedicated Route**: Implemented at `/admin` via `app/admin/page.tsx` rendering `DashboardShell` with `isAdminRoute={true}`.
- **Role Verification**: Built access checks into `components/dashboard/dashboard-shell.tsx`:
  - Enforces admin login when accessing `/admin`.
  - Prevents standard student accounts from viewing admin tools.
  - Displays a clean "Access Denied" or "Admin Console" redirect interface for cross-role attempts.
- **Dual Navigation Systems**:
  - `adminNavItems` in `lib/nav.ts` with dedicated groups: `Overview`, `Management`, and `Configuration`.
  - Topbar quick switcher link allowing instant transitions between **Student Portal** (`/`) and **Admin Portal** (`/admin`).

### B. Core Admin Sections Built & Integrated

All admin section components reside in `components/sections/admin/` and are registered in `components/sections/section-router.tsx`:

#### 1. Platform Overview (`components/sections/admin/admin-overview.tsx`)
- **Key Metrics (KPIs)**:
  - *Total Students* (with weekly change badge).
  - *Active Candidates Today* (% of cohort indicator).
  - *Agent Calls Today* (with average latency tracking).
  - *Average Placement Readiness* (with trend comparison).
- **Weekly Telemetry Chart**: Area chart tracking daily sessions, agent invocations, and module completion rates.
- **Module Usage Donut**: Visual split of candidate preparation focus across Coding Arena, Resume Analyzer, Aptitude Lab, Mock Interviews, and Company Intel.
- **Readiness Distribution**: Bar chart categorizing students across placement probability brackets (0–20%, 21–40%, ..., 81–100%).
- **Cohort Broadcast Console**: Form to dispatch system-wide announcements to all connected candidates.
- **Live Activity Feed**: Real-time event ticker of recent candidate submissions and agent analyses.
- **Infrastructure Health**: Concurrency load and latency status for all 6 core MAPS agents.

#### 2. Cohort Management / User Directory (`components/sections/admin/admin-users.tsx`)
- **Cohort Directory Table**:
  - Displays candidates with branch, graduation year, XP, streak, readiness probability progress bar, and status.
  - Search by name, email, target role, company, or branch.
  - Status filters: `All`, `Active`, `Inactive`, and `Suspended`.
  - In-table inline quick editing for XP, streaks, readiness, and account status.
  - One-click account suspension/reactivation toggle.
  - Deletion modal confirmation with audit trail logging.
- **Side-by-Side Candidate Detail Panel (`lg:grid-cols-3` Layout)**:
  - Immediate inspection of candidate profiles on laptop and desktop screens without scrolling down.
  - **Skill Profile Radar Chart**: Visualizes scores in Coding, Aptitude, Interview, Resume, Consistency, and Accuracy.
  - **6-Week Progress Trend**: Multi-metric line chart tracking candidate improvement over time.
- **Add Student Modal**: Dialog for manually enrolling candidates into the cohort.

#### 3. Agent Control Room (`components/sections/admin/admin-agents.tsx`)
- **Fleet Telemetry**:
  - Aggregate metrics across all 6 agents (Orchestrator, Resume, Coding, Interview, Company, Coach).
  - Mean latency tracking and success rates.
- **Agent Performance Charts**:
  - Hourly latency trend chart comparing response times across agents.
  - Workload distribution bar chart showing daily inference volume per agent.
- **Agent Selection & Status Cards**:
  - Card for each agent displaying model, thread load bar, call count, and quick enable/disable toggle.
  - Active selection indicator ring with animated status dot.
- **Live Parameter Tuning Panel**:
  - **Operation Status**: `Online`, `Offline`, `Maintenance`.
  - **LLM Model Selector**: Choose from `llama-3.3-70b-versatile`, `llama3-70b-8192`, `mixtral-8x7b-32768`, etc.
  - **Temperature Slider**: Fine-tune output randomness (`0.0` deterministic to `1.0` creative).
  - **Max Output Tokens Slider**: Dynamic token limits (`256` to `8,192` tokens).
  - Interactive save confirmation with instant feedback.

#### 4. Platform Configuration (`components/sections/admin/admin-settings.tsx`)
- **Student Feature Flags**:
  - Independent toggles for student-facing modules: Coding Arena, Mock Interview Lab, Cohort Leaderboard, Aptitude Lab, Roadmap Generator, Advanced Analytics, Company Insights, and ARIA Assistant.
- **Security Policy**:
  - Toggle student self-registration.
  - Toggle MFA enforcement for admins.
  - Adjustable session timeout slider (`15` to `240` minutes).
  - Adjustable max failed login attempts (`3` to `10`).
- **Platform Scaling**:
  - Cohort capacity control (`50` to `500` students).
  - Maintenance Mode toggle with safety confirmation dialog.
- **Announcements & Maintenance**:
  - Broadcast creator targeted to `All`, `Students`, or `Admins`.
  - Cache re-seeding and demo cohort reset utilities.

#### 5. Security Audit Log (`components/sections/admin/admin-audit-log.tsx`)
- **Compliance Event Stream**:
  - Chronological table of administrative mutations (user suspensions, role updates, agent config adjustments, feature toggles, broadcast dispatches).
- **Search & Multi-Dimensional Filtering**:
  - Filter by severity: `high`, `medium`, `low`.
  - Filter by target: `User`, `Agent`, `System`, `Platform`.
- **Event Detail Drawer**:
  - Inspect cryptographic event ID, admin actor, target entity, source IP address, full payload details, and exact timestamp.

### C. Design & Infrastructure Enhancements
- **Glassmorphic Theme**: Dark/light mode support using CSS variables (`--glass`, `--glow`, `--border`, `--popover`).
- **Dependency Resolution**: Resolved missing packages (`katex`, `react-markdown`, `remark-gfm`, `rehype-katex`) and fixed Next.js Turbopack build compatibility.

---

## 3. What Has To Be Done (Future Enhancements)

Per `NEXT_STEPS.md` and production readiness standards, the following milestones remain for future iterations:

| Area | Tasks To Be Done | Priority |
|---|---|---|
| **Database Persistence** | Connect Prisma ORM models to store real admin data (`AdminUser`, `StudentCohort`, `AgentConfiguration`, `AuditLog`, `SystemConfig`) in PostgreSQL/Supabase instead of local React state. | High |
| **Server-Side Authorization** | Implement Next.js Edge Middleware (`middleware.ts`) to validate HTTP-only session cookies and JWT roles on every `/admin` and `/api/admin/*` request. | High |
| **Real Agent API Endpoints** | Wire up backend API routes: `GET/PATCH /api/admin/agents`, `GET/PATCH /api/admin/users`, `POST /api/admin/announcements` connected directly to Groq agent runtimes. | High |
| **Granular RBAC** | Support multi-tier admin roles: `Super Admin`, `Placement Officer`, `Department Mentor`, and `Guest Recruiter`. | Medium |
| **Batch CSV Import/Export** | Enable bulk upload of entire college batches via CSV/XLSX for one-click candidate onboarding. | Medium |
| **Real-Time WebSockets / SSE** | Replace local polling with WebSocket or Server-Sent Events (SSE) for real-time agent latency and student activity streams. | Medium |
| **Automated Alerts** | Integrate Webhook notifications (Slack / Discord / Email) when agent error rates exceed 5% or latency spikes. | Low |

---

## 4. How to Run the Project

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **Package Manager**: `npm` or `pnpm`
- **Environment**: Windows, macOS, or Linux

### Step 1: Environment Variables Setup
Ensure you have a `.env` or `.env.local` file in `d:\SEM_7_Project\Multi-Agent AI\MAPS\maps-dashboard`:

```env
# Groq LLM API Key for Multi-Agent execution
GROQ_API_KEY=your_groq_api_key_here

# Next.js Public Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Install Dependencies
Open your terminal in the `maps-dashboard` directory and run:

```bash
cd "d:\SEM_7_Project\Multi-Agent AI\MAPS\maps-dashboard"
npm install
```

### Step 3: Run the Development Server
Start the Next.js development server with Turbopack:

```bash
npm run dev
```

The application will be accessible at **`http://localhost:3000`**.

---

## 5. How to Access and Test the Portals

### A. Accessing the Admin Portal
1. Open your browser and navigate to:
   ```
   http://localhost:3000/admin
   ```
2. When prompted by the **MAPS Admin Panel** login screen, enter:
   - **Administrator Email / Identifier**: `admin`
   - **Password**: `password`
3. Click **Sign In**.
4. You will land on the **Admin Overview** dashboard with access to all 5 sections in the sidebar:
   - `Admin Panel` (Overview telemetry & health)
   - `User Directory` (Candidate management & radar profiles)
   - `Agent Control` (Fleet parameters & temperature tuning)
   - `Site Config` (Feature modules & security policies)
   - `Audit Log` (Traceability trail & event inspection)

### B. Accessing the Student Portal
1. Navigate to:
   ```
   http://localhost:3000/
   ```
2. Enter your student name (e.g. `Aditya Raj`) and password `password`.
3. You can toggle between portals at any time using the **Student Portal / Admin Portal** button in the Topbar.

### C. Testing Production Build (Optional)
To verify build correctness:

```bash
npm run build
npm run start
```
