import OrdenRutaPanel from './OrdenRutaPanel';

export default function ModalCaptura({
  acometidaActiva,
  lecturaActual,
  setLecturaActual,
  estadoMedidor,
  setEstadoMedidor,
  requiereAtencion,
  setRequiereAtencion,
  observaciones,
  setObservaciones,
  setFoto1,
  setFoto2,
  actualizarGps,
  setActualizarGps,
  coordsGps,
  obteniendoGps,
  guardando,
  onVolver,
  onCapturarGps,
  onGuardar,
  onToggleActivo,
  acometidas,
  onUbicarEnRuta
}) {
  return (
    <div className="captura">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={onVolver}>
          &larr; Volver al listado
        </button>
        <button
          type="button"
          className="btn btn-peligro"
          onClick={() => onToggleActivo(acometidaActiva.id, acometidaActiva.activo !== false)}
        >
          Desactivar acometida
        </button>
      </div>

      <div className="ficha-servicio">
        <div className="codigo">
          Ruta #{acometidaActiva.orden_ruta ?? '—'} · Servicio No. {acometidaActiva.numero_servicio} | Medidor:{' '}
          {acometidaActiva.medidor_numero || 'S/N'}
        </div>
        <h3>{acometidaActiva.nombre_beneficiario}</h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
          {acometidaActiva.nombre_zona} — Caserío: <b>{acometidaActiva.nombre_caserio}</b>
        </div>
        <div className="ficha-base">
          Lectura Anterior (Octubre): <b>{acometidaActiva.lectura_base}</b>
        </div>
      </div>

      <OrdenRutaPanel acometida={acometidaActiva} acometidas={acometidas || []} onUbicar={onUbicarEnRuta} />

      <form onSubmit={onGuardar} className="form-col">
        <div>
          <label className="bloque">Lectura Actual (Noviembre 2026): *</label>
          <input
            type="number"
            step="any"
            required
            value={lecturaActual}
            onChange={(e) => setLecturaActual(e.target.value)}
            placeholder={`Mayor o igual a ${acometidaActiva.lectura_base}`}
            style={{ fontSize: '1.1rem' }}
          />
          {lecturaActual !== '' && (
            <div className="consumo-ok">
              Consumo calculado: {Math.max(parseFloat(lecturaActual) - Number(acometidaActiva.lectura_base || 0), 0)} m³
            </div>
          )}
        </div>

        <div>
          <label className="bloque">Estado del Medidor:</label>
          <select value={estadoMedidor} onChange={(e) => setEstadoMedidor(e.target.value)}>
            <option value="BUENO">Bueno</option>
            <option value="DAÑADO">Dañado / Detenido</option>
            <option value="SIN CAJA">Sin Caja / Expuesto</option>
            <option value="BORROSO">Vidrio Sudado / Borroso</option>
            <option value="INACCESIBLE">Puerta con llave / Inaccesible</option>
          </select>
        </div>

        <div className="caja-suave">
          <label className="check-fila">
            <input
              type="checkbox"
              checked={actualizarGps}
              onChange={(e) => {
                setActualizarGps(e.target.checked);
                if (e.target.checked) onCapturarGps();
              }}
              style={{ width: 'auto' }}
            />
            {acometidaActiva.latitud
              ? 'Actualizar ubicación GPS (medidor movido)'
              : 'Registrar ubicación GPS (Primera lectura)'}
          </label>

          {actualizarGps ? (
            <div style={{ marginTop: 6 }}>
              {obteniendoGps ? (
                <span>Obteniendo coordenadas satelitales...</span>
              ) : coordsGps.lat ? (
                <span>
                  GPS listo: <b>{coordsGps.lat}, {coordsGps.lng}</b> (±{coordsGps.precision}m){' '}
                  <button type="button" className="btn" onClick={onCapturarGps} style={{ marginLeft: 6, fontSize: '0.75rem' }}>
                    Recalibrar
                  </button>
                </span>
              ) : (
                <button type="button" className="btn" onClick={onCapturarGps}>
                  Obtener GPS ahora
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 4, color: 'var(--texto-suave)' }}>
              Ubicación guardada previamente: {acometidaActiva.latitud}, {acometidaActiva.longitud}
            </div>
          )}
        </div>

        <div className="fotos-grid">
          <div>
            <label className="bloque" style={{ fontSize: '0.85rem' }}>
              Foto 1 (Lectura Nov):
            </label>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto1(e.target.files[0])} />
          </div>
          <div>
            <label className="bloque" style={{ fontSize: '0.85rem' }}>
              Foto 2 (Caja / Entorno):
            </label>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto2(e.target.files[0])} />
          </div>
        </div>

        <div className={requiereAtencion ? 'caja-alerta' : 'caja-suave'}>
          <label className="check-fila" style={{ color: requiereAtencion ? 'var(--peligro-texto)' : undefined }}>
            <input
              type="checkbox"
              checked={requiereAtencion}
              onChange={(e) => setRequiereAtencion(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Reportar caso que requiere atención / revisión
          </label>

          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            placeholder={
              requiereAtencion
                ? 'Describe el problema (ej. fuga, medidor enterrado, difícil acceso, posible fraude)...'
                : 'Observaciones opcionales...'
            }
            required={requiereAtencion}
            style={{ marginTop: 8 }}
          />
        </div>

        <button type="submit" className="btn btn-exito" disabled={guardando}>
          {guardando ? 'Guardando lectura y fotos...' : 'Guardar Lectura de Noviembre'}
        </button>
      </form>
    </div>
  );
}
