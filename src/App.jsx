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

  // 1. Cargar datos iniciales desde Supabase al abrir la app
  useEffect(() => {
    fetchDatosSupabase();
  }, []);

  async function fetchDatosSupabase() {
    setLoading(true);
    try {
      // 1. Cargar zonas
      const { data: dataZonas } = await supabase.from('zonas').select('*');
      setZonas(dataZonas || []);

      // 2. Cargar caseríos
      const { data: dataCaserios } = await supabase.from('caserios').select('*');
      setCaserios(dataCaserios || []);

      // 3. Cargar beneficiarios directamente
      const { data: dataBeneficiarios } = await supabase.from('beneficiarios').select('*');
      
      // 4. Cargar acometidas y unirlas en JavaScript de forma segura
      const { data: dataAcometidas, error: errAcometidas } = await supabase.from('acometidas').select('*');
      
      if (errAcometidas) throw errAcometidas;

      // Unir los datos en memoria para el selector
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

  // 2. Función para subir fotos a Supabase Storage y guardar la lectura
  async function handleGuardarLectura(e) {
    e.preventDefault();
    if (!selectedAcometida || !lecturaActual) {
      alert("Por favor selecciona una acometida e ingresa la lectura actual.");
      return;
    }

    try {
      let foto1Url = null;
      let foto2Url = null;

      // Subir Foto 1 si existe
      if (foto1) {
        const fileName1 = `lecturas/${selectedAcometida.id}_${Date.now()}_1.jpg`;
        const { error: err1 } = await supabase.storage.from('fotos_medidores').upload(fileName1, foto1);
        if (!err1) {
          const { data: pubData1 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName1);
          foto1Url = pubData1.publicUrl;
        }
      }

      // Subir Foto 2 si existe
      if (foto2) {
        const fileName2 = `lecturas/${selectedAcometida.id}_${Date.now()}_2.jpg`;
        const { error: err2 } = await supabase.storage.from('fotos_medidores').upload(fileName2, foto2);
        if (!err2) {
          const { data: pubData2 } = supabase.storage.from('fotos_medidores').getPublicUrl(fileName2);
          foto2Url = pubData2.publicUrl;
        }
      }

      // Insertar en la tabla lecturas_mensuales
      const periodoMes = new Date().getMonth() + 1;
      const periodoAnio = new Date().getFullYear();

      const { error: insertError } = await supabase.from('lecturas_mensuales').insert([{
        acometida_id: selectedAcometida.id,
        periodo_mes: periodoMes,
        periodo_anio: periodoAnio,
        lectura_anterior: selectedAcometida.lectura_base || 0,
        lectura_actual: parseFloat(lecturaActual),
        estado_medidor_reportado: estadoMedidor,
        observaciones: observaciones,
        foto_1_url: foto1Url,
        foto_2_url: foto2Url
      }]);

      if (insertError) throw insertError;

      // Actualizar la lectura base en la tabla acometidas para el siguiente mes
      await supabase.from('acometidas')
        .update({ lectura_base: parseFloat(lecturaActual), estado_medidor: estadoMedidor })
        .eq('id', selectedAcometida.id);

      alert("¡Lectura guardada y sincronizada con Supabase exitosamente!");
      
      // Limpiar formulario
      setLecturaActual('');
      setFoto1(null);
      setFoto2(null);
      setObservaciones(null);
      setSelectedAcometida(null);
      fetchDatosSupabase();

    } catch (error) {
      console.error("Error al guardar lectura:", error);
      alert("Hubo un error al guardar la lectura: " + error.message);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Conectando con Supabase y cargando datos...</div>;

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
            }}
            defaultValue=""
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
            <p><b>Caserío:</b> {selectedAcometida.caserios?.nombre_caserio}</p>
            <p><b>Lectura Anterior (Base):</b> {selectedAcometida.lectura_base}</p>
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