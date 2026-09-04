export const getRubricPrompt = ({
  question_text,
  question_type,
  max_marks,
  subject
}) => {
  return `You are an expert ${subject} teacher. Generate a comprehensive grading rubric for the following question.

Question: ${question_text}
Question Type: ${question_type}
Max Marks: ${max_marks}

Your task is to produce a structured JSON rubric that an AI grader will use to evaluate student answers.

CRITICAL RULES:

1. The sum of all criteria 'marks' MUST EXACTLY EQUAL ${max_marks}. Before returning, re-add your criteria marks and confirm the total matches ${max_marks} exactly. If it does not, adjust the marks (not the wording) until it does.

2. For MCQ: Provide the exact correct answer in the 'correct_answer' field. Under 'criteria', you may include points for the correct answer, and mention common distractors to help the grader understand common mistakes.

3. For short answer: Generate 2-4 key points in 'criteria' that the student must cover to get full marks.

4. For long answer: Generate 4-8 criteria covering core content, structure, and relevant examples.

5. For fill-in-blank: Provide the exact correct answer and acceptable alternatives in 'correct_answer'.

6. 'OR' Questions: If the question contains an "OR" (meaning the student can choose between two different prompts in a single question), you MUST generate criteria for BOTH options. Prefix the criteria for the first option with "[Option 1]" and the second option with "[Option 2]". The sum of marks for Option 1 must equal ${max_marks}, AND the sum of marks for Option 2 must equal ${max_marks} separately. Keywords should also be split so it's clear which option each keyword belongs to (e.g., "[Option 1] keyword").

7. Labeled sub-parts (a/b/c, i/ii/iii, etc.): If the question has explicit sub-parts, generate one criterion per sub-part (not per option) and split the marks across sub-parts as evenly as the question implies. Do not collapse multiple sub-parts into a single criterion, and do not add a sub-part that doesn't exist in the question.

8. MATCH THE COMMAND VERB — this determines both what to require and how many criteria to write:
   - "state / give / list / name / write down / enlist" → the student only needs to correctly state each item. Do NOT add criteria for explanation, significance, definitions, or examples unless the question separately asks for them.
   - "explain / describe / discuss / justify / differentiate / derive / how does" → the student must show reasoning or mechanism, not just name the concept. Criteria should test the specific reasoning steps expected, not just keyword presence.
   - Never require both a bare list AND an explanation unless the question explicitly asks for both.

9. STRICT FAITHFULNESS: Do NOT invent criteria the question does not explicitly ask for. If a question asks for an open-ended list (e.g., "any three uses"), generate exactly that many repeatable, equally-weighted criteria (e.g., "Correct use #1 (1 mark)", "Correct use #2 (1 mark)", "Correct use #3 (1 mark)") — one mark per item, up to the number requested. CRITICAL: Do NOT put specific examples inside the criteria text (e.g., do NOT write "Correct use #1 (e.g., energy storage)"). Pre-selecting specific examples causes the grader to rigidly mark other valid answers incorrect. Any scientifically/factually correct item should satisfy the criterion.

10. ATOMIC, NON-OVERLAPPING CRITERIA: Each criterion must test one distinct, independently gradable requirement. Do not split the same idea into two criteria worded differently (e.g., "advantages of urea" and "benefits of urea for crop yield" are the same requirement — do not list both).

11. Numerical / derivation questions: Break marks across the actual steps a grader can check independently (e.g., correct setup/expression, correct substitution or derivation logic, correct final answer with units). Don't award all marks to only the final numeric answer if the question involves a multi-step derivation.

12. Diagram / process-flow questions: Criteria should check for the specific labeled stages, reagents, or steps the diagram must contain, and correct sequence/direction — not general "diagram clarity."

13. 'keywords': Provide an array of specific terms, vocabulary, or core concepts the AI grader MUST look for in student answers.

14. 'partial_credit': Set to true if a student can earn partial marks for incomplete answers (usually false for MCQ/fill-in-blank, true for short/long answers).

15. ALWAYS return ONLY valid JSON. Do not include markdown code blocks (e.g., \`\`\`json) or any conversational text.

WORKED EXAMPLE (for calibration only — do not copy into unrelated questions):
Question: "Give any three uses of organic compounds OR What are advantages of urea as a fertilizer? (any three)" | Max Marks: 3
Correct output shape:
{
  "criteria": [
    { "point": "[Option 1] Correct use #1 of organic compounds", "marks": 1 },
    { "point": "[Option 1] Correct use #2 of organic compounds", "marks": 1 },
    { "point": "[Option 1] Correct use #3 of organic compounds", "marks": 1 },
    { "point": "[Option 2] Correct advantage #1 of urea as fertilizer", "marks": 1 },
    { "point": "[Option 2] Correct advantage #2 of urea as fertilizer", "marks": 1 },
    { "point": "[Option 2] Correct advantage #3 of urea as fertilizer", "marks": 1 }
  ],
  "keywords": ["[Option 1] medicines", "[Option 1] fuels", "[Option 1] dyes", "[Option 1] plastics", "[Option 2] nitrogen content", "[Option 2] solubility", "[Option 2] non-corrosive"],
  "correct_answer": null,
  "partial_credit": true
}
Note there is no "definition," "explanation," or "example" criterion — the question only says "give"/"advantages," so only the listed items are graded.

EXPECTED JSON FORMAT:
{
  "criteria": [
    { "point": "[Option 1] Specific requirement or point", "marks": 2 }
  ],
  "keywords": ["term1", "term2"],
  "correct_answer": "...",
  "partial_credit": true
}`;
};