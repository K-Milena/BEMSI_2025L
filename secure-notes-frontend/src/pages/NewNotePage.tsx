import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewNotePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const fakeKeyRaw = new Uint8Array(32).fill(1);
  const str2ab = (str: string) => new TextEncoder().encode(str);
  const ab2hex = (buffer: ArrayBuffer) =>
    [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  const generateIv = () => crypto.getRandomValues(new Uint8Array(12));

  const encryptData = async (keyRaw: Uint8Array, plaintext: string) => {
    const key = await crypto.subtle.importKey(
      'raw',
      keyRaw,
      'AES-GCM',
      false,
      ['encrypt']
    );
    const iv = generateIv();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      str2ab(plaintext)
    );
    return {
      encryptedData: ab2hex(encrypted),
      iv: ab2hex(iv.buffer),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Encrypting and sending...');

    try {
      const { encryptedData, iv } = await encryptData(fakeKeyRaw, content);

      const res = await fetch('http://localhost:3000/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({
          title,
          encryptedData,
          iv,
        }),
      });

      if (res.ok) {
        setStatus('Note saved successfully!');
        setTitle('');
        setContent('');
      } else {
        const data = await res.json();
        setStatus(`Error: ${data.error || 'Failed to save note'}`);
      }
    } catch (err) {
      setStatus('Encryption or network error.');
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>New Encrypted Note</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title (not encrypted yet):
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>
        <label>
          Content:
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={10}
            style={{ width: '100%', marginBottom: 10, fontFamily: 'monospace' }}
          />
        </label>
        <button type="submit" style={{ padding: '10px 20px', marginRight: 10 }}>
          Save Encrypted Note
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ padding: '10px 20px' }}
        >
          Back to Dashboard
        </button>
      </form>
      <p>{status}</p>
    </div>
  );
};

export default NewNotePage;

