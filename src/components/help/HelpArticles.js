import styles from './HelpArticles.module.css';

const helpContent = [
  {
    id: "getting-started",
    category: "Getting Started",
    articles: [
      {
        question: "What is AEGIS?",
        answer: "AEGIS lets a teacher upload student answer sheets (photo or PDF), have AI OCR the handwriting and grade each answer against a rubric, then review flagged/low-confidence answers and export final results."
      },
      {
        question: "Creating your account",
        answer: "You can sign up for an account using your email and a password on the Sign Up page. Currently, Single Sign-On (SSO) is not supported, so please ensure you use an email you have regular access to."
      },
      {
        question: "Your first exam, in 4 steps",
        answer: "1. Create Exam (title, subject, class/grade, passing %)\n2. Add Questions & Rubrics\n3. Upload Answer Sheets\n4. Let AEGIS grade, then review results."
      },
      {
        question: "Understanding the dashboard",
        answer: "The sidebar contains several sections:\n• Home: Your overview and quick actions.\n• Exams: All exams you have created.\n• Results: Aggregated results view across exams.\n• To Review: Answers flagged with low-confidence across all exams.\n• Activity: A log of your recent actions.\n• Settings: Profile and account preferences."
      }
    ]
  },
  {
    id: "creating-exams",
    category: "Creating & Configuring Exams",
    articles: [
      {
        question: "Creating a new exam",
        answer: "When creating a new exam, you will fill out the Subject, Exam Title, Class/Grade, and Passing Percentage. You can also provide optional 'Instructions & Rubric Context' (e.g., 'Deduct 1 mark for missing units. Be strict on spelling.') which the AI uses when grading the entire exam."
      },
      {
        question: "Adding questions and sub-parts",
        answer: "Questions can have nested sub-parts (e.g. Q1a, Q1b). Each sub-part has its own marks and rubric, which is extremely useful for multi-part questions."
      },
      {
        question: "Writing a good rubric (and generating one with AI)",
        answer: "You can write your own rubric or use the 'Generate Rubric with AI' button available per question. It drafts an expected answer from the question text, which you can then edit. We highly recommend reviewing AI-generated rubrics before uploading answer sheets, since grading quality depends directly on rubric clarity."
      },
      {
        question: "Setting the passing percentage",
        answer: "The passing percentage is used to compute pass/fail analytics. This can be changed after creation, but note that it won't retroactively recolor already-graded charts until recalculated."
      }
    ]
  },
  {
    id: "uploading",
    category: "Uploading Answer Sheets",
    articles: [
      {
        question: "Supported file types",
        answer: "AEGIS accepts image files and PDFs per student. You can upload multiple files at once via drag-and-drop or the file picker. Please note there is a 20 MB size limit per file, so be sure to compress oversized scans or photos before uploading."
      },
      {
        question: "Matching sheets to students",
        answer: "After adding files to the upload queue, you enter each student's Name and Roll No. so results can be attributed correctly. You can use the search box in the queue ('Search by name or roll no...') to easily find specific students once sheets pile up."
      },
      {
        question: "Tips for better OCR accuracy",
        answer: "For the best AI reading accuracy:\n• Use even lighting and avoid shadows across the page.\n• Take straight-on photos rather than angled ones.\n• Upload one student's sheet per file where possible.\n• Ensure legible handwriting — AEGIS will flag illegible answers for manual review rather than guessing."
      }
    ]
  },
  {
    id: "how-ai-works",
    category: "How AI Grading Works",
    articles: [
      {
        question: "What happens after you click Process",
        answer: "1. Each uploaded sheet is read by AI (OCR) to extract the written answers.\n2. Each answer is compared against the rubric you wrote (or generated) for that question.\n3. AEGIS produces a mark plus two confidence scores: one for how clearly it could read the handwriting, and one for how confident it is in the grade it gave.\n4. Answers with low combined confidence are automatically sent to 'To Review' instead of being finalized silently."
      },
      {
        question: "What are confidence scores?",
        answer: "There are two scores: Reading confidence (could the AI read the handwriting clearly?) and Grading confidence (how sure is the AI about the mark it gave?). Grading confidence counts for more than reading confidence in the overall score. Low overall confidence is why an answer lands in 'To Review' for your manual check."
      },
      {
        question: "Why is processing sometimes slow / does it time out?",
        answer: "Answer sheets are processed one student at a time rather than in one big batch, partly to work around AI provider time limits. Because of this, large classes take proportionally longer to grade. Please know that grading is not instantaneous for a full class set."
      },
      {
        question: "Checking processing status",
        answer: "There's a status indicator while grading runs. Please refresh or wait rather than re-uploading if it seems slow."
      }
    ]
  },
  {
    id: "reviewing",
    category: "Reviewing & Rechecking Results",
    articles: [
      {
        question: "The 'To Review' queue",
        answer: "Answers AEGIS wasn't confident about appear here across all exams, with the flag reason shown (e.g. unclear handwriting vs. ambiguous answer). You can read the original sheet and the AI's reasoning, then confirm or correct the mark."
      },
      {
        question: "Manual recheck: overriding a grade",
        answer: "Any answer (not just flagged ones) can be manually rechecked. The Manual Recheck tab lets a teacher select a student and adjust marks directly, and the override is recorded by the system."
      },
      {
        question: "Per-question review inside an exam",
        answer: "There is an exam-level 'Review' tab (for rechecking within one specific exam) and a global 'To Review' page (across all exams). These are two different entry points to similar functionality, so choose the one that fits your workflow."
      }
    ]
  },
  {
    id: "copy-detection",
    category: "Copy / Plagiarism Detection",
    articles: [
      {
        question: "Turning on copy detection",
        answer: "Copy detection is opt-in, not automatic. On the Upload page, check the 'Copy Detection' box next to the 'Start Grading AI' button. AEGIS will run a full-class copy scan right after grading finishes (this adds some time to the overall run). If left unchecked, no copy scan runs and the Copied tab will stay empty."
      },
      {
        question: "How copy detection works",
        answer: "Once triggered, AEGIS compares every pair of students' answers to the same question. It first runs a fast text-similarity check, then does a closer AI comparison on likely matches. Finally, it flags pairs whose answers are suspiciously similar."
      },
      {
        question: "Reviewing a copy flag",
        answer: "On the exam's Copied tab, each flag shows a similarity score and both students' answer sheets side-by-side. This allows you to judge in context and adjust marks right there if necessary."
      },
      {
        question: "False positives — what to do",
        answer: "Similar answers aren't always copying (e.g., short factual answers or shared formulas). We encourage teachers to always open both sheets before acting on a flag rather than trusting the similarity score alone."
      }
    ]
  },
  {
    id: "analytics",
    category: "Results, Analytics & Export",
    articles: [
      {
        question: "Viewing exam results",
        answer: "The per-exam Results tab displays individual student scores and pass/fail status against the passing percentage set at exam creation."
      },
      {
        question: "Understanding the analytics tab",
        answer: "The analytics tab contains charts showing the score distribution, pass/fail breakdown, which questions/topics students struggled with most, and AI-generated topic recommendations outlining what to re-teach based on class performance."
      },
      {
        question: "Exporting results",
        answer: "Results can be seamlessly exported as XLSX or CSV files for integration into your gradebooks or administrative records."
      },
      {
        question: "Global Results & Review pages",
        answer: "The dashboard-level Results and Review pages aggregate data across all of your exams, giving you a high-level overview, versus the detailed per-exam tabs."
      }
    ]
  },
  {
    id: "account",
    category: "Account & Settings",
    articles: [
      {
        question: "Updating your profile",
        answer: "Your name and profile information are editable under Settings → Profile Information. Profile picture uploads are also supported."
      },
      {
        question: "Changing your password",
        answer: "You can update your password securely by navigating to Settings → Change Password."
      },
      {
        question: "Notifications",
        answer: "In-app notifications are triggered by important events, such as when a processing run finishes or when items are flagged and need your review."
      }
    ]
  },
  {
    id: "troubleshooting",
    category: "Troubleshooting",
    articles: [
      {
        question: "My upload isn't processing",
        answer: "Check that your file type is supported (image or PDF only), that it doesn't exceed the 20 MB size limit, and that the student name and roll number were entered before starting processing."
      },
      {
        question: "Grades look wrong / too strict or too lenient",
        answer: "Vague rubrics produce inconsistent grading. We recommend tightening your rubric and re-running the grading, or using Manual Recheck for one-off corrections."
      },
      {
        question: "A student's answer sheet was misread",
        answer: "If the AI consistently misreads a sheet, try re-uploading a clearer photo or scan. Alternatively, use Manual Recheck to correct the grade."
      },
      {
        question: "Nothing is happening after I click Process / Errors",
        answer: "AI grading depends on external AI providers and can occasionally be delayed under heavy load. Please wait a few minutes before retrying. If the issue persists, contact support."
      }
    ]
  }
];

export default function HelpArticles({ searchQuery }) {
  // Filter logic based on searchQuery
  const filteredContent = helpContent.map(section => {
    if (!searchQuery) return section;
    const query = searchQuery.toLowerCase();
    
    // Check if category title matches
    if (section.category.toLowerCase().includes(query)) {
      return section;
    }
    
    // Filter articles within category
    const filteredArticles = section.articles.filter(article => 
      article.question.toLowerCase().includes(query) || 
      article.answer.toLowerCase().includes(query)
    );
    
    return {
      ...section,
      articles: filteredArticles
    };
  }).filter(section => section.articles.length > 0);

  if (filteredContent.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3 className={styles.emptyTitle}>No results found</h3>
            <p className={styles.emptyText}>We couldn't find any articles matching "{searchQuery}". Try a different search term or browse the categories.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {filteredContent.map(section => (
          <div key={section.id} id={section.id} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{section.category}</h2>
            
            <div className={styles.accordionContainer}>
              {section.articles.map((article, idx) => (
                <details key={idx} className={styles.details}>
                  <summary className={styles.summary}>
                    {article.question}
                    <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </summary>
                  <div className={styles.content}>
                    {/* Handle newlines in answers */}
                    {article.answer.split('\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
        
        {/* Contact Support Banner */}
        <div id="contact-support" className={styles.contactBanner}>
          <div className={styles.contactContent}>
            <h3 className={styles.contactTitle}>Still need help?</h3>
            <p className={styles.contactText}>
              If you couldn't find the answer to your question, our support team is here to help. 
              Please include the exam name and student roll number if reporting an issue.
            </p>
          </div>
          <a href="mailto:hackathonprojectdev@gmail.com" className={styles.contactButton}>
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
