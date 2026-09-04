import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from '../[examId]/route';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { supabaseServer } from '@/lib/supabase/server';

// Mock dependencies
vi.mock('@/lib/supabase/middleware', () => ({
  getAuthenticatedUser: vi.fn()
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: vi.fn()
}));

vi.mock('@/lib/processing/copyDetection', () => ({
  runCopyDetection: vi.fn()
}));

describe('Copy Detection API Routes - Ownership checks', () => {
  it('should return 401 if user is not authenticated on GET', async () => {
    getAuthenticatedUser.mockResolvedValueOnce(null);

    const req = {};
    const res = await GET(req, { params: { examId: '123' } });
    
    expect(res.status).toBe(401);
  });

  it('should return 404 if exam does not belong to the user on GET', async () => {
    // Mock user
    getAuthenticatedUser.mockResolvedValueOnce({ id: 'teacher-1' });

    // Mock supabase to return no rows (simulating exam not found or wrong teacher)
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
    
    supabaseServer.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        single: mockSingle
      })
    });

    const req = {};
    const res = await GET(req, { params: { examId: 'other-teacher-exam' } });
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Exam not found or access denied');
    
    // Verify it checked ownership properly
    expect(mockEq).toHaveBeenCalledWith('teacher_id', 'teacher-1');
  });

  it('should return 404 if exam does not belong to the user on POST', async () => {
    // Mock user
    getAuthenticatedUser.mockResolvedValueOnce({ id: 'teacher-1' });

    // Mock supabase to return no rows (simulating exam not found or wrong teacher)
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
    
    supabaseServer.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        single: mockSingle
      })
    });

    const req = {};
    const res = await POST(req, { params: { examId: 'other-teacher-exam' } });
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Exam not found or access denied');
  });
});
