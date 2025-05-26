import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { addUser, findUserByEmail } from './db/users';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Backend działa!' });
});

app.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  if (findUserByEmail(email)) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = addUser(email, passwordHash);

  res.status(201).json({ message: 'User created', userId: newUser.id });
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
 
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.json({ userId: req.user.userId, email: req.user.email });
});

// Simple in-memory store for demo
const notes: { id: string; userId: string; title: string; encryptedData: string; iv: string }[] = [];

app.post('/notes', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { title, encryptedData, iv } = req.body;
  if (!title || !encryptedData || !iv) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const newNote = {
    id: crypto.randomUUID(),
    userId: req.user.userId,
    title,
    encryptedData,
    iv,
  };
  notes.push(newNote);
  res.status(201).json({ message: 'Note saved', noteId: newNote.id });
});

app.get('/notes', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userNotes = notes.filter(note => note.userId === req.user!.userId);
  // Return only metadata, not encryptedData for listing
  const metadata = userNotes.map(({ id, title, iv }) => ({ id, title, iv }));
  res.json(metadata);
});

app.get('/notes/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

const note = notes.find(n => n.userId === req.user!.userId && n.id === req.params.id);

  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  res.json(note);
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

