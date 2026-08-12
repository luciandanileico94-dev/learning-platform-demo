import { beforeEach, describe, expect, it } from 'vitest';
import { courses, getCourseProgress, lesson, readProgress, STORAGE_KEY, subjects } from '../shared/store';

describe('catalogul seeded și progresul local', () => {
  beforeEach(() => localStorage.clear());

  it('oferă materii, cursuri și lecții cu exerciții', () => {
    expect(subjects.length).toBeGreaterThanOrEqual(2);
    expect(courses.length).toBeGreaterThanOrEqual(2);
    expect(courses[0].lessons.length).toBeGreaterThanOrEqual(3);
    expect(lesson.exercises.map((item) => item.kind)).toEqual(['choice', 'numeric', 'steps']);
  });

  it('calculează progresul unui curs și citește valori curate', () => {
    expect(getCourseProgress(courses[0], { xp: 0, streak: 0, completedLessonIds: [lesson.id], lessonDone: true })).toMatchObject({ completed: 1, total: 3, percent: 33 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 30, streak: 3, completedLessonIds: [lesson.id], lessonDone: true }));
    expect(readProgress()).toMatchObject({ xp: 30, streak: 3, completedLessonIds: [lesson.id], lessonDone: true });
  });
});
