import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function NuevaAcometidaView({ zonas, acometidas, onGuardado, onCancelar }) {
  const [nombreBeneficiario, setNombreBeneficiario] = useState('');
  const [dui, setDui] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [caserios, setCaserios] = useState([]);
  const [caserioId, setCaserioId] = useState('');
  const [numeroServicio, setNumeroServicio] = useState('');
  const [medidorNumero, setMedidorNumero] = useState('');
  const [lecturaBase, setLecturaBase] = useState('0');
  const [ordenRuta, setOrdenRuta] = useState('');
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [estadoGps, setEstadoGps] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Cargar caseríos cuando se selecciona una zona
  useEffect(() => {
    if (!zonaId) {
      setCaserios([]);
      setCaserioId('');
      return;
    }
    async function cargarCaserios() {
      const { data } = await supabase
        .from('caserios')
        .select('*')
        .eq('zona_id', zonaId)
        .order('nombre_caserio');
      if (data) {
        setCaserios(data);
        if (data.length > 0) setCaserioId(data[0].id);
      }
    }
    cargarCaserios();
  }, [zonaId]);

  // Sugerir siguiente número de servicio disponible
  useEffect(() => {
    if (acometidas && acometidas.length > 0) {
      const maxServicio = Math.max(...acometidas.map((a) => Number(a.numero_servicio) || 0));
      setNumeroServicio(String(maxServicio + 1));
    }
  }, [acometidas]);

  function capturarGps() {
    if (!navigator.geolocation) {
      setEstadoGps('Tu navegador no soporta GPS.');
      return;
    }
    setEstadoGps('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
        setEstadoGps(`Ubicación lista (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`);
      },
      (err) => {
        setEstadoGps('Error al obtener GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!nombreBeneficiario.trim() || !caserioId || !numeroServicio) {
      setError('Por favor completa el nombre, la zona/caserío y el número de servicio.');
      return;
    }

    setGuardando(true);
    try {
      // 1. Insertar beneficiario
      const { data: benefData, error: benefError } = await supabase
        .from('beneficiarios')
        .insert([{ nombre_completo: nombreBeneficiario.trim(), dui: dui.trim() || null }])
        .select()
        .single();

      if (benefError) throw benefError;

      // 2. Insertar acometida
      const { error: acomError } = await supabase.from('acometidas').insert([
        {
          beneficiario_id: benefData.id,
          caserio_id: Number(caserioId),
          numero_servicio: Number(numeroServicio),
          medidor_numero: medidorNumero.trim() || null,
          lectura_base: Number(lecturaBase) || 0,
          orden_ruta: Number(ordenRuta) || Number(numeroServicio),
          latitud,
          longitud,
          activo: true
        }
      ]);

      if (acomError) throw acomError;

      alert('¡Nueva acometida registrada correctamente!');
      if (onGuardado) onGuardado();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ maxWidth: 550, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>+ Nueva Acometida</h2>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}
          >
            Volver
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>
            Nombre Completo del Beneficiario *
          </label>
          <input
            type="text"
            required
            value={nombreBeneficiario}
            onChange={(e) => setNombreBeneficiario(e.target.value)}
            placeholder="Ej. Juan Carlos Pérez"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>Zona *</label>
            <select
              required
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              <option value="">Seleccione zona...</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre_zona}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>Caserío *</label>
            <select
              required
              value={caserioId}
              onChange={(e) => setCaserioId(e.target.value)}
              disabled={!zonaId}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              {caserios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_caserio}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>
              N° Servicio *
            </label>
            <input
              type="number"
              required
              value={numeroServicio}
              onChange={(e) => setNumeroServicio(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>
              Orden en Ruta (Secuencia)
            </label>
            <input
              type="number"
              value={ordenRuta}
              onChange={(e) => setOrdenRuta(e.target.value)}
              placeholder="Ej. 15"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>
              N° de Medidor
            </label>
            <input
              type="text"
              value={medidorNumero}
              onChange={(e) => setMedidorNumero(e.target.value)}
              placeholder="Ej. 245890"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 4 }}>
              Lectura Inicial Base
            </label>
            <input
              type="number"
              value={lecturaBase}
              onChange={(e) => setLecturaBase(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: 12, border: '1px dashed #9ca3af', borderRadius: 8, textAlign: 'center' }}>
          <button
            type="button"
            onClick={capturarGps}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📍 Capturar Ubicación GPS Actual
          </button>
          {estadoGps && <div style={{ fontSize: '0.8rem', marginTop: 6, color: '#4b5563' }}>{estadoGps}</div>}
        </div>

        <button
          type="submit"
          disabled={guardando}
          style={{ padding: 12, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: 8 }}
        >
          {guardando ? 'Guardando...' : 'Guardar Nueva Acometida'}
        </button>
      </form>
    </div>
  );
}