# System Evaluation Metrics

This document explains the system-level evaluation metrics shown in the MAPS project report.

These metrics are different from student readiness metrics such as ATS score, aptitude score, coding score, interview readiness, and placement probability.

MAPS uses pretrained language models and does not have a labeled dataset or a traditional classifier. Therefore, normal classifier accuracy is not the appropriate evaluation method. The system should instead be evaluated using functional test cases, schema checks, response-time measurements, repeatability tests, expert relevance scoring, and controlled-error counting.

## Metrics in the Project Report

| Metric | Reported result |
|---|---:|
| Agent routing accuracy | 95% |
| Schema validity rate | 92% |
| Task success rate | 90% |
| Average response time | 4.8 seconds |
| Resume match consistency | 87% |
| Roadmap relevance | 89% |
| Error rate | 8% |

These percentages should only be presented as final measured results if the corresponding tests and logs were actually completed.

## 1. Agent Routing Accuracy

### Meaning

Agent routing accuracy measures whether the placement coordinator sends a student request to the correct specialist agent.

The coordinator implementation is in [`app/api/agents/orchestrator/route.ts`](./app/api/agents/orchestrator/route.ts).

### Examples

| Student request | Expected agent |
|---|---|
| Analyze my resume | Resume Agent |
| Give me a Python coding problem | Coding Agent |
| Start a mock interview | Interview Agent |
| Create a weekly preparation plan | Coach Agent |
| Give me quantitative aptitude questions | Aptitude Agent |

### Formula

```text
Agent Routing Accuracy =
Correctly routed requests ÷ Total routing test requests × 100
```

### Example calculation

```text
Correctly routed requests: 19
Total routing requests: 20

Routing accuracy = 19 ÷ 20 × 100 = 95%
```

Therefore, a result of `95%` means that 19 out of 20 routing decisions were correct.

### Current implementation status

The current coordinator returns an agent plan and validates that an `agents` array exists. It does not automatically compare every routing decision with a labeled expected agent.

To calculate this metric properly, the project needs:

1. A test dataset containing requests and expected agents.
2. The coordinator's actual response.
3. A comparison between expected and actual agents.
4. An aggregated percentage.

## 2. Schema Validity Rate

### Meaning

Schema validity rate measures how many AI responses follow the JSON structure expected by the application.

Expected response structures are described in [`lib/agents/agent-prompts.ts`](./lib/agents/agent-prompts.ts).

For example, a valid Resume Agent response may contain:

```json
{
  "overallScore": 80,
  "sections": {
    "summary": 8,
    "experience": 7,
    "skills": 9,
    "education": 8
  },
  "keywordGaps": []
}
```

### Formula

```text
Schema Validity Rate =
Valid AI responses ÷ Total AI responses × 100
```

### Example calculation

```text
Valid responses: 92
Total responses: 100

Schema validity rate = 92 ÷ 100 × 100 = 92%
```

A response is valid when it:

- Is valid JSON.
- Contains all required fields.
- Uses the expected data types.
- Uses allowed enum values where required.
- Keeps numeric values within the expected range.
- Follows the expected nested structure.

### Difference from task success

A response can be valid JSON and still be functionally incorrect.

```text
Schema validity:
Does the response have the correct structure?

Task success:
Did the response actually complete the requested task correctly?
```

### Current implementation status

Several routes perform basic parsing and validation using JSON extraction, `jsonrepair`, and required-field checks. Complete runtime schemas for all AI responses are not yet implemented.

Therefore, the `92%` value should only be claimed after running a response-validation test set and counting the results.

## 3. Task Success Rate

### Meaning

Task success rate measures whether an agent completed the requested task correctly.

Examples include:

- Resume analysis returns the expected sections.
- Coding evaluation produces the correct pass/fail result.
- Aptitude Agent returns a valid question and answer.
- Interview Agent returns a score and feedback.
- Coach Agent returns a usable roadmap.
- Coordinator returns the correct specialist-agent plan.

### Formula

```text
Task Success Rate =
Successfully completed tasks ÷ Total tasks × 100
```

### Example calculation

```text
Successful tasks: 90
Total tasks: 100

Task success rate = 90 ÷ 100 × 100 = 90%
```

A result of `90%` means that 90 out of 100 tested tasks completed correctly according to the evaluation criteria.

## 4. Response Time

### Meaning

Response time measures how long the system takes to process a request and return a response.

It may include:

```text
Request received
→ Authentication
→ Input validation
→ AI provider request
→ Response parsing
→ Final response returned
```

### Formula

For one request:

```text
Response time =
Response completion timestamp - Request start timestamp
```

For several requests:

```text
Average response time =
Sum of all response times ÷ Number of requests
```

### Example calculation

```text
Request times:
3.2 seconds
4.1 seconds
5.0 seconds
6.0 seconds
4.9 seconds

Average =
(3.2 + 4.1 + 5.0 + 6.0 + 4.9) ÷ 5
= 23.2 ÷ 5
= 4.64 seconds
```

Rounded result:

```text
Average response time = 4.6 seconds
```

The report's `4.8 seconds` means that the measured test requests took approximately 4.8 seconds on average.

### Current implementation status

The shared Groq client in [`lib/agents/groq-client.ts`](./lib/agents/groq-client.ts) sends requests to the provider, but the project does not yet persist response-duration telemetry for every agent route.

The value must therefore come from browser network timing, server logs, a performance test, or future telemetry instrumentation.

## 5. Resume Match Consistency

### Meaning

Resume match consistency measures whether the Resume Agent gives reasonably similar results when the same resume and job description are analyzed repeatedly.

The Resume Agent supports:

- Resume-only analysis.
- Resume and job-description matching.
- Keyword-gap detection.
- Match scoring.

### Test method

Run the same input multiple times:

```text
Same resume
Same job description
Same target role
Same target company
```

Compare:

- Overall score.
- Job-description match score.
- Detected keyword gaps.
- Critical gaps.
- Section scores.

A practical rule is to consider scores consistent when they remain within an allowed tolerance, such as `±5 points`, and the important keyword findings remain substantially similar.

### Formula

```text
Resume Match Consistency =
Consistent repeated analyses ÷ Total repeated analyses × 100
```

### Example calculation

```text
Consistent analyses: 26
Total repeated analyses: 30

Consistency = 26 ÷ 30 × 100
             = 86.67%
             ≈ 87%
```

Consistency means that the model produces similar results for the same input. It does not prove that the score is objectively correct.

## 6. Roadmap Relevance

### Meaning

Roadmap relevance measures whether the Coach Agent's recommended preparation plan addresses the student's actual weaknesses.

The Coach Agent generates:

- Priority areas.
- Weekly plans.
- Daily tasks.
- Skill gaps.
- Today's tasks.
- Weekly goals.

The roadmap interface is in [`components/sections/roadmap.tsx`](./components/sections/roadmap.tsx), and the expected Coach Agent response is defined in [`lib/agents/agent-prompts.ts`](./lib/agents/agent-prompts.ts).

### Evaluation method

Create test student profiles with known weaknesses.

Example:

```text
Resume score: 60
Aptitude accuracy: 40%
Coding success rate: 30%
Interview score: 50
```

The expected roadmap should prioritize:

1. Aptitude.
2. Coding.
3. Interview preparation.

Review whether the generated roadmap:

- Identifies the weak areas.
- Assigns appropriate tasks.
- Includes the required preparation dimensions.
- Provides realistic weekly goals.
- Matches the target role.
- Avoids irrelevant activities.

### Formula

Using an evaluation rubric:

```text
Roadmap Relevance =
Relevant roadmap criteria satisfied ÷ Total roadmap criteria × 100
```

### Example calculation

```text
Relevant criteria satisfied: 8.9 average
Total criteria: 10

Roadmap relevance = 8.9 ÷ 10 × 100
                   = 89%
```

Another option is to ask multiple evaluators to score the roadmap:

```text
Ratings: 90%, 85%, 92%

Average relevance =
(90 + 85 + 92) ÷ 3
= 89%
```

### Current implementation status

The Coach Agent generates the roadmap, but there is no labeled “correct roadmap” for automatic comparison. Relevance therefore requires a predefined rubric, expert review, or a benchmark dataset.

## 7. Error Rate

### Meaning

Error rate measures the proportion of requests that end in a controlled error.

Examples include:

- Invalid input.
- Unauthorized request.
- AI provider failure.
- Invalid AI JSON.
- Timeout.
- Coding execution failure.
- Unsupported file upload.
- Database failure.

### Formula

```text
Error Rate =
Requests ending in controlled error ÷ Total requests × 100
```

### Example calculation

```text
Controlled errors: 8
Total requests: 100

Error rate = 8 ÷ 100 × 100 = 8%
```

Therefore, an error rate of `8%` means that 8 out of 100 requests ended in a handled error.

A controlled error means that the system intentionally returns an error response such as:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
500 Internal Server Error
502 Bad Gateway
```

Error rate is not always exactly `100% - task success rate`, because:

- A request can succeed technically but produce a poor answer.
- A response can have valid JSON but fail the actual task.
- Invalid user input is different from an AI task failure.

## Summary Table

| Metric | Formula | Meaning |
|---|---|---|
| Agent routing accuracy | Correct routes ÷ total routing tests × 100 | Whether requests reach the correct agent |
| Schema validity rate | Valid responses ÷ total responses × 100 | Whether AI output follows the expected structure |
| Task success rate | Successful tasks ÷ total tasks × 100 | Whether agents complete tasks correctly |
| Response time | Total duration ÷ request count | Average processing time |
| Resume match consistency | Consistent repeated analyses ÷ total repeated analyses × 100 | Stability for identical resume inputs |
| Roadmap relevance | Relevant criteria ÷ total criteria × 100 | Whether plans address student weaknesses |
| Error rate | Controlled errors ÷ total requests × 100 | How often requests end in handled errors |

## What Is Implemented in the Current Project?

The current project contains:

- Agent routing through the placement coordinator.
- JSON parsing and partial response validation.
- Error responses and server-side error logging.
- Resume matching prompts.
- Personalized roadmap generation.
- Coding test execution and pass/fail evaluation.
- Authentication and input validation.

The project does not yet automatically store and calculate all seven system-level metrics in a telemetry database.

The following require formal instrumentation or an evaluation dataset:

- Routing accuracy.
- Schema validity percentage across all agents.
- Overall task success rate.
- Average response time across all routes.
- Resume consistency testing.
- Roadmap relevance scoring.
- Aggregated error rate.

## Accurate Review Statement

Use the following explanation during a review:

> These are system evaluation metrics, not classifier accuracy metrics. Because MAPS uses pretrained language models and does not have a labeled training dataset, the system is evaluated through functional test cases, schema checks, timing measurements, repeatability tests, expert relevance scoring, and controlled-error counting. The percentages must be calculated from a defined evaluation dataset and request logs. The current implementation supports the agent operations and partial validation, but full automated telemetry for these seven metrics is still a future enhancement.

The values `95%`, `92%`, `90%`, `4.8 seconds`, `87%`, `89%`, and `8%` should be presented as final project results only if the corresponding tests were actually run and the results were recorded.
