export default function DashboardView({
  zonas,
  acometidas,
  totalActivos,
  totalLeidosGlobal,
  totalPendientesGlobal,
  porcentajeAvance
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#eff6ff', padding: 15, borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1d4ed8' }}>{totalActivos}</div>
          <div style={{ fontSize: '0.8rem', color: '#374151' }}>Activos en Ruta</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: 15, borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#16a34a' }}>{totalLeidosGlobal}</div>
          <div style={{ fontSize: '0.8rem', color: '#374151' }}>Leídos Nov</div>
        </div>
        <div style={{ background: '#fff7ed', padding: 15, borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ea580c' }}>{totalPendientesGlobal}</div>
          <div style={{ fontSize: '0.8rem', color: '#374151' }}>Faltantes</div>
        </div>
      </div>

      <div style={{ marginBottom: 25 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 'bold', fontSize: '0.9rem' }}>
          <span>Progreso General de Noviembre</span>
          <span>{porcentajeAvance}%</span>
        </div>
        <div style={{ width: '100%', height: 18, background: '#e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ width: `${porcentajeAvance}%`, height: '100%', background: '#16a34a', transition: 'width 0.4s' }} />
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Avance por Zona</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {zonas.map((z) => {
          const acomZona = acometidas.filter((a) => a.zona_id === z.id);
          const leidosZona = acomZona.filter((a) => Boolean(a.lectura_noviembre)).length;
          const pctZona = acomZona.length > 0 ? Math.round((leidosZona / acomZona.length) * 100) : 0;

          return (
            <div key={z.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 6 }}>
                <b>{z.nombre_zona}</b>
                <span>
                  {leidosZona} / {acomZona.length} ({pctZona}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pctZona}%`, height: '100%', background: '#2563eb' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
