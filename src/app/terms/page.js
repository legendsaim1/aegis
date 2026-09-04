"use client";

import Link from "next/link";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import DocsSidebar from "@/components/layout/DocsSidebar";

const navigation = [
  { id: "eligibility", title: "1. Eligibility and Accounts" },
  { id: "description", title: "2. Description of the Service" },
  { id: "acceptable-use", title: "3. Acceptable Use" },
  { id: "uploaded-content", title: "4. Uploaded Content and Student Data" },
  { id: "ai-processing", title: "5. Third-Party AI Processing" },
  { id: "intellectual-property", title: "6. Intellectual Property" },
  { id: "service-availability", title: "7. Service Availability and Changes" },
  { id: "disclaimers", title: "8. Disclaimers" },
  { id: "liability", title: "9. Limitation of Liability" },
  { id: "termination", title: "10. Termination" },
  { id: "changes", title: "11. Changes to These Terms" },
  { id: "contact", title: "12. Contact" },
  { id: "governing-law", title: "13. Governing Law" }
];

export default function TermsOfService() {
  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} isDocsPage={true} />
      
      <main className={styles.main}>
        <div className={styles.layout}>
          <div className={styles.sidebarWrapper}>
            <DocsSidebar navigation={navigation} />
          </div>
          
          <div className={styles.contentWrapper}>
            <div className={styles.contentInner}>
              <div className={styles.header}>
                <h1 className={styles.title}>Terms of Service</h1>
                <div className={styles.meta}>Last updated: September 3, 2026</div>
                <p className={styles.intro}>
                  Welcome to AEGIS. AEGIS is an AI-powered exam grading and insight platform that lets teachers upload handwritten answer sheets, receive automated OCR and grading, detect copied answers, and view performance analytics. These Terms of Service ("Terms") govern your access to and use of the AEGIS website, dashboard, and related services (collectively, the "Service").
                </p>
                <p className={styles.intro}>
                  By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
                </p>
              </div>

              <section id="eligibility" className={styles.section}>
                <h2><span className={styles.numberBadge}>1</span> Eligibility and Accounts</h2>
                <ul>
                  <li>The Service is intended for teachers, instructors, and institutions evaluating student exam work. You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account.</li>
                  <li>You register using email and password authentication. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</li>
                  <li>You agree to provide accurate information when creating your account and to keep your profile information (including your display name and profile picture) up to date.</li>
                  <li>You must notify us promptly if you become aware of any unauthorized use of your account.</li>
                </ul>
              </section>

              <section id="description" className={styles.section}>
                <h2><span className={styles.numberBadge}>2</span> Description of the Service</h2>
                <p>AEGIS allows registered teachers to:</p>
                <ul>
                  <li>Create exams and either upload a question paper or manually enter exam questions.</li>
                  <li>Upload scanned or photographed student answer sheets (PDF or image format) for a given exam.</li>
                  <li>Automatically extract handwritten answer text using AI-based OCR.</li>
                  <li>Automatically generate grading rubrics and grade extracted answers against those rubrics, receiving a score, confidence indicators, and constructive feedback for each answer.</li>
                  <li>Run copy-detection analysis to flag suspiciously similar answers across students.</li>
                  <li>View analytics such as score distributions, pass/fail rates, topic-level difficulty, and AI-generated teaching recommendations.</li>
                  <li>Manually review and override AI-assigned grades ("recheck"), and export results as XLSX/CSV.</li>
                </ul>
                <p>AEGIS relies on third-party AI providers (including Google Gemini and Groq) to perform OCR, rubric generation, grading, and copy-detection tasks. By using these features, you acknowledge that answer sheet content and derived text are transmitted to these providers for processing, as described in Section 5.</p>
              </section>

              <section id="acceptable-use" className={styles.section}>
                <h2><span className={styles.numberBadge}>3</span> Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                  <li>Upload content you do not have the right to upload, or that infringes the intellectual property, privacy, or other rights of any person.</li>
                  <li>Use the Service to process, store, or grade material unrelated to legitimate academic exam evaluation.</li>
                  <li>Attempt to circumvent, disable, or interfere with security-related features of the Service, including authentication and access controls.</li>
                  <li>Attempt to reverse-engineer, scrape, or extract the underlying models, prompts, or source code of the Service.</li>
                  <li>Use the Service in a way that violates any applicable law, regulation, or third-party right, including data protection and student-privacy laws applicable in your jurisdiction.</li>
                  <li>Share your account credentials with, or grant account access to, unauthorized individuals.</li>
                </ul>
                <p>We reserve the right to suspend or terminate accounts that violate this section.</p>
              </section>

              <section id="uploaded-content" className={styles.section}>
                <h2><span className={styles.numberBadge}>4</span> Uploaded Content and Student Data</h2>
                <ul>
                  <li><strong>Answer sheets and question papers.</strong> When you upload an answer sheet, question paper, or related exam material, you retain ownership of that content. You grant AEGIS a limited license to store, process, and display that content solely to provide the Service to you (OCR extraction, grading, analytics, export, etc.).</li>
                  <li><strong>Student information.</strong> Answer sheets and exam records may contain personally identifiable student information (such as names, roll numbers, or handwriting). You represent that you have the necessary authority and, where required, consent or institutional approval to upload and process this information through AEGIS.</li>
                  <li><strong>Responsibility for accuracy.</strong> AI-generated grades, OCR transcriptions, confidence scores, and copy-detection flags are provided as an advisory tool to assist you. They are not guaranteed to be error-free. All grading outputs must be reviewed and verified by the teacher before being treated as final or submitted for academic reporting.</li>
                  <li><strong>Storage.</strong> Uploaded files, extracted text, generated rubrics, grades, and profile images are stored using our database and file storage infrastructure (Supabase) for as long as your account remains active or as otherwise described in our Privacy Policy.</li>
                </ul>
              </section>

              <section id="ai-processing" className={styles.section}>
                <h2><span className={styles.numberBadge}>5</span> Third-Party AI Processing</h2>
                <p>To deliver OCR, rubric generation, grading, and copy-detection features, AEGIS transmits extracted answer text, and in some cases uploaded images, to third-party AI model providers (including Google Gemini and Groq-hosted models). These providers process the data solely to return the requested output (e.g., extracted text, grading results) and are subject to their own terms and data-handling practices. AEGIS is not responsible for the internal processing practices of these third-party providers beyond what is disclosed in our Privacy Policy.</p>
                <p>Because AEGIS routes requests across multiple API keys and, where necessary, fallback providers for reliability, processing of the same request may occasionally be handled by more than one provider.</p>
              </section>

              <section id="intellectual-property" className={styles.section}>
                <h2><span className={styles.numberBadge}>6</span> Intellectual Property</h2>
                <ul>
                  <li>The AEGIS name, logo, interface, and underlying software (excluding your uploaded content) are the property of AEGIS and its licensors. Nothing in these Terms grants you rights to our trademarks, branding, or source code beyond what is necessary to use the Service.</li>
                  <li>You retain all rights to the exam materials, answer sheets, and other content you upload, subject to the license granted in Section 4.</li>
                </ul>
              </section>

              <section id="service-availability" className={styles.section}>
                <h2><span className={styles.numberBadge}>7</span> Service Availability and Changes</h2>
                <p>AEGIS was developed for the Alibaba Cloud AI Hackathon Pakistan 2026 and is provided on an evolving, best-effort basis. We do not guarantee uninterrupted or error-free operation. As a project under active innovation, features may be updated, modified, or refreshed periodically.</p>
              </section>

              <section id="disclaimers" className={styles.section}>
                <h2><span className={styles.numberBadge}>8</span> Disclaimers</h2>
                <p>THE SERVICE, INCLUDING ALL AI-GENERATED OUTPUTS (OCR TEXT, RUBRICS, GRADES, CONFIDENCE SCORES, COPY-DETECTION FLAGS, AND RECOMMENDATIONS), IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR ACCURACY. AI GRADING ASSISTANCE IS ADVISORY IN NATURE; TEACHERS ARE SOLELY RESPONSIBLE FOR VERIFYING FINAL SCORES BEFORE OFFICIALLY RECORDING GRADES.</p>
              </section>

              <section id="liability" className={styles.section}>
                <h2><span className={styles.numberBadge}>9</span> Limitation of Liability</h2>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, AEGIS AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, GRADES, OR ACADEMIC RECORDS, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
              </section>

              <section id="termination" className={styles.section}>
                <h2><span className={styles.numberBadge}>10</span> Termination</h2>
                <p>You may stop using the Service and request deletion of your account at any time. We may suspend or terminate your access to the Service if you violate these Terms or if we discontinue the Service. Upon termination, your right to use the Service ceases, though certain provisions of these Terms (including Sections 6, 8, and 9) will survive.</p>
              </section>

              <section id="changes" className={styles.section}>
                <h2><span className={styles.numberBadge}>11</span> Changes to These Terms</h2>
                <p>We may update these Terms from time to time. Material changes will be reflected by updating the "Last updated" date above. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
              </section>

              <section id="contact" className={styles.section}>
                <h2><span className={styles.numberBadge}>12</span> Contact</h2>
                <p>Questions about these Terms can be sent to <strong>hackathonprojectdev@gmail.com</strong>.</p>
              </section>

              <section id="governing-law" className={styles.section}>
                <h2><span className={styles.numberBadge}>13</span> Governing Law</h2>
                <p>These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any dispute, claim, or controversy arising out of or relating to the Service or these Terms shall be submitted to the exclusive jurisdiction of the courts located in Lahore, Pakistan.</p>
              </section>

              <div className={styles.disclaimer}>
                <p>
                  <em>See also our <Link href="/privacy-policy">Privacy Policy</Link> and <Link href="#">Security</Link> pages for more detail on how data is collected, processed, and protected.</em>
                </p>
              </div>

              <div className={styles.closingCta}>
                <h3>Have questions about our terms?</h3>
                <p>Our support team is happy to clarify any details regarding your use of AEGIS.</p>
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
