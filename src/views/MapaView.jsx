import MapaMedidores from '../components/MapaMedidores';

export default function MapaView({ zonas, acometidas, acometidasFiltradas, filtroZona, setFiltroZona }) {
  return (
    <div>
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
      </div>

      <MapaMedidores acometidas={acometidasFiltradas} />
    </div>
  );
}
