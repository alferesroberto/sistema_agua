import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [zonas, setZonas] = useState([]);
  const [caserios, setCaserios] = useState([]);
  const [acometidas, setAcometidas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el formulario de lectura actual
  const [selectedAcometida, setSelectedAcometida] = useState(null);
  const [lecturaActual, setLecturaActual] = useState('');
  const [estadoMedidor, setEstadoMedidor] = useState('BUENO');
  const [foto1, setFoto1] = useState(null);
  const [foto2, setFoto2] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  
  // Estado para el histórico de consumo de la acometida seleccionada
  const [historicoConsumo, setHistoricoConsumo] = useState([]);

  // 1. Cargar datos iniciales desde Supabase al abrir la app
  useEffect(() => {
    fetchDatosSupabase();
  }, []);

  async function fetchDatosSupabase() {
    setLoading(true);
    try {
      const { data: dataZonas } = await supabase.from('zonas').select('*');
      setZonas(dataZonas || []);

      const { data: dataCaserios } = await supabase.from('caserios').select('*');
      setCaserios(dataCaserios || []);

      const { data: dataBeneficiarios } = await supabase.from('beneficiarios').select('*');
      
      const { data: dataAcometidas, error: errAcometidas } = await supabase.from('acometidas').select('*');
      if (errAcometidas) throw errAcometidas;

      const acometidasCompletas = (dataAcometidas || []).map(acometida => {
        const beneficiario = (dataBeneficiarios || []).find(b => b.id === acometida.beneficiario_id);
        const caserio = (dataCaserios || []).find(c => c.id === acometida.caserio_id);
        
        return {
          ...acometida,
          beneficiarios: { nombre_completo: beneficiario ? beneficiario.nombre_completo : 'Sin Nombre' },
          caserios: { nombre_caserio: caserio ? caserio.nombre_caserio : 'Sin Caserío' }
        };
      });

      setAcometidas(acometidasCompletas);

    } catch (error) {
      console.error("Error cargando datos de Supabase:", error);
    } finally {
      setLoading(false);
    }
  }

  // 2. Función para cargar el histórico de los últimos meses de la acometida
  async function cargarHistorico(acometidaId) {
    if (!acometidaId) {
      setHistoricoConsumo([]);
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('lecturas_mensuales')
        .select('periodo_mes, periodo_anio, consumo_m3')
        .eq('acometida_id', acometidaId)
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes', { ascending: false })
        .limit(4);
  
      if (error) {
        console.error("Error devuelto por Supabase:", error.message);
        throw error;
      }
  
      console.log("Datos de histórico encontrados para ID", acometidaId, ":", data);
      setHistoricoConsumo(data ? data.reverse() : []);
    } catch (error) {
      console.error("Excepción al cargar histórico:", error);
      setHistoricoConsumo([]);
    }
  }

  // 3. Función para subir fotos a Supabase Storage y guardar la lectura
  async function handleGuardarLectura(e) {
    e.preventDefault();
    if (!selectedAcometida || !lecturaActual) {
      alert("Por favor selecciona una acometida e ingresa la lectura actual.");
      return;
    }

    try {
      let foto1Url = null;
      let foto2Url = null;

      if (foto1) {
        const fileName1 = `lecturas/${selectedAcometida.id}_${Date.now()}_1.jpg`;
        const { error: err1 } = await supabase.storage.from('fotos_medidores').upload(fileName1, foto1);
        if (!err1) {
          const { data: pubData1 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName1);
          foto1Url = pubData1.publicUrl;
        }
      }

      if (foto2) {
        const fileName2 = `lecturas/${selectedAcometida.id}_${Date.now()}_2.jpg`;
        const { error: err2 } = await supabase.storage.from('fotos_medidores').upload(fileName2, foto2);
        if (!err2) {
          const { data: pubData2 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName2);
          foto2Url = pubData2.publicUrl;
        }
      }

      const periodoMes = new Date().getMonth() + 1;
      const periodoAnio = new Date().getFullYear();

      // Cálculo del consumo en m3 restando lectura actual menos la base anterior
      const lecturaAnt = selectedAcometida.lectura_base || 0;
      const lecturaActNum = parseFloat(lecturaActual);
      const consumoCalculado = lecturaActNum - lecturaAnt;

      const { error: insertError } = await supabase.from('lecturas_mensuales').insert([{
        acometida_id: selectedAcometida.id,
        periodo_mes: periodoMes,
        periodo_anio: periodoAnio,
        lectura_anterior: lecturaAnt,
        lectura_actual: lecturaActNum,
        consumo_m3: consumoCalculado >= 0 ? consumoCalculado : 0,
        estado_medidor_reportado: estadoMedidor,
        observaciones: observaciones,
        foto_1_url: foto1Url,
        foto_2_url: foto2Url
      }]);

      if (insertError) throw insertError;

      await supabase.from('acometidas')
        .update({ lectura_base: lecturaActNum, estado_medidor: estadoMedidor })
        .eq('id', selectedAcometida.id);

      alert("¡Lectura guardada y sincronizada con Supabase exitosamente!");
      
      setLecturaActual('');
      setFoto1(null);
      setFoto2(null);
      setObservaciones('');
      setSelectedAcometida(null);
      setHistoricoConsumo([]);
      fetchDatosSupabase();

    } catch (error) {
      console.error("Error al guardar lectura:", error);
      alert("Hubo un error al guardar la lectura: " + error.message);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Conectando con Supabase y cargando datos...</div>;

  const nombresMeses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const maxConsumo = Math.max(...historicoConsumo.map(item => Number(item.consumo_m3) || 0), 1);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Módulo de Lecturas de Campo (Supabase)</h2>
      
      <form onSubmit={handleGuardarLectura} style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
        <div>
          <label><b>Seleccionar Asociado / Acometida:</b></label>
          <select 
            style={{ width: '100%', padding: 10, marginTop: 5 }}
            onChange={(e) => {
              const encontrada = acometidas.find(a => a.id == e.target.value);
              setSelectedAcometida(encontrada);
              cargarHistorico(encontrada ? encontrada.id : null);
            }}
            value={selectedAcometida ? selectedAcometida.id : ""}
          >
            <option value="" disabled>Selecciona un servicio...</option>
            {acometidas.map(a => (
              <option key={a.id} value={a.id}>
                No. {a.numero_servicio} - {a.beneficiarios?.nombre_completo} (Medidor: {a.medidor_numero || 'S/N'})
              </option>
            ))}
          </select>
        </div>

        {selectedAcometida && (
          <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 14 }}>
            <p style={{ margin: '0 0 4px 0' }}><b>Caserío:</b> {selectedAcometida.caserios?.nombre_caserio}</p>
            <p style={{ margin: '0 0 10px 0' }}><b>Lectura Anterior (Base):</b> {selectedAcometida.lectura_base}</p>
            
            {/* MINI GRÁFICA DE HISTÓRICO DE CONSUMO */}
            <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '10px', marginTop: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>
                Histórico de Consumo (Últimos Meses)
              </p>

              {historicoConsumo.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                  No hay lecturas anteriores registradas en este medidor.
                </p>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '85px', paddingTop: '12px' }}>
                  {historicoConsumo.map((reg, index) => {
                    const consumo = Number(reg.consumo_m3) || 0;
                    const alturaPorcentaje = Math.round((consumo / maxConsumo) * 100);

                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '22%' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '3px' }}>
                          {consumo}m³
                        </span>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '28px',
                            height: `${Math.max(alturaPorcentaje, 10)}%`,
                            backgroundColor: '#2563eb',
                            borderRadius: '3px 3px 0 0'
                          }}
                        />
                        <span style={{ fontSize: '0.65rem', color: '#4b5563', marginTop: '3px' }}>
                          {nombresMeses[reg.periodo_mes]}/{String(reg.periodo_anio).slice(-2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label><b>Lectura Actual:</b></label>
          <input 
            type="number" 
            step="any"
            value={lecturaActual} 
            onChange={(e) => setLecturaActual(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 5 }}
            placeholder="Ej. 1450"
            required
          />
        </div>

        <div>
          <label><b>Estado del Medidor:</b></label>
          <select 
            value={estadoMedidor} 
            onChange={(e) => setEstadoMedidor(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 5 }}
          >
            <option value="BUENO">Bueno</option>
            <option value="DAÑADO">Dañado</option>
            <option value="SIN CAJA">Sin Caja</option>
            <option value="BORROSO">Número Borroso</option>
          </select>
        </div>

        <div>
          <label><b>Fotografía 1 (Medidor / Lectura):</b></label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={(e) => setFoto1(e.target.files[0])}
            style={{ display: 'block', marginTop: 5 }}
          />
        </div>

        <div>
          <label><b>Fotografía 2 (Caja / Estado General):</b></label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={(e) => setFoto2(e.target.files[0])}
            style={{ display: 'block', marginTop: 5 }}
          />
        </div>

        <div>
          <label><b>Observaciones:</b></label>
          <textarea 
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 5 }}
            placeholder="Notas adicionales o detalles de entrega a terceros..."
          />
        </div>

        <button 
          type="submit" 
          style={{ background: '#2563eb', color: '#fff', padding: 12, border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
        >
          Guardar Lectura en Supabase 🚀
        </button>
      </form>
    </div>
  );
}