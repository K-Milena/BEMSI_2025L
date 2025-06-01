import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_string';


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

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { email, password: passwordHash },  // <--- zapisz hash, nie plain
  });

  res.status(201).json({ message: 'User created', userId: newUser.id });
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
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

app.post('/notes', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, encryptedData, iv } = req.body;
  if (!title || !encryptedData || !iv) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const newNote = await prisma.note.create({
    data: {
      userId: req.user.userId,
      title,
      encryptedData,
      iv,
    },
  });

  res.status(201).json({ message: 'Note saved', noteId: newNote.id });
});

app.get('/notes', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userNotes = await prisma.note.findMany({
    where: { userId: req.user.userId },
    select: { id: true, title: true, iv: true }, // metadata only
  });

  res.json(userNotes);
});

app.get('/notes/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const note = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.userId,
    },
  });

  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  res.json(note);
});

// DELETE /notes/:id - delete a note by ID
app.delete('/notes/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const noteId = req.params.id;

  try {
    // Sprawdź, czy notatka należy do użytkownika
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.userId,
      },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found or access denied' });
      return;
    }

    // Usuń notatkę
    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

