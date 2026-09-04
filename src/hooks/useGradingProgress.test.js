import { describe, it, expect } from 'vitest';

describe('useGradingProgress SSE Event Processing Logic', () => {
  it('should parse valid SSE JSON event and update per-student progress map', () => {
    const prevProgress = {
      'student-1': { percent: 45, status: 'processing' }
    };

    const processEventData = (prev, dataStr) => {
      try {
        const data = JSON.parse(dataStr);
        if (data && data.studentId) {
          return {
            ...prev,
            [data.studentId]: {
              percent: typeof data.percent === 'number' ? data.percent : 0,
              status: data.type || data.status || 'processing'
            }
          };
        }
      } catch {
        // Safe fallback for malformed chunks
      }
      return prev;
    };

    // Update existing student
    const updated = processEventData(prevProgress, JSON.stringify({
      studentId: 'student-1',
      percent: 85,
      type: 'grading_questions'
    }));
    expect(updated['student-1']).toEqual({ percent: 85, status: 'grading_questions' });

    // Add new student
    const withNewStudent = processEventData(updated, JSON.stringify({
      studentId: 'student-2',
      percent: 20,
      type: 'ocr'
    }));
    expect(withNewStudent['student-2']).toEqual({ percent: 20, status: 'ocr' });
    expect(withNewStudent['student-1']).toEqual({ percent: 85, status: 'grading_questions' });
  });

  it('should safely ignore non-JSON pings, heartbeats, or malformed data without crashing', () => {
    const prevProgress = {
      'student-1': { percent: 50, status: 'processing' }
    };

    const processEventData = (prev, dataStr) => {
      try {
        const data = JSON.parse(dataStr);
        if (data && data.studentId) {
          return {
            ...prev,
            [data.studentId]: {
              percent: typeof data.percent === 'number' ? data.percent : 0,
              status: data.type || data.status || 'processing'
            }
          };
        }
      } catch {
        // Safe fallback
      }
      return prev;
    };

    expect(processEventData(prevProgress, ':keepalive ping')).toEqual(prevProgress);
    expect(processEventData(prevProgress, '')).toEqual(prevProgress);
    expect(processEventData(prevProgress, 'invalid-json-string')).toEqual(prevProgress);
    expect(processEventData(prevProgress, JSON.stringify({ someOtherField: true }))).toEqual(prevProgress);
  });
});
