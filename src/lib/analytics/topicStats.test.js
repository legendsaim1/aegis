import { describe, it, expect } from 'vitest';
import { calculateTopicStats } from './topicStats';

describe('calculateTopicStats', () => {
  it('calculates average score correctly for standalone questions', () => {
    const questions = [
      { id: 'q1', question_number: 1, sub_part: null, max_marks: 4 }
    ];
    const answers = [
      { question_id: 'q1', obtained_marks: 2, key_points_missed: ['a'] },
      { question_id: 'q1', obtained_marks: 3, key_points_missed: ['b'] },
      { question_id: 'q1', obtained_marks: 4, key_points_missed: ['a'] }
    ];
    
    const stats = calculateTopicStats(questions, answers);
    expect(stats).toHaveLength(1);
    expect(stats[0].avg_obtained).toBe(3);
    expect(stats[0].avg_percentage).toBe(75);
    expect(stats[0].total_attempts).toBe(3);
    expect(stats[0].top_missed_points).toEqual(['a', 'b']);
  });

  it('rolls up subparts into parent question and sorts ascending by avg_percentage', () => {
    const questions = [
      { id: 'p1', question_number: 1, sub_part: null, max_marks: 10 },
      { id: 's1a', question_number: 1, sub_part: 'a', max_marks: 4 },
      { id: 's1b', question_number: 1, sub_part: 'b', max_marks: 6 }
    ];
    
    const answers = [
      // 1a avg = 2/4 (50%)
      { question_id: 's1a', obtained_marks: 2 },
      { question_id: 's1a', obtained_marks: 2 },
      // 1b avg = 6/6 (100%)
      { question_id: 's1b', obtained_marks: 6 },
      { question_id: 's1b', obtained_marks: 6 }
    ];
    
    const stats = calculateTopicStats(questions, answers);
    expect(stats).toHaveLength(3);
    
    // Parent rollup = (50% * 4) + (100% * 6) / 10 = (200 + 600)/10 = 80%
    
    // Expected order: s1a (50%), p1 (80%), s1b (100%)
    expect(stats[0].sub_part).toBe('a');
    expect(stats[0].avg_percentage).toBe(50);
    
    expect(stats[1].sub_part).toBeNull();
    expect(stats[1].avg_percentage).toBe(80);
    
    expect(stats[2].sub_part).toBe('b');
    expect(stats[2].avg_percentage).toBe(100);
  });

  it('handles empty answers gracefully', () => {
    const questions = [
      { id: 'q1', question_number: 1, sub_part: null, max_marks: 4 }
    ];
    const stats = calculateTopicStats(questions, []);
    expect(stats).toHaveLength(1);
    expect(stats[0].avg_percentage).toBe(0);
  });
});
