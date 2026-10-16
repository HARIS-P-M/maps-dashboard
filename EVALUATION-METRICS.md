# Evaluation Metrics

This document explains how the MAPS dashboard calculates student evaluation metrics.

The live calculations are primarily implemented in [`lib/store.ts`](./lib/store.ts).

## 1. ATS Resume Score

The Resume Agent analyzes:

- Resume content.
- Target role.
- Target company.
- Optional job description.

The agent returns an `overallScore`, which is used as the ATS score.

```ts
getLiveAtsScore: () => {
  const { resumeAnalysis } = get()
  return resumeAnalysis?.overallScore ?? 0
}
```

Formula:

```text
ATS Score = AI-generated resume overallScore
```

If no resume has been analyzed, the ATS score is `0`.

The API implementation is in [`app/api/agents/resume/route.ts`](./app/api/agents/resume/route.ts).

## 2. Interview Readiness

The Interview Agent evaluates each answer on a `0–10` scale using factors such as:

- STAR framework.
- Clarity.
- Confidence.
- Relevance to the target role.
- Alignment with the candidate's resume, when available.

All evaluations are stored in `interviewHistory`. The application calculates their average and converts the result to a `0–100` score.

```ts
const avg =
  interviewHistory.reduce(
    (sum, evaluation) => sum + evaluation.overallScore,
    0
  ) / interviewHistory.length

return Math.round(avg * 10)
```

Formula:

```text
Interview Readiness = average interview score × 10
```

Example:

```text
Interview scores: 7, 8, 9
Average: 8
Interview readiness: 8 × 10 = 80%
```

If there are no interview evaluations, the score is `0`.

The API implementation is in [`app/api/agents/interview/route.ts`](./app/api/agents/interview/route.ts).

## 3. Aptitude Score

The aptitude score is based on the number of correct answers and the total number of attempted questions.

```ts
Math.round((correct / total) * 100)
```

Formula:

```text
Aptitude Score = correct answers ÷ total questions × 100
```

Example:

```text
Correct answers: 18
Total questions: 20
Aptitude score: 18 ÷ 20 × 100 = 90%
```

If no aptitude questions have been attempted, the score is `0`.

The same calculation is used in the aptitude section at [`components/sections/aptitude.tsx`](./components/sections/aptitude.tsx).

## 4. Coding Score

The coding score combines:

1. Coding success rate.
2. Coding practice volume.

### Success rate

```text
Success rate = passed coding sessions ÷ total coding sessions
```

### Practice volume

The application treats 50 coding sessions as the maximum practice-volume target:

```ts
const volume = Math.min(codingSessions.length / 50, 1)
```

### Final formula

```ts
(successRate * 0.6 + volume * 0.4) * 100
```

The weights are:

| Component | Weight |
|---|---:|
| Coding success rate | 60% |
| Coding volume | 40% |

Example:

```text
Total coding sessions: 10
Passed sessions: 8

Success rate: 8 ÷ 10 = 0.8
Volume: 10 ÷ 50 = 0.2

Coding score:
(0.8 × 0.6 + 0.2 × 0.4) × 100 = 56%
```

A student who completes 50 sessions and passes all of them receives a coding score of `100%`.

## 5. Placement Probability

Placement probability combines four evaluation scores:

| Metric | Weight |
|---|---:|
| ATS Resume Score | 30% |
| Coding Score | 30% |
| Interview Readiness | 25% |
| Aptitude Score | 15% |

Formula:

```ts
weighted =
  ats * 0.30 +
  coding * 0.30 +
  interview * 0.25 +
  aptitude * 0.15
```

The result is rounded and capped at `99`:

```ts
Math.min(99, Math.round(weighted))
```

Example:

```text
ATS score: 80
Coding score: 70
Interview readiness: 90
Aptitude score: 60

Placement probability:
80 × 0.30 +
70 × 0.30 +
90 × 0.25 +
60 × 0.15

= 24 + 21 + 22.5 + 9
= 76.5
= 77%
```

If all four component metrics are zero, placement probability is `0%`.

## 6. Study Streak

The current dashboard streak is based on aptitude activity:

```ts
getLiveStreak: () => {
  return get().aptitudeStats.streak
}
```

Therefore:

```text
Study Streak = aptitude activity streak
```

It is not yet a unified streak across coding, aptitude, resume, interview, and roadmap activities.

## 7. Skill Gap Metrics

The Skill Gap section compares the student's current skill level with the required level.

Conceptually:

```text
Deficit = required level - current level
Coverage = current level ÷ required level × 100
```

Example:

```text
Current skill level: 60
Required skill level: 80

Deficit: 80 - 60 = 20 points
Coverage: 60 ÷ 80 × 100 = 75%
```

The Coach Agent uses information including:

- Resume analysis.
- Job description.
- Target role.
- Target company.
- Coding performance.
- Aptitude accuracy.
- Interview history.

The UI is implemented in [`components/sections/skill-gap.tsx`](./components/sections/skill-gap.tsx).

## 8. Adaptive Aptitude Difficulty

The next aptitude question uses topic-level accuracy to select a difficulty mode.

| Topic accuracy | Difficulty |
|---|---|
| No previous attempts | Standard |
| 80% or above | Hard |
| 50%–79% | Medium |
| Below 50% | Easy |

Examples:

```text
Accuracy: 85% → Hard questions
Accuracy: 65% → Medium questions
Accuracy: 40% → Easy questions
```

Adaptive difficulty changes the next question selection. It does not directly add bonus points to the aptitude score.

The implementation is in [`app/api/agents/aptitude/route.ts`](./app/api/agents/aptitude/route.ts).

## 9. Admin Database Metrics

The Admin Overview uses database aggregates for the metrics that are currently persisted, including:

- Total active or non-deleted students.
- Active students.
- Suspended students.
- Average placement probability.
- Average ATS score.

Some metrics are not yet instrumented as durable database data, including:

- Agent calls today.
- Real-time agent latency.
- Complete student activity history.

Those values should not be interpreted as production telemetry until event tracking is implemented.

The overview endpoint is [`app/api/admin/overview/route.ts`](./app/api/admin/overview/route.ts).

## 10. Current Persistence Limitation

Some student metrics currently use Zustand persistence in the browser under the storage key:

```text
maps-storage-v2
```

This affects data such as:

- Coding sessions.
- Aptitude attempts.
- Interview history.
- Completed roadmap tasks.
- Resume analysis state.

As a result, some values may remain local to the student's browser instead of being available to the Admin Dashboard or other devices.

The planned persistence improvement is to send student activity events to authenticated API routes and store them in PostgreSQL. This will provide a single durable source of truth for student and admin metrics.

## Review Summary

The current evaluation model is:

```text
ATS score
  = AI-generated resume score

Interview readiness
  = average interview score on a 0–10 scale × 10

Aptitude score
  = correct answers ÷ total attempts × 100

Coding score
  = (success rate × 60% + practice volume × 40%) × 100

Placement probability
  = ATS × 30%
  + Coding × 30%
  + Interview × 25%
  + Aptitude × 15%
```

These scores are readiness indicators calculated from the student's available preparation activity. Placement probability is not a guaranteed prediction of employment.
