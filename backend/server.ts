import express from 'express';
import cors from 'cors';
import { answerKey, courses, domains, getLesson, progress } from '../shared/store';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/courses', (_req, res) => res.json({ domains, courses }));
app.get('/api/lessons/:id', (req, res) => {
  const lesson = getLesson(req.params.id);
  return lesson ? res.json(lesson) : res.status(404).json({ error: 'Lecția nu există.' });
});
app.post('/api/lessons/:id/answer', (req, res) => {
  const { questionIndex, optionIndex } = req.body as { questionIndex?: unknown; optionIndex?: unknown };
  const key = typeof questionIndex === 'number' && typeof optionIndex === 'number' ? answerKey(req.params.id, questionIndex) : undefined;
  if (!key) return res.status(400).json({ error: 'Răspuns invalid.' });
  return res.json({ correct: key.answer === optionIndex, explanation: key.explanation, correctOption: key.answer, score: key.answer === optionIndex ? 1 : 0 });
});
app.post('/api/courses/:id/complete', (req, res) => {
  if (!courses.some((course) => course.id === req.params.id)) return res.status(404).json({ error: 'Cursul nu există.' });
  if (!progress.completedCourseIds.includes(req.params.id)) progress.completedCourseIds.push(req.params.id);
  return res.json({ ...progress });
});

if (process.env.NODE_ENV !== 'test') app.listen(3001, () => console.log('API disponibil la http://localhost:3001'));
