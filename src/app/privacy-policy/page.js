"use client";

import Link from "next/link";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import DocsSidebar from "@/components/layout/DocsSidebar";

const navigation = [
  { id: "who-applies", title: "1. Who this policy applies to" },
  { id: "info-collected", title: "2. Information we collect" },
  { id: "how-we-use", title: "3. How we use your information" },
  { id: "who-we-share", title: "4. Who we share information with" },
  { id: "data-retention", title: "5. Data retention and deletion" },
  { id: "how-we-protect", title: "6. How we protect your information" },
  { id: "choices-rights", title: "7. Your choices and rights" },
  { id: "childrens-privacy", title: "8. Children's privacy" },
  { id: "ai-training", title: "9. AI Training & Data Isolation" },
  { id: "changes", title: "10. Changes to this policy" },
  { id: "contact", title: "11. Contact us" }
];

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      {/* Reusing PublicNavbar but passing isDocsPage to suppress marketing nav if you have that implemented */}
      <PublicNavbar isLandingPage={false} isDocsPage={true} />
      
      <main className={styles.main}>
        <div className={styles.layout}>
          <div className={styles.sidebarWrapper}>
            <DocsSidebar navigation={navigation} />
          </div>
          
          <div className={styles.contentWrapper}>
            <div className={styles.contentInner}>
            <div className={styles.header}>
              <h1 className={styles.title}>Privacy Policy</h1>
              <div className={styles.meta}>Last updated: September 3, 2026</div>
              <p className={styles.intro}>
                AEGIS is an AI-based exam grading and insight system built for teachers and educators. This Privacy Policy explains what information we collect through the AEGIS web application, how we use it, who we share it with, and the choices available to you.
              </p>
              <p className={styles.intro}>
                By creating an account or otherwise using AEGIS, you agree to the practices described in this policy.
              </p>
            </div>

            <section id="who-applies" className={styles.section}>
              <h2><span className={styles.numberBadge}>1</span> Who this policy applies to</h2>
              <p>
                AEGIS is a tool for <strong>teachers and educators</strong> ("Teacher," "you"). Your students are not AEGIS users and do not create accounts, log in, or interact with AEGIS directly. Any information about your students — their names, roll numbers, and answer sheets — is provided to AEGIS <em>by you</em>, as the teacher, for the purpose of grading and analyzing their exams.
              </p>
              <p>
                Because student answer sheets may belong to minors, it is your responsibility to ensure you have the appropriate authorization from your school, institution, or applicable policy to upload student work to a third-party tool like AEGIS. AEGIS does not independently verify this authorization.
              </p>
            </section>

            <section id="info-collected" className={styles.section}>
              <h2><span className={styles.numberBadge}>2</span> Information we collect</h2>
              
              <h3>2.1 Account information (Teachers)</h3>
              <p>When you sign up, we collect:</p>
              <ul>
                <li>Your <strong>email address</strong> (via Supabase Authentication, used for login)</li>
                <li>Your <strong>full name</strong></li>
                <li>Your <strong>school/institution name</strong></li>
                <li>An optional <strong>profile picture</strong> you choose to upload</li>
              </ul>
              <p>Your password is managed entirely by our authentication provider (Supabase Auth) using industry-standard hashing; AEGIS itself never sees or stores your plaintext password.</p>

              <h3>2.2 Exam content you create</h3>
              <ul>
                <li>Exam titles, subjects, class/grade labels, grading instructions, and passing-percentage thresholds</li>
                <li>Questions, question types, maximum marks, and rubrics (including rubrics you write yourself or generate with AI assistance)</li>
              </ul>

              <h3>2.3 Student information you upload</h3>
              <p>For each student you add to an exam, we store:</p>
              <ul>
                <li><strong>Student name</strong> and <strong>roll number</strong>, as you enter them</li>
                <li>The <strong>answer sheet file</strong> itself (PDF, JPG, PNG, or WebP) — up to 20 MB per file</li>
                <li><strong>Text extracted from the answer sheet</strong> by our AI OCR process (i.e., a transcription of what the student wrote)</li>
                <li>The <strong>marks, AI-generated feedback, and confidence scores</strong> produced by grading</li>
                <li>Any <strong>manual corrections or notes</strong> you make when reviewing a grade</li>
              </ul>

              <h3>2.4 Information generated by using AEGIS</h3>
              <ul>
                <li>Grading results, analytics (score distributions, pass/fail rates, per-question difficulty, AI topic recommendations)</li>
                <li>Copy-detection flags and similarity scores between students' answers, if you enable that feature</li>
                <li>In-app notifications (e.g., "Batch Grading Complete") and your activity log within the dashboard</li>
              </ul>

              <h3>2.5 Technical / session data</h3>
              <ul>
                <li>A <strong>session cookie</strong> issued by our authentication provider so you stay logged in. This is strictly functional — AEGIS does not use advertising cookies, third-party analytics trackers, or cross-site tracking of any kind.</li>
              </ul>
              <p>We do not collect payment or billing information, as AEGIS does not currently process payments.</p>
            </section>

            <section id="how-we-use" className={styles.section}>
              <h2><span className={styles.numberBadge}>3</span> How we use your information</h2>
              <p>We use the information above solely to operate and improve AEGIS, specifically to:</p>
              <ul>
                <li>Authenticate you and secure your account</li>
                <li>Run the AI grading pipeline: extracting text from answer sheets, grading it against your rubric, and calculating confidence scores</li>
                <li>Generate rubrics and topic recommendations when you request AI assistance</li>
                <li>Detect and flag potentially copied answers, if you enable copy detection for an exam</li>
                <li>Display your exams, results, and analytics back to you in the dashboard</li>
                <li>Generate exports (e.g., XLSX result sheets) when you request them</li>
                <li>Notify you of processing status and results within the app</li>
                <li>Maintain the security and integrity of the platform (e.g., verifying you only ever access your own exams and students)</li>
              </ul>
              <p>We do not use your data, or your students' data, to train our own AI models, and we do not sell personal information to anyone.</p>
            </section>

            <section id="who-we-share" className={styles.section}>
              <h2><span className={styles.numberBadge}>4</span> Who we share information with</h2>
              <p>We share data with the following categories of service providers, only as needed to operate AEGIS:</p>
              
              <h3>4.1 AI processing providers</h3>
              <p>To grade exams, AEGIS sends relevant content to third-party AI providers:</p>
              <ul>
                <li><strong>Google (Gemini API)</strong> — receives answer sheet images/PDFs and question paper images for OCR (handwriting-to-text extraction).</li>
                <li><strong>Groq</strong> — receives extracted answer text, question text, and rubrics to perform grading, rubric generation, copy-detection comparisons, and topic-recommendation analysis.</li>
              </ul>
              <p>These providers process this content to return a result to AEGIS (e.g., a grade or extracted text) and are bound by their own respective terms and privacy commitments as AI infrastructure providers. AEGIS does not control, and is not responsible for, these providers' independent data-handling practices beyond the request/response needed to deliver the feature.</p>

              <h3>4.2 Infrastructure providers</h3>
              <ul>
                <li><strong>Supabase</strong> — provides our database, file storage, and authentication. All account data, exam data, student data, and uploaded files are stored in Supabase infrastructure.</li>
                <li><strong>Vercel</strong> — hosts the AEGIS web application itself.</li>
              </ul>

              <h3>4.3 Legal requirements</h3>
              <p>We may disclose information if required to do so by law, or if we believe in good faith that disclosure is necessary to comply with a legal obligation, protect the rights or safety of AEGIS, our users, or others.</p>
              <p>We do not otherwise share, rent, or sell your information, or your students' information, to advertisers, data brokers, or any other third party.</p>
            </section>

            <section id="data-retention" className={styles.section}>
              <h2><span className={styles.numberBadge}>5</span> Data retention and deletion</h2>
              <p>Your exam data, student records, and files remain in AEGIS for as long as your account is active, or until you delete them.</p>
              <p>When you delete an exam, AEGIS permanently removes, in order: all student answers, any recheck/review records, the students themselves, the exam's questions, and finally the exam. This action cannot be undone, so please make sure you've exported anything you want to keep first.</p>
              <p>You may delete individual students (and their uploaded answer sheets and grades) from within an exam at any time.</p>
              <p>If you'd like your account and all associated data fully deleted, contact us using the details in Section 11 below.</p>
            </section>

            <section id="how-we-protect" className={styles.section}>
              <h2><span className={styles.numberBadge}>6</span> How we protect your information</h2>
              <p>We take the following measures to protect data within AEGIS:</p>
              <ul>
                <li><strong>Session-based authentication</strong> — every request to our backend is verified against your logged-in session; there are no public API keys or long-lived third-party tokens that could be leaked or reused.</li>
                <li><strong>Environment isolation</strong> — all AI provider API keys, database credentials, and signing secrets are managed solely within secure server-side environment variables and are never transmitted to client browsers.</li>
                <li><strong>Per-request ownership checks</strong> — every time you (or the app on your behalf) request exam, student, or answer data, our backend independently re-verifies that the record belongs to your account before returning or modifying it.</li>
                <li><strong>Upload validation</strong> — answer sheets and profile pictures are strictly validated for MIME type and file size before being accepted to reduce the risk of malicious payloads.</li>
              </ul>
              <p><strong>Please also be aware of the following limitation, in the interest of transparency:</strong> uploaded answer sheets are stored at unique, unlisted file addresses rather than behind a per-file access check, meaning that anyone who obtained the exact file address could potentially view that file directly. We recommend you do not share answer-sheet links outside of the AEGIS dashboard. We are continuing to strengthen file-level access controls, and this policy will be updated as that work progresses.</p>
              <p>No method of electronic storage or transmission is 100% secure, and while we work to protect your information, we cannot guarantee absolute security.</p>
            </section>

            <section id="choices-rights" className={styles.section}>
              <h2><span className={styles.numberBadge}>7</span> Your choices and rights</h2>
              <p>Depending on your location, you may have rights to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate information (you can update your name and profile picture directly in Settings)</li>
                <li>Request deletion of your account and associated data</li>
                <li>Object to or restrict certain processing of your information</li>
              </ul>
              <p>To exercise any of these rights, contact us using the details below. We will respond to verified requests within a reasonable timeframe.</p>
            </section>

            <section id="childrens-privacy" className={styles.section}>
              <h2><span className={styles.numberBadge}>8</span> Children's privacy</h2>
              <p>AEGIS accounts are intended for teachers and educators, not for use directly by children. While student answer sheets (which may belong to minors) are uploaded to the platform by teachers for grading purposes, AEGIS does not knowingly collect personal information directly from children, and does not allow students to create their own accounts. If you upload answer sheets belonging to minors, you represent and warrant that you have appropriate institutional authorization and parental consent where required by law (such as FERPA, COPPA, or equivalent regional regulations) to process their academic work.</p>
            </section>

            <section id="ai-training" className={styles.section}>
              <h2><span className={styles.numberBadge}>9</span> AI Model Training &amp; Data Isolation</h2>
              <p>
                We do not use student answer sheets, teacher rubrics, or any user-generated content to train or fine-tune foundational AI models. All evaluation and OCR calls sent to third-party providers (Google Gemini, Groq) are conducted under zero-data-retention inference agreements where submitted student data is strictly processed to return the instantaneous evaluation response and is not retained for model retraining.
              </p>
            </section>

            <section id="changes" className={styles.section}>
              <h2><span className={styles.numberBadge}>10</span> Changes to this policy</h2>
              <p>We may update this Privacy Policy from time to time as AEGIS evolves. If we make material changes, we will update the "Last updated" date above. Continued use of AEGIS after changes take effect constitutes acceptance of the revised policy.</p>
            </section>

            <section id="contact" className={styles.section}>
              <h2><span className={styles.numberBadge}>11</span> Contact us</h2>
              <p>If you have questions about this Privacy Policy, or want to exercise any of your data rights, please reach out through the contact option in our <Link href="/help">Help Center</Link> or email us directly at <strong>hackathonprojectdev@gmail.com</strong>.</p>
            </section>

            <div className={styles.disclaimer}>
              <p>
                <em>This policy describes AEGIS's practices as of the date above and reflects an early-stage product under active development. It is not a substitute for legal advice, and we encourage you to consult your own institution's data-protection policies when deciding what student information to upload.</em>
              </p>
            </div>

            <div className={styles.closingCta}>
              <h3>Still have questions?</h3>
              <p>Our support team is here to help you understand how we protect your data.</p>
              <Link href="/help" className={styles.closingCtaLink}>Visit Help Center</Link>
            </div>
            
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
