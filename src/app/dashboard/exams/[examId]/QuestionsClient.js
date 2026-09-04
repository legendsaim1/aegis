'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';
import QuestionForm from './questions/QuestionForm';
import QuestionList from './questions/QuestionList';
import { useToast } from '@/hooks/useToast';

export default function QuestionsClient({ initialQuestions = [], examId }) {
  const router = useRouter();
  const toast = useToast();

  const [questions, setQuestions] = useState(initialQuestions);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, id: null });

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleOpenAdd = useCallback(() => {
    setModalMode('add');
    setEditingGroup(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((group) => {
    setModalMode('edit');
    setEditingGroup(group);
    setModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id) => {
    setConfirmModalState({ isOpen: true, id });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmModalState({ isOpen: false, id: null });
  }, []);

  const executeDelete = useCallback(async () => {
    const id = confirmModalState.id;
    setConfirmModalState({ isOpen: false, id: null });

    // Optimistic UI removal in 0ms
    const prevQuestions = questions;
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question deleted');

    try {
      const res = await fetch(`/api/questions?id=${id}&examId=${examId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch (err) {
      setQuestions(prevQuestions);
      toast.error(err.message || 'Failed to delete question');
    }
  }, [confirmModalState.id, examId, questions, router, toast]);

  const handleSaveModal = async (formData, mode, originalGroup) => {
    const calculatedQNum = mode === 'add' 
      ? (initialQuestions.length > 0 ? Math.max(...initialQuestions.map(q => parseInt(q.question_number, 10) || 0)) + 1 : 1)
      : (originalGroup.parent ? originalGroup.parent.question_number : originalGroup.parts[0].question_number);

    const qNum = formData.question_number ? parseInt(formData.question_number, 10) : calculatedQNum;

    if (mode === 'add') {
      if (formData.parts && formData.parts.length > 0) {
        // Submit parent context
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId,
            question_number: qNum,
            question_text: formData.text || 'Question Context',
            question_type: formData.parts[0].type,
            max_marks: 0,
            rubric_json: formData.rubric || 'CONTEXT_ONLY_DO_NOT_GRADE',
            teacher_instructions: formData.teacher_instructions || null,
            sub_part: null,
          }),
        });
        // Submit parts in parallel
        await Promise.all(
          formData.parts.map((part) =>
            fetch('/api/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                examId,
                question_number: qNum,
                question_text: part.text || `Part ${part.sub_part}`,
                question_type: part.type,
                max_marks: Number(part.marks) || 1,
                rubric_json: part.rubric || null,
                teacher_instructions: part.teacher_instructions || null,
                sub_part: part.sub_part,
              }),
            })
          )
        );
      } else {
        // Single question
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId,
            question_number: qNum,
            question_text: formData.text || 'Untitled Question',
            question_type: formData.type,
            max_marks: Number(formData.marks) || 1,
            rubric_json: formData.rubric || null,
            teacher_instructions: formData.teacher_instructions || null,
            sub_part: null,
          }),
        });
      }
    } else { // mode === 'edit'
      // 1. Update or create parent
      if (formData.parts && formData.parts.length > 0) {
        if (originalGroup.parent) {
          await fetch(`/api/questions?id=${originalGroup.parent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_number: qNum,
              question_text: formData.text,
              question_type: formData.parts[0].type,
              max_marks: 0,
              rubric_json: formData.rubric || 'CONTEXT_ONLY_DO_NOT_GRADE',
              teacher_instructions: formData.teacher_instructions || null,
            }),
          });
        } else {
          const mainQ = originalGroup.parts[0];
          await fetch(`/api/questions?id=${mainQ.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_number: qNum,
              question_text: formData.text,
              question_type: formData.parts[0].type,
              max_marks: 0,
              rubric_json: formData.rubric || 'CONTEXT_ONLY_DO_NOT_GRADE',
              teacher_instructions: formData.teacher_instructions || null,
              sub_part: null,
            }),
          });
        }
      } else {
        if (originalGroup.parent) {
          await fetch(`/api/questions?id=${originalGroup.parent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_number: qNum,
              question_text: formData.text,
              question_type: formData.type,
              max_marks: Number(formData.marks) || 1,
              rubric_json: formData.rubric || null,
              teacher_instructions: formData.teacher_instructions || null,
              sub_part: null,
            }),
          });
        }
      }

      // 2. Handle parts diff
      const originalParts = originalGroup.parts || [];
      const newParts = formData.parts || [];

      // Delete removed parts in parallel
      const partsToDelete = originalParts.filter(orig => !newParts.find(p => p.id === orig.id));
      if (partsToDelete.length > 0) {
        await Promise.all(
          partsToDelete.map(orig =>
            fetch(`/api/questions?id=${orig.id}&examId=${examId}`, { method: 'DELETE' })
          )
        );
      }

      // Update existing or create new parts in parallel
      await Promise.all(
        newParts.map((part) => {
          const isNew = String(part.id).startsWith('new-');
          const endpoint = isNew ? '/api/questions' : `/api/questions?id=${part.id}`;
          const method = isNew ? 'POST' : 'PUT';

          return fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...(isNew ? { examId } : {}),
              question_number: qNum,
              question_text: part.text || `Part ${part.sub_part}`,
              question_type: part.type,
              max_marks: Number(part.marks) || 1,
              rubric_json: part.rubric || null,
              teacher_instructions: part.teacher_instructions || null,
              sub_part: part.sub_part,
            }),
          });
        })
      );
    }
    
    router.refresh();
  };

  return (
    <>
      <QuestionForm 
        isOpen={modalOpen} 
        mode={modalMode} 
        group={editingGroup} 
        onClose={handleCloseModal} 
        onSave={handleSaveModal} 
        examId={examId} 
      />

      <QuestionList
        questions={questions}
        examId={examId}
        onOpenAdd={handleOpenAdd}
        onOpenEdit={handleOpenEdit}
        onDeleteRequest={handleDeleteRequest}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={executeDelete}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}
