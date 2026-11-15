import { exportarLecturasCsv, exportarReporteAtencionCsv } from '../utils/exportCsv';

export default function ReportesView({ acometidas, casosAtencion, totalLeidosGlobal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, border: '1px solid #d1d5db', borderRadius: 10, background: '#f9fafb' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Exportar Lecturas Realizadas (Noviembre)</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#4b5563' }}>
          Descarga el archivo CSV listo para abrir en Excel con ID, Nombre Completo del Beneficiario, Zona, Caserío,
          Lecturas y Consumo en m³.
        </p>
        <button
          onClick={() => exportarLecturasCsv(acometidas)}
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Descargar Excel / CSV de Lecturas ({totalLeidosGlobal})
        </button>
      </div>

      <div style={{ padding: 16, border: '1px solid #fca5a5', borderRadius: 10, background: '#fef2f2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#991b1b' }}>
            Casos que Requieren Atención ({casosAtencion.length})
          </h3>
          {casosAtencion.length > 0 && (
            <button
              onClick={() => exportarReporteAtencionCsv(casosAtencion)}
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Exportar Reporte
            </button>
          )}
        </div>

        {casosAtencion.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#7f1d1d', margin: 0 }}>
            No se han reportado novedades o medidores dañados en noviembre.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {casosAtencion.map((a) => (
              <div
                key={a.id}
                style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #fecaca', fontSize: '0.85rem' }}
              >
                <div style={{ fontWeight: 'bold', color: '#991b1b' }}>
                  No. {a.numero_servicio} — {a.nombre_beneficiario} ({a.lectura_noviembre.estado_medidor_reportado})
                </div>
                <div style={{ color: '#4b5563', marginTop: 2 }}>
                  {a.nombre_zona} • {a.nombre_caserio} • Medidor: {a.medidor_numero || 'S/N'}
                </div>
                {a.lectura_noviembre.observaciones && (
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: '#1f2937' }}>
                    "{a.lectura_noviembre.observaciones}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
