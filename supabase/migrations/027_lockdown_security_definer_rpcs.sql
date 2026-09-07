-- Migration 027: Restrict SECURITY DEFINER RPCs to the trusted service_role.
--
-- Root cause (NEW-1): migrations 020/023/024 created destructive SECURITY DEFINER
-- functions that retained Postgres' default EXECUTE grant to PUBLIC. PostgREST
-- therefore exposes them at /rest/v1/rpc/... to the public `anon` key; because they
-- are SECURITY DEFINER they run as the owner and BYPASS RLS, allowing unauthenticated
-- cross-tenant destructive writes (wipe/fabricate copy flags, rewrite grading state).
--
-- Root cause (NEW-2): migration 022's guard on get_teacher_dashboard_stats
-- (auth.uid() IS NULL -> RAISE) rejects the app's own service_role caller, so the
-- dashboard RPC always failed and silently fell back to slower queries.
--
-- Fix: REVOKE EXECUTE from PUBLIC/anon/authenticated and GRANT to service_role (the
-- only role the backend uses via SUPABASE_SERVICE_ROLE_KEY), and make the dashboard
-- guard service_role-aware. The application calls every one of these functions via
-- supabaseServer() = service_role, so no legitimate caller is affected.
--
-- NOTE: sync_exam_total_marks() (migration 021) is SECURITY DEFINER but RETURNS
-- TRIGGER, so it is not exposed via PostgREST and requires no action here.

-- 1) Remove the default PUBLIC grant and block the externally-reachable roles.
REVOKE EXECUTE ON FUNCTION replace_exam_copy_flags(uuid, jsonb)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION recalculate_student_total(uuid)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION recalculate_exam_student_totals(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_teacher_dashboard_stats(uuid)     FROM PUBLIC, anon, authenticated;

-- 2) Re-grant to the only role the trusted backend uses, so existing callers keep working.
GRANT EXECUTE ON FUNCTION replace_exam_copy_flags(uuid, jsonb)  TO service_role;
GRANT EXECUTE ON FUNCTION recalculate_student_total(uuid)       TO service_role;
GRANT EXECUTE ON FUNCTION recalculate_exam_student_totals(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION get_teacher_dashboard_stats(uuid)     TO service_role;

-- 3) NEW-2: service_role-aware guard. The aggregation body is preserved VERBATIM from
--    migration 022; only the authorization check at the top changes. search_path is
--    pinned to defend the SECURITY DEFINER function against search_path hijacking.
CREATE OR REPLACE FUNCTION get_teacher_dashboard_stats(p_teacher_id UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Trusted backend (service_role) is allowed: the API route already authenticates
    -- the teacher and passes their own id as p_teacher_id. Any other caller must BE
    -- that teacher.
    IF auth.role() IS DISTINCT FROM 'service_role'
       AND (auth.uid() IS NULL OR auth.uid() != p_teacher_id) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
