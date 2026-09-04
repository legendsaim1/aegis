"use client";

import { useState } from "react";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";
import HelpHero from "@/components/help/HelpHero";
import HelpCategories from "@/components/help/HelpCategories";
import HelpArticles from "@/components/help/HelpArticles";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} />
      
      <main className={styles.main}>
        <HelpHero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {/* Only show categories when not actively searching */}
        {!searchQuery && <HelpCategories />}
        <HelpArticles searchQuery={searchQuery} />
      </main>

      <Footer />
    </div>
  );
}
