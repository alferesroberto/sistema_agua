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
  onGuardar
}) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <button
        onClick={onVolver}
        style={{ marginBottom: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
      >
        &larr; Volver al listado
      </button>

      <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 15 }}>
        <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 'bold' }}>
          Servicio No. {acometidaActiva.numero_servicio} | Medidor: {acometidaActiva.medidor_numero || 'S/N'}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0' }}>
          {acometidaActiva.nombre_beneficiario}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
          {acometidaActiva.nombre_zona} — Caserío: <b>{acometidaActiva.nombre_caserio}</b>
        </div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #bfdbfe', fontSize: '0.95rem' }}>
          Lectura Anterior (Octubre): <b>{acometidaActiva.lectura_base}</b>
        </div>
      </div>

      <form onSubmit={onGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
            Lectura Actual (Noviembre 2026): *
          </label>
          <input
            type="number"
            step="any"
            required
            value={lecturaActual}
            onChange={(e) => setLecturaActual(e.target.value)}
            placeholder={`Mayor o igual a ${acometidaActiva.lectura_base}`}
            style={{ width: '100%', padding: 12, fontSize: '1.1rem', borderRadius: 8, border: '1px solid #9ca3af', boxSizing: 'border-box' }}
          />
          {lecturaActual !== '' && (
            <div style={{ fontSize: '0.85rem', marginTop: 4, color: '#047857', fontWeight: 'bold' }}>
              Consumo calculado: {Math.max(parseFloat(lecturaActual) - Number(acometidaActiva.lectura_base || 0), 0)} m³
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Estado del Medidor:</label>
          <select
            value={estadoMedidor}
            onChange={(e) => setEstadoMedidor(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            <option value="BUENO">Bueno</option>
            <option value="DAÑADO">Dañado / Detenido</option>
            <option value="SIN CAJA">Sin Caja / Expuesto</option>
            <option value="BORROSO">Vidrio Sudado / Borroso</option>
            <option value="INACCESIBLE">Puerta con llave / Inaccesible</option>
          </select>
        </div>

        <div style={{ background: '#f3f4f6', padding: 10, borderRadius: 8, fontSize: '0.85rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={actualizarGps}
              onChange={(e) => {
                setActualizarGps(e.target.checked);
                if (e.target.checked) onCapturarGps();
              }}
            />
            {acometidaActiva.latitud
              ? 'Actualizar ubicación GPS (medidor movido)'
              : 'Registrar ubicación GPS (Primera lectura)'}
          </label>

          {actualizarGps ? (
            <div style={{ marginTop: 6, color: '#1f2937' }}>
              {obteniendoGps ? (
                <span>Obteniendo coordenadas satelitales...</span>
              ) : coordsGps.lat ? (
                <span>
                  GPS listo: <b>{coordsGps.lat}, {coordsGps.lng}</b> (±{coordsGps.precision}m){' '}
                  <button type="button" onClick={onCapturarGps} style={{ marginLeft: 6, fontSize: '0.75rem' }}>
                    Recalibrar
                  </button>
                </span>
              ) : (
                <button type="button" onClick={onCapturarGps}>
                  Obtener GPS ahora
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 4, color: '#6b7280' }}>
              Ubicación guardada previamente: {acometidaActiva.latitud}, {acometidaActiva.longitud}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
              Foto 1 (Lectura Nov):
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFoto1(e.target.files[0])}
              style={{ width: '100%', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
              Foto 2 (Caja / Entorno):
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFoto2(e.target.files[0])}
              style={{ width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div
          style={{
            background: requiereAtencion ? '#fef2f2' : '#f3f4f6',
            padding: 10,
            borderRadius: 8,
            border: requiereAtencion ? '1px solid #fca5a5' : 'none'
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 'bold',
              color: requiereAtencion ? '#b91c1c' : '#374151',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={requiereAtencion}
              onChange={(e) => setRequiereAtencion(e.target.checked)}
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
            style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          style={{
            background: '#16a34a',
            color: '#fff',
            padding: 14,
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          {guardando ? 'Guardando lectura y fotos...' : 'Guardar Lectura de Noviembre'}
        </button>
      </form>
    </div>
  );
}
