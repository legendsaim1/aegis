import { describe, it, expect } from 'vitest';
import { filterCandidatesForQuestion } from './copyDetectionFilter';

describe('Copy Detection Filter', () => {
  const question = { id: 'q1', max_marks: 5 };

  it('should filter out answers below minimum length', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'short', obtained_marks: 0 },
      { id: '2', student_id: 's2', extracted_text: 'short', obtained_marks: 0 }
    ];
    // length is 5 < 15
    const candidates = filterCandidatesForQuestion(question, answers, { minLength: 15 });
    expect(candidates.length).toBe(0);
  });

  it('should return highly similar pairs above the threshold', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'The mitochondria is the powerhouse of the cell and produces ATP.', obtained_marks: 3 },
      { id: '2', student_id: 's2', extracted_text: 'The mitochondria is the powerhouse of the cell and produces ATP.', obtained_marks: 3 }
    ];
    const candidates = filterCandidatesForQuestion(question, answers, { similarityThreshold: 0.85 });
    expect(candidates.length).toBe(1);
    expect(candidates[0].studentA).toBeDefined();
    expect(candidates[0].studentB).toBeDefined();
    expect(candidates[0].textA).toContain('mitochondria');
  });

  it('should FLAG pairs that are short but identical, unless they match the rubric', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'The powerhouse of the cell.', obtained_marks: 5 },
      { id: '2', student_id: 's2', extracted_text: 'The powerhouse of the cell.', obtained_marks: 5 }
    ];
    // With AND logic, short answers (< 30 words) are only discounted if they also match the rubric.
    // Since there is no rubric here, it should be flagged as a candidate.
    const candidates = filterCandidatesForQuestion(question, answers, { similarityThreshold: 0.85 });
    expect(candidates.length).toBe(1);
  });

  it('should discount pairs that are short AND highly match the rubric', () => {
    const qWithRubric = { 
      id: 'q1', 
      max_marks: 5,
      rubric: "The powerhouse of the cell."
    };
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'The powerhouse of the cell.', obtained_marks: 5 },
      { id: '2', student_id: 's2', extracted_text: 'The powerhouse of the cell.', obtained_marks: 5 }
    ];
    // These are short AND rigid matches to the rubric, so they should be discounted as coincidental.
    const candidates = filterCandidatesForQuestion(qWithRubric, answers, { similarityThreshold: 0.85 });
    expect(candidates.length).toBe(0);
  });

  it('should NOT discount pairs that both got full marks if answers are long', () => {
    const answers = [
      { 
        id: '1', student_id: 's1', obtained_marks: 5,
        extracted_text: 'The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate.'
      },
      { 
        id: '2', student_id: 's2', obtained_marks: 5,
        extracted_text: 'The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate.'
      }
    ];
    // 37 words, so > 20 words. No rubric match so shouldn't discount.
    const candidates = filterCandidatesForQuestion(question, answers, { similarityThreshold: 0.85 });
    expect(candidates.length).toBe(1);
  });

  it('should discount pairs that are long but very close to the rubric ideal answer (rigid format)', () => {
    const qWithRubric = { 
      id: 'q1', 
      max_marks: 5,
      rubric: "Calculate the molar mass of CO2 which is 44g/mol and use PV=nRT"
    };
    const answers = [
      { 
        id: '1', student_id: 's1', obtained_marks: 5,
        extracted_text: 'Calculate the molar mass of CO2 which is 44g/mol and use PV=nRT to find the answer to this question.'
      },
      { 
        id: '2', student_id: 's2', obtained_marks: 5,
        extracted_text: 'Calculate the molar mass of CO2 which is 44g/mol and use PV=nRT exactly as requested.'
      }
    ];
    // These are independent correct derivations, both >20 words but very close to rubric.
    // They should get discounted.
    const candidates = filterCandidatesForQuestion(qWithRubric, answers, { similarityThreshold: 0.45 });
    expect(candidates.length).toBe(0);
  });

  it('should NOT discount pairs that are long and very similar to EACH OTHER but NOT to the rubric (genuine copying)', () => {
    const qWithRubric = { 
      id: 'q1', 
      max_marks: 5,
      rubric: "Photosynthesis produces oxygen."
    };
    const answers = [
      { 
        id: '1', student_id: 's1', obtained_marks: 5,
        extracted_text: 'The plant does a really weird thing where it takes the sun and turns it into air we can breathe and the leaves get green because of the magical chlorophyll stuff.'
      },
      { 
        id: '2', student_id: 's2', obtained_marks: 5,
        extracted_text: 'The plant does a really weird thing where it takes the sun and turns it into air we can breathe and the leaves get green because of the magical chlorophyll stuff.'
      }
    ];
    // Long answers (>20 words), similar to each other, but totally different phrasing than the rubric.
    // Must NOT be discounted.
    const candidates = filterCandidatesForQuestion(qWithRubric, answers, { similarityThreshold: 0.85 });
    expect(candidates.length).toBe(1);
  });
});
