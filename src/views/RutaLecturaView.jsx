import { useState } from 'react';
import ModalCaptura from '../components/ModalCaptura';

export default function RutaLecturaView({
  zonas,
  acometidas,
  filtroZona,
  setFiltroZona,
  busqueda,
  setBusqueda,
  listaPendientes,
  listaLeidos,
  acometidaActiva,
  abrirCaptura,
  capturaProps
}) {
  const [subTabRuta, setSubTabRuta] = useState('pendientes');

  if (acometidaActiva) {
    return <ModalCaptura acometidaActiva={acometidaActiva} {...capturaProps} />;
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap' }}>
        <select
          value={filtroZona}
          onChange={(e) => setFiltroZona(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', flex: '1 1 160px' }}
        >
          <option value="TODAS">Todas las Zonas ({acometidas.length})</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre_zona}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por N°, nombre, medidor o caserío..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', flex: '2 1 220px' }}
        />
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 12 }}>
        <button
          onClick={() => setSubTabRuta('pendientes')}
          style={{
            flex: 1,
            padding: 10,
            border: 'none',
            background: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderBottom: subTabRuta === 'pendientes' ? '3px solid #ea580c' : 'none',
            color: subTabRuta === 'pendientes' ? '#ea580c' : '#6b7280'
          }}
        >
          Pendientes ({listaPendientes.length})
        </button>
        <button
          onClick={() => setSubTabRuta('leidos')}
          style={{
            flex: 1,
            padding: 10,
            border: 'none',
            background: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderBottom: subTabRuta === 'leidos' ? '3px solid #16a34a' : 'none',
            color: subTabRuta === 'leidos' ? '#16a34a' : '#6b7280'
          }}
        >
          Ya Leídos ({listaLeidos.length})
        </button>
      </div>

      {subTabRuta === 'pendientes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listaPendientes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
              No hay lecturas pendientes con este filtro.
            </p>
          ) : (
            listaPendientes.map((a) => (
              <div
                key={a.id}
                onClick={() => abrirCaptura(a)}
                style={{
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderLeft: '4px solid #ea580c',
                  borderRadius: 8,
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    No. {a.numero_servicio} — {a.nombre_beneficiario}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                    {a.nombre_zona} • {a.nombre_caserio} • Medidor: <b>{a.medidor_numero || 'S/N'}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 75 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Base Oct</div>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{a.lectura_base}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTabRuta === 'leidos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listaLeidos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
              Aún no se han registrado lecturas en esta zona.
            </p>
          ) : (
            listaLeidos.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 12,
                  border: '1px solid #d1fae5',
                  borderLeft: '4px solid #16a34a',
                  borderRadius: 8,
                  background: '#f0fdf4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    No. {a.numero_servicio} — {a.nombre_beneficiario}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 2 }}>
                    {a.nombre_zona} • {a.nombre_caserio} • Consumo: <b>{a.lectura_noviembre.consumo_m3} m³</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Lectura Nov</div>
                  <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '1rem' }}>
                    {a.lectura_noviembre.lectura_actual}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
