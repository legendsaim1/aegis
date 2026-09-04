# AEGIS ✦

**AI-based Exam Grading & Insight System** — Upload handwritten answer sheets, get instant AI grading with confidence scores.

Built for the **Alibaba Cloud AI Hackathon Pakistan 2026**.

---

## What is AEGIS?

AEGIS (AI-based Exam Grading & Insight System) is an AI-powered exam checking system that lets teachers:

- **Upload** student answer sheets (PDF or image)
- **Auto-grade** answers using AI with rubric-based evaluation
- **Track confidence** — dual scores for handwriting OCR and grading accuracy
- **Detect copying** — flag suspiciously similar answers across students using hybrid TF-IDF + AI.
- **View analytics** — score distributions, pass/fail rates, difficult topics, and AI-powered topic recommendations.
- **Recheck manually** — override AI grades directly on the portal.
- **Export results** — download result sheets as XLSX/CSV

All from a clean, professional dashboard. No manual checking. No bias.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14.2.15 (App Router + Edge Middleware) + React 18.2.0 |
| **Styling** | Vanilla CSS + CSS Modules |
| **Auth** | Supabase Auth (email/password) |
| **Database** | Supabase PostgreSQL |
| **File Storage** | Supabase Storage |
| **AI - OCR** | Google Gemini `gemini-3.1-flash-lite` |
| **AI - Text Processing** | Groq (`openai/gpt-oss-120b`, `qwen/qwen3.6-27b`, etc.) |
| **Charts** | Recharts |
| **Export** | ExcelJS (Dynamically Imported) |
| **Hosting** | Vercel (Serverless + Edge) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed
- [Git](https://git-scm.com/) installed
- A [Supabase](https://supabase.com/) account (free tier)
- 3 Google Cloud projects for Gemini API keys
- 3 Groq accounts for Groq API keys

### 1. Clone the repo

```bash
git clone https://github.com/legendsaim1/aegis.git
cd aegis
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# === Primary Gemini Keys (Vision/OCR) ===
# Supports up to 20 keys (GEMINI_API_KEY_1 through GEMINI_API_KEY_20)
GEMINI_API_KEY_1=your_first_gemini_key
GEMINI_API_KEY_2=your_second_gemini_key

# === Groq Keys (Text: grading, rubrics, copy detection) ===
# Supports up to 40 keys (GROQ_API_KEY_1 through GROQ_API_KEY_40)
GROQ_API_KEY_1=your_first_groq_key
GROQ_API_KEY_2=your_second_groq_key

# === Backup Gemini Keys (Failover for ALL tasks) ===
# Supports up to 20 keys (GEMINI_BACKUP_KEY_1 through GEMINI_BACKUP_KEY_20)
GEMINI_BACKUP_KEY_1=your_first_backup_gemini_key
GEMINI_BACKUP_KEY_2=your_second_backup_gemini_key
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Run the migration file in the Supabase SQL Editor:

```bash
# The schema file is located at:
supabase/migrations/001_initial_schema.sql
```

3. Enable **Email Auth** in Supabase Dashboard → Authentication → Providers
4. Create a **Storage bucket** named `answer-sheets` (set to public or with RLS)

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
aegis/
├── public/                        # Static assets (logo, favicon)
│
├── src/
│   ├── app/
│   │   ├── page.js                # Landing page
│   │   ├── globals.css            # Design system + global styles
│   │   ├── layout.js              # Root layout
│   │   ├── auth/                  # Login / Signup pages
│   │   ├── dashboard/             # All dashboard pages
│   │   └── api/                   # API route handlers
│   │
│   ├── components/                # UI, Layout, Analytics components
│   │
│   ├── lib/
│   │   ├── ai/                    # ⭐ Unified AI Layer (Multi-Provider)
│   │   │   ├── provider.js        # Failover orchestrator
│   │   │   ├── gemini/            # Gemini client & adapter
│   │   │   ├── groq/              # Groq client & adapter
│   │   │   └── prompts/           # Prompt templates
│   │   │
│   │   ├── supabase/              # Supabase client (browser + server)
│   │   ├── processing/            # Pipeline orchestration + queue
│   │   └── utils/                 # Confidence calc, export, validators
│   │
│   └── hooks/                     # Custom React hooks
│
├── .env.example                   # Template for environment variables
└── README.md
```

### Who Owns What?

| Directory | Owner |
|-----------|-------|
| `src/components/**`, `src/app/page.js`, `globals.css` | **Hamad Abbasi** (Frontend) |
| `src/lib/ai/**` | **Ali Saim Salehzadeh** (AI Specialist) |
| `src/app/api/**`, `src/lib/supabase/**`, `src/lib/processing/**` | **Muhammad Hamza Shakeel** (Backend + Infra) |

---

## AI Architecture (Multi-Provider)

AEGIS uses a hybrid AI architecture utilizing both **Gemini** (for Vision) and **Groq** (for Text processing).

```
Teacher uploads PDF/image
        ↓
  Stored in Supabase Storage
        ↓
  GEMINI: Extracts text (OCR) via gemini-3.1-flash-lite
        ↓
  GROQ: Evaluates answer against rubric via gpt-oss-120b
        ↓
  Results stored with dual confidence scores
        ↓
  Low confidence → flagged for human review
        ↓
  Local TF-IDF + GROQ: Hybrid semantic copy detection across all answers
```

### Rate Limiting & Failover Strategy

To bypass free-tier limitations and guarantee 100% uptime:
- **Dynamic Key Scaling**: Supports anywhere from 1 to 40 API keys for Groq, and up to 20 for Gemini providers. The system dynamically scans the environment and pools them.
- **Smart Rotation & Cooldown**: Keys are rotated per request. If a key hits a rate limit (HTTP 429), it is placed on a 60-second cooldown so it doesn't fail subsequent requests.
- **Throttling**: Grading requests are automatically throttled (2-second delay) to respect Groq's RPM limits while parallelizing where possible.
- **3-Tier Failover Architecture**:
  - **Tier 1 (Primary)**: The primary task model (e.g. `gpt-oss-120b`) using the primary key pool.
  - **Tier 2 (Model Fallback)**: For non-grading tasks, falls back to a different model on the *same* provider (e.g. `qwen/qwen3.6-27b`) to utilize a completely separate rate-limit pool without changing providers. (Grading skips this to avoid inter-student bias).
  - **Tier 3 (Provider Fallback)**: If Groq completely fails, falls back to a dedicated pool of Backup Gemini keys using `gemini-3.1-flash-lite`.

### Subject-Aware Contextualization
The AI prompts receive the `subject_name` dynamic parameter passed down through the pipeline. This allows the AI to apply domain-specific grading leniency and correctly interpret OCR hallucinations (e.g., interpreting "NaCI" as "NaCl" in a Chemistry exam rather than an English typo).

---

## Serverless Performance Optimizations

AEGIS is built to perform at scale on Vercel's Serverless infrastructure. We implemented several architectural optimizations to drastically minimize latency and cold-start penalties:

- **Module-Level Singletons:** The Supabase Admin Client (`supabaseServer`) is cached at the module level. This prevents expensive object instantiation overhead on every request during warm serverless executions.
- **Request Deduplication:** Authentication checks (`getAuthenticatedUser`) are wrapped in `React.cache()`. This completely eliminates redundant network round-trips to Supabase Auth when multiple server components or functions call it within the same request lifecycle.
- **Dynamic Imports:** Heavy utility libraries (like `exceljs`) are entirely removed from the global bundle. They are dynamically imported (`await import()`) solely at the exact point of execution, keeping the initial serverless cold-start footprint incredibly lean.
- **Aggressive Tree Shaking:** The `next.config.js` is optimized to natively tree-shake large namespace imports like `recharts` and `@supabase/supabase-js`, resulting in minimal production payloads.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit & integration tests (Vitest) |

---

## Deployment

This project auto-deploys to **Vercel** on push to `main`.

1. Connect your GitHub repo to [Vercel](https://vercel.com/)
2. Add all environment variables in Vercel → Settings → Environment Variables
3. Deploy!

---

## Team

| Role | Name | Responsibility |
|------|------|---------------|
| **AI Specialist** | Ali Saim Salehzadeh | AI — Multi-provider orchestrator, Gemini OCR, Groq grading |
| **Frontend Lead** | Hamad Abbasi | Frontend — UI, components, styling, responsiveness |
| **Backend + Infra** | Muhammad Hamza Shakeel | Backend — APIs, database, storage, deployment |

---

## Hackathon Info

- **Event:** Alibaba Cloud AI Hackathon Pakistan 2026
- **Category:** Education — Adaptive learning tools
- **Requirements:** Generative AI usage, live deployed link, Google Drive submission
