export const blogCategories = [
  "All",
  "Product & Vision",
  "AI Architecture",
  "Academic Integrity",
  "Multimodal Vision",
  "Infrastructure"
];

export const blogPosts = [
  {
    slug: "why-we-built-aegis",
    title: "Why we built AEGIS",
    category: "Product & Vision",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "Teachers lose up to 15 hours a week to manual grading. AEGIS automates the tedious part without losing nuance on subjective answers.",
    date: "August 26, 2026",
    readTime: "4 min read",
    content: `
## The Grading Bottleneck

Teachers are the backbone of our education system, yet they spend an astonishing amount of their time—up to 15 hours a week—grading papers manually. This is time that could be spent lesson planning, mentoring students one-on-one, or simply resting. 

The problem isn't that grading is unimportant. Feedback is critical to learning. The problem is that the *mechanics* of grading—deciphering handwriting, checking against a rubric, tallying scores—are tedious, repetitive, and prone to fatigue.

## A Better Way

We built AEGIS to solve exactly this problem. Our goal wasn't to replace the teacher, but to give them a superpower. AEGIS handles the heavy lifting: reading messy handwriting, evaluating answers against your specific rubric, and instantly flagging anything it's not absolutely certain about.

It automates the tedious parts without losing the nuance required for subjective answers. If a student writes an essay or solves a multi-step math problem, AEGIS understands the context and grades accordingly.

## The Hackathon Origins

AEGIS was originally developed during the Alibaba Cloud AI Hackathon Pakistan 2026. We realized that while generative AI was being used to write essays and generate code, its true potential lay in evaluation and reasoning. By combining specialized AI models with a workflow designed specifically for educators, we created a tool that respects a teacher's final say while saving them hours of time.

Ready to reclaim your weekends?
    `,
    ctaLink: "?modal=signup",
    ctaText: "Get Started Free"
  },
  {
    slug: "how-aegis-grades",
    title: "How AEGIS actually grades a handwritten answer sheet",
    category: "AI Architecture",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "A plain-language walkthrough of our pipeline: Gemini reads the handwriting, Groq grades it against your rubric, and uncertain answers go to review.",
    date: "August 27, 2026",
    readTime: "6 min read",
    content: `
## Behind the Curtain

When you click "Start Grading AI" on a batch of uploaded answer sheets, what actually happens? It might feel like magic, but it's actually a highly orchestrated pipeline of specialized AI models working together. 

Here is a plain-language walkthrough of exactly how AEGIS evaluates a student's handwritten exam.

### Step 1: Extraction (OCR)

First, we need to read the handwriting. We use Google's Gemini (specifically, \`gemini-3.1-flash-lite\`) for this step. It acts as an advanced Optical Character Recognition (OCR) engine. It looks at the uploaded image and extracts the handwritten text, mapping it to the specific questions on your exam. 

### Step 2: Evaluation

Once we have the text, the actual grading begins. We send the student's answer, along with the question and your specific grading rubric, to a powerful language model hosted on Groq (usually \`gpt-oss-120b\`). 

Groq evaluates the answer strictly against your rubric. It doesn't just look for keywords; it assesses the reasoning, the accuracy, and the completeness of the answer.

### Step 3: Confidence Scoring & Copy Detection

For every grade it assigns, the AI also generates a **Confidence Score**. This is a measure of how certain the model is that its evaluation is correct. 

Simultaneously, we run a hybrid Copy Detection scan (using semantic similarity analysis) to flag any answers across the class that are suspiciously identical in meaning, even if the exact wording varies slightly.

### Step 4: The Review Queue

This is the most important part of the pipeline: **AEGIS does not blindly finalize uncertain grades.** 

If the confidence score falls below a specific threshold, or if the answer is flagged for potential copying, the system halts auto-grading for that specific answer and places it in your **Manual Review queue**. 

By grading *per student* and utilizing this safety net, we ensure that you are only spending your time looking at the 5-10% of answers that truly require human judgment, while the other 90% are handled accurately and automatically.
    `,
    ctaLink: "/help",
    ctaText: "Read more in the Help Center: What happens after you click Process"
  },
  {
    slug: "confidence-scores-explained",
    title: "What a confidence score means (and why you'll still review some answers)",
    category: "Product & Vision",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "Reframing the 'flagged for review' queue as the safety net working exactly as intended, not the AI failing.",
    date: "August 28, 2026",
    readTime: "5 min read",
    content: `
## The Safety Net

A common misconception about AI grading is that it should be 100% autonomous. The reality is that human expression is messy, and a responsible AI system knows when to ask for help.

In AEGIS, that request for help is called the **Manual Review queue**, and it is driven by **Confidence Scores**.

## What is a Confidence Score?

Whenever our evaluation model grades a student's answer, it calculates a confidence score behind the scenes. This score reflects the model's certainty based on several factors:
1. Was the handwriting partially illegible?
2. Did the student answer the question in a highly unconventional way?
3. Did the answer partially contradict the rubric, requiring nuanced interpretation?

## Working as Intended

If the AI grades an exam and flags 3 out of 20 questions for your review, **this is not the AI failing.** This is the safety net working exactly as intended. 

Instead of guessing and potentially giving a student an unfair grade, AEGIS pauses and hands the reins back to you, the educator. It will show you the student's answer, the rubric, and its *proposed* grade, but it requires you to click "Approve" or "Override".

This hybrid approach guarantees accuracy. You save hours on the straightforward answers, and you can focus your expertise exactly where it's needed most—on the borderline cases.
    `,
    ctaLink: "/help",
    ctaText: "Read more in the Help Center: Manual Recheck / To Review"
  },
  {
    slug: "inside-copy-detection",
    title: "Inside AEGIS Copy Detection: Catching Collusion with Trigrams and Semantic AI",
    category: "Academic Integrity",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "How AEGIS combines weighted n-gram shingles with Groq-hosted GPT-OSS 120B to expose subtle student collusion without flagging legitimate identical formulas.",
    date: "August 29, 2026",
    readTime: "5 min read",
    content: `
## The Changing Face of Academic Dishonesty

In paper-based examinations, student collusion rarely resembles copy-paste plagiarism. When two students share answers in an exam hall, they deliberately swap adjectives, reorder bullet points, or alter grammatical voice. 

Traditional exact-match string algorithms fail completely in this environment. If two physics students write definitions of Newton's Third Law, simple string comparison either misses rewritten plagiarism entirely or flags honest students who memorized the exact textbook phrasing.

We engineered AEGIS Copy Detection to address this nuance through a two-stage hybrid analysis pipeline.

## Stage 1: Mathematical Shingling with Trigrams

Before running expensive neural network comparisons across an entire class, AEGIS computes vector similarity locally using an n-gram tokenization pipeline.

Rather than looking solely at individual words (unigrams), our tokenizer creates overlapping shingles across three distinct granularities:
- **Unigrams (20% Weight):** Measures core subject vocabulary overlap.
- **Bigrams (30% Weight):** Captures two-word phrasing and technical terms.
- **Trigrams (50% Weight):** Captures sentence rhythm, syntax patterns, and phrase construction.

By assigning 50% of the mathematical weight to trigrams, the comparison prioritizes structural rhythm. If two students swap isolated adjectives but preserve identical sentence structures, their hybrid similarity score immediately crosses our candidate threshold.

## Stage 2: Semantic Verification via Groq GPT-OSS 120B

Candidate pairs that exhibit elevated mathematical similarity are passed to our semantic analysis model (\`openai/gpt-oss-120b\` running on Groq).

The model evaluates the pair against three strict academic criteria:
1. **Formulaic vs. Idiosyncratic Overlap:** Is the overlap simply the standard textbook answer, or does it contain identical unique phrasings, quirks, or calculation missteps?
2. **Shared Errors:** If both students commit the identical, idiosyncratic mathematical or conceptual error, the probability of independent creation approaches zero.
3. **Paraphrase Detection:** The model evaluates whether Answer B is an intentional rearrangement of Answer A designed to evade detection.

## The Educator's Cockpit: The Copied Tab

AEGIS does not penalize students autonomously. Flagged submissions appear side-by-side in the dedicated **Copied tab** of the exam dashboard.

Teachers can review the highlighted sentence matches, inspect the confidence score, and perform single-click bulk mark deductions or dismiss the alert if the overlap was coincidental. Complete authority remains in the hands of the instructor.
    `,
    ctaLink: "/#features",
    ctaText: "Explore Copy Detection Features"
  },
  {
    slug: "automating-exam-digitization",
    title: "From Paper to Portal: How Multimodal AI Automates Exam Digitization",
    category: "Multimodal Vision",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "Eliminating the setup barrier: how Google Gemini 3.1 Flash-Lite decomposes complex question papers while preserving sub-part hierarchies and grading formulas.",
    date: "August 30, 2026",
    readTime: "4 min read",
    content: `
## The Onboarding Bottleneck

Every grading system faces a common failure point: friction during setup. If a teacher has to spend 45 minutes manually copying questions, sub-parts, and marking rubrics from a printed exam paper into web form fields, they abandon the software before uploading their first student paper.

With AEGIS, setting up an exam takes 15 seconds: upload the question paper PDF or photo, and multimodal vision models handle the rest.

## Deconstructing the Hierarchy of an Exam

A real-world question paper is rarely a flat list of questions. Consider a standard chemistry or language exam:
- Section A contains compulsory short questions.
- Question 2 presents an overarching comprehension passage, followed by sub-parts \`(i)\`, \`(ii)\`, and \`(iii)\`.
- Question 3 offers an "OR" choice between two distinct analytical prompts.
- Questions specify arithmetic marking distributions such as \`(4 + 2 = 6 Marks)\`.

Flat OCR treats all of these as generic paragraphs. AEGIS uses Google Gemini 3.1 Flash-Lite with specialized system instructions to reconstruct the complete structural tree.

## Intelligent Type Inference & Arithmetic Preservation

During question extraction, AEGIS performs three simultaneous structural operations:
1. **Sub-part Nesting:** When \`Question 2\` contains parts \`(a)\` and \`(b)\`, AEGIS nests them inside the parent question object's \`sub_parts\` array rather than outputting duplicate top-level questions.
2. **Automatic Type Classification:** By analyzing the prompt phrasing and marks allotment, AEGIS automatically classifies questions into \`mcq\`, \`short\`, \`long\`, or \`blank\`.
3. **Marks Distribution Preservation:** Simple marks annotations like \`(05)\` are stripped to keep question text clean, while composite arithmetic indicators like \`(3+2=5)\` are preserved verbatim to communicate rubric criteria to the AI grader.

## Instant Rubric Drafting

Once questions are extracted, teachers can click **Generate Rubrics** to have Groq draft point-by-point criteria for every question. Teachers can review, tweak, and save—turning what was once an hour of manual typing into a streamlined verification workflow.
    `,
    ctaLink: "?modal=signup",
    ctaText: "Try Question Paper Extraction"
  },
  {
    slug: "20-key-failover-engine",
    title: "The 20-Key Failover Engine: Engineering Resilient AI for High-Volume Exam Sessions",
    category: "Infrastructure",
    author: { name: "AEGIS Team", initials: "✦" },
    excerpt: "Inside the multi-tier key pool that prevents HTTP 429 rate limits, guarantees zero grading variance, and achieves uninterrupted batch evaluation.",
    date: "August 31, 2026",
    readTime: "6 min read",
    content: `
## The Rate-Limit Reality in EdTech

Batch processing academic assessments presents unique infrastructure hurdles. During midterm or final exam weeks, an institution might upload 120 student answer sheets simultaneously. With each sheet spanning 4 to 8 pages, a single batch triggers hundreds of consecutive multimodal API requests within minutes.

Standard cloud AI endpoints enforce strict Tokens-Per-Minute (TPM) and Requests-Per-Minute (RPM) quotas. In an unmanaged architecture, the 15th student triggers an \`HTTP 429 Too Many Requests\` error, terminating the entire batch.

To ensure AEGIS remains resilient under peak institutional load, we built a three-tier failover and key-rotation engine in \`provider.js\`.

## Tier 1: Horizontal Key Pooling & 60-Second Cooldowns

AEGIS supports dynamic horizontal key pools of up to 20 API keys per provider (e.g., \`GEMINI_API_KEY_1\` through \`GEMINI_API_KEY_20\` and corresponding Groq pools).

When a batch processes:
- Requests rotate across available active keys to distribute load evenly.
- If a key returns an HTTP 429 or transient network failure, the key is immediately flagged with a 60-second cooldown.
- Cooldown timestamps are maintained in memory and synchronized to Supabase, ensuring rate-limit recovery states persist across serverless cold starts.
- Subsequent calls bypass resting keys automatically without interrupting the queue.

## Tier 2: Alternative Groq Model Fallbacks

If an entire primary model quota is saturated, AEGIS pivots non-grading tasks to secondary models within the same provider:
- Rubric drafting falls back from \`gpt-oss-120b\` to \`qwen/qwen3.6-27b\`.
- Topic recommendations fall back to \`qwen/qwen3-32b\`.

### Why Grading is Strictly Isolated from Fallback
We established a strict architectural rule: **Grading never falls back to an alternative model family.** 

If Student 1 is graded by \`gpt-oss-120b\` and Student 2 is graded by an alternative model, subtle prompt interpretation differences could introduce grading bias between classmates. If the primary grading pool is temporarily saturated, the system pauses and retries with backoff rather than compromising grading uniformity.

## Tier 3: Universal Backup Gemini Flash-Lite Pool

As an ultimate safeguard against upstream provider outages, AEGIS maintains an isolated \`GEMINI_BACKUP_KEY_*\` pool. If primary inference fails, the universal backup pool activates to guarantee that teacher evaluations never stall mid-session.
    `,
    ctaLink: "/docs/api",
    ctaText: "Read the Architecture API Docs"
  }
];
