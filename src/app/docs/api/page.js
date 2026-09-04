"use client";

import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import DocsSidebar from "@/components/layout/DocsSidebar";
import ApiSection from "@/components/api-docs/ApiSection";
import { ApiDocsFilterProvider } from "@/components/api-docs/ApiDocsFilterContext";
import ApiFilterToolbar from "@/components/api-docs/ApiFilterToolbar";

const navigation = [
  { 
    group: "Overview", 
    items: [
      { id: "overview", title: "Overview & Conventions" },
      { id: "auth", title: "Auth" }
    ]
  },
  {
    group: "Core Resources",
    items: [
      { id: "exams", title: "Exams" },
      { id: "questions", title: "Questions" },
      { id: "upload", title: "Answer Sheet Upload & Students" }
    ]
  },
  {
    group: "Architecture",
    items: [
      { id: "ai-grading", title: "AI Grading Pipeline" },
      { id: "ai-architecture", title: "AI Provider Architecture" },
      { id: "copy-detection", title: "Copy Detection" }
    ]
  },
  {
    group: "Operations & Views",
    items: [
      { id: "results", title: "Results Matrix" },
      { id: "review", title: "Manual Review & Recheck" },
      { id: "analytics", title: "Analytics" },
      { id: "export", title: "Export" },
      { id: "notifications", title: "Notifications" },
      { id: "profile", title: "Profile" },
      { id: "dashboard", title: "Dashboard & Global Views" }
    ]
  }
];

export default function ApiDocs() {
  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} isDocsPage={true} />
      
      <main className={styles.main}>
        <div className={styles.layout}>
          <div className={styles.sidebarWrapper}>
            <DocsSidebar navigation={navigation} />
          </div>
          
          <ApiDocsFilterProvider>
            <div className={styles.contentWrapper}>
              <div className={styles.header}>
                <h1 className={styles.title}>API Documentation</h1>
                <p className={styles.subtitle}>
                  An internal architecture and endpoints reference for how the AEGIS frontend communicates with its backend API routes and AI providers. Designed for internal authenticated browser sessions and developers extending AEGIS.
                </p>
              </div>

              <ApiFilterToolbar />

              {/* 1. Overview & Conventions */}
            <ApiSection id="overview" title="Overview & Conventions">
              <p><strong>Base path:</strong> All routes live under <code>/api/*</code> in the Next.js App Router (<code>src/app/api/**/route.js</code>).</p>
              <p><strong>Authentication:</strong> Every route (except the auth bootstrap) calls <code>getAuthenticatedUser()</code> and returns <code>401 &#123; error: "Unauthorized" &#125;</code> if there's no session. There is no API-key mechanism.</p>
              <p><strong>Ownership Checks:</strong> Almost every exam-scoped route re-verifies <code>teacher_id = user.id</code> on the exams table before touching child data to ensure strict tenant isolation.</p>
              <p><strong>Errors:</strong> Consistently returned as <code>Response.json(&#123; error: "..." &#125;, &#123; status: N &#125;)</code>.</p>
              <ul>
                <li><code>400</code>: Bad/missing input</li>
                <li><code>401</code>: No session</li>
                <li><code>403</code>: Session exists but doesn't own the resource</li>
                <li><code>404</code>: Not found / not owned</li>
                <li><code>409</code>: Conflict (e.g., already processing)</li>
                <li><code>413</code>: Payload too large</li>
                <li><code>415</code>: Bad file type</li>
                <li><code>422</code>: Business-rule failure (e.g., grading needs review)</li>
                <li><code>500</code>: Server/database error</li>
                <li><code>502</code>: AI returned bad data</li>
              </ul>
              <p><strong>Timeouts:</strong> Several routes declare Vercel's <code>maxDuration</code> (up to 300s) because they call slow AI models synchronously. These are long-running, blocking requests.</p>
            </ApiSection>

            {/* 2. Auth */}
            <ApiSection id="auth" title="Auth" />
            <ApiSection 
              method="POST" 
              path="/api/auth/[...supabase]" 
              description="Creates the teachers table row right after Supabase Auth signup succeeds (actual login/signup is handled client-side). No auth required; this is the bootstrap step."
              codeBlocks={[
                { title: "Request Body", language: "json", code: "{\n  \"id\": \"uuid\",\n  \"email\": \"user@example.com\",\n  \"full_name\": \"Jane Doe\",\n  \"school_name\": \"Springfield High\"\n}" }
              ]}
            />

            {/* 3. Exams */}
            <ApiSection id="exams" title="Exams" />
            <ApiSection method="GET" path="/api/exams" description="List all exams owned by the logged-in teacher, newest first." />
            <ApiSection 
              method="POST" 
              path="/api/exams" 
              description="Create a new exam. The server forces status='draft' and teacher_id=caller."
              codeBlocks={[
                { title: "Request Body", language: "json", code: "{\n  \"title\": \"Midterm\",\n  \"subject\": \"Physics\",\n  \"class_grade\": \"10th\",\n  \"total_marks\": 100,\n  \"instructions\": \"No calculators\",\n  \"passing_percentage\": 50\n}" }
              ]}
            />
            <ApiSection method="GET" path="/api/exams/{examId}" description="Fetch one exam plus its nested questions(*). Returns 404 if not found or not owned." />
            <ApiSection method="PUT" path="/api/exams/{examId}" description="Update an exam. Strips teacher_id from the body so ownership can't be reassigned." />
            <ApiSection method="DELETE" path="/api/exams/{examId}" description="Cascading delete: removes answers → recheck_requests → students → questions → exam, scoped to teacher_id." />

            {/* 4. Questions */}
            <ApiSection id="questions" title="Questions" />
            <ApiSection method="GET" path="/api/questions?examId=" description="List questions for an exam, ordered by question_number then sub_part." />
            <ApiSection 
              method="POST" 
              path="/api/questions" 
              description="Create a question. Validates question_type (mcq | short | long | blank), positive question_number, and max_marks."
              codeBlocks={[
                { title: "Request Body", language: "json", code: "{\n  \"examId\": \"uuid\",\n  \"question_number\": 1,\n  \"question_text\": \"What is velocity?\",\n  \"question_type\": \"short\",\n  \"max_marks\": 5\n}" }
              ]}
            />
            <ApiSection method="PUT" path="/api/questions?id=" description="Partial update applying only whitelisted fields." />
            <ApiSection method="DELETE" path="/api/questions?id=&examId=" description="Deletes a question. Requires both id and examId (used for ownership verification)." />
            <ApiSection 
              method="POST" 
              path="/api/questions/generate-rubrics" 
              description="AI-assisted rubric drafting. Does not save anything; frontend must persist via PUT /api/questions."
              codeBlocks={[
                { title: "Request Body", language: "json", code: "{\n  \"questionText\": \"What is velocity?\",\n  \"questionType\": \"short\",\n  \"maxMarks\": 5\n}" },
                { title: "Response", language: "json", code: "{\n  \"success\": true,\n  \"rubric\": \"{...JSON string...}\"\n}" }
              ]}
            />
            <ApiSection method="POST" path="/api/questions/extract" description="AI OCR for an uploaded question paper file (multipart form with 'file'). Returns extracted questions array." />

            {/* 5. Upload & Students */}
            <ApiSection id="upload" title="Answer Sheet Upload & Students" />
            <ApiSection method="POST" path="/api/upload" description="Upload one student's answer sheet. Multipart form: examId, student_name, roll_number, file. Validates size (≤ 20MB) and type. Inserts a student row with status='pending'." />
            <ApiSection method="GET" path="/api/upload?examId=" description="List all students (answer sheets) for an exam, ordered by roll number." />
            <ApiSection method="DELETE" path="/api/upload?studentId=&examId=" description="Deletes a student and their answers." />
            <ApiSection method="PATCH" path="/api/upload" description="Corrects a student's name/roll after upload." />
            <ApiSection method="PATCH" path="/api/students/{studentId}" description="Manually overwrite a student's total score. Sets status='manually_graded' and clears overall_grade_confidence." />
            <ApiSection method="PATCH" path="/api/answers/{answerId}" description="Overwrite a single answer's marks. Performs the strictest ownership check (joins answers → students → exams). Recalculates total_obtained_marks." />

            {/* 6. AI Grading Pipeline */}
            <ApiSection id="ai-grading" title="AI Grading Pipeline" />
            <ApiSection 
              method="POST" 
              path="/api/process" 
              description="Runs the full synchronous AI grading pipeline for one student (OCR + grading). Atomically flips student status to 'processing' to prevent double-processing."
              codeBlocks={[
                { title: "Responses", language: "json", code: "// Clean grade\n{ \"success\": true, \"reviewRequired\": false, \"message\": \"Grading complete\", \"data\": {...} }\n\n// Needs Review\n{ \"success\": false, \"reviewRequired\": true, \"message\": \"...\", \"data\": {...} }\n\n// 409 Conflict if already processing\n// 500 if pipeline throws (status reverts to 'error')" }
              ]}
            />
            <ApiSection method="GET" path="/api/process/status?examId=" description="Poll grading progress for an exam. Returns counts per status bucket and a progressPercent." />
            <ApiSection method="POST" path="/api/extract" description="AI OCR specifically for a student's answer sheet against an exam's question list. Runs extraction but does not grade or persist to DB." />

            {/* 7. AI Provider Architecture */}
            <ApiSection id="ai-architecture" title="AI Provider Architecture">
              <p>The routing and pooling logic in <code>provider.js</code> determines which models handle specific tasks:</p>
              <ul>
                <li><strong>OCR (Answer Sheets):</strong> Gemini (<code>gemini-3.1-flash-lite</code>)</li>
                <li><strong>Question Paper Extraction:</strong> Gemini (<code>gemini-3.1-flash-lite</code>)</li>
                <li><strong>Grading:</strong> Groq (<code>openai/gpt-oss-120b</code>) — intentionally isolated from fallback to prevent inter-student grading variance</li>
                <li><strong>Rubric Generation:</strong> Groq (<code>openai/gpt-oss-120b</code>, Tier-2 fallback: <code>qwen/qwen3.6-27b</code>)</li>
                <li><strong>Copy Detection:</strong> Groq (<code>openai/gpt-oss-120b</code>, Tier-2 fallback: <code>qwen/qwen3.6-27b</code>)</li>
                <li><strong>Topic Recommendations:</strong> Groq (<code>openai/gpt-oss-120b</code>, Tier-2 fallback: <code>qwen/qwen3-32b</code>)</li>
                <li><strong>Analytics:</strong> Groq (<code>qwen/qwen3-32b</code>)</li>
                <li><strong>Universal Backup Pool:</strong> Gemini (<code>gemini-3.1-flash-lite</code> via <code>GEMINI_BACKUP_KEY_*</code>) as Tier-3 failover for all tasks</li>
              </ul>
              <p><strong>Key Pooling &amp; Cooldowns:</strong> The system supports up to 20 keys per pool (e.g., <code>GEMINI_API_KEY_1</code> to <code>_20</code> and Groq key pools). Keys returning rate-limit status (429) are placed on an automated 60-second cooldown in memory and synced to Supabase to persist across serverless cold starts.</p>
              <p><strong>Failover Cascade:</strong></p>
              <ol>
                <li><strong>Tier 1:</strong> Primary provider and task model, retried across all available active keys.</li>
                <li><strong>Tier 2:</strong> Groq alternative model pool (e.g., <code>qwen/qwen3.6-27b</code>, <code>qwen/qwen3-32b</code>) for specific tasks when RPM/TPM is saturated (grading strictly excluded).</li>
                <li><strong>Tier 3:</strong> Universal backup Gemini pool using flash-lite for all tasks as a final safeguard.</li>
              </ol>
              <p><strong>Concurrency:</strong> Grading scales concurrently up to the number of configured active Groq keys via <code>p-limit(activeKeys)</code>.</p>
            </ApiSection>

            {/* 8. Results Matrix */}
            <ApiSection id="results" title="Results Matrix" />
            <ApiSection method="GET" path="/api/results/{examId}" description="Returns the complete per-student grading matrix for an exam, including individual question scores, confidence levels, pass/fail status, and computed review/copy flags." />
            <ApiSection method="GET" path="/api/results/global" description="Every exam owned by the teacher annotated with aggregate student counts, average scores, and pass/fail distributions. Powers the global Results dashboard." />

            {/* 9. Manual Review & Recheck */}
            <ApiSection id="review" title="Manual Review & Recheck" />
            <ApiSection method="GET" path="/api/manual-recheck/{examId}" description="Dedicated endpoint returning student answers flagged for manual review with joined student details and question max marks." />
            <ApiSection method="PATCH" path="/api/manual-recheck/{examId}" description="Update an individual answer's marks during manual recheck. Recomputes student total marks, clears needs_review flag, and records an audit reason." />
            <ApiSection method="GET" path="/api/recheck/{examId}" description="Returns all answers flagged needs_review=true for an exam, reshaped for the legacy Recheck tab UI." />
            <ApiSection method="POST" path="/api/recheck/{examId}" description="Override a flagged grade. Updates marks, clears needs_review, sets flag_reason, and recalculates total." />
            <ApiSection method="PATCH" path="/api/recheck/{examId}" description="Accept the AI's grade as-is. Clears needs_review and sets flag_reason: 'AI grade accepted by teacher'." />
            <ApiSection method="GET" path="/api/review/global?limit=&offset=" description="Paginated review flags across all exams. Backs the dashboard 'To Review' page." />

            {/* 10. Copy Detection */}
            <ApiSection id="copy-detection" title="Copy Detection" />
            <ApiSection method="POST" path="/api/copy-detect" description="Triggers full-class copy-detection scan. Runs hybrid TF-IDF + AI comparison synchronously (maxDuration: 300)." />
            <ApiSection method="GET" path="/api/copied/{examId}" description="Fetch confirmed copy flags reshaped for the Copied tab UI side-by-side view." />
            <ApiSection method="PATCH" path="/api/copied/{examId}" description="Bulk-adjust marks for flagged answers. Recalculates total_obtained_marks for affected students." />
            <ApiSection method="DELETE" path="/api/copied/{examId}" description="Dismiss/resolve a flag by deleting the copy_flags row without touching marks." />

            {/* 11. Analytics */}
            <ApiSection id="analytics" title="Analytics" />
            <ApiSection method="GET" path="/api/analytics/{examId}" description="Main analytics payload. Combines Postgres RPC for fast aggregates with Node-computed live stats. Accepts ?include=recommendations and ?forceRegenerate=true." />
            <ApiSection method="POST" path="/api/analytics/{examId}" description="Explicitly (re)generate and cache AI topic recommendations." />

            {/* 12. Export */}
            <ApiSection id="export" title="Export" />
            <ApiSection method="GET" path="/api/export/{examId}" description="Generates and streams an Excel (XLSX) workbook containing exam results, question breakdowns, student grades, and copy detection flags formatted for administrative records." />

            {/* 13. Notifications */}
            <ApiSection id="notifications" title="Notifications" />
            <ApiSection method="GET" path="/api/notifications?limit=&offset=" description="Paginated list of the teacher's notifications, newest first." />
            <ApiSection method="POST" path="/api/notifications" description="Create a notification. Triggered by frontend events (exam created, upload complete, batch graded)." />
            <ApiSection method="PUT" path="/api/notifications" description="Mark notifications as read via array of IDs or { markAll: true }." />

            {/* 14. Profile */}
            <ApiSection id="profile" title="Profile" />
            <ApiSection method="GET" path="/api/profile" description="Returns caller's profile. Email comes from the auth session, not the editable table." />
            <ApiSection method="PATCH" path="/api/profile" description="Update display name only (max 120 chars). Email changes are deliberately unsupported." />
            <ApiSection method="POST" path="/api/profile/avatar" description="Upload a profile picture. Multipart form: PNG/JPEG/WebP/GIF, ≤ 3MB. Saves to avatars/{userId}/." />

            {/* 15. Dashboard */}
            <ApiSection id="dashboard" title="Dashboard & Global Views" />
            <ApiSection method="GET" path="/api/dashboard" description="Powers the Home page summary cards: totalExams, gradedPapers, aiConfidenceScore, pendingReview, and recent exams." />

            </div>
          </ApiDocsFilterProvider>
        </div>
      </main>

      <Footer />
    </div>
  );
}
