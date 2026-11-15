import MapaMedidores from '../components/MapaMedidores';

export default function MapaView({ zonas, acometidas, acometidasFiltradas, filtroZona, setFiltroZona }) {
  return (
    <div>
      <div className="filtros">
        <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)}>
          <option value="TODAS">Todas las Zonas ({acometidas.length})</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre_zona}
            </option>
          ))}
        </select>
      </div>

      <MapaMedidores acometidas={acometidasFiltradas} />
    </div>
  );
}
