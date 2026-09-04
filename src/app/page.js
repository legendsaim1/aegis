"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Features from "@/components/landing/Features";
import SpecimenShowcase from "@/components/landing/SpecimenShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Listen for Supabase auth state changes (handles implicit OAuth fallback and password recovery)
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/update-password");
      } else if (event === "SIGNED_IN") {
        router.push("/dashboard");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={true} />

      {/* ---- Sections ---- */}
      <main>
        <Hero />
        <About />
        <Features />
        <SpecimenShowcase />
        <HowItWorks />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}