import { useEffect, useRef } from 'react';

export default function MapaMedidores({ acometidas }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    const L = window.L;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const conCoordenadas = acometidas.filter((a) => a.latitud && a.longitud);
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [acometidas]);

  const geolocalizados = acometidas.filter((a) => a.latitud && a.longitud).length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 15, fontSize: '0.85rem', marginBottom: 10 }}>
        <span>
          <b style={{ color: '#16a34a' }}>●</b> Leído en Noviembre
        </span>
        <span>
          <b style={{ color: '#ea580c' }}>●</b> Pendiente de lectura
        </span>
        <span style={{ color: '#6b7280' }}>(Geolocalizados: {geolocalizados})</span>
      </div>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '450px', borderRadius: 10, border: '1px solid #d1d5db' }}
      />
    </div>
  );
}
