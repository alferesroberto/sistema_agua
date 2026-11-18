import TemaToggle from './TemaToggle';

export default function Navbar({
  vistaActiva,
  onCambiarVista,
  totalLeidos,
  totalActivos,
  porcentajeAvance,
  casosAtencion,
  onActualizar,
  onCerrarSesion,
  preferencia,
  onCambiarTema,
  onAbrirLegal
}) {
  const tabs = [
    { id: 'ruta', label: 'Ruta' },
    { id: 'nueva', label: '+ Nueva' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mapa', label: 'Mapa GPS' },
    { id: 'reportes', label: `Alertas (${casosAtencion})` }
  ];

  return (
    <header className="navbar">
      <div className="navbar-top">
        <div>
          <h2>Sistema de Lecturas — Noviembre 2026</h2>
          <span className="navbar-avance">
            Avance: <b>{totalLeidos}</b> de <b>{totalActivos}</b> activos ({porcentajeAvance}%)
          </span>
        </div>
        <div className="navbar-acciones">
          <TemaToggle preferencia={preferencia} onCambiar={onCambiarTema} />
          <button type="button" className="btn" onClick={onAbrirLegal}>
            Legal
          </button>
          <button type="button" className="btn" onClick={onActualizar}>
            Actualizar
          </button>
          <button type="button" className="btn btn-peligro" onClick={onCerrarSesion}>
            Salir
          </button>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab${vistaActiva === tab.id ? ' is-activa' : ''}`}
            onClick={() => onCambiarVista(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}