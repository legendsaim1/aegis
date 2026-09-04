function getTopFrequencies(arrays, limit = 5) {
  const counts = {};
  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === 'string') {
          const lower = item.trim().toLowerCase();
          if (!lower) continue;
          counts[lower] = counts[lower] || { count: 0, original: item.trim() };
          counts[lower].count++;
        }
      }
    }
  }
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(c => c.original);
}

export function calculateTopicStats(questions, answers) {
  if (!questions || !questions.length) return [];
  
  // 1. Group answers by question_id
  const answersByQ = {};
  for (const a of answers) {
    if (!answersByQ[a.question_id]) {
      answersByQ[a.question_id] = [];
    }
    answersByQ[a.question_id].push(a);
  }

  // 2. Calculate basic stats for each question (both parents and subparts)
  const questionStats = new Map(); // question_id -> stats
  
  for (const q of questions) {
    const qAnswers = answersByQ[q.id] || [];
    let totalObtained = 0;
    const totalAttempts = qAnswers.length;
    const maxMarks = Number(q.max_marks) || 0;
    
    const missedArrays = [];
    const coveredArrays = [];
    
    for (const a of qAnswers) {
      totalObtained += Number(a.obtained_marks) || 0;
      if (a.key_points_missed) missedArrays.push(a.key_points_missed);
      if (a.key_points_covered) coveredArrays.push(a.key_points_covered);
    }
    
    const avgObtained = totalAttempts > 0 ? (totalObtained / totalAttempts) : 0;
    const avgPercentage = (maxMarks > 0 && totalAttempts > 0) ? (avgObtained / maxMarks) * 100 : 0;
    
    questionStats.set(q.id, {
      id: q.id,
      question_number: q.question_number,
      sub_part: q.sub_part,
      question_text: q.question_text || '',
      max_marks: maxMarks,
      avg_obtained: Math.round(avgObtained * 10) / 10,
      avg_percentage: Math.round(avgPercentage * 10) / 10,
      total_attempts: totalAttempts,
      top_missed_points: getTopFrequencies(missedArrays),
      top_covered_points: getTopFrequencies(coveredArrays)
    });
  }

  // 3. Roll up parent questions (questions where sub_part is null but have children)
  const childrenByParentNum = {};
  for (const q of questions) {
    if (q.sub_part) {
      if (!childrenByParentNum[q.question_number]) childrenByParentNum[q.question_number] = [];
      childrenByParentNum[q.question_number].push(questionStats.get(q.id));
    }
  }

  for (const q of questions) {
    if (!q.sub_part && childrenByParentNum[q.question_number]) {
      // This is a parent with children. Override its stats with a rollup of its children.
      const children = childrenByParentNum[q.question_number];
      
      let totalWeightedPercentage = 0;
      let totalChildMaxMarks = 0;
      let parentTotalAttempts = 0;
      const allMissedArrays = [];
      const allCoveredArrays = [];
      
      for (const child of children) {
        totalWeightedPercentage += (child.avg_percentage * child.max_marks);
        totalChildMaxMarks += child.max_marks;
        parentTotalAttempts = Math.max(parentTotalAttempts, child.total_attempts);
        
        const cAnswers = answersByQ[child.id] || [];
        for (const a of cAnswers) {
          if (a.key_points_missed) allMissedArrays.push(a.key_points_missed);
          if (a.key_points_covered) allCoveredArrays.push(a.key_points_covered);
        }
      }
      
      const rollupAvgPercentage = totalChildMaxMarks > 0 ? (totalWeightedPercentage / totalChildMaxMarks) : 0;
      
      const stat = questionStats.get(q.id);
      stat.avg_percentage = Math.round(rollupAvgPercentage * 10) / 10;
      stat.total_attempts = parentTotalAttempts;
      stat.top_missed_points = getTopFrequencies(allMissedArrays);
      stat.top_covered_points = getTopFrequencies(allCoveredArrays);
      stat.is_rollup = true;
    }
  }

  // 4. Sort ascending by avg_percentage (weakest first)
  const results = Array.from(questionStats.values()).sort((a, b) => a.avg_percentage - b.avg_percentage);
  return results;
}
