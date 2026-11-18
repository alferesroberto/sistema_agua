import { useState } from 'react';

export default function LegalView({ onCerrar }) {
  const [tab, setTab] = useState('privacidad');

  const documentos = [
    { id: 'privacidad', label: 'Privacidad y Datos' },
    { id: 'sesiones', label: 'Sesiones y Almacenamiento' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'terminos', label: 'Términos de Uso' }
  ];

  return (
    <div className="legal-card">
      <div className="legal-cabecera">
        <h2>Marco Legal, Privacidad y Seguridad</h2>
        {onCerrar && (
          <button type="button" className="btn" onClick={onCerrar}>
            Cerrar
          </button>
        )}
      </div>

      <div className="legal-tabs">
        {documentos.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`legal-tab${tab === item.id ? ' is-activa' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="legal-cuerpo">
        {tab === 'privacidad' && (
          <div>
            <h3>Política de Privacidad y Protección de Datos</h3>
            <p>
              <b>1. Responsable del Tratamiento:</b> Asociación Comunal El Buen Progreso (Sistema de Agua
              Potable, Cantón Corral Viejo, Tenancingo, Cuscatlán, El Salvador).
            </p>
            <p>
              <b>2. Datos Recopilados y Finalidad:</b> El sistema almacena nombres de beneficiarios, números de
              servicio, medidores, lecturas mensuales de consumo, coordenadas geográficas (GPS) de las acometidas
              y fotografías técnicas de los medidores. Esta información se utiliza exclusivamente para la gestión
              operativa, mantenimiento de red y facturación del servicio comunitario de agua potable.
            </p>
            <p>
              <b>3. Minimización de Datos en Campo:</b> Los operadores deben capturar fotografías enfocadas
              únicamente en el medidor y su caja de protección, evitando incluir personas, menores de edad o
              áreas privadas de los inmuebles.
            </p>
            <p>
              <b>4. Confidencialidad:</b> Los datos del padrón no serán vendidos, cedidos ni compartidos con
              terceros ajenos a la administración del sistema, salvo requerimiento legal de autoridad competente.
            </p>
          </div>
        )}

        {tab === 'sesiones' && (
          <div>
            <h3>Política de Sesiones y Almacenamiento Local</h3>
            <p>
              <b>1. Uso de Almacenamiento Técnico:</b> Esta plataforma no utiliza cookies publicitarias ni
              rastreadores de terceros. Para su funcionamiento, emplea almacenamiento local del navegador (
              <i>LocalStorage</i>) gestionado mediante Supabase Auth.
            </p>
            <p>
              <b>2. Finalidad Estrictamente Necesaria:</b> Los tokens almacenados permiten validar la identidad
              del operador autorizado, mantener la sesión activa durante el recorrido de lectura en campo y
              proteger las peticiones hacia la base de datos.
            </p>
            <p>
              <b>3. Cierre de Sesión:</b> Al finalizar la jornada o al utilizar dispositivos compartidos, el
              operador debe cerrar sesión explícitamente para eliminar los tokens locales del navegador.
            </p>
          </div>
        )}

        {tab === 'seguridad' && (
          <div>
            <h3>Política de Seguridad de la Información</h3>
            <p>
              <b>1. Cifrado y Transporte:</b> Todas las comunicaciones entre la aplicación web, el
              almacenamiento de fotografías y la base de datos se realizan mediante protocolos cifrados HTTPS/TLS.
            </p>
            <p>
              <b>2. Control de Acceso:</b> El acceso de lectura y escritura está restringido exclusivamente a
              cuentas verificadas. La base de datos implementa políticas de seguridad a nivel de fila (
              <i>Row Level Security</i>) para evitar accesos anónimos.
            </p>
            <p>
              <b>3. Trazabilidad:</b> Cada lectura registrada queda asociada a una fecha, marca de tiempo y
              respaldo fotográfico para auditoría interna y resolución de reclamos de consumo.
            </p>
          </div>
        )}

        {tab === 'terminos' && (
          <div>
            <h3>Términos y Condiciones de Uso (Operadores)</h3>
            <p>
              <b>1. Uso Autorizado:</b> Esta herramienta es de uso exclusivo para el personal autorizado por la
              Junta Directiva de la Asociación Comunal. Las credenciales (correo y contraseña) son personales e
              intransferibles.
            </p>
            <p>
              <b>2. Integridad de la Información:</b> El operador se compromete a registrar lecturas verídicas
              tomadas en sitio y a reportar anomalías (medidores dañados, fugas o inaccesibilidad) de manera
              objetiva.
            </p>
            <p>
              <b>3. Prohibiciones:</b> Queda estrictamente prohibida la extracción, descarga masiva (CSV/Excel) o
              divulgación no autorizada del padrón de usuarios, ubicaciones GPS o estados de cuenta fuera de los
              fines administrativos de la Asociación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
