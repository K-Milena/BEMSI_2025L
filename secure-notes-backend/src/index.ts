import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import { pool } from './db/db';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
