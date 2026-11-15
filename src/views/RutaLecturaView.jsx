import { useState, useEffect } from 'react';
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
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 15;

  // Reiniciar a la página 1 cada vez que cambie el filtro, la búsqueda o la sub-pestaña
  useEffect(() => {
    setPaginaActual(1);
  }, [subTabRuta, filtroZona, busqueda]);

  if (acometidaActiva) {
    return <ModalCaptura acometidaActiva={acometidaActiva} {...capturaProps} />;
  }

  // Determinar qué lista mostrar según la sub-pestaña activa
  const listaActiva = subTabRuta === 'pendientes' ? listaPendientes : listaLeidos;

  // Calcular elementos de la página actual
  const indiceUltimo = paginaActual * elementosPorPagina;
  const indicePrimero = indiceUltimo - elementosPorPagina;
  const elementosPaginados = listaActiva.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(listaActiva.length / elementosPorPagina);

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

      {/* CONTENIDO DE LA LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {listaActiva.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
            {subTabRuta === 'pendientes'
              ? 'No hay lecturas pendientes con este filtro.'
              : 'Aún no se han registrado lecturas en esta sección.'}
          </p>
        ) : (
          elementosPaginados.map((a) => {
            const esLeido = subTabRuta === 'leidos';
            return (
              <div
                key={a.id}
                onClick={() => !esLeido && abrirCaptura(a)}
                style={{
                  padding: 12,
                  border: esLeido ? '1px solid #d1fae5' : '1px solid #e5e7eb',
                  borderLeft: esLeido ? '4px solid #16a34a' : '4px solid #ea580c',
                  borderRadius: 8,
                  background: esLeido ? '#f0fdf4' : '#fff',
                  cursor: esLeido ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    No. {a.numero_servicio} — {a.nombre_beneficiario}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: esLeido ? '#4b5563' : '#6b7280', marginTop: 2 }}>
                    {a.nombre_zona} • {a.nombre_caserio} •{' '}
                    {esLeido ? (
                      <>
                        Consumo: <b>{a.lectura_noviembre?.consumo_m3 || 0} m³</b>
                      </>
                    ) : (
                      <>
                        Medidor: <b>{a.medidor_numero || 'S/N'}</b>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 75 }}>
                  {esLeido ? (
                    <>
                      <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Lectura Nov</div>
                      <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '1rem' }}>
                        {a.lectura_noviembre?.lectura_actual}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Base Oct</div>
                      <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{a.lectura_base}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '10px 0' }}>
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: paginaActual === 1 ? '#f3f4f6' : '#fff',
              color: paginaActual === 1 ? '#9ca3af' : '#374151',
              cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            &larr; Anterior
          </button>

          <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
            Página <b>{paginaActual}</b> de <b>{totalPaginas}</b> ({listaActiva.length} registros)
          </span>

          <button
            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: paginaActual === totalPaginas ? '#f3f4f6' : '#fff',
              color: paginaActual === totalPaginas ? '#9ca3af' : '#374151',
              cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </>
  );
}