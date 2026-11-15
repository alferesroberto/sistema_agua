import { exportarLecturasCsv, exportarReporteAtencionCsv } from '../utils/exportCsv';

export default function ReportesView({ acometidas, casosAtencion, totalLeidosGlobal }) {
  return (
    <div className="reportes">
      <div className="bloque">
        <h3 style={{ marginBottom: 8, fontSize: '1rem' }}>Exportar Lecturas Realizadas (Noviembre)</h3>
        <p style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
          Descarga el archivo CSV listo para abrir en Excel con ID, Nombre Completo del Beneficiario, Zona, Caserío,
          Lecturas y Consumo en m³.
        </p>
        <button type="button" className="btn btn-primario" onClick={() => exportarLecturasCsv(acometidas)}>
          Descargar Excel / CSV de Lecturas ({totalLeidosGlobal})
        </button>
      </div>

      <div className="bloque alerta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <h3 style={{ fontSize: '1rem' }}>Casos que Requieren Atención ({casosAtencion.length})</h3>
          {casosAtencion.length > 0 && (
            <button type="button" className="btn btn-peligro-solido" onClick={() => exportarReporteAtencionCsv(casosAtencion)}>
              Exportar
            </button>
          )}
        </div>

        {casosAtencion.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--peligro-texto)' }}>
            No se han reportado novedades o medidores dañados en noviembre.
          </p>
        ) : (
          casosAtencion.map((a) => (
            <div key={a.id} className="caso">
              <div style={{ fontWeight: 'bold', color: 'var(--peligro-texto)' }}>
                No. {a.numero_servicio} — {a.nombre_beneficiario} ({a.lectura_noviembre.estado_medidor_reportado})
              </div>
              <div style={{ color: 'var(--texto-suave)', marginTop: 2 }}>
                {a.nombre_zona} • {a.nombre_caserio} • Medidor: {a.medidor_numero || 'S/N'}
              </div>
              {a.lectura_noviembre.observaciones && (
                <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{a.lectura_noviembre.observaciones}"</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
