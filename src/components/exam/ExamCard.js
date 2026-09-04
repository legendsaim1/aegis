'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './ExamCard.module.css';
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from '@/hooks/useToast';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusLabel = {
  draft: 'Draft',
  graded: 'Graded',
};

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const StackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

export default function ExamCard({ exam }) {
  const router = useRouter();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: exam.title || '',
    subject: exam.subject || '',
    class_grade: exam.class_grade || '',
    passing_percentage: exam.passing_percentage ?? 50
  });

  const statusClass = styles['status' + exam.status] || styles.statusdraft;

  const handleCardClick = () => {
    if (!isEditing) {
      router.push(`/dashboard/exams/${exam.id}`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    setShowConfirmDelete(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete exam');
      }
      router.refresh();
    } catch (err) {
      console.error('Failed to delete exam:', err);
      setIsDeleting(false);
      toast.error('Failed to delete the exam. Please try again.');
    }
  };

  const handleEditSave = async (e) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update exam');
      
      setIsEditing(false);
      setIsSaving(false);
      router.refresh();
    } catch (err) {
      console.error('Failed to update exam:', err);
      setIsSaving(false);
      toast.error('Failed to update exam. Please try again.');
    }
  };

  return (
    <>
      <div 
        onClick={handleCardClick} 
        className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
        style={isDeleting ? { pointerEvents: 'none', opacity: 0.5, cursor: 'default' } : { cursor: 'pointer' }}
      >
        <div style={{ padding: '24px' }}>
          <h3 className={styles.subject}>{exam.subject || 'Untitled Subject'}</h3>
          {exam.title && <span className={styles.title}>{exam.title}</span>}

          <div className={styles.detailsList}>
            {exam.class_grade && (
              <div className={styles.detailItem}>
                <span>Grade {exam.class_grade}</span>
              </div>
            )}
            {exam.students && (
              <div className={styles.detailItem}>
                <StackIcon />
                <span>{exam.students.length} Paper{exam.students.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <CalendarIcon />
              <span>{formatDate(exam.created_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <FileIcon />
              <span>{exam.total_marks ?? '—'} marks</span>
            </div>
          </div>
        </div>

        <div className={styles.spacer} />

        <div className={styles.cardFooter}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {exam.status ? (statusLabel[exam.status] || exam.status) : 'Draft'}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={styles.deleteBtn} 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              title="Edit Exam"
            >
              <EditIcon />
            </button>
            <button 
              className={styles.deleteBtn} 
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Delete Exam"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div 
          onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <h3 style={{ margin: 0, fontSize: '18px' }}>Edit Exam Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Exam Title</label>
              <input 
                value={editForm.title} 
                onChange={e => setEditForm({...editForm, title: e.target.value})} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--white)' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Subject</label>
              <input 
                value={editForm.subject} 
                onChange={e => setEditForm({...editForm, subject: e.target.value})} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--white)' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Class Grade</label>
              <input 
                value={editForm.class_grade} 
                onChange={e => setEditForm({...editForm, class_grade: e.target.value})} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--white)' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Passing Percentage (%)</label>
              <input 
                type="number"
                min="1"
                max="100"
                value={editForm.passing_percentage} 
                onChange={e => setEditForm({...editForm, passing_percentage: parseInt(e.target.value, 10) || 0})} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--white)' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSave} 
                style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--white)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={(e) => {
          if (e) e.stopPropagation();
          setShowConfirmDelete(false);
        }}
      />
    </>
  );
}
