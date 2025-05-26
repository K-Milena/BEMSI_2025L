import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  iv: string;
}

const DashboardPage = () => {
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get('http://localhost:3000/notes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNotes(res.data);
      } catch (e: any) {
        setError('Failed to load notes');
      }
    };
    fetchNotes();
  }, [token]);

  return (
    <div>
      <h2>Your Notes</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <Link to="/new-note">Create new note</Link>
      <ul>
        {notes.map(note => (
          <li key={note.id}>
            <Link to={`/notes/${note.id}`}>{note.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;
