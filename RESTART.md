# 🔄 Quick Restart Instructions

## The Issue:

The worker is running OLD code (before the PersonalizeNode fix). You need to restart it.

## Steps:

### 1️⃣ Stop the Worker

Go to the terminal where worker is running and press `Ctrl+C`

### 2️⃣ Clean BullMQ Queue

```bash
npx tsx --env-file=.env -e "const { Queue } = require('bullmq'); const { redisConnection } = require('./lib/queue/connection'); setTimeout(async () => { const queue = new Queue('apply-jobs', { connection: redisConnection }); await queue.obliterate({ force: true }); console.log('✅ Cleaned BullMQ queue'); await queue.close(); process.exit(0); }, 100);"
```

### 3️⃣ Clean Database

```bash
npx tsx --env-file=.env -e "import mongoose from 'mongoose'; import { Job } from './models/job.model'; import { AgentRun } from './models/agentrun.model'; import { ApplyQueue } from './models/applyqueue.model'; import { Application } from './models/application.model'; import './database/db'; setTimeout(async () => { await mongoose.connect(process.env.MONGODB_URI); await Job.deleteMany({ source: 'seed' }); await AgentRun.deleteMany({}); await ApplyQueue.deleteMany({}); await Application.deleteMany({}); console.log('✅ Cleaned database'); process.exit(0); }, 100);"
```

### 4️⃣ Start Worker with NEW Code

```bash
npx tsx --env-file=.env lib/queue/apply-worker.ts
```

### 5️⃣ Run Seed Script (new terminal)

```bash
npx tsx --env-file=.env scripts/seed-database.ts
```

### 6️⃣ Check Results

```bash
npx tsx --env-file=.env scripts/check-logs.ts
```

---

## Expected Output in Worker Terminal:

```
[Worker] 📋 Processing job 697f... for user 697f...
[Worker] ✓ User validated
[Worker] 🔄 Starting Apply Workflow...
[Worker] ✓ Apply Workflow completed with status: COMPLETED
[Worker] ✅ Job 697f... completed: COMPLETED
```

If you see "PersonalizeNode error: No job ID found", the fix worked (new error message) and we need to debug why `state.jobId` isn't being passed.

If you see "PersonalizeNode error: No queued jobs found" (OLD error), the worker is STILL running old code - make sure to fully stop and restart it.
