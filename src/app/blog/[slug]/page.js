"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import { blogPosts } from "@/lib/blogData";

function renderContent(content) {
  const blocks = content.trim().split('\n\n');
  
  return blocks.map((block, idx) => {
    block = block.trim();
    if (!block) return null;
    
    if (block.startsWith('### ')) {
      return <h3 key={idx}>{block.replace('### ', '')}</h3>;
    }
    
    if (block.startsWith('## ')) {
      return <h2 key={idx}>{block.replace('## ', '')}</h2>;
    }
    
    if (block.startsWith('1. ') || block.startsWith('2. ')) {
      const items = block.split('\n').map(b => b.replace(/^\d+\.\s/, ''));
      return (
        <ol key={idx}>
          {items.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ol>
      );
    }
    
    return <p key={idx}>{parseInline(block)}</p>;
  });
}

function parseInline(text) {
  // Split by bold (**text**) and code (`text`)
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function BlogPost({ params }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  
  if (!post) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} />
      
      <main className={styles.main}>
        <article className={styles.article}>
          <header className={styles.header}>
            <Link href="/blog" className={styles.backLink}>&larr; Back to Blog</Link>
            <div className={styles.meta}>
              <time>{post.date}</time>
              <span>&middot;</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.excerpt}>{post.excerpt}</p>
          </header>

          <div className={styles.content}>
            {renderContent(post.content)}
          </div>

          <div className={styles.ctaCard}>
            <h3 className={styles.ctaTitle}>Ready to see it in action?</h3>
            <p className={styles.ctaText}>Join thousands of educators saving hours every week with AEGIS.</p>
            <Link href={post.ctaLink} className={styles.ctaButton}>
              {post.ctaText}
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
