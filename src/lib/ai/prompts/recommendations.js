export const getRecommendationPrompt = (weakTopics) => {
  return `You are an expert Teacher AI assistant analyzing exam results.
Your task is to review the weakest topics from a recent exam and provide concrete, actionable teaching recommendations to improve student performance.

Here are the weakest topics (sorted from lowest average percentage to highest):
${JSON.stringify(weakTopics, null, 2)}

CRITICAL RULES:
1. Provide a recommendation for each topic in the input.
2. The recommendation MUST be a short, concrete, teacher-facing suggestion based on the 'top_missed_points' and 'top_covered_points'. Focus on the concepts students missed. Do NOT restate the score or state the obvious.
3. Classify "difficulty_label" as follows:
   - "Easy" if avg_percentage >= 70
   - "Medium" if avg_percentage is between 40 and 69.9
   - "Hard" if avg_percentage < 40
4. Output STRICT JSON format as a JSON array exactly matching the schema below.
5. Do NOT include markdown code blocks (e.g., \`\`\`json) or conversational text.

EXPECTED JSON SCHEMA:
{
  "recommendations": [
    {
      "question_number": 1,
      "sub_part": "a",
      "difficulty_label": "Hard",
      "avg_percentage": 30.5,
      "recommendation": "Review balancing equations with visual props, specifically focusing on balancing coefficients."
    }
  ]
}`;
};
