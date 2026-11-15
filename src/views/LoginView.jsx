import { useState } from 'react';
import { iniciarSesion } from '../services/authService';
import TemaToggle from '../components/TemaToggle';

export default function LoginView({ preferencia, onCambiarTema }) {
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
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <h1>Sistema de Lecturas</h1>
            <p>Inicia sesión para registrar lecturas de noviembre.</p>
          </div>
          <TemaToggle preferencia={preferencia} onCambiar={onCambiarTema} />
        </div>

        <div>
          <label className="bloque" htmlFor="correo">
            Correo
          </label>
          <input
            id="correo"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="bloque" htmlFor="clave">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="error-caja">{error}</div>}

        <button type="submit" className="btn btn-primario" disabled={enviando} style={{ minHeight: 44 }}>
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
