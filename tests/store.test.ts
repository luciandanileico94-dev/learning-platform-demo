import { answerKey, courses, getLesson } from '../shared/store';

describe('shared lesson contract', () => {
  it('returns questions without answer keys', () => {
    const lesson = getLesson(courses[0].lessonId);
    expect(lesson?.questions).toHaveLength(5);
    expect(JSON.stringify(lesson)).not.toContain('explanation');
    expect(JSON.stringify(lesson)).not.toContain('correctOption');
    expect(answerKey(courses[0].lessonId, 0)?.answer).toBeDefined();
  });
});
