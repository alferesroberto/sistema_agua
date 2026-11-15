export default function DashboardView({
  acometidas,
  totalActivos,
  totalLeidosGlobal,
  totalPendientesGlobal,
  porcentajeAvance
}) {
  const porCaserio = [];
  const indice = new Map();

  acometidas.forEach((a) => {
    const clave = a.caserio_id || a.nombre_caserio;
    if (!indice.has(clave)) {
      const item = {
        id: clave,
        nombre: a.nombre_caserio,
        zona: a.nombre_zona,
        total: 0,
        leidos: 0
      };
      indice.set(clave, item);
      porCaserio.push(item);
    }
    const item = indice.get(clave);
    item.total += 1;
    if (a.lectura_noviembre) item.leidos += 1;
  });

  porCaserio.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

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

      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Avance por Caserío</h3>
      {porCaserio.map((c) => {
        const pct = c.total > 0 ? Math.round((c.leidos / c.total) * 100) : 0;

        return (
          <div key={c.id} className="zona-card">
            <div className="progreso-head" style={{ fontSize: '0.9rem' }}>
              <div>
                <b>{c.nombre}</b>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', fontWeight: 400 }}>{c.zona}</div>
              </div>
              <span>
                {c.leidos} / {c.total} ({pct}%)
              </span>
            </div>
            <div className="barra azul">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
