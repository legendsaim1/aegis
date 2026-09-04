-- Step 1: Create the Analytics Aggregation Function
CREATE OR REPLACE FUNCTION get_exam_analytics_summary(
    p_exam_id UUID,
    p_passing_threshold NUMERIC,
    p_exam_total_marks NUMERIC
) RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- We use json_build_object to construct the exact JSON shape the frontend expects
    SELECT json_build_object(
        'total_students', COUNT(*),
        'average_score', COALESCE(ROUND(AVG(total_obtained_marks)::numeric, 1), 0),
        'highest_score', COALESCE(MAX(total_obtained_marks), 0),
        'lowest_score', COALESCE(MIN(total_obtained_marks), 0),
        'pass_count', COUNT(*) FILTER (WHERE total_obtained_marks >= p_passing_threshold),
        'fail_count', COUNT(*) FILTER (WHERE total_obtained_marks < p_passing_threshold),
        'distribution_buckets', json_build_object(
            '0-20%', COUNT(*) FILTER (WHERE (total_obtained_marks::numeric / p_exam_total_marks) * 100 <= 20),
            '21-40%', COUNT(*) FILTER (WHERE (total_obtained_marks::numeric / p_exam_total_marks) * 100 > 20 AND (total_obtained_marks::numeric / p_exam_total_marks) * 100 <= 40),
            '41-60%', COUNT(*) FILTER (WHERE (total_obtained_marks::numeric / p_exam_total_marks) * 100 > 40 AND (total_obtained_marks::numeric / p_exam_total_marks) * 100 <= 60),
            '61-80%', COUNT(*) FILTER (WHERE (total_obtained_marks::numeric / p_exam_total_marks) * 100 > 60 AND (total_obtained_marks::numeric / p_exam_total_marks) * 100 <= 80),
            '81-100%', COUNT(*) FILTER (WHERE (total_obtained_marks::numeric / p_exam_total_marks) * 100 > 80)
        )
    ) INTO result
    FROM students
    WHERE exam_id = p_exam_id AND status IN ('graded', 'manually_graded');

    RETURN result;
END;
$$ LANGUAGE plpgsql;
