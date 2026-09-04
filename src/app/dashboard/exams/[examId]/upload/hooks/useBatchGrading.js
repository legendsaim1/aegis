'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import pLimit from 'p-limit';


export function useBatchGrading({
  examId,
  sheets,
  setSheets,
  selectedIds,
  setProgress,
  setActiveLabel
}) {
  const router = useRouter();
  const toast = useToast();
  const abortControllerRef = useRef(null);

  const [isGrading, setIsGrading] = useState(false);
  const [enableCopyDetection, setEnableCopyDetection] = useState(false);
  const [totalGradingCount, setTotalGradingCount] = useState(0);
  const [totalGradedCount, setTotalGradedCount] = useState(0);

  const handleCancelGrading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const executeGrading = useCallback(async (toGrade) => {
    setIsGrading(true);
    setTotalGradingCount(toGrade.length);
    setTotalGradedCount(0);
    setProgress(0);
    setActiveLabel('Queued for grading…');
    toast.info(`Grading started for ${toGrade.length} student${toGrade.length === 1 ? '' : 's'}`);

    const toGradeDbIds = new Set(toGrade.map(s => s.dbId));
    setSheets(prev => prev.map(s => toGradeDbIds.has(s.dbId) ? { ...s, status: 'queued' } : s));

    const completedRef = { current: 0 };
    let reviewCount = 0;

    const limit = pLimit(2);
    abortControllerRef.current = new AbortController();

    const maxGradingProgress = enableCopyDetection ? 85 : 100;
    const simInterval = setInterval(() => {
      setProgress(prev => {
        const targetProgress = (completedRef.current / toGrade.length) * maxGradingProgress;
        const crawlCeiling = targetProgress + ((1 / toGrade.length) * maxGradingProgress * 0.9);
        if (prev < crawlCeiling && prev < (maxGradingProgress - 1)) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    const processStudent = async (sheet) => {
      setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'processing' } : s));
      setActiveLabel(`Grading ${sheet.name}…`);

      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: sheet.dbId, examId, enableCopyDetection }),
          signal: abortControllerRef.current.signal
        });

        const data = await res.json();

        if (res.status === 409) {
          setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'processing' } : s));
          return;
        }

        if (!data.reviewRequired && (!res.ok || !data.success)) {
          throw new Error(data.error || data.message || 'Grading pipeline failed');
        }

        if (data.reviewRequired) reviewCount++;
        setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: data.reviewRequired ? 'review' : 'done' } : s));
      } catch (error) {
        if (error.name === 'AbortError') {
          setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'uploaded' } : s));
          return; 
        }
        console.error('Failed grading student:', sheet.name, error);
        toast.error(`Failed grading ${sheet.name}: ${error.message}`);
        setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'uploaded' } : s));
      } finally {
        completedRef.current++;
        setTotalGradedCount(completedRef.current);
        setProgress(Math.round((completedRef.current / toGrade.length) * maxGradingProgress));
      }
    };

    const promises = toGrade.map(sheet => limit(() => processStudent(sheet)));
    await Promise.allSettled(promises);
    clearInterval(simInterval);

    if (enableCopyDetection) {
      setActiveLabel('Running Full-Class Copy Detection... (Please wait)');
      
      let copyProgress = 85;
      const copyInterval = setInterval(() => {
        copyProgress += 1;
        if (copyProgress > 98) clearInterval(copyInterval);
        else setProgress(copyProgress);
      }, 2500);

      try {
        const copyRes = await fetch('/api/copy-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId }),
          signal: abortControllerRef.current.signal
        });
        
        clearInterval(copyInterval);
        setProgress(100);
        
        const copyData = await copyRes.json();
        
        if (copyRes.ok && copyData.success) {
          const flags = copyData.data.flaggedCount;
          if (flags > 0) {
            toast.warning(`Grading complete! Found ${flags} potential cheating cases.`);
          } else {
            toast.success(`Successfully graded ${completedRef.current} students! No copying detected.`);
          }
        } else {
          throw new Error(copyData.details ? `${copyData.error}: ${copyData.details}` : copyData.error || 'Unknown error');
        }
      } catch (error) {
        clearInterval(copyInterval);
        setProgress(100);
        if (error.name !== 'AbortError') {
          console.error('Copy detection failed:', error);
          toast.error(`Grading finished, but Copy Detection failed: ${error.message}`);
        }
      }
    } else {
      setProgress(100);
      if (reviewCount > 0) {
        toast.warning(`${completedRef.current} students processed. ${reviewCount} need review.`);
      } else {
        toast.success(`Successfully graded ${completedRef.current} students!`);
      }
    }

    setIsGrading(false);
    setActiveLabel('');
    
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Batch Grading Complete',
        message: reviewCount > 0 ? `${reviewCount} sheet${reviewCount === 1 ? '' : 's'} flagged for manual review.` : 'All sheets graded successfully.',
        type: reviewCount > 0 ? 'warning' : 'success',
        link_url: `/dashboard/exams/${examId}/review`
      })
    }).catch(console.error);
    window.dispatchEvent(new Event('refreshNotifications'));
    setTimeout(() => setProgress(0), 1000);
    router.refresh();
  }, [enableCopyDetection, examId, router, setActiveLabel, setProgress, setSheets, toast]);

  const handleStartGrading = useCallback(async () => {
    const toGrade = selectedIds && selectedIds.size > 0
      ? sheets.filter(s => selectedIds.has(s.id || s.dbId) && s.dbId)
      : sheets.filter(s => s.status === 'uploaded' && s.dbId);

    if (toGrade.length === 0) {
      if (selectedIds && selectedIds.size > 0) {
        toast.error('None of the selected sheets can be graded. Make sure they are uploaded first.');
      } else {
        toast.error('No pending sheets to grade. Upload them to the database first.');
      }
      return;
    }

    executeGrading(toGrade);
  }, [executeGrading, selectedIds, sheets, toast]);

  const handleRetryStudent = useCallback(async (sheet) => {
    setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'processing' } : s));
    setIsGrading(true);
    setProgress(0);
    setActiveLabel(`Grading ${sheet.name}…`);

    let currentSimProgress = 0;
    const simInterval = setInterval(() => {
      currentSimProgress += 1;
      if (currentSimProgress > 90) clearInterval(simInterval);
      else setProgress(currentSimProgress);
    }, 300);

    try {
      abortControllerRef.current = new AbortController();
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: sheet.dbId, examId, enableCopyDetection, forceRetry: true }),
        signal: abortControllerRef.current.signal
      });
      clearInterval(simInterval);
      const data = await res.json();

      if (res.status === 409) {
        setIsGrading(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
        return;
      }

      if (!data.reviewRequired && (!res.ok || !data.success)) {
        throw new Error(data.error || data.message || 'Grading pipeline failed');
      }
      setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: data.reviewRequired ? 'review' : 'done' } : s));
      toast.success(`Successfully graded ${sheet.name}`);
      
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Single Sheet Graded',
          message: `${sheet.name}'s answer sheet was graded successfully${data.reviewRequired ? ', but flagged for review' : ''}.`,
          type: data.reviewRequired ? 'warning' : 'success',
          link_url: `/dashboard/exams/${examId}/review`
        })
      }).catch(console.error);
      window.dispatchEvent(new Event('refreshNotifications'));

    } catch (error) {
      clearInterval(simInterval);
      if (error.name === 'AbortError') {
        setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'uploaded' } : s));
      } else {
        console.error('Failed retrying student:', sheet.name, error);
        toast.error(`Failed retrying ${sheet.name}: ${error.message}`);
        setSheets(prev => prev.map(s => s.dbId === sheet.dbId ? { ...s, status: 'stale_processing' } : s));
        
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Grading Failed',
            message: `Failed to grade ${sheet.name}: ${error.message}`,
            type: 'error',
            link_url: `/dashboard/exams/${examId}/upload`
          })
        }).catch(console.error);
        window.dispatchEvent(new Event('refreshNotifications'));
      }
    }

    setProgress(100);
    setIsGrading(false);
    setActiveLabel('');
    setTimeout(() => setProgress(0), 1000);
    router.refresh();
  }, [enableCopyDetection, examId, router, setActiveLabel, setProgress, setSheets, toast]);

  return {
    isGrading,
    enableCopyDetection,
    setEnableCopyDetection,
    totalGradingCount,
    totalGradedCount,
    handleStartGrading,
    executeGrading,
    handleRetryStudent,
    handleCancelGrading,
  };
}

export default useBatchGrading;
