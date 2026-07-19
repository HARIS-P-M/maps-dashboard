export const codingProgress = [
  { week: 'W1', solved: 8, target: 12 },
  { week: 'W2', solved: 15, target: 18 },
  { week: 'W3', solved: 22, target: 24 },
  { week: 'W4', solved: 31, target: 30 },
  { week: 'W5', solved: 40, target: 38 },
  { week: 'W6', solved: 52, target: 46 },
  { week: 'W7', solved: 61, target: 54 },
  { week: 'W8', solved: 74, target: 64 },
]

export const readinessRadar = [
  { dimension: 'DSA', you: 82, cohort: 64 },
  { dimension: 'System Design', you: 58, cohort: 55 },
  { dimension: 'Aptitude', you: 74, cohort: 66 },
  { dimension: 'Communication', you: 69, cohort: 62 },
  { dimension: 'Resume', you: 88, cohort: 70 },
  { dimension: 'Core CS', you: 76, cohort: 68 },
]

export const skillGap = [
  { skill: 'Dynamic Programming', current: 62, required: 85 },
  { skill: 'Graphs', current: 71, required: 80 },
  { skill: 'System Design', current: 48, required: 78 },
  { skill: 'SQL', current: 80, required: 75 },
  { skill: 'OS & Networks', current: 66, required: 72 },
  { skill: 'Behavioral', current: 74, required: 70 },
]

export const activityHeat = Array.from({ length: 8 }).map((_, w) => ({
  week: `W${w + 1}`,
  days: Array.from({ length: 7 }).map(() => Math.floor(Math.random() * 5)),
}))

export const probabilityTrend = [
  { month: 'Jan', prob: 41 },
  { month: 'Feb', prob: 48 },
  { month: 'Mar', prob: 55 },
  { month: 'Apr', prob: 61 },
  { month: 'May', prob: 67 },
  { month: 'Jun', prob: 73 },
  { month: 'Jul', prob: 79 },
]

export const languageSplit = [
  { name: 'Python', value: 42 },
  { name: 'Java', value: 28 },
  { name: 'C++', value: 20 },
  { name: 'SQL', value: 10 },
]

export const dailyTasks = [
  { id: 1, title: 'Solve 3 medium DP problems', done: true, tag: 'Coding', xp: 60 },
  { id: 2, title: 'Record a 2-min "Tell me about yourself"', done: true, tag: 'Interview', xp: 40 },
  { id: 3, title: 'Review Amazon LP: Customer Obsession', done: false, tag: 'Behavioral', xp: 30 },
  { id: 4, title: 'Aptitude drill: Time & Work (15 Qs)', done: false, tag: 'Aptitude', xp: 25 },
  { id: 5, title: 'Fix 4 ATS warnings on resume', done: false, tag: 'Resume', xp: 45 },
]

export const achievements = [
  { id: 1, title: '30-Day Streak', desc: 'Practiced every day for a month', unlocked: true },
  { id: 2, title: 'Century Club', desc: 'Solved 100 problems', unlocked: true },
  { id: 3, title: 'ATS Master', desc: 'Reached 90+ ATS score', unlocked: true },
  { id: 4, title: 'Mock Pro', desc: 'Completed 10 mock interviews', unlocked: false },
  { id: 5, title: 'Graph Guru', desc: 'Solved 25 graph problems', unlocked: false },
  { id: 6, title: 'Offer Ready', desc: 'Hit 85% placement probability', unlocked: false },
]

export const leaderboard = [
  { rank: 1, name: 'Aarav Mehta', xp: 12840, streak: 62, delta: 0 },
  { rank: 2, name: 'Priya Nair', xp: 12110, streak: 48, delta: 1 },
  { rank: 3, name: 'You', xp: 11760, streak: 32, delta: 2, self: true },
  { rank: 4, name: 'Rohan Das', xp: 11290, streak: 41, delta: -1 },
  { rank: 5, name: 'Sana Kapoor', xp: 10870, streak: 29, delta: 0 },
  { rank: 6, name: 'Vikram Rao', xp: 10120, streak: 22, delta: 3 },
  { rank: 7, name: 'Neha Joshi', xp: 9840, streak: 19, delta: -2 },
]

export const notifications = [
  { id: 1, agent: 'Coach Agent', text: 'You are 2 problems away from your weekly target. Keep going.', time: '5m', type: 'nudge' },
  { id: 2, agent: 'Resume Agent', text: 'Detected 4 ATS keyword gaps for your target SDE roles.', time: '1h', type: 'warning' },
  { id: 3, agent: 'Interview Agent', text: 'Your last mock scored 8.2/10 on clarity. Filler words down 30%.', time: '3h', type: 'success' },
  { id: 4, agent: 'Company Agent', text: 'Google application window opens in 6 days. Timeline updated.', time: '1d', type: 'info' },
]

export const companies = [
  { name: 'Google', role: 'SDE-1', match: 78, difficulty: 'Hard', window: 'Opens in 6d', accent: 'var(--chart-1)' },
  { name: 'Amazon', role: 'SDE-1', match: 84, difficulty: 'Medium', window: 'Open now', accent: 'var(--chart-3)' },
  { name: 'Microsoft', role: 'SWE', match: 71, difficulty: 'Hard', window: 'Opens in 12d', accent: 'var(--chart-2)' },
  { name: 'Atlassian', role: 'Frontend', match: 66, difficulty: 'Medium', window: 'Opens in 3d', accent: 'var(--chart-4)' },
]

export const companyTimeline = [
  { phase: 'Online Assessment', date: 'Week 1', status: 'done', detail: '2 DSA + 1 debugging' },
  { phase: 'Technical Round 1', date: 'Week 2', status: 'active', detail: 'DSA + problem solving' },
  { phase: 'Technical Round 2', date: 'Week 3', status: 'upcoming', detail: 'System design + LP' },
  { phase: 'Hiring Manager', date: 'Week 4', status: 'upcoming', detail: 'Behavioral + fitment' },
  { phase: 'Offer', date: 'Week 5', status: 'upcoming', detail: 'Negotiation & docs' },
]

export const agents = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'Coordinates all agents', status: 'active', load: 34 },
  { id: 'resume', name: 'Resume Agent', role: 'ATS & content analysis', status: 'active', load: 58 },
  { id: 'coding', name: 'Coding Agent', role: 'DSA hints & review', status: 'active', load: 72 },
  { id: 'interview', name: 'Interview Agent', role: 'Speech & answer scoring', status: 'idle', load: 12 },
  { id: 'company', name: 'Company Agent', role: 'JD matching & timelines', status: 'active', load: 41 },
  { id: 'coach', name: 'Coach Agent', role: 'Roadmap & nudges', status: 'active', load: 27 },
]

export const roadmap = [
  { phase: 'Foundations', weeks: 'Weeks 1-3', progress: 100, items: ['Arrays & Strings', 'Hashing', 'Two Pointers', 'Sorting'] },
  { phase: 'Core DSA', weeks: 'Weeks 4-7', progress: 72, items: ['Trees & BST', 'Graphs', 'Recursion', 'Backtracking'] },
  { phase: 'Advanced', weeks: 'Weeks 8-11', progress: 34, items: ['Dynamic Programming', 'Greedy', 'Tries', 'Segment Trees'] },
  { phase: 'Interview Ready', weeks: 'Weeks 12-14', progress: 8, items: ['System Design', 'Mock Loops', 'Behavioral', 'Company Deep-dives'] },
]

export const aptitudeTopics = [
  { topic: 'Quantitative', accuracy: 78, attempted: 240 },
  { topic: 'Logical Reasoning', accuracy: 84, attempted: 190 },
  { topic: 'Verbal Ability', accuracy: 71, attempted: 160 },
  { topic: 'Data Interpretation', accuracy: 66, attempted: 120 },
]
