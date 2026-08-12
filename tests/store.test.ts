import { lesson, readProgress, STORAGE_KEY } from '../shared/store';

describe('conținutul sigur al demo-ului', () => {
  it('are două carduri de predare și trei tipuri de exercițiu', () => {
    expect(lesson.teachingCards).toHaveLength(2);
    expect(lesson.exercises.map((item) => item.kind)).toEqual(['choice', 'numeric', 'steps']);
  });

  it('citește progresul local și revine la valori curate', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 30, streak: 3, lessonDone: true }));
    expect(readProgress()).toMatchObject({ xp: 30, streak: 3, lessonDone: true });
    localStorage.removeItem(STORAGE_KEY);
  });
});
