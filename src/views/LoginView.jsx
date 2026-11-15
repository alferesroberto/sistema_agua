import { useState } from 'react';
import { iniciarSesion } from '../services/authService';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        background: '#eff6ff',
        padding: 16
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 8px 24px rgba(30, 58, 138, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>Sistema de Lecturas</h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            Inicia sesión para registrar lecturas de noviembre.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: 4 }}>
            Correo
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: 4 }}>
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: 12,
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
