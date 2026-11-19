import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import {
  obtenerAcometidas,
  compararOrdenRuta,
  acometidasDeLaZona,
  reubicarEnRutaZona
} from '../services/acometidasService';

export const PERIODO_MES = 11;
export const PERIODO_ANIO = 2026;

export function useAcometidas() {
  const [zonas, setZonas] = useState([]);
  const [caserios, setCaserios] = useState([]);
  const [acometidas, setAcometidas] = useState([]);
  const [lecturasMesActual, setLecturasMesActual] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroZona, setFiltroZona] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');

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

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo({ silencioso = false } = {}) {
    if (!silencioso) setLoading(true);
    try {
      const [resZonas, resCaserios, resBenef, resAcom, resLecturas] = await Promise.all([
        supabase.from('zonas').select('*').order('id'),
        supabase.from('caserios').select('*'),
        supabase.from('beneficiarios').select('*'),
        obtenerAcometidas(),
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

      const ordenadas = [...acometidasUnidas].sort(compararOrdenRuta);
      setAcometidas(ordenadas);
      return ordenadas;
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al conectar con Supabase: ' + error.message);
      return [];
    } finally {
      setLoading(false);
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

  function cerrarCaptura() {
    setAcometidaActiva(null);
  }

  async function toggleActivoAcometida(acometidaId, estadoActual) {
    const nuevoEstado = !estadoActual;
    const mensaje = nuevoEstado
      ? '¿Reactivar esta acometida en la ruta de lecturas?'
      : '¿Desactivar esta acometida? Saldrá de la ruta hasta que la vuelvas a activar.';

    if (!window.confirm(mensaje)) return;

    const { error } = await supabase
      .from('acometidas')
      .update({ activo: nuevoEstado, actualizado_en: new Date().toISOString() })
      .eq('id', acometidaId);

    if (error) {
      alert('Error al actualizar el estado: ' + error.message);
      return;
    }

    if (acometidaActiva?.id === acometidaId) {
      setAcometidaActiva(null);
    }

    await cargarTodo({ silencioso: true });
  }

  async function ubicarEnRuta(acometidaId, despuesDeId) {
    const actual = acometidas.find((a) => a.id === acometidaId);
    if (!actual?.zona_id) {
      alert('Esta acometida no tiene zona asignada para reordenar la ruta.');
      return;
    }

    try {
      const zona = acometidasDeLaZona(acometidas, actual.zona_id);
      await reubicarEnRutaZona({
        acometidasZona: zona,
        acometidaId,
        despuesDeId
      });
      const actualizadas = await cargarTodo({ silencioso: true });
      if (acometidaActiva?.id === acometidaId) {
        const fresca = actualizadas.find((a) => a.id === acometidaId);
        if (fresca) setAcometidaActiva(fresca);
      }
    } catch (error) {
      console.error('Error reordenando ruta:', error);
      alert('Error al actualizar el orden de ruta: ' + error.message);
    }
  }

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

      const { error: insertErr } = await supabase.from('lecturas_mensuales').insert([
        {
          acometida_id: acometidaActiva.id,
          periodo_mes: PERIODO_MES,
          periodo_anio: PERIODO_ANIO,
          lectura_anterior: lecturaAntNum,
          lectura_actual: lecturaActNum,
          estado_medidor_reportado: estadoMedidor,
          requiere_atencion: requiereAtencion,
          observaciones: observaciones.trim() || null,
          foto_1_url: foto1Url,
          foto_2_url: foto2Url
        }
      ]);

      if (insertErr) throw insertErr;

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

  const acometidasFiltradas = useMemo(() => {
    return acometidas
      .filter((a) => {
        const cumpleZona = filtroZona === 'TODAS' || String(a.zona_id) === String(filtroZona);
        const term = busqueda.toLowerCase().trim();
        const cumpleBusqueda =
          !term ||
          String(a.numero_servicio).includes(term) ||
          a.nombre_beneficiario.toLowerCase().includes(term) ||
          String(a.medidor_numero || '').toLowerCase().includes(term) ||
          a.nombre_caserio.toLowerCase().includes(term);

        return cumpleZona && cumpleBusqueda;
      })
      .sort(compararOrdenRuta);
  }, [acometidas, filtroZona, busqueda]);

  const acometidasEnRuta = acometidasFiltradas.filter((a) => a.activo !== false);
  const listaPendientes = acometidasEnRuta.filter((a) => !a.lectura_noviembre);
  const listaLeidos = acometidasEnRuta.filter((a) => Boolean(a.lectura_noviembre));
  const listaInactivas = acometidasFiltradas.filter((a) => a.activo === false);

  const acometidasActivas = acometidas.filter((a) => a.activo !== false);
  const totalActivos = acometidasActivas.length;
  const totalLeidosGlobal = acometidasActivas.filter((a) => Boolean(a.lectura_noviembre)).length;
  const totalPendientesGlobal = totalActivos - totalLeidosGlobal;
  const porcentajeAvance = totalActivos > 0 ? Math.round((totalLeidosGlobal / totalActivos) * 100) : 0;

  const casosAtencion = acometidasActivas.filter(
    (a) =>
      a.lectura_noviembre &&
      (a.lectura_noviembre.requiere_atencion ||
        (a.lectura_noviembre.estado_medidor_reportado &&
          a.lectura_noviembre.estado_medidor_reportado !== 'BUENO'))
  );

  return {
    zonas,
    caserios,
    acometidas,
    acometidasActivas,
    lecturasMesActual,
    loading,
    cargarTodo,
    filtroZona,
    setFiltroZona,
    busqueda,
    setBusqueda,
    acometidasFiltradas,
    acometidasEnRuta,
    listaPendientes,
    listaLeidos,
    listaInactivas,
    totalActivos,
    totalLeidosGlobal,
    totalPendientesGlobal,
    porcentajeAvance,
    casosAtencion,
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
    abrirCaptura,
    cerrarCaptura,
    capturarUbicacionGps,
    handleGuardarLectura,
    toggleActivoAcometida,
    ubicarEnRuta
  };
}
