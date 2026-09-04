import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getSignedAnswerSheetUrl } from '@/lib/utils/storage';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '7', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // 1. Fetch exams for this teacher, ordered by newest first
  const { data: exams, error: examsError } = await supabase
    .from('exams')
    .select('id, title, class_grade, subject, status, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (examsError) {
    return Response.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }

  if (!exams || exams.length === 0) {
    return Response.json({ exams: [], hasMore: false });
  }

  const examIds = exams.map(e => e.id);

  // 2. Fetch all flagged answers for these exams
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select(`
      id,
      extracted_text,
      obtained_marks,
      ai_feedback,
      flag_reason,
      questions (
        question_number,
        sub_part,
        max_marks,
        question_text
      ),
      students!inner (
        id,
        student_name,
        roll_number,
        exam_id,
        answer_sheet_url,
        original_filename
      )
    `)
    .eq('needs_review', true)
    .in('students.exam_id', examIds);

  if (answersError) {
    return Response.json({ error: 'Failed to fetch review flags' }, { status: 500 });
  }

  // 3. Check if there's more exams by trying to fetch the very next one
  const { data: nextExam } = await supabase
    .from('exams')
    .select('id')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset + limit, offset + limit);

  const hasMore = nextExam && nextExam.length > 0;

  // 4. Format into a structure:
  // exams: [{ ...exam, studentGroups: [ ... ] }]
  
  const flags = await Promise.all((answers || []).map(async (ans) => {
    const qLabel = ans.questions.sub_part
      ? `Q${ans.questions.question_number}(${ans.questions.sub_part})`
      : `Q${ans.questions.question_number}`;

    const signedPdfUrl = await getSignedAnswerSheetUrl(supabase, ans.students.answer_sheet_url);

    return {
      id: ans.id,
      studentId: ans.students.id,
      studentName: ans.students.student_name,
      studentRoll: ans.students.roll_number,
      examId: ans.students.exam_id,
      pdfUrl: signedPdfUrl,
      filename: ans.students.original_filename,
      questionTopic: qLabel,
      questionText: ans.questions.question_text || `Question ${qLabel}`,
      extractedText: ans.extracted_text,
      feedback: ans.ai_feedback,
      reason: ans.flag_reason,
      totalMarks: ans.questions.max_marks,
      marksObtained: ans.obtained_marks,
    };
  }));

  const formattedExams = exams.map(exam => {
    const examFlags = flags.filter(f => f.examId === exam.id);
    
    // Group by student
    const studentMap = new Map();
    examFlags.forEach(flag => {
      if (!studentMap.has(flag.studentId)) {
        studentMap.set(flag.studentId, {
          studentId: flag.studentId,
          studentName: flag.studentName,
          studentRoll: flag.studentRoll,
          examId: exam.id,
          pdfUrl: flag.pdfUrl,
          filename: flag.filename,
          flags: []
        });
      }
      studentMap.get(flag.studentId).flags.push(flag);
    });

    return {
      ...exam,
      studentGroups: Array.from(studentMap.values())
    };
  });

  // 5. Compute global stats across ALL exams
  const { data: allExamsData } = await supabase
    .from('exams')
    .select('id')
    .eq('teacher_id', user.id);
  
  const allExamIds = (allExamsData || []).map(e => e.id);
  const totalExams = allExamIds.length;
  
  let globalTotalFlags = 0;
  let globalTotalStudents = 0;
  
  if (totalExams > 0) {
    const { data: globalAnswers } = await supabase
      .from('answers')
      .select('student_id, students!inner(exam_id)')
      .eq('needs_review', true)
      .in('students.exam_id', allExamIds);
      
    globalTotalFlags = (globalAnswers || []).length;
    const uniqueStudents = new Set((globalAnswers || []).map(a => a.student_id));
    globalTotalStudents = uniqueStudents.size;
  }

  return Response.json({ 
    exams: formattedExams, 
    hasMore,
    globalStats: {
      totalExams,
      totalStudents: globalTotalStudents,
      totalFlags: globalTotalFlags
    }
  });
}
