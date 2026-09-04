import ExcelJS from 'exceljs';
import { getExamTotalMarks } from '@/lib/utils/examTotals';

/**
 * Generates an Excel workbook buffer from exam results.
 * @param {Object} exam - The exam details (title, subject, total_marks, passing_percentage)
 * @param {Array} students - Array of graded student records
 * @param {Array} questions - Array of questions for the exam
 * @param {Array} answers - Array of all answers
 * @param {Set} copiedStudentIds - Set of student IDs flagged for copying
 * @returns {Promise<Buffer>} - The Excel file buffer ready for download
 */
export async function generateExcelExport(exam, students, questions = [], answers = [], copiedStudentIds = new Set()) {
  const examTotalMarks = getExamTotalMarks(questions, exam);
  const passPct = (exam.passing_percentage !== undefined && exam.passing_percentage !== null) ? exam.passing_percentage : 50;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Aegis Grading AI';
  workbook.created = new Date();

  // Helper to create beautiful title headers
  const addTitleBlock = (worksheet, title, colCount) => {
    worksheet.mergeCells(1, 1, 1, colCount);
    worksheet.mergeCells(2, 1, 2, colCount);
    worksheet.mergeCells(3, 1, 3, colCount);
    worksheet.mergeCells(4, 1, 4, colCount);

    const styleRow = (rowNum, value, font, fill) => {
      const row = worksheet.getRow(rowNum);
      const masterCell = row.getCell(1);
      masterCell.value = value;
      for (let i = 1; i <= colCount; i++) {
        const cell = row.getCell(i);
        cell.font = font;
        cell.fill = fill;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    };

    styleRow(1, exam.subject || 'Subject Not Specified', { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }, { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } });
    styleRow(2, exam.title || 'Exam Results', { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }, { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } });
    styleRow(3, `Generated on: ${new Date().toLocaleDateString()}`, { name: 'Arial', size: 10, italic: true, color: { argb: 'FFBDC3C7' } }, { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } });
    styleRow(4, `Total Marks: ${examTotalMarks} | Passing Percentage: ${passPct}%`, { name: 'Arial', size: 11, bold: true, color: { argb: 'FF2C3E50' } }, { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } });

    worksheet.getRow(5).height = 10;
  };

  const styleHeaderRow = (worksheet, rowNumber) => {
    const row = worksheet.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1F618D' } },
        left: { style: 'thin', color: { argb: 'FF1F618D' } },
        bottom: { style: 'thin', color: { argb: 'FF1F618D' } },
        right: { style: 'thin', color: { argb: 'FF1F618D' } }
      };
    });
    row.height = 30;
  };

  const applyDataRowStyles = (worksheet, startRow) => {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < startRow) return;

      const isEven = rowNumber % 2 === 0;
      const rowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF2F4F4' : 'FFFFFFFF' } };

      row.eachCell((cell, colNumber) => {
        if (!cell.fill || cell.fill.fgColor.argb === 'FFFFFFFF') {
            cell.fill = rowFill;
        }
        
        cell.font = cell.font || { name: 'Arial', size: 11 };
        cell.alignment = cell.alignment || { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEAEDED' } },
          left: { style: 'thin', color: { argb: 'FFEAEDED' } },
          bottom: { style: 'thin', color: { argb: 'FFEAEDED' } },
          right: { style: 'thin', color: { argb: 'FFEAEDED' } }
        };

        if (cell.value === 'Pass') {
          cell.font = { ...cell.font, color: { argb: 'FF27AE60' }, bold: true };
        } else if (cell.value === 'Fail') {
          cell.font = { ...cell.font, color: { argb: 'FFC0392B' }, bold: true };
        } else if (cell.value === 'Needs Review') {
          cell.font = { ...cell.font, color: { argb: 'FFD35400' }, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } };
        } else if (cell.value === 'Copied' || cell.value === 'Withheld') {
          cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' }, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE74C3C' } };
        }
      });
      row.height = 20;
    });
  };

  const summarySheet = workbook.addWorksheet('Results Summary', { views: [{ showGridLines: false }] });
  
  const summaryColumns = [
    { header: 'Roll Number', key: 'roll', width: 18 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Total Marks', key: 'total', width: 15 },
    { header: 'Obtained Marks', key: 'obtained', width: 18 },
    { header: 'Percentage', key: 'pct', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  addTitleBlock(summarySheet, exam.title, summaryColumns.length);

  const summaryHeaderRow = summarySheet.getRow(6);
  summaryColumns.forEach((col, i) => {
    const cell = summaryHeaderRow.getCell(i + 1);
    cell.value = col.header;
    summarySheet.getColumn(i + 1).width = col.width;
    summarySheet.getColumn(i + 1).key = col.key;
  });
  styleHeaderRow(summarySheet, 6);

  const sortedStudents = [...students].sort((a, b) => a.roll_number.localeCompare(b.roll_number));

  sortedStudents.forEach(student => {
    const isError = student.status === 'error' || (student.total_obtained_marks === null && student.status !== 'review');
    const obtained = Number(student.total_obtained_marks || 0);
    const percentage = ((obtained / examTotalMarks) * 100).toFixed(1);

    const studentAnswers = answers.filter(a => a.student_id === student.id);
    const isCopied = copiedStudentIds.has(student.id);
    const needsRecheck = studentAnswers.some(a => a.needs_review);

    let gradeStatus = "Graded";
    if (isError) gradeStatus = "Error (Not Graded)";
    else if (isCopied) gradeStatus = "Copied";
    else if (needsRecheck) gradeStatus = "Needs Review";

    summarySheet.addRow({
      roll: student.roll_number,
      name: student.student_name || 'Unknown',
      total: examTotalMarks,
      obtained: isError ? 'N/A' : ((isCopied || needsRecheck) ? 'Withheld' : obtained),
      pct: isError ? '-' : ((isCopied || needsRecheck) ? '-' : `${percentage}%`),
      status: isError ? 'Error (Not Graded)' : ((isCopied || needsRecheck) ? 'Withheld' : (percentage >= passPct ? 'Pass' : 'Fail'))
    });
  });

  applyDataRowStyles(summarySheet, 7);

  const matrixSheet = workbook.addWorksheet('Question Matrix', { views: [{ showGridLines: false }] });
  
  const matrixCols = [
    { header: 'Roll Number', key: 'roll', width: 18 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Total Score', key: 'total', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  questions.forEach(q => {
    matrixCols.push({
      header: `Q${q.question_number}${q.sub_part ? `(${q.sub_part})` : ''}`,
      key: `q_${q.id}`,
      width: 12
    });
  });

  addTitleBlock(matrixSheet, exam.title, matrixCols.length);

  const matrixHeaderRow = matrixSheet.getRow(6);
  matrixCols.forEach((col, i) => {
    const cell = matrixHeaderRow.getCell(i + 1);
    cell.value = col.header;
    matrixSheet.getColumn(i + 1).width = col.width;
    matrixSheet.getColumn(i + 1).key = col.key;
  });
  styleHeaderRow(matrixSheet, 6);

  sortedStudents.forEach(student => {
    const isError = student.status === 'error' || (student.total_obtained_marks === null && student.status !== 'review');
    const studentAnswers = answers.filter(a => a.student_id === student.id);
    const isCopied = copiedStudentIds.has(student.id);
    const needsRecheck = studentAnswers.some(a => a.needs_review);

    let gradeStatus = "Graded";
    if (isError) gradeStatus = "Error (Not Graded)";
    else if (isCopied) gradeStatus = "Copied";
    else if (needsRecheck) gradeStatus = "Needs Review";

    const obtained = Number(student.total_obtained_marks || 0);
    const percentage = ((obtained / examTotalMarks) * 100).toFixed(1);

    const rowObj = {
      roll: student.roll_number,
      name: student.student_name || 'Unknown',
      total: isError ? 'N/A' : ((isCopied || needsRecheck) ? 'Withheld' : obtained),
      status: isError ? 'Error (Not Graded)' : ((isCopied || needsRecheck) ? 'Withheld' : (percentage >= passPct ? 'Pass' : 'Fail'))
    };

    questions.forEach(q => {
      const answer = studentAnswers.find(a => a.question_id === q.id);
      rowObj[`q_${q.id}`] = isError ? 'N/A' : ((isCopied || needsRecheck) ? 'Withheld' : (answer ? answer.obtained_marks : '-'));
    });

    matrixSheet.addRow(rowObj);
  });

  applyDataRowStyles(matrixSheet, 7);

  const flaggedSheet = workbook.addWorksheet('Flagged Answers', { views: [{ showGridLines: false }] });
  
  const flaggedCols = [
    { header: 'Roll Number', key: 'roll', width: 18 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Question', key: 'q', width: 12 },
    { header: 'Obtained Marks', key: 'marks', width: 15 },
    { header: 'Flag Reason', key: 'reason', width: 40 },
    { header: 'AI Feedback', key: 'feedback', width: 60 },
  ];

  addTitleBlock(flaggedSheet, exam.title, flaggedCols.length);

  const flaggedHeaderRow = flaggedSheet.getRow(6);
  flaggedCols.forEach((col, i) => {
    const cell = flaggedHeaderRow.getCell(i + 1);
    cell.value = col.header;
    flaggedSheet.getColumn(i + 1).width = col.width;
    flaggedSheet.getColumn(i + 1).key = col.key;
  });
  styleHeaderRow(flaggedSheet, 6);

  let hasFlags = false;
  sortedStudents.forEach(student => {
    const studentAnswers = answers.filter(a => a.student_id === student.id && a.needs_review);
    studentAnswers.forEach(answer => {
      hasFlags = true;
      const q = questions.find(q => q.id === answer.question_id);
      const qLabel = q ? `Q${q.question_number}${q.sub_part ? `(${q.sub_part})` : ''}` : 'Unknown';
      
      const row = flaggedSheet.addRow({
        roll: student.roll_number,
        name: student.student_name || 'Unknown',
        q: qLabel,
        marks: answer.obtained_marks,
        reason: answer.flag_reason || '',
        feedback: answer.ai_feedback || ''
      });
      
      row.getCell(5).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      row.getCell(6).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      row.height = 60;
    });
  });

  if (!hasFlags) {
    flaggedSheet.addRow({ roll: 'No flagged answers found for this exam.' });
    flaggedSheet.mergeCells(7, 1, 7, flaggedCols.length);
  } else {
    applyDataRowStyles(flaggedSheet, 7);
  }
  
  return await workbook.xlsx.writeBuffer();
}