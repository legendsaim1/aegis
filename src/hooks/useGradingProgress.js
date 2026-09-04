'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to consume Server-Sent Events (SSE) from the grading process stream.
 * 
 * @param {string} examId - The current exam ID
 * @param {boolean} isActive - Whether grading is active and stream should be connected
 * @returns {Record<string, { percent: number, status: string }>} Map of studentId -> progress object
 */
export function useGradingProgress(examId, isActive) {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (!isActive || !examId || typeof window === 'undefined' || !window.EventSource) {
      return;
    }

    let eventSource = null;

    try {
      eventSource = new EventSource(`/api/process/stream?examId=${encodeURIComponent(examId)}`);

      eventSource.onmessage = (event) => {
        if (!event?.data) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.studentId) {
            setProgress((prev) => ({
              ...prev,
              [data.studentId]: {
                percent: typeof data.percent === 'number' ? data.percent : 0,
                status: data.type || data.status || 'processing'
              }
            }));
          }
        } catch {
          // Ignore parse errors for keep-alive comments or non-JSON messages
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          try {
            eventSource.close();
          } catch {
            // Ignore close errors
          }
        }
      };
    } catch {
      // Ignore EventSource creation errors
    }

    return () => {
      if (eventSource) {
        try {
          eventSource.close();
        } catch {
          // Ignore close errors
        }
      }
    };
  }, [examId, isActive]);

  return progress;
}

export default useGradingProgress;
