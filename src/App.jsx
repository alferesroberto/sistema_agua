import { useState, useEffect } from 'react';
import { obtenerSesion, suscribirSesion, cerrarSesion } from './services/authService';
import { useAcometidas } from './hooks/useAcometidas';
import { useTema } from './hooks/useTema';
import LoginView from './views/LoginView';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import RutaLecturaView from './views/RutaLecturaView';
import MapaView from './views/MapaView';
import ReportesView from './views/ReportesView';

export default function App() {
  const [sesion, setSesion] = useState(undefined);
  const tema = useTema();

  useEffect(() => {
    let cancelado = false;

    obtenerSesion()
      .then((session) => {
        if (!cancelado) setSesion(session);
      })
      .catch(() => {
        if (!cancelado) setSesion(null);
      });

    const unsuscribir = suscribirSesion(setSesion);
    return () => {
      cancelado = true;
      unsuscribir();
    };
  }, []);

  async function handleCerrarSesion() {
    try {
      await cerrarSesion();
    } catch (error) {
      alert('No se pudo cerrar sesión: ' + error.message);
    }
  }

  if (sesion === undefined) {
    return <div className="pantalla-carga">Verificando sesión...</div>;
  }

  if (!sesion) {
    return <LoginView preferencia={tema.preferencia} onCambiarTema={tema.setPreferencia} />;
  }

  return <AppAutenticada onCerrarSesion={handleCerrarSesion} tema={tema} />;
}

function AppAutenticada({ onCerrarSesion, tema }) {
  const [vistaActiva, setVistaActiva] = useState('ruta');
  const datos = useAcometidas();

  function cambiarVista(id) {
    setVistaActiva(id);
    datos.cerrarCaptura();
  }

  if (datos.loading) {
    return <div className="pantalla-carga">Cargando padrón activo y lecturas de noviembre...</div>;
  }

  const capturaProps = {
    lecturaActual: datos.lecturaActual,
    setLecturaActual: datos.setLecturaActual,
    estadoMedidor: datos.estadoMedidor,
    setEstadoMedidor: datos.setEstadoMedidor,
    requiereAtencion: datos.requiereAtencion,
    setRequiereAtencion: datos.setRequiereAtencion,
    observaciones: datos.observaciones,
    setObservaciones: datos.setObservaciones,
    setFoto1: datos.setFoto1,
    setFoto2: datos.setFoto2,
    actualizarGps: datos.actualizarGps,
    setActualizarGps: datos.setActualizarGps,
    coordsGps: datos.coordsGps,
    obteniendoGps: datos.obteniendoGps,
    guardando: datos.guardando,
    onVolver: datos.cerrarCaptura,
    onCapturarGps: datos.capturarUbicacionGps,
    onGuardar: datos.handleGuardarLectura
  };

  return (
    <div className="app-shell">
      <Navbar
        vistaActiva={vistaActiva}
        onCambiarVista={cambiarVista}
        totalLeidos={datos.totalLeidosGlobal}
        totalActivos={datos.totalActivos}
        porcentajeAvance={datos.porcentajeAvance}
        casosAtencion={datos.casosAtencion.length}
        onActualizar={datos.cargarTodo}
        onCerrarSesion={onCerrarSesion}
        preferencia={tema.preferencia}
        onCambiarTema={tema.setPreferencia}
      />

      {vistaActiva === 'ruta' && (
        <RutaLecturaView
          zonas={datos.zonas}
          acometidas={datos.acometidas}
          filtroZona={datos.filtroZona}
          setFiltroZona={datos.setFiltroZona}
          busqueda={datos.busqueda}
          setBusqueda={datos.setBusqueda}
          listaPendientes={datos.listaPendientes}
          listaLeidos={datos.listaLeidos}
          acometidaActiva={datos.acometidaActiva}
          abrirCaptura={datos.abrirCaptura}
          capturaProps={capturaProps}
        />
      )}

      {vistaActiva === 'dashboard' && (
        <DashboardView
          zonas={datos.zonas}
          acometidas={datos.acometidas}
          totalActivos={datos.totalActivos}
          totalLeidosGlobal={datos.totalLeidosGlobal}
          totalPendientesGlobal={datos.totalPendientesGlobal}
          porcentajeAvance={datos.porcentajeAvance}
        />
      )}

      {vistaActiva === 'mapa' && (
        <MapaView
          zonas={datos.zonas}
          acometidas={datos.acometidas}
          acometidasFiltradas={datos.acometidasFiltradas}
          filtroZona={datos.filtroZona}
          setFiltroZona={datos.setFiltroZona}
        />
      )}

      {vistaActiva === 'reportes' && (
        <ReportesView
          acometidas={datos.acometidas}
          casosAtencion={datos.casosAtencion}
          totalLeidosGlobal={datos.totalLeidosGlobal}
        />
      )}
    </div>
  );
}
