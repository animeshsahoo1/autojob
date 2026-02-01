# 🚀 Complete Setup & Run Guide

## Issues Fixed:

1. ✅ PersonalizeNode now works with Apply workflow (uses `state.jobId`)
2. ✅ Worker updates ApplyQueue with correct status (SENT instead of COMPLETED/FAILED)
3. ✅ Applications will now be created in DB

---

## Step-by-Step Instructions:

### 1️⃣ Clean Up Old Data

```bash
npx tsx --env-file=.env -e "import mongoose from 'mongoose'; import { Job } from './models/job.model'; import { AgentRun } from './models/agentrun.model'; import { ApplyQueue } from './models/applyqueue.model'; import { Application } from './models/application.model'; import './database/db'; setTimeout(async () => { await mongoose.connect(process.env.MONGODB_URI); await Job.deleteMany({ source: 'seed' }); await AgentRun.deleteMany({}); await ApplyQueue.deleteMany({}); await Application.deleteMany({}); console.log('✅ Cleaned up old data'); process.exit(0); }, 100);"
```

### 2️⃣ Clean BullMQ Redis Queue

```bash
npx tsx --env-file=.env -e "const { Queue } = require('bullmq'); const { redisConnection } = require('./lib/queue/connection'); setTimeout(async () => { const queue = new Queue('apply-jobs', { connection: redisConnection }); await queue.obliterate({ force: true }); console.log('✅ Cleaned BullMQ queue'); await queue.close(); process.exit(0); }, 100);"
```

### 3️⃣ Start the Worker (Terminal 1)

```bash
npx tsx --env-file=.env lib/queue/apply-worker.ts
```

**Keep this running!** You should see:

```
[Worker] 🚀 Apply worker started, waiting for jobs...
[Worker] Concurrency: 5 jobs
[Worker] Rate limit: 10 jobs per 60 seconds
```

### 4️⃣ Run Seed Script (Terminal 2 - while worker is running)

```bash
npx tsx --env-file=.env scripts/seed-database.ts
```

**Expected Output:**

```
✅ Found existing user: test.student@example.com
✅ Created/found resumes
✅ Created 5 job listings
✅ Created agent run
🚀 Starting Discovery Workflow...
[Discovery] Enqueueing 10 jobs for application
[Discovery] Enqueued 10 jobs to BullMQ
✅ Discovery Workflow completed!
Jobs found: 35
Jobs queued: 10
Jobs skipped: 25
```

### 5️⃣ Watch Worker Process Jobs (in Terminal 1)

You should see:

```
[Worker] 📋 Processing job 697f... for user 697f...
[Worker] ✓ User validated
[Worker] 🔄 Starting Apply Workflow...
[Worker] ✓ Apply Workflow completed with status: COMPLETED
[Worker] ✅ Job 697f... completed: COMPLETED
```

### 6️⃣ Check Results

```bash
npx tsx --env-file=.env scripts/check-logs.ts
```

**Expected:**

```
🔄 QUEUE STATUS
Pending:    0
Processing: 0
Completed:  0
Failed:     0
Total:      10

📝 APPLICATIONS
Total:   10
Applied: 10
Draft:   0
```

---

## 🔍 Verify Everything Worked

### Check Applications in DB:

```bash
npx tsx --env-file=.env -e "import mongoose from 'mongoose'; import { Application } from './models/application.model'; import './database/db'; setTimeout(async () => { await mongoose.connect(process.env.MONGODB_URI); const apps = await Application.find().limit(3).lean(); console.log('Applications:', JSON.stringify(apps, null, 2)); process.exit(0); }, 100);"
```

### Check Agent Logs:

```bash
npx tsx --env-file=.env -e "import mongoose from 'mongoose'; import { AgentLog } from './models/agentlog.model'; import './database/db'; setTimeout(async () => { await mongoose.connect(process.env.MONGODB_URI); const logs = await AgentLog.find().limit(10).lean(); console.log('Logs:', logs.length); logs.forEach(log => console.log(log.stage, ':', log.message)); process.exit(0); }, 100);"
```

### Check BullMQ Stats:

```bash
npx tsx --env-file=.env -e "const { Queue } = require('bullmq'); const { redisConnection } = require('./lib/queue/connection'); setTimeout(async () => { const queue = new Queue('apply-jobs', { connection: redisConnection }); const counts = await queue.getJobCounts(); console.log('Queue counts:', counts); await queue.close(); process.exit(0); }, 100);"
```

---

## 📊 View in Frontend

1. Start Next.js dev server:

```bash
npm run dev
```

2. Visit pages:
   - **All logs:** http://localhost:3000/logs
   - **Specific agent run:** http://localhost:3000/logs/[agentRunId]
   - **API endpoints:**
     - GET /api/logs?userId=XXX
     - GET /api/logs/stats?userId=XXX

---

## 🎯 What Gets Stored in DB:

### 1. Jobs (35 total from seed)

- Title, company, skills, requirements
- Location, salary range
- Apply URL for sandbox

### 2. AgentRun (1 per Discovery run)

- Tracks counters: jobsFound, jobsQueued, jobsSkipped, appliedCountToday
- Status: ACTIVE → COMPLETED

### 3. ApplyQueue (10 queued jobs)

- Status: QUEUED → SENT (after processing)
- Links agentRun → job → user

### 4. Application (10 created by worker)

- Status: SUBMITTED or FAILED
- Resume variant used
- Attempts, receipt, error info
- Timeline of stages

### 5. AgentLog (100+ entries)

- Every workflow step logged
- Stage: ARTIFACT, SEARCH, POLICY, PERSONALIZE, APPLY, VALIDATION
- Level: INFO, WARN, ERROR
- Full metadata for debugging

---

## ⚠️ Troubleshooting

**Worker not picking up jobs?**

- Check Redis connection: `REDIS_HOST`, `REDIS_PASSWORD` in .env
- Verify worker is running: Look for "[Worker] 🚀 Apply worker started"

**Applications not created?**

- Check OpenAI API key is set: `OPENAI_API_KEY` in .env
- Check worker logs for errors
- Run: `npx tsx --env-file=.env scripts/check-logs.ts`

**PersonalizeNode errors?**

- This is now fixed (handles both Discovery and Apply workflows)
- Make sure artifactState is passed from Discovery to BullMQ

**No logs in frontend?**

- Check MongoDB connection
- Verify AgentLog collection has data
- Check API route: `/api/logs?userId=XXX`

---

## 🎉 Success Criteria

✅ Worker starts and waits for jobs
✅ Seed script enqueues 10 jobs to BullMQ
✅ Worker processes all 10 jobs (see logs in Terminal 1)
✅ 10 Applications created with status SUBMITTED
✅ AgentLog has 100+ entries
✅ Frontend shows logs at /logs
✅ LangSmith has workflow traces (https://smith.langchain.com/)

---

## 🔄 To Run Again

Simply repeat steps 1-6. The cleanup commands will remove old data and you'll get fresh results.
