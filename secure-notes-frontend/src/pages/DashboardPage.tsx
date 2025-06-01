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
        setError('');
      } catch (e: any) {
        setError('Failed to load notes');
      }
    };
    fetchNotes();
  }, [token]);

  return (
    <div style={{
      maxWidth: 700,
      margin: '40px auto',
      padding: '0 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#222',
    }}>
      <h2 style={{
        fontSize: '2.4rem',
        marginBottom: 20,
        fontWeight: '700',
        textAlign: 'center',
      }}>
        Your Notes
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#842029',
          padding: '10px 15px',
          borderRadius: 5,
          marginBottom: 20,
          border: '1px solid #f5c2c7',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      <Link to="/new-note" style={{
        display: 'inline-block',
        marginBottom: 30,
        padding: '12px 24px',
        backgroundColor: '#4f46e5',
        color: '#fff',
        borderRadius: 6,
        textDecoration: 'none',
        fontWeight: '600',
        boxShadow: '0 4px 8px rgba(79, 70, 229, 0.3)',
        transition: 'background-color 0.3s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4338ca')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#4f46e5')}
      >
        + Create New Note
      </Link>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {notes.length === 0 && !error && (
          <p style={{ textAlign: 'center', color: '#555' }}>
            No notes yet. Start creating one!
          </p>
        )}
        {notes.map(note => (
          <li key={note.id} style={{
            backgroundColor: '#fafafa',
            marginBottom: 15,
            padding: 15,
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.2s ease',
          }}>
            <Link 
              to={`/notes/${note.id}`} 
              style={{
                textDecoration: 'none',
                color: '#333',
                fontWeight: '600',
                fontSize: '1.1rem',
                display: 'block',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#4f46e5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333')}
            >
              {note.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;

