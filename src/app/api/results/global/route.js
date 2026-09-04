import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getExamTotalMarks } from '@/lib/utils/examTotals';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = supabaseServer();
    
    // 1. Fetch all exams for this teacher
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, title, class_grade, subject, created_at, total_marks, passing_percentage')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (examsError) throw examsError;

    if (!exams || exams.length === 0) {
      return Response.json([]);
    }

    const examIds = exams.map(e => e.id);

    // 2. Fetch students and questions for all these exams concurrently
    const [studentsRes, questionsRes] = await Promise.all([
      supabase
        .from('students')
        .select('exam_id, total_obtained_marks, status')
        .in('exam_id', examIds),
      supabase
        .from('questions')
        .select('exam_id, question_number, sub_part, max_marks')
        .in('exam_id', examIds)
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (questionsRes.error) throw questionsRes.error;

    const students = studentsRes.data || [];
    const questions = questionsRes.data || [];

    // 3. Aggregate results per exam
    const results = exams.map(exam => {
      // Find students belonging to this exam
      const examStudents = students.filter(s => s.exam_id === exam.id);
      const examQuestions = questions.filter(q => q.exam_id === exam.id);
      
      // Only count graded students for statistics
      const gradedStudents = examStudents.filter(s => ['graded', 'manually_graded'].includes(s.status) && s.total_obtained_marks != null);
      
      const examTotalMarks = getExamTotalMarks(examQuestions, exam);

      const passThreshold = (exam.passing_percentage !== undefined && exam.passing_percentage !== null)
        ? Number(exam.passing_percentage)
        : 50;

      const totalStudents = examStudents.length;
      const gradedCount = gradedStudents.length;
      
      let passedCount = 0;
      let totalObtained = 0;

      gradedStudents.forEach(s => {
        const score = Number(s.total_obtained_marks) || 0;
        totalObtained += score;
        
        // Calculate percentage for this student accurately
        const percentage = examTotalMarks > 0 ? (score / examTotalMarks) * 100 : 0;
        if (percentage >= passThreshold) {
          passedCount++;
        }
      });

      const failedCount = gradedCount - passedCount;
      const averageMarks = gradedCount > 0 ? Math.round(totalObtained / gradedCount) : 0;

      return {
        ...exam,
        total_marks: examTotalMarks,
        stats: {
          totalStudents,
          gradedCount,
          passedCount,
          failedCount,
          averageMarks
        }
      };
    });

    return Response.json(results);

  } catch (error) {
    console.error('Error in /api/results/global:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
