"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import styles from "./AuthModal.module.css";
import { supabaseClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms.",
  }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export default function AuthModal({ initialMode = "login", onClose }) {
  const router = useRouter();
  
  // Modal state
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  
  // Form states
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [message, setMessage] = useState("");

  const customResolver = async (data, context, options) => {
    const schema = mode === "login" ? loginSchema : mode === "signup" ? signupSchema : forgotPasswordSchema;
    return zodResolver(schema)(data, context, options);
  };

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: customResolver,
  });

  const agreeTerms = watch("agreeTerms");

  useEffect(() => {
    reset();
    setGlobalError("");
    setMessage("");
  }, [mode, reset]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setGlobalError("");
    setMessage("");

    if (mode === "forgot_password") {
      if (typeof window !== 'undefined') {
        localStorage.setItem('resetting_password', 'true');
      }
      const { error: authError } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      if (authError) {
        setGlobalError(authError.message);
      } else {
        setGlobalError("");
        setMessage("Password reset link sent to your email!");
        setMode("login");
      }
      setIsLoading(false);
      return;
    }

    if (mode === "login") {
      const { error: authError } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setGlobalError(authError.message);
        setIsLoading(false);
        return;
      }
      
      router.refresh();
      router.push("/dashboard");
    } else {
      // Signup logic
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setGlobalError(authError.message);
        setIsLoading(false);
        return;
      }

      // Create teacher row via API
      const res = await fetch("/api/auth/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          school_name: "",
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        setGlobalError(resData.error || "Failed to create teacher profile");
        setIsLoading(false);
        return;
      }

      router.refresh();
      router.push("/dashboard");
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className={styles.card}>
        {/* Left Panel — Brand / Welcome */}
        <div className={styles.brandPanel}>
          {/* Top Bar inside panel */}
          <header className={styles.topBar}>
            <div className={styles.pageLogo}>
              <span className={styles.pageLogoIcon}>✦</span>
              <span className={styles.pageLogoText}>AEGIS</span>
            </div>
          </header>

          {/* Decorative circles */}
          <div className={`${styles.circle} ${styles.circle1}`} />
          <div className={`${styles.circle} ${styles.circle2}`} />
          <div className={`${styles.circle} ${styles.circle3}`} />

          <div className={styles.brandContent}>
            <div>
              <h1 className={styles.welcome}>WELCOME</h1>
              <h2 className={styles.headline}>AI-Powered Grading</h2>
              <p className={styles.brandDescription}>
                Upload handwritten answer sheets, get instant AI-powered grading
                with confidence scores, analytics, and copy detection. Built for
                educators who value their time.
              </p>
            </div>
            <div className={styles.brandBadges}>
              <div className={styles.brandBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Secure & Encrypted
              </div>
              <div className={styles.brandBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Setup in Minutes
              </div>
            </div>
          </div>
        </div>

        {/* Smooth curved divider between panels */}
        <svg className={styles.curveDivider} viewBox="0 0 150 560" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M 150 0 L 65 0 C 0 150, 130 250, 130 330 C 130 410, 0 500, 55 560 L 150 560 Z"
            fill="var(--bg-secondary)"
          />
        </svg>

        {/* Right Panel — Form */}
        <div className={styles.formPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {mode === "login" 
                  ? "Sign in" 
                  : mode === "forgot_password"
                  ? "Reset Password"
                  : "Create an account"}
              </h2>
              <p className={styles.formSubtitle}>
                {mode === "login"
                  ? "Enter your credentials to access the AEGIS dashboard"
                  : mode === "forgot_password"
                  ? "Enter your email to receive a reset link"
                  : "Create your AEGIS account to get started"}
              </p>
              {globalError && <p style={{ color: "var(--danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>{globalError}</p>}
              {message && <p style={{ color: "var(--success)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)", padding: "var(--space-2)", backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>{message}</p>}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {/* Full Name (Signup only) */}
              {mode === "signup" && (
                <div>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Full Name"
                      className={styles.input}
                      autoComplete="name"
                      {...register("fullName")}
                    />
                  </div>
                  {errors.fullName && <div className={styles.errorText}>{errors.fullName.message}</div>}
                </div>
              )}

              {/* Email / Username */}
              <div>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    className={styles.input}
                    autoComplete="email"
                    {...register("email")}
                  />
                </div>
                {errors.email && <div className={styles.errorText}>{errors.email.message}</div>}
              </div>

              {/* Password - Not needed for forgot_password */}
              {mode !== "forgot_password" && (
                <div>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className={styles.input}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className={styles.showBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <div className={styles.errorText}>{errors.password.message}</div>}
                </div>
              )}

            <div className={styles.optionsRow}>
              {mode === "login" ? (
                <button type="button" className={styles.switchLink} style={{ marginLeft: 'auto' }} onClick={() => setMode("forgot_password")}>Forgot Password?</button>
              ) : mode === "signup" ? (
                <div>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      {...register("agreeTerms")}
                    />
                    <span className={styles.checkboxCustom}>
                      {agreeTerms && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span>
                      I agree to the <span className={styles.termsLink}>Terms</span>
                    </span>
                  </label>
                  {errors.agreeTerms && <div className={styles.errorText} style={{ marginTop: '4px' }}>{errors.agreeTerms.message}</div>}
                </div>
              ) : null}
            </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.spinner} />
                ) : (
                  mode === "login" ? "Sign in" : mode === "forgot_password" ? "Send reset link" : "Sign up"
                )}
              </button>
            </form>

            {mode !== "forgot_password" && (
              <>
                {/* Or Divider */}
                <div className={styles.divider}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>Or</span>
                  <span className={styles.dividerLine} />
                </div>

                {/* Sign in/up with Google */}
                <button 
                  type="button" 
                  className={styles.otherBtn}
                  onClick={async () => {
                    setIsLoading(true);
                    setGlobalError("");
                    
                    const siteUrl = window.location.origin;
                    
                    const { error: authError } = await supabaseClient.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
                      },
                    });

                    if (authError) {
                      setGlobalError(authError.message);
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
                </button>
              </>
            )}

            {/* Switch Prompt */}
            <p className={styles.switchPrompt}>
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button type="button" className={styles.switchLink} onClick={() => setMode("signup")}>Sign Up</button>
                </>
              ) : mode === "forgot_password" ? (
                <>
                  Remember your password?{" "}
                  <button type="button" className={styles.switchLink} onClick={() => setMode("login")}>Back to Sign in</button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" className={styles.switchLink} onClick={() => setMode("login")}>Sign In</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
