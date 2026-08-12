import { answerKey, courses, getLesson } from '../shared/store';
import { isSafeDemoPayload } from '../shared/privacy';

describe('shared lesson contract', () => {
  it('returns questions without answer keys', () => {
    const lesson = getLesson(courses[0].lessonId);
    expect(lesson?.questions).toHaveLength(5);
    expect(JSON.stringify(lesson)).not.toContain('explanation');
    expect(JSON.stringify(lesson)).not.toContain('correctOption');
    expect(answerKey(courses[0].lessonId, 0)?.answer).toBeDefined();
  });

  it('rejects personal or secret-shaped payloads deterministically', () => {
    expect(isSafeDemoPayload({ questionIndex: 0, optionIndex: 1 })).toBe(true);
    expect(isSafeDemoPayload({ token: 'demo-secret' })).toBe(false);
    expect(isSafeDemoPayload({ note: 'contact me at demo@example.test' })).toBe(false);
  });
});
