'use client';

import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/useToast';

// --- Icons ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

const SlidersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- Sub-Components ---

function ProfileTab() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        setProfile(data);
        setFullName(data.full_name || '');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProfile((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      toast.success('Profile picture updated!');
      window.dispatchEvent(new Event('aegis:profile-updated'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const startEditName = () => {
    setFullName(profile?.full_name || '');
    setIsEditingName(true);
  };

  const cancelEditName = () => {
    setFullName(profile?.full_name || '');
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty.');
      return;
    }
    if (trimmed === (profile?.full_name || '')) {
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProfile((prev) => ({ ...prev, full_name: data.full_name }));
      setFullName(data.full_name);
      setIsEditingName(false);
      toast.success('Name updated.');
      window.dispatchEvent(new Event('aegis:profile-updated'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (profile?.full_name || '')
    ? profile.full_name.trim().split(/\s+/).filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Profile Information</h3>
        <p className={styles.cardDesc}>Your name and photo, as shown across Aegis.</p>
      </div>
      <div className={styles.cardBody}>

        {/* Avatar — click the photo itself to change it */}
        <div className={styles.avatarSection}>
          <label className={styles.avatarUploadWrap}>
            <div className={styles.avatarCircle} style={{ position: 'relative', overflow: 'hidden' }}>
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" fill sizes="96px" style={{ objectFit: 'cover' }} />
              ) : (
                initials
              )}
              <div className={styles.avatarOverlay}>
                {isUploading ? <div className={styles.spinner} style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : <CameraIcon />}
              </div>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </label>
          <div>
            <div className={styles.profileNameDisplay}>{profile?.full_name || 'Unnamed'}</div>
            <div className={styles.profileEmailDisplay}>{profile?.email}</div>
          </div>
        </div>

        {/* Full Name — inline edit */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldRowLabel}>Full Name</div>
          {isEditingName ? (
            <div className={styles.fieldRowEdit}>
              <input
                type="text"
                className={styles.formInput}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button className={styles.iconBtn} onClick={handleSaveName} disabled={isSaving} aria-label="Save name">
                {isSaving ? <div className={styles.spinner} style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} /> : <CheckCircleIcon />}
              </button>
              <button className={styles.iconBtnGhost} onClick={cancelEditName} disabled={isSaving} aria-label="Cancel">
                <XIcon />
              </button>
            </div>
          ) : (
            <div className={styles.fieldRowView}>
              <span>{profile?.full_name}</span>
              <button className={styles.editTrigger} onClick={startEditName}>
                <PencilIcon /> Edit
              </button>
            </div>
          )}
        </div>

        {/* Email — always locked, never becomes an input */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldRowLabel}>Email Address</div>
          <div className={styles.fieldRowView}>
            <span>{profile?.email}</span>
            <span className={styles.lockedBadge}><LockIcon /> Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ supabase }) {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password) {
      toast.error('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    window.dispatchEvent(new Event('aegis:request-logout'));
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      window.dispatchEvent(new Event('aegis:request-logout'));
    } catch (error) {
      toast.error(error.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Change Password Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Change Password</h3>
          <p className={styles.cardDesc}>Ensure your account is using a long, random password to stay secure.</p>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>New Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirm Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <div className={styles.cardFooter} style={{ justifyContent: 'space-between' }}>
          <button className={styles.editTrigger} onClick={handleSignOut} style={{ color: 'var(--danger)' }}>
            <LogOutIcon /> Sign Out
          </button>
          <button className={styles.btnPrimary} onClick={handleUpdatePassword} disabled={isSaving || !password}>
            {isSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Delete Account Card */}
      <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ color: 'var(--danger)' }}>Delete Account</h3>
          <p className={styles.cardDesc}>Permanently remove your account and all of its data. This action cannot be undone.</p>
        </div>
        <div className={styles.cardFooter}>
          <button className={styles.btnPrimary} style={{ background: 'var(--danger)' }} onClick={() => setShowDeleteModal(true)} disabled={isSaving || isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="Are you absolutely sure you want to permanently delete your account and all associated data? This action cannot be undone."
        confirmText="Yes, delete my account"
        isDanger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />

    </div>
  );
}


// --- Main Page Component ---

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageDesc}>Manage your account settings and preferences.</p>
      </div>

      <div className={styles.layoutSingle}>
        <ProfileTab />
        <AccountTab supabase={supabaseClient} />
      </div>
    </div>
  );
}