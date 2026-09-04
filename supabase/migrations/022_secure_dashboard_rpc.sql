-- Migration 022: Secure Dashboard RPC with auth.uid() tenant validation
-- Prevents unauthorized or unauthenticated callers from reading cross-tenant dashboard aggregates

CREATE OR REPLACE FUNCTION get_teacher_dashboard_stats(p_teacher_id UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Verify the caller is authenticated and matching the requested teacher_id
    IF auth.uid() IS NULL OR auth.uid() != p_teacher_id THEN
        RAISE EXCEPTION 'Forbidden: Access denied to dashboard stats';
    END IF;

    SELECT json_build_object(
        'total_exams', (
            SELECT COUNT(*) 
            FROM exams 
            WHERE teacher_id = p_teacher_id
        ),
        'graded_papers', (
            SELECT COUNT(*) 
            FROM students s 
            JOIN exams e ON s.exam_id = e.id 
            WHERE e.teacher_id = p_teacher_id AND s.status IN ('graded', 'manually_graded')
        ),
        'avg_confidence', COALESCE((
            SELECT ROUND(AVG(s.overall_grade_confidence)::numeric * 100) 
            FROM students s 
            JOIN exams e ON s.exam_id = e.id 
            WHERE e.teacher_id = p_teacher_id 
              AND s.status IN ('graded', 'manually_graded') 
              AND s.overall_grade_confidence IS NOT NULL
        ), 0),
        'pending_reviews', (
            SELECT COUNT(*) 
            FROM answers a
            JOIN students s ON a.student_id = s.id
            JOIN exams e ON s.exam_id = e.id
            WHERE e.teacher_id = p_teacher_id AND a.needs_review = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
