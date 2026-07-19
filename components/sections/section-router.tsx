"use client"

import type { ViewId } from "@/lib/nav"
import { Overview } from "./overview"
import { Agents } from "./agents"
import { Resume } from "./resume"
import { Coding } from "./coding"
import { Aptitude } from "./aptitude"
import { Interview } from "./interview"
import { CompanySection } from "./company"
import { SkillGapSection } from "./skill-gap"
import { RoadmapSection } from "./roadmap"
import { AnalyticsSection } from "./analytics"
import { LeaderboardSection } from "./leaderboard"
import { NotificationsSection } from "./notifications"
import { SettingsSection } from "./settings"
import { ProfileSection } from "./profile"

// Admin Views
import { AdminOverview } from "./admin/admin-overview"
import { AdminUsers } from "./admin/admin-users"
import { AdminAgents } from "./admin/admin-agents"
import { AdminSettings } from "./admin/admin-settings"

export function SectionRouter({ view, onNavigate }: { view: ViewId; onNavigate: (v: ViewId) => void }) {
  switch (view) {
    case "dashboard":
      return <Overview onNavigate={onNavigate} />
    case "agents":
      return <Agents />
    case "resume":
      return <Resume />
    case "coding":
      return <Coding />
    case "aptitude":
      return <Aptitude />
    case "interview":
      return <Interview />
    case "companies":
      return <CompanySection />
    case "skillgap":
      return <SkillGapSection />
    case "roadmap":
      return <RoadmapSection />
    case "analytics":
      return <AnalyticsSection />
    case "leaderboard":
      return <LeaderboardSection />
    case "notifications":
      return <NotificationsSection />
    case "settings":
      return <SettingsSection />
    case "profile":
      return <ProfileSection />

    // Admin cases
    case "admin-dashboard":
      return <AdminOverview />
    case "admin-users":
      return <AdminUsers />
    case "admin-agents":
      return <AdminAgents />
    case "admin-settings":
      return <AdminSettings />
  }
}
