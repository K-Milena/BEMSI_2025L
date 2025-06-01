import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const fakeKeyRaw = new Uint8Array(32).fill(1);

const str2ab = (str: string) => new TextEncoder().encode(str);
const ab2str = (buf: ArrayBuffer) => new TextDecoder().decode(buf);
const hex2ab = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
};
const ab2hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
const generateIv = () => crypto.getRandomValues(new Uint8Array(12));

async function encryptData(keyRaw: Uint8Array, plaintext: string) {
  const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, [
    'encrypt',
  ]);
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
}

async function decryptData(
  keyRaw: Uint8Array,
  encryptedHex: string,
  ivHex: string
) {
  const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, [
    'decrypt',
  ]);
  const encryptedBuffer = hex2ab(encryptedHex);
  const iv = new Uint8Array(hex2ab(ivHex));
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );
    return ab2str(decrypted);
  } catch {
    return 'Decryption failed or invalid key';
  }
}

const NoteDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [iv, setIv] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [status, setStatus] = useState('Loading note...');

  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      setStatus('Loading note...');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/notes/${id}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) {
          setStatus('Failed to load note');
          return;
        }
        const note = await res.json();
        setTitle(note.title);
        setIv(note.iv);
        setEncryptedData(note.encryptedData);
        const decrypted = await decryptData(fakeKeyRaw, note.encryptedData, note.iv);
        setContent(decrypted);
        setStatus('');
      } catch (e) {
        setStatus('Error fetching note');
        console.error(e);
      }
    };
    fetchNote();
  }, [id]);

  const handleSave = async () => {
    setStatus('Encrypting and saving...');
    try {
      const { encryptedData, iv } = await encryptData(fakeKeyRaw, content);

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/notes`, {
        method: 'POST', // or ideally PUT/PATCH for update
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          title,
          encryptedData,
          iv,
        }),
      });

      if (res.ok) {
        setStatus('Note saved successfully!');
        setEncryptedData(encryptedData);
        setIv(iv);
      } else {
        const data = await res.json();
        setStatus(`Error: ${data.error || 'Failed to save note'}`);
      }
    } catch (e) {
      setStatus('Encryption or network error.');
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this note? This action cannot be undone!')) {
      return;
    }
    setStatus('Deleting note...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/notes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      if (res.ok) {
        setStatus('Note deleted. Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        const data = await res.json();
        setStatus(`Failed to delete note: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      setStatus('Network error while deleting note.');
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Edit Note</h2>
      <label>
        Title (unencrypted):
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>
      <label>
        Content:
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          style={{ width: '100%', marginBottom: 10, fontFamily: 'monospace' }}
        />
      </label>
      <div>
        <button onClick={handleSave} style={{ marginRight: 10, padding: '10px 20px' }}>
          Save Encrypted Note
        </button>
        <button onClick={handleDelete} style={{ marginRight: 10, padding: '10px 20px', backgroundColor: '#d9534f', color: 'white' }}>
          Delete Note
        </button>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px' }}>
          Back to Dashboard
        </button>
      </div>
      <p>{status}</p>
    </div>
  );
};

export default NoteDetailsPage;

