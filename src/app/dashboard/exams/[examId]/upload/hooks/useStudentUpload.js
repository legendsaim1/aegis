'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

export function useStudentUpload(examId) {
  const inputRef = useRef(null);
  const selectAllRef = useRef(null);
  const toast = useToast();

  const [sheets, setSheets] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLabel, setActiveLabel] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDanger: false,
    confirmText: 'Confirm'
  });

  // Fetch existing students from API
  const fetchStudents = useCallback(async () => {
    if (!examId) return;

    const mapDbStatus = (student) => {
      const dbStatus = student.status;
      if (dbStatus === 'error') return 'error';
      if (dbStatus === 'processing') {
        if (student.processed_at) {
          const elapsedMs = Date.now() - new Date(student.processed_at).getTime();
          if (elapsedMs > 10 * 60 * 1000) {
            return 'stale_processing';
          }
        }
        return 'processing';
      }
      if (dbStatus === 'uploaded') return 'uploaded';
      if (dbStatus === 'graded' || dbStatus === 'manually_graded' || dbStatus === 'review') return 'done';
      return 'pending_db';
    };

    try {
      const res = await fetch(`/api/upload?examId=${examId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(s => ({
          id: s.id,
          dbId: s.id, 
          name: s.student_name,
          roll: s.roll_number,
          fileObj: null,
          fileName: s.original_filename || (s.answer_sheet_url ? s.answer_sheet_url.split('/').pop() : 'No file'),
          fileUrl: s.answer_sheet_url,
          fileSize: null,
          status: mapDbStatus(s),
        }));
        setSheets(mapped);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [examId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle incoming files
  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles).map((f, i) => {
      // 20MB max file size check
      if (f.size > 20 * 1024 * 1024) {
        toast.error('Upload failed: file too large');
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: `Student ${sheets.length + i + 1}`,
        roll: `R${sheets.length + i + 1}`,
        fileObj: f,
        fileName: f.name,
        fileUrl: URL.createObjectURL(f),
        fileSize: f.size,
        status: 'queued',
      };
    });
    setSheets(prev => [...prev, ...fileArray]);
  }, [sheets.length, toast]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  // Upload queued sheets
  const handleUploadSheets = useCallback(async () => {
    const toUpload = sheets.filter(s => s.status === 'queued' && s.fileObj);
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    let successCount = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const sheet = toUpload[i];
      setActiveLabel(`Uploading ${sheet.fileName}… (${i + 1} of ${toUpload.length})`);

      const baseProgress = Math.round((i / toUpload.length) * 100);
      const targetProgress = Math.round(((i + 1) / toUpload.length) * 100);
      const crawlCeiling = baseProgress + Math.floor((targetProgress - baseProgress) * 0.90);
      let simValue = baseProgress;
      setProgress(baseProgress);
      const dynamicInterval = 250;
      const simInterval = setInterval(() => {
        if (simValue < crawlCeiling) {
          simValue = Math.min(crawlCeiling, simValue + 2);
          setProgress(simValue);
        }
      }, dynamicInterval);

      try {
        setSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, status: 'uploading' } : s));

        const uploadData = new FormData();
        uploadData.append('examId', examId);
        uploadData.append('student_name', sheet.name);
        uploadData.append('roll_number', sheet.roll);
        uploadData.append('file', sheet.fileObj);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });

        clearInterval(simInterval);
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || 'Upload failed');

        setSheets(prev => prev.map(s => s.id === sheet.id ? {
          ...s,
          status: 'uploaded',
          dbId: uploadJson.id
        } : s));
        successCount++;
      } catch (error) {
        clearInterval(simInterval);
        console.error('Upload error for', sheet.fileName, error);
        const isSizeErr = error.message?.toLowerCase().includes('large') || error.message?.toLowerCase().includes('size') || error.message?.toLowerCase().includes('payload');
        toast.error(isSizeErr ? 'Upload failed: file too large' : `Upload failed: ${error.message}`);
        setSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, status: 'queued' } : s));
      }
      setProgress(targetProgress);
    }

    setIsUploading(false);
    setActiveLabel('');
    if (successCount > 0) {
      toast.success(successCount === 1 ? 'Student uploaded successfully' : `${successCount} students uploaded successfully`);
      
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Sheets Uploaded',
          message: `${successCount} new answer sheet${successCount === 1 ? '' : 's'} have been uploaded and are ready for grading.`,
          type: 'info',
          link_url: `/dashboard/exams/${examId}/upload`
        })
      }).catch(console.error);
      window.dispatchEvent(new Event('refreshNotifications'));
    }
    setTimeout(() => setProgress(0), 1000);
  }, [sheets, examId, toast]);


  // Update sheet locally
  const updateSheet = useCallback((id, field, value) => {
    setSheets(prev => prev.map(s => s.id === id || s.dbId === id ? { ...s, [field]: value } : s));
  }, []);

  // Save changes to DB
  const handleSaveToDB = useCallback(async (sheet, field, value) => {
    if (!sheet.dbId) return; 

    try {
      const res = await fetch('/api/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: sheet.dbId, examId, [field]: value })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update database');
      }
    } catch (error) {
      console.error(error);
      toast.error(`Could not save changes to database: ${error.message}`);
    }
  }, [examId, toast]);

  // Delete helpers with optimistic UI update and rollback
  const deleteSheetsFromServer = useCallback(async (sheetsToDelete) => {
    const targetIds = new Set(sheetsToDelete.map(s => s.id || s.dbId));

    // Optimistic removal: remove from UI immediately
    setSheets(prev => prev.filter(s => !targetIds.has(s.id || s.dbId)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      targetIds.forEach(id => next.delete(id));
      return next;
    });

    const failures = [];
    for (const sheet of sheetsToDelete) {
      if (!sheet.dbId) continue;
      try {
        const res = await fetch(`/api/upload?studentId=${sheet.dbId}&examId=${examId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete from database');
      } catch (error) {
        failures.push({ sheet, error });
      }
    }

    // Rollback if any deletions failed
    if (failures.length > 0) {
      const failedSheets = failures.map(f => f.sheet);
      setSheets(prev => [...prev, ...failedSheets]);
      toast.error(`Failed to delete ${failures.length} sheet${failures.length === 1 ? '' : 's'}: ${failures[0].error.message}`);
    }
    return sheetsToDelete.length - failures.length;
  }, [examId, toast]);

  const executeDeleteStudent = useCallback(async (sheet) => {
    setConfirmModalState(prev => ({ ...prev, isOpen: false }));
    const count = await deleteSheetsFromServer([sheet]);
    if (count > 0) {
      toast.info('Student removed');
    }
  }, [deleteSheetsFromServer, toast]);

  const handleDeleteStudent = useCallback((sheet) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Sheet',
      message: `Are you sure you want to delete ${sheet.name}? All data and grades will be permanently lost.`,
      confirmText: 'Delete',
      isDanger: true,
      action: () => executeDeleteStudent(sheet)
    });
  }, [executeDeleteStudent]);

  const executeDeleteSelected = useCallback(async (toDelete) => {
    setConfirmModalState(prev => ({ ...prev, isOpen: false }));
    const count = await deleteSheetsFromServer(toDelete);
    if (count > 0) {
      toast.success(count === 1 ? 'Student removed' : `${count} students removed`);
    }
  }, [deleteSheetsFromServer, toast]);

  const handleBulkDelete = useCallback(() => {
    const toDelete = sheets.filter(s => selectedIds.has(s.id || s.dbId));
    if (toDelete.length === 0) return;
    
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Selected Sheets',
      message: `Delete ${toDelete.length} selected sheet${toDelete.length === 1 ? '' : 's'}? All data and grades will be permanently lost.`,
      confirmText: 'Delete All',
      isDanger: true,
      action: () => executeDeleteSelected(toDelete)
    });
  }, [sheets, selectedIds, executeDeleteSelected]);

  // Sorting and Selection
  const toggleSort = useCallback((key) => {
    setSortKey(prevKey => {
      if (prevKey !== key) {
        setSortDir('asc');
        return key;
      }
      setSortDir(prevDir => (prevDir === 'asc' ? 'desc' : 'asc'));
      if (sortDir === 'desc') {
        return null;
      }
      return key;
    });
  }, [sortDir]);

  const toggleSelectOne = useCallback((rowId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // Stats calculation
  const stats = useMemo(() => ({
    total: sheets.length,
    gradingDone: sheets.filter(s => s.status === 'done').length,
    pendingUpload: sheets.filter(s => s.status === 'queued').length,
    queued: sheets.filter(s => ['uploaded', 'pending_db', 'uploading', 'processing', 'stale_processing'].includes(s.status)).length,
    error: sheets.filter(s => s.status === 'error').length,
  }), [sheets]);

  const matchesFilter = useCallback((s) => {
    switch (statusFilter) {
      case 'gradingDone': return s.status === 'done';
      case 'pendingUpload': return s.status === 'queued';
      case 'queued': return ['uploaded', 'pending_db', 'uploading', 'processing', 'stale_processing'].includes(s.status);
      case 'error': return s.status === 'error';
      default: return true;
    }
  }, [statusFilter]);

  const visibleSheets = useMemo(() => {
    let result = sheets.filter(matchesFilter);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(term) ||
        (s.roll || '').toLowerCase().includes(term)
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let av = a[sortKey] ?? '';
        let bv = b[sortKey] ?? '';
        if (sortKey === 'roll') {
          const an = parseFloat(String(av).replace(/[^\d.]/g, ''));
          const bn = parseFloat(String(bv).replace(/[^\d.]/g, ''));
          if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn) return sortDir === 'asc' ? an - bn : bn - an;
        }
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sheets, searchTerm, sortKey, sortDir, matchesFilter]);

  const visibleIds = useMemo(() => visibleSheets.map(s => s.id || s.dbId), [visibleSheets]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  const hasQueued = useMemo(() => sheets.some(s => s.status === 'queued'), [sheets]);
  const hasUploaded = useMemo(() => sheets.some(s => s.status === 'uploaded'), [sheets]);

  return {
    inputRef,
    selectAllRef,
    sheets,
    setSheets,
    dragActive,
    isUploading,
    progress,
    setProgress,
    activeLabel,
    setActiveLabel,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDir,
    selectedIds,
    setSelectedIds,
    confirmModalState,
    setConfirmModalState,
    stats,
    visibleSheets,
    allVisibleSelected,
    hasQueued,
    hasUploaded,
    handleFiles,
    handleDrag,
    handleDrop,
    handleChange,
    handleUploadSheets,
    updateSheet,
    handleSaveToDB,
    handleDeleteStudent,
    handleBulkDelete,
    toggleSort,
    toggleSelectOne,
    toggleSelectAllVisible,
    fetchStudents,
  };
}

export default useStudentUpload;
