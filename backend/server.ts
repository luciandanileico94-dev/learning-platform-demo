import express from 'express';
import cors from 'cors';
import { lesson } from '../shared/store';

// Kept as an optional local preview server. The published demo does not call it.
export const app = express();
app.use(cors());
app.get('/api/lesson', (_req, res) => res.json(lesson));

if (process.env.NODE_ENV !== 'test') app.listen(3001, () => console.log('Server opțional disponibil la http://localhost:3001'));
