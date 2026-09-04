-- Migration 020: Atomic replace of copy flags for an exam (RPC)
-- Ensures that clearing old flags and inserting new flags happens in a single atomic transaction.

CREATE OR REPLACE FUNCTION replace_exam_copy_flags(
  p_exam_id UUID,
  p_flags JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- 1. Always delete previous copy flags for this exam (wiping stale flags on zero-copy runs)
  DELETE FROM public.copy_flags WHERE exam_id = p_exam_id;

  -- 2. Insert new confirmed flags if provided
  IF p_flags IS NOT NULL AND jsonb_array_length(p_flags) > 0 THEN
    INSERT INTO public.copy_flags (
      exam_id,
      question_id,
      student_a_id,
      student_b_id,
      similarity_score,
      reason,
      confirmed
    )
    SELECT
      p_exam_id,
      (elem->>'question_id')::UUID,
      (elem->>'student_a_id')::UUID,
      (elem->>'student_b_id')::UUID,
      (elem->>'similarity_score')::FLOAT,
      (elem->>'reason')::TEXT,
      COALESCE((elem->>'confirmed')::BOOLEAN, true)
    FROM jsonb_array_elements(p_flags) AS elem;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('success', true, 'inserted_count', v_count);
END;
$$;
