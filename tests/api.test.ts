import type { AddressInfo } from 'node:net';
import { app } from '../backend/server';
import { courses } from '../shared/store';

describe('API flow', () => {
  it('answers and completes idempotently', async () => {
    const server = app.listen(0);
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}/api`;
    const lesson = await (await fetch(`${base}/lessons/${courses[0].lessonId}`)).json() as { questions: unknown[] };
    expect(lesson.questions).toHaveLength(5);
    const answer = await (await fetch(`${base}/lessons/${courses[0].lessonId}/answer`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ questionIndex:0, optionIndex:0 }) })).json() as { correct: boolean };
    expect(answer.correct).toBe(true);
    const complete = () => fetch(`${base}/courses/${courses[0].id}/complete`, { method:'POST' }).then((r) => r.json()) as Promise<{ completedCourseIds: string[] }>;
    const first = await complete(); const second = await complete();
    expect(first.completedCourseIds).toEqual(second.completedCourseIds);
    server.close();
  });
});
