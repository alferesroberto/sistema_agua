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
  listaInactivas,
  acometidaActiva,
  abrirCaptura,
  toggleActivoAcometida,
  capturaProps
}) {
  const [subTabRuta, setSubTabRuta] = useState('pendientes');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 15;

  useEffect(() => {
    setPaginaActual(1);
  }, [subTabRuta, filtroZona, busqueda]);

  if (acometidaActiva) {
    return <ModalCaptura acometidaActiva={acometidaActiva} {...capturaProps} />;
  }

  const listaActiva =
    subTabRuta === 'pendientes' ? listaPendientes : subTabRuta === 'leidos' ? listaLeidos : listaInactivas;
  const indiceUltimo = paginaActual * elementosPorPagina;
  const indicePrimero = indiceUltimo - elementosPorPagina;
  const elementosPaginados = listaActiva.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(listaActiva.length / elementosPorPagina);

  return (
    <>
      <div className="filtros">
        <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)}>
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
        />
      </div>

      <div className="subtabs">
        <button
          type="button"
          className={`subtab${subTabRuta === 'pendientes' ? ' is-pendiente' : ''}`}
          onClick={() => setSubTabRuta('pendientes')}
        >
          Pendientes ({listaPendientes.length})
        </button>
        <button
          type="button"
          className={`subtab${subTabRuta === 'leidos' ? ' is-leido' : ''}`}
          onClick={() => setSubTabRuta('leidos')}
        >
          Ya Leídos ({listaLeidos.length})
        </button>
        <button
          type="button"
          className={`subtab${subTabRuta === 'inactivos' ? ' is-inactivo' : ''}`}
          onClick={() => setSubTabRuta('inactivos')}
        >
          Inactivos ({listaInactivas.length})
        </button>
      </div>

      <div className="lista">
        {listaActiva.length === 0 ? (
          <p className="vacio">
            {subTabRuta === 'pendientes'
              ? 'No hay lecturas pendientes con este filtro.'
              : subTabRuta === 'leidos'
                ? 'Aún no se han registrado lecturas en esta sección.'
                : 'No hay acometidas inactivas con este filtro.'}
          </p>
        ) : (
          elementosPaginados.map((a) => {
            const esLeido = subTabRuta === 'leidos';
            const esInactivo = subTabRuta === 'inactivos';
            return (
              <div
                key={a.id}
                className={`tarjeta ${esInactivo ? 'inactiva' : esLeido ? 'leido' : 'pendiente'}`}
                onClick={() => !esLeido && !esInactivo && abrirCaptura(a)}
                style={{ cursor: esLeido || esInactivo ? 'default' : 'pointer' }}
              >
                <div>
                  <div className="tarjeta-titulo">
                    No. {a.numero_servicio} — {a.nombre_beneficiario}
                  </div>
                  <div className="tarjeta-meta">
                    {a.nombre_zona} • {a.nombre_caserio} • Medidor: <b>{a.medidor_numero || 'S/N'}</b>
                  </div>
                </div>
                <div className="tarjeta-dato">
                  {esLeido && (
                    <>
                      <small>Lectura Nov</small>
                      <strong>{a.lectura_noviembre?.lectura_actual}</strong>
                    </>
                  )}
                  {!esLeido && !esInactivo && (
                    <>
                      <small>Base Oct</small>
                      <strong>{a.lectura_base}</strong>
                    </>
                  )}
                  <button
                    type="button"
                    className={`btn ${esInactivo ? 'btn-primario' : 'btn-peligro'}`}
                    style={{ marginTop: 6, fontSize: '0.75rem', minHeight: 32, padding: '4px 8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActivoAcometida(a.id, a.activo !== false);
                    }}
                  >
                    {esInactivo ? 'Activar' : 'Desactivar'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            type="button"
            className="btn"
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
          >
            &larr; Anterior
          </button>

          <span>
            Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
          </span>

          <button
            type="button"
            className="btn"
            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </>
  );
}
