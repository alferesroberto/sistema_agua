export default function Navbar({
  vistaActiva,
  onCambiarVista,
  totalLeidos,
  totalActivos,
  porcentajeAvance,
  casosAtencion,
  onActualizar,
  onCerrarSesion
}) {
  const tabs = [
    { id: 'ruta', label: 'Ruta Lectura' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mapa', label: 'Mapa GPS' },
    { id: 'reportes', label: `Exportar / Alertas (${casosAtencion})` }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>Sistema de Lecturas — Noviembre 2026</h2>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Avance: <b>{totalLeidos}</b> de <b>{totalActivos}</b> activos ({porcentajeAvance}%)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onActualizar}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
          >
            Actualizar
          </button>
          <button
            onClick={onCerrarSesion}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 15 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onCambiarVista(tab.id)}
            style={{
              padding: '10px 6px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer',
              background: vistaActiva === tab.id ? '#2563eb' : '#e5e7eb',
              color: vistaActiva === tab.id ? '#fff' : '#374151'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
