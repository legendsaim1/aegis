"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import { blogPosts, blogCategories } from "@/lib/blogData";

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>AEGIS Blog</h1>
            <p className={styles.subtitle}>
              Insights on AI-powered grading, academic integrity, and engineering the future of education.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className={styles.filterBar}>
            {blogCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.filterPill} ${selectedCategory === category ? styles.filterPillActive : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {filteredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <time className={styles.date}>{post.date}</time>
                  <span className={styles.readTime}>{post.readTime}</span>
                </div>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.readMore}>Read article &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
