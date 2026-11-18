import { useState } from 'react';
import { acometidasDeLaZona } from '../services/acometidasService';

export default function OrdenRutaPanel({ acometida, acometidas, onUbicar, compacto = false }) {
  const [despuesDeId, setDespuesDeId] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!acometida?.zona_id) return null;

  const vecinos = acometidasDeLaZona(acometidas, acometida.zona_id);
  const indice = vecinos.findIndex((a) => a.id === acometida.id);
  const opciones = vecinos.filter((a) => a.id !== acometida.id);

  async function aplicar(e) {
    e.preventDefault();
    e.stopPropagation();
    setGuardando(true);
    try {
      await onUbicar(acometida.id, despuesDeId || null);
    } finally {
      setGuardando(false);
    }
  }

  async function mover(direccion) {
    if (guardando) return;
    if (direccion === 'subir' && indice <= 0) return;
    if (direccion === 'bajar' && (indice < 0 || indice >= vecinos.length - 1)) return;

    const destinoId = direccion === 'subir' ? (indice <= 1 ? null : vecinos[indice - 2].id) : vecinos[indice + 1].id;

    setGuardando(true);
    try {
      await onUbicar(acometida.id, destinoId);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={`orden-ruta-panel${compacto ? ' is-compacto' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="orden-ruta-botones">
        <button
          type="button"
          className="btn btn-icono"
          title="Subir en la ruta"
          disabled={guardando || indice <= 0}
          onClick={() => mover('subir')}
        >
          ↑
        </button>
        <button
          type="button"
          className="btn btn-icono"
          title="Bajar en la ruta"
          disabled={guardando || indice < 0 || indice >= vecinos.length - 1}
          onClick={() => mover('bajar')}
        >
          ↓
        </button>
      </div>

      {!compacto && (
        <form onSubmit={aplicar} className="orden-ruta-form">
          <label className="bloque" htmlFor={`ubicar-${acometida.id}`}>
            Ubicar después de (misma zona)
          </label>
          <select
            id={`ubicar-${acometida.id}`}
            value={despuesDeId}
            onChange={(e) => setDespuesDeId(e.target.value)}
          >
            <option value="">Al inicio de la zona</option>
            {opciones.map((a) => (
              <option key={a.id} value={a.id}>
                Ruta #{a.orden_ruta ?? '—'} · No. {a.numero_servicio} — {a.nombre_beneficiario}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando posición...' : 'Mover en ruta'}
          </button>
        </form>
      )}
    </div>
  );
}
