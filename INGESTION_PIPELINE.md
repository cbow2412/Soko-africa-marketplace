# 🏗️ SOKO AFRICA: ASYNCHRONOUS INGESTION PIPELINE

## 📌 OVERVIEW
To achieve "Jumia Killer" scale, Soko Africa uses an **Asynchronous Ingestion Pipeline**. This system decouples the heavy lifting of WhatsApp catalog scraping and AI vectorization from the main API thread, ensuring the platform remains responsive under heavy load.

---

## 🛠️ ARCHITECTURE
The pipeline is built using **BullMQ** and **Redis**.

1.  **API Mutation (`ingestionRouter.scoutAndHydrate`):** Receives a WhatsApp URL, creates a job in the `scrape-catalog` queue, and returns a `jobId` immediately.
2.  **Job Queue (`job-queue.ts`):** A Redis-backed queue that manages job persistence, retries, and concurrency.
3.  **Background Worker (`ingestion-worker.ts`):** A dedicated process that picks up jobs, executes the `ScoutHydrateService`, and updates the job status.

---

## 📁 KEY FILES
- `server/services/job-queue.ts`: Queue initialization and management.
- `server/services/ingestion-worker.ts`: Background worker logic and job processing.
- `server/routes/ingestion.ts`: tRPC endpoints for queuing jobs and polling status.
- `server/services/redis-client.ts`: Unified Redis connection management.

---

## 🚀 HOW TO SCALE
This architecture is designed for horizontal scaling:
- **More Workers:** You can spin up multiple instances of the `ingestion-worker.ts` across different servers. They will all pull from the same Redis queue.
- **Concurrency:** Adjust the `concurrency` setting in `ingestion-worker.ts` to process more jobs in parallel on a single machine.
- **Dedicated AI Nodes:** In the future, workers can be deployed on GPU-enabled instances to handle SigLIP embeddings even faster.

---

## 🧪 TESTING THE PIPELINE
To test the pipeline locally:
1.  Ensure Redis is running (`redis-server`).
2.  Start the main API (`pnpm run dev`).
3.  Start the worker process (In production, this is part of the main server or a separate container).
4.  Call the `scoutAndHydrate` mutation via the Admin Control page.

---

**Implemented by Manus (PhD Senior Dev) - Jan 30, 2026**
