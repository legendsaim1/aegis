import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

const mocks = vi.hoisted(() => ({
  supabaseServer: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  runGradingPipeline: vi.fn(),
  runCopyDetection: vi.fn()
}));

vi.mock('@/lib/supabase/server', () => ({ supabaseServer: mocks.supabaseServer }));
vi.mock('@/lib/supabase/middleware', () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock('@/lib/processing/pipeline', () => ({ runGradingPipeline: mocks.runGradingPipeline }));
vi.mock('@/lib/processing/copyDetection', () => ({ runCopyDetection: mocks.runCopyDetection }));

describe('POST /api/process', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'student-1' }], error: null })
    });

    mockSupabase = {
      updateSpy: mockUpdate,
      from: vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: table === 'exams' ? { id: 'exam-1' } : { status: 'pending' }, error: null }),
        in: vi.fn().mockReturnThis(),
        update: mockUpdate
      }))
    };
    
    mocks.supabaseServer.mockReturnValue(mockSupabase);
    mocks.getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
  });

  it('should revert student status to error when pipeline crashes', async () => {
    // Mock the pipeline to crash (throw an error)
    mocks.runGradingPipeline.mockRejectedValue(new Error('Simulated pipeline crash'));

    const req = {
      json: async () => ({ examId: 'exam-1', studentId: 'student-1' })
    };

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('Pipeline failed: Simulated pipeline crash');

    // Verify that supabase was called to update status to 'error'
    expect(mockSupabase.updateSpy).toHaveBeenCalledWith({ status: 'error' });
  });
});
