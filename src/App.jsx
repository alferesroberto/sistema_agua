import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export default function App() {
  // Catálogos y datos principales
  const [zonas, setZonas] = useState([]);
  const [caserios, setCaserios] = useState([]);
  const [acometidas, setAcometidas] = useState([]);
  const [lecturasMesActual, setLecturasMesActual] = useState([]);
  const [loading, setLoading] = useState(true);

  // Periodo actual de campaña (Noviembre 2026)
  const PERIODO_MES = 11;
  const PERIODO_ANIO = 2026;

  // Navegación y filtros
  const [vistaActiva, setVistaActiva] = useState('ruta'); // 'dashboard' | 'ruta' | 'mapa' | 'reportes'
  const [subTabRuta, setSubTabRuta] = useState('pendientes'); // 'pendientes' | 'leidos'
  const [filtroZona, setFiltroZona] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');

  // Modal / Formulario de captura para el usuario seleccionado
  const [acometidaActiva, setAcometidaActiva] = useState(null);
  const [lecturaActual, setLecturaActual] = useState('');
  const [estadoMedidor, setEstadoMedidor] = useState('BUENO');
  const [requiereAtencion, setRequiereAtencion] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [foto1, setFoto1] = useState(null);
  const [foto2, setFoto2] = useState(null);
  const [actualizarGps, setActualizarGps] = useState(false);
  const [coordsGps, setCoordsGps] = useState({ lat: null, lng: null, precision: null });
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Referencia para el contenedor del mapa Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setLoading(true);
    try {
      const [resZonas, resCaserios, resBenef, resAcom, resLecturas] = await Promise.all([
        supabase.from('zonas').select('*').order('id'),
        supabase.from('caserios').select('*'),
        supabase.from('beneficiarios').select('*'),
        supabase.from('acometidas').select('*').eq('activo', true).order('numero_servicio'),
        supabase
          .from('lecturas_mensuales')
          .select('*')
          .eq('periodo_mes', PERIODO_MES)
          .eq('periodo_anio', PERIODO_ANIO)
      ]);

      if (resAcom.error) throw resAcom.error;

      const dataZonas = resZonas.data || [];
      const dataCaserios = resCaserios.data || [];
      const dataBenef = resBenef.data || [];
      const dataAcom = resAcom.data || [];
      const dataLect = resLecturas.data || [];

      setZonas(dataZonas);
      setCaserios(dataCaserios);
      setLecturasMesActual(dataLect);

      // Enriquecer acometidas activas con nombres de beneficiario, caserío, zona y lectura de noviembre si ya existe
      const acometidasUnidas = dataAcom.map((a) => {
        const benef = dataBenef.find((b) => b.id === a.beneficiario_id);
        const cas = dataCaserios.find((c) => c.id === a.caserio_id);
        const zona = dataZonas.find((z) => z.id === cas?.zona_id);
        const lecturaNov = dataLect.find((l) => l.acometida_id === a.id);

        return {
          ...a,
          nombre_beneficiario: benef ? benef.nombre_completo : 'Sin Nombre',
          nombre_caserio: cas ? cas.nombre_caserio : 'Sin Caserío',
          zona_id: cas?.zona_id || null,
          nombre_zona: zona ? zona.nombre_zona : 'Sin Zona',
          lectura_noviembre: lecturaNov || null
        };
      });

      setAcometidas(acometidasUnidas);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al conectar con Supabase: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Abrir tarjeta de lectura para un asociado
  function abrirCaptura(acometida) {
    setAcometidaActiva(acometida);
    setLecturaActual('');
    setEstadoMedidor(acometida.estado_medidor || 'BUENO');
    setRequiereAtencion(false);
    setObservaciones('');
    setFoto1(null);
    setFoto2(null);

    const sinUbicacion = !acometida.latitud || !acometida.longitud;
    setActualizarGps(sinUbicacion);
    setCoordsGps({
      lat: acometida.latitud || null,
      lng: acometida.longitud || null,
      precision: acometida.precision_gps || null
    });

    if (sinUbicacion) {
      capturarUbicacionGps();
    }
  }

  function capturarUbicacionGps() {
    if (!navigator.geolocation) {
      alert('Tu dispositivo o navegador no soporta GPS.');
      return;
    }
    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordsGps({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          precision: Math.round(pos.coords.accuracy)
        });
        setObteniendoGps(false);
      },
      (err) => {
        console.warn('Error GPS:', err);
        alert('No se pudo obtener el GPS. Asegúrate de tener activa la ubicación del teléfono.');
        setObteniendoGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Guardar lectura de noviembre + fotos + GPS si aplica
  async function handleGuardarLectura(e) {
    e.preventDefault();
    if (!acometidaActiva || lecturaActual === '') return;

    const lecturaActNum = parseFloat(lecturaActual);
    const lecturaAntNum = Number(acometidaActiva.lectura_base) || 0;

    if (lecturaActNum < lecturaAntNum && !requiereAtencion) {
      const confirmar = window.confirm(
        `La lectura ingresada (${lecturaActNum}) es menor que la base anterior (${lecturaAntNum}). ¿Deseas guardarla de todos modos?`
      );
      if (!confirmar) return;
    }

    setGuardando(true);
    try {
      let foto1Url = null;
      let foto2Url = null;

      if (foto1) {
        const fileName1 = `noviembre_2026/${acometidaActiva.id}_${Date.now()}_1.jpg`;
        const { error: err1 } = await supabase.storage.from('fotos_medidores').upload(fileName1, foto1);
        if (!err1) {
          const { data: pub1 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName1);
          foto1Url = pub1.publicUrl;
        }
      }

      if (foto2) {
        const fileName2 = `noviembre_2026/${acometidaActiva.id}_${Date.now()}_2.jpg`;
        const { error: err2 } = await supabase.storage.from('fotos_medidores').upload(fileName2, foto2);
        if (!err2) {
          const { data: pub2 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName2);
          foto2Url = pub2.publicUrl;
        }
      }

      const consumoCalculado = Math.max(lecturaActNum - lecturaAntNum, 0);

      // 1. Insertar lectura en noviembre 2026
      const { error: insertErr } = await supabase.from('lecturas_mensuales').insert([
        {
          acometida_id: acometidaActiva.id,
          periodo_mes: PERIODO_MES,
          periodo_anio: PERIODO_ANIO,
          lectura_anterior: lecturaAntNum,
          lectura_actual: lecturaActNum,
          consumo_m3: consumoCalculado,
          estado_medidor_reportado: estadoMedidor,
          requiere_atencion: requiereAtencion,
          observaciones: observaciones.trim() || null,
          foto_1_url: foto1Url,
          foto_2_url: foto2Url
        }
      ]);

      if (insertErr) throw insertErr;

      // 2. Actualizar lectura_base (y GPS solo si es 1ra vez o se marcó actualización)
      const updatePayload = {
        lectura_base: lecturaActNum,
        estado_medidor: estadoMedidor,
        actualizado_en: new Date().toISOString()
      };

      if (actualizarGps && coordsGps.lat && coordsGps.lng) {
        updatePayload.latitud = coordsGps.lat;
        updatePayload.longitud = coordsGps.lng;
        updatePayload.precision_gps = coordsGps.precision;
      }

      const { error: updErr } = await supabase
        .from('acometidas')
        .update(updatePayload)
        .eq('id', acometidaActiva.id);

      if (updErr) throw updErr;

      setAcometidaActiva(null);
      await cargarTodo();
    } catch (error) {
      console.error('Error guardando lectura:', error);
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  }

  // Filtrado por zona y búsqueda
  const acometidasFiltradas = acometidas.filter((a) => {
    const cumpleZona = filtroZona === 'TODAS' || String(a.zona_id) === String(filtroZona);
    const term = busqueda.toLowerCase().trim();
    const cumpleBusqueda =
      !term ||
      String(a.numero_servicio).includes(term) ||
      a.nombre_beneficiario.toLowerCase().includes(term) ||
      String(a.medidor_numero || '').toLowerCase().includes(term) ||
      a.nombre_caserio.toLowerCase().includes(term);

    return cumpleZona && cumpleBusqueda;
  });

  const listaPendientes = acometidasFiltradas.filter((a) => !a.lectura_noviembre);
  const listaLeidos = acometidasFiltradas.filter((a) => Boolean(a.lectura_noviembre));

  // Métricas globales para el Dashboard
  const totalActivos = acometidas.length;
  const totalLeidosGlobal = acometidas.filter((a) => Boolean(a.lectura_noviembre)).length;
  const totalPendientesGlobal = totalActivos - totalLeidosGlobal;
  const porcentajeAvance = totalActivos > 0 ? Math.round((totalLeidosGlobal / totalActivos) * 100) : 0;

  // Casos que requieren atención en noviembre
  const casosAtencion = acometidas.filter(
    (a) =>
      a.lectura_noviembre &&
      (a.lectura_noviembre.requiere_atencion ||
        (a.lectura_noviembre.estado_medidor_reportado &&
          a.lectura_noviembre.estado_medidor_reportado !== 'BUENO'))
  );

  // Inicializar / actualizar mapa Leaflet cuando se abre la pestaña 'mapa'
  useEffect(() => {
    if (vistaActiva !== 'mapa' || !mapContainerRef.current || !window.L) return;

    const L = window.L;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const conCoordenadas = acometidasFiltradas.filter((a) => a.latitud && a.longitud);
    // Coordenadas por defecto: Tenancingo, Cuscatlán, El Salvador
    const centroInicial =
      conCoordenadas.length > 0
        ? [Number(conCoordenadas[0].latitud), Number(conCoordenadas[0].longitud)]
        : [13.8333, -88.9833];

    const map = L.map(mapContainerRef.current).setView(centroInicial, 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const bounds = [];
    conCoordenadas.forEach((a) => {
      const lat = Number(a.latitud);
      const lng = Number(a.longitud);
      const leido = Boolean(a.lectura_noviembre);

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: leido ? '#16a34a' : '#ea580c',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;">
          <b>No. ${a.numero_servicio} - ${a.nombre_beneficiario}</b><br/>
          Caserío: ${a.nombre_caserio} (${a.nombre_zona})<br/>
          Medidor: ${a.medidor_numero || 'S/N'}<br/>
          Estado Nov: <b style="color:${leido ? '#16a34a' : '#ea580c'}">${
            leido ? `Leído (${a.lectura_noviembre.lectura_actual})` : 'Pendiente'
          }</b>
        </div>
      `);

      bounds.push([lat, lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [vistaActiva, filtroZona, acometidas]);

  // Exportar lecturas realizadas en CSV (compatible directo con Excel)
  function exportarLecturasCsv() {
    const realizadas = acometidas.filter((a) => Boolean(a.lectura_noviembre));
    if (realizadas.length === 0) {
      alert('Aún no hay lecturas realizadas en noviembre para exportar.');
      return;
    }

    const encabezados = [
      'ID Acometida',
      'No. Servicio',
      'Nombre Completo del Beneficiario',
      'Zona',
      'Nombre del Caserio',
      'Medidor',
      'Lectura Anterior (Oct)',
      'Lectura Actual (Nov)',
      'Consumo m3',
      'Estado Medidor',
      'Observaciones'
    ];

    const filas = realizadas.map((a) => [
      a.id,
      a.numero_servicio,
      `"${a.nombre_beneficiario.replace(/"/g, '""')}"`,
      `"${a.nombre_zona}"`,
      `"${a.nombre_caserio}"`,
      a.medidor_numero || '',
      a.lectura_noviembre.lectura_anterior,
      a.lectura_noviembre.lectura_actual,
      a.lectura_noviembre.consumo_m3,
      a.lectura_noviembre.estado_medidor_reportado || 'BUENO',
      `"${(a.lectura_noviembre.observaciones || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      '\uFEFF' + [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lecturas_Noviembre_2026_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar reporte de anomalías / atención especial
  function exportarReporteAtencionCsv() {
    if (casosAtencion.length === 0) {
      alert('No hay casos reportados que requieran atención.');
      return;
    }

    const encabezados = [
      'No. Servicio',
      'Beneficiario',
      'Zona',
      'Caserio',
      'Medidor',
      'Estado Reportado',
      'Lectura Ingresada',
      'Detalle / Situacion'
    ];

    const filas = casosAtencion.map((a) => [
      a.numero_servicio,
      `"${a.nombre_beneficiario.replace(/"/g, '""')}"`,
      `"${a.nombre_zona}"`,
      `"${a.nombre_caserio}"`,
      a.medidor_numero || '',
      a.lectura_noviembre.estado_medidor_reportado,
      a.lectura_noviembre.lectura_actual,
      `"${(a.lectura_noviembre.observaciones || 'Marcado para revisión').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      '\uFEFF' + [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Atencion_Medidores_Nov2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: 'center', fontFamily: 'sans-serif' }}>
        Cargando padrón activo y lecturas de noviembre...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 15, fontFamily: 'sans-serif', color: '#1f2937' }}>
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>Sistema de Lecturas — Noviembre 2026</h2>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Avance: <b>{totalLeidosGlobal}</b> de <b>{totalActivos}</b> activos ({porcentajeAvance}%)
          </span>
        </div>
        <button
          onClick={cargarTodo}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          Actualizar
        </button>
      </div>

      {/* BARRA DE NAVEGACIÓN PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 15 }}>
        {[
          { id: 'ruta', label: 'Ruta Lectura' },
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'mapa', label: 'Mapa GPS' },
          { id: 'reportes', label: `Exportar / Alertas (${casosAtencion.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setVistaActiva(tab.id);
              setAcometidaActiva(null);
            }}
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

      {/* FILTRO GLOBAL POR ZONA Y BUSCADOR (En Ruta y Mapa) */}
      {(vistaActiva === 'ruta' || vistaActiva === 'mapa') && !acometidaActiva && (
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

          {vistaActiva === 'ruta' && (
            <input
              type="text"
              placeholder="Buscar por N°, nombre, medidor o caserío..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', flex: '2 1 220px' }}
            />
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: RUTA DE LECTURA (PENDIENTES VS LEÍDOS + FORMULARIO DE CAMPO) */}
      {/* ===================================================================== */}
      {vistaActiva === 'ruta' && (
        <>
          {acometidaActiva ? (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
              <button
                onClick={() => setAcometidaActiva(null)}
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

              <form onSubmit={handleGuardarLectura} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                {/* SECCIÓN DE UBICACIÓN GPS */}
                <div style={{ background: '#f3f4f6', padding: 10, borderRadius: 8, fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={actualizarGps}
                      onChange={(e) => {
                        setActualizarGps(e.target.checked);
                        if (e.target.checked) capturarUbicacionGps();
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
                          <button type="button" onClick={capturarUbicacionGps} style={{ marginLeft: 6, fontSize: '0.75rem' }}>
                            Recalibrar
                          </button>
                        </span>
                      ) : (
                        <button type="button" onClick={capturarUbicacionGps}>
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

                {/* FOTOGRAFÍAS DE NOVIEMBRE */}
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

                {/* REPORTE DE ATENCIÓN ESPECIAL */}
                <div style={{ background: requiereAtencion ? '#fef2f2' : '#f3f4f6', padding: 10, borderRadius: 8, border: requiereAtencion ? '1px solid #fca5a5' : 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', color: requiereAtencion ? '#b91c1c' : '#374151', cursor: 'pointer' }}>
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
          ) : (
            <>
              {/* SUB-PESTAÑAS: PENDIENTES VS YA LEÍDOS */}
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

              {/* LISTADO DE PENDIENTES */}
              {subTabRuta === 'pendientes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {listaPendientes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                      No hay lecturas pendientes con este filtro.
                    </p>
                  ) : (
                    listaPendientes.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => abrirCaptura(a)}
                        style={{
                          padding: 12,
                          border: '1px solid #e5e7eb',
                          borderLeft: '4px solid #ea580c',
                          borderRadius: 8,
                          background: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                            No. {a.numero_servicio} — {a.nombre_beneficiario}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                            {a.nombre_zona} • {a.nombre_caserio} • Medidor: <b>{a.medidor_numero || 'S/N'}</b>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 75 }}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Base Oct</div>
                          <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{a.lectura_base}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* LISTADO DE YA LEÍDOS */}
              {subTabRuta === 'leidos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {listaLeidos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                      Aún no se han registrado lecturas en esta zona.
                    </p>
                  ) : (
                    listaLeidos.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: 12,
                          border: '1px solid #d1fae5',
                          borderLeft: '4px solid #16a34a',
                          borderRadius: 8,
                          background: '#f0fdf4',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                            No. {a.numero_servicio} — {a.nombre_beneficiario}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 2 }}>
                            {a.nombre_zona} • {a.nombre_caserio} • Consumo: <b>{a.lectura_noviembre.consumo_m3} m³</b>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Lectura Nov</div>
                          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '1rem' }}>
                            {a.lectura_noviembre.lectura_actual}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: DASHBOARD DE AVANCE                                          */}
      {/* ===================================================================== */}
      {vistaActiva === 'dashboard' && (
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

          {/* Barra de progreso global */}
          <div style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 'bold', fontSize: '0.9rem' }}>
              <span>Progreso General de Noviembre</span>
              <span>{porcentajeAvance}%</span>
            </div>
            <div style={{ width: '100%', height: 18, background: '#e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
              <div style={{ width: `${porcentajeAvance}%`, height: '100%', background: '#16a34a', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Avance desglosado por zona */}
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
      )}

      {/* ===================================================================== */}
      {/* VISTA 3: MAPA GPS DE MEDIDORES                                        */}
      {/* ===================================================================== */}
      {vistaActiva === 'mapa' && (
        <div>
          <div style={{ display: 'flex', gap: 15, fontSize: '0.85rem', marginBottom: 10 }}>
            <span>
              <b style={{ color: '#16a34a' }}>●</b> Leído en Noviembre
            </span>
            <span>
              <b style={{ color: '#ea580c' }}>●</b> Pendiente de lectura
            </span>
            <span style={{ color: '#6b7280' }}>
              (Geolocalizados: {acometidasFiltradas.filter((a) => a.latitud && a.longitud).length})
            </span>
          </div>
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '450px', borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 4: EXPORTACIÓN DE LECTURAS Y REPORTE DE ATENCIÓN                */}
      {/* ===================================================================== */}
      {vistaActiva === 'reportes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bloque de exportación */}
          <div style={{ padding: 16, border: '1px solid #d1d5db', borderRadius: 10, background: '#f9fafb' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Exportar Lecturas Realizadas (Noviembre)</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#4b5563' }}>
              Descarga el archivo CSV listo para abrir en Excel con ID, Nombre Completo del Beneficiario, Zona, Caserío, Lecturas y Consumo en m³.
            </p>
            <button
              onClick={exportarLecturasCsv}
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

          {/* Bloque de casos que requieren atención */}
          <div style={{ padding: 16, border: '1px solid #fca5a5', borderRadius: 10, background: '#fef2f2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#991b1b' }}>
                Casos que Requieren Atención ({casosAtencion.length})
              </h3>
              {casosAtencion.length > 0 && (
                <button
                  onClick={exportarReporteAtencionCsv}
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
                  <div key={a.id} style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
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
      )}
    </div>
  );
}