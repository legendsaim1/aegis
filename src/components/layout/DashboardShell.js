"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./DashboardShell.module.css";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function DashboardShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("Teacher");
  const [userEmail, setUserEmail] = useState("teacher@school.edu");
  const [userInitial, setUserInitial] = useState("T");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      await supabaseClient.auth.signOut();
      router.push('/');
    }, 1200); // Wait slightly to let the spinner be seen
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/?modal=login');
        return;
      }
      
      setUserEmail(user.email);
      let { data: teacher } = await supabaseClient
        .from('teachers')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      // Automatically create teacher record if they just signed up via Google OAuth
      if (!teacher) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        await fetch("/api/auth/supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            full_name: fullName,
            school_name: "",
          }),
        });
        teacher = { full_name: fullName, avatar_url: null };
      }

      if (teacher && teacher.full_name) {
        const firstName = teacher.full_name.split(' ')[0];
        setUserName(firstName);
        setUserInitial(firstName.charAt(0).toUpperCase());
      }
      setAvatarUrl(teacher?.avatar_url || null);
    };
    fetchUser();

    // Settings page dispatches this after a successful name/avatar save so
    // the sidebar and topbar reflect it immediately instead of only after
    // the next full page load.
    window.addEventListener('aegis:profile-updated', fetchUser);
    
    // Listen for logout requests from child components (e.g., Settings page)
    const handleLogoutRequest = () => handleLogout();
    window.addEventListener('aegis:request-logout', handleLogoutRequest);
    
    return () => {
      window.removeEventListener('aegis:profile-updated', fetchUser);
      window.removeEventListener('aegis:request-logout', handleLogoutRequest);
    };
  }, [router, handleLogout]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={styles.shell}>
      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className={styles.logoutOverlay}>
          <div className={styles.spinnerWrap}>
            <div className={styles.winSpinner}>
              <div></div><div></div><div></div><div></div><div></div>
            </div>
            <p className={styles.logoutText}>Logging out...</p>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        userName={userName}
        userInitial={userInitial}
        avatarUrl={avatarUrl}
        onLogout={handleLogout}
      />

      <div className={styles.mainWrapper}>
        <Topbar 
          toggleSidebar={toggleSidebar} 
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
        />
        <main className={styles.mainContent}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
