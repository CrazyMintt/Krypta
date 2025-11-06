import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import CredentialDetails from './CredentialDetails';
import './popup.css';

const Popup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<any | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['token'], (result) => {
      if (result.token) {
        setToken(result.token);
      }
    });
  }, []);

  useEffect(() => {
    if (token) {
      fetchCredentials();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch('https://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || 'Invalid email or password');
        return;
      }

      const authToken = `${data.token_type} ${data.access_token}`;
      chrome.storage.local.set({ token: authToken }, () => {
        setToken(authToken);
      });
    } catch (error) {
      console.error('Login failed:', error);
      alert('Server error');
    }
  };

  const fetchCredentials = async () => {
    try {
      const response = await fetch('https://localhost:8000/data/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token!,
        },
        body: JSON.stringify({ page_size: 10, page_number: 1, id_separadores: [] }),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCredentials(data);
      } else {
        setCredentials([]);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['token'], () => {
      setToken(null);
      setCredentials([]);
      setEmail('');
      setPassword('');
    });
  };

  if (token) {
    return (
      <div className="container">
        <div className="header">
          <h1>Krypta</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="content">
          {selectedCredential ? (
            <CredentialDetails credential={selectedCredential} onBack={() => setSelectedCredential(null)} />
          ) : (
            <div>
              <h2>Credentials</h2>
              <ul className="credential-list">
                {credentials.map((cred) => (
                  <li key={cred.id} onClick={() => setSelectedCredential(cred)}>
                    {cred.nome_aplicacao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Krypta</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">Login</button>
      </form>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Popup />);