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
      <div className="stat-grid">
        <div className="stat azul">
          <strong>{totalActivos}</strong>
          <span>Activos en Ruta</span>
        </div>
        <div className="stat verde">
          <strong>{totalLeidosGlobal}</strong>
          <span>Leídos Nov</span>
        </div>
        <div className="stat naranja">
          <strong>{totalPendientesGlobal}</strong>
          <span>Faltantes</span>
        </div>
      </div>

      <div className="progreso">
        <div className="progreso-head">
          <span>Progreso General de Noviembre</span>
          <span>{porcentajeAvance}%</span>
        </div>
        <div className="barra">
          <span style={{ width: `${porcentajeAvance}%` }} />
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Avance por Zona</h3>
      {zonas.map((z) => {
        const acomZona = acometidas.filter((a) => a.zona_id === z.id);
        const leidosZona = acomZona.filter((a) => Boolean(a.lectura_noviembre)).length;
        const pctZona = acomZona.length > 0 ? Math.round((leidosZona / acomZona.length) * 100) : 0;

        return (
          <div key={z.id} className="zona-card">
            <div className="progreso-head" style={{ fontSize: '0.9rem' }}>
              <b>{z.nombre_zona}</b>
              <span>
                {leidosZona} / {acomZona.length} ({pctZona}%)
              </span>
            </div>
            <div className="barra azul">
              <span style={{ width: `${pctZona}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
