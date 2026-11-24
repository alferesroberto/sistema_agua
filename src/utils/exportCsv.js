function descargarCsv(nombreArchivo, encabezados, filas) {
  const csvContent = '\uFEFF' + [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function textoCsv(valor) {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`;
}

function obtenerOrdenRuta(item) {
  const orden = Number(item?.orden_ruta);
  if (Number.isFinite(orden) && orden > 0) return orden;
  return Number.MAX_SAFE_INTEGER;
}

function obtenerNumeroServicio(item) {
  const servicio = Number(item?.numero_servicio);
  return Number.isFinite(servicio) ? servicio : Number.MAX_SAFE_INTEGER;
}

export function ordenarPorRuta(items = []) {
  return [...items].sort((a, b) => {
    // 1. Si deseas agrupar primero por zona y caserío, descomenta estas líneas:
   const zonaA = String(a?.nombre_zona ?? '');
   const zonaB = String(b?.nombre_zona ?? '');
    if (zonaA !== zonaB) return zonaA.localeCompare(zonaB, 'es', { numeric: true });
    //
   const caserioA = String(a?.nombre_caserio ?? '');
   const caserioB = String(b?.nombre_caserio ?? '');
   if (caserioA !== caserioB) return caserioA.localeCompare(caserioB, 'es', { numeric: true });

    // 2. Orden principal por orden_ruta
    const rutaA = obtenerOrdenRuta(a);
    const rutaB = obtenerOrdenRuta(b);
    if (rutaA !== rutaB) return rutaA - rutaB;

    // 3. Respaldo por numero_servicio si tienen el mismo orden_ruta o no tienen asignado
    const servA = obtenerNumeroServicio(a);
    const servB = obtenerNumeroServicio(b);
    if (servA !== servB) return servA - servB;

    return String(a?.nombre_beneficiario ?? '').localeCompare(
      String(b?.nombre_beneficiario ?? ''),
      'es'
    );
  });
}

export function exportarLecturasCsv(acometidas) {
  const realizadas = ordenarPorRuta(
    acometidas.filter((a) => Boolean(a.lectura_noviembre))
  );

  if (realizadas.length === 0) {
    alert('Aún no hay lecturas realizadas en noviembre para exportar.');
    return;
  }

  const encabezados = [
    'Orden Ruta',
    'ID Acometida',
    'No. Servicio',
    'Nombre Completo del Beneficiario',
    'Zona',
    'Nombre del Caserio',
    'Medidor',
    'Lectura Anterior (Oct)',
    'Lectura Actual (Nov)',
    'Consumo m3',
    'Estado Medidor',
    'Observaciones'
  ];

  const filas = realizadas.map((a) => [
    a.orden_ruta ?? '',
    a.id,
    a.numero_servicio,
    textoCsv(a.nombre_beneficiario),
    textoCsv(a.nombre_zona),
    textoCsv(a.nombre_caserio),
    a.medidor_numero || '',
    a.lectura_noviembre.lectura_anterior,
    a.lectura_noviembre.lectura_actual,
    a.lectura_noviembre.consumo_m3,
    a.lectura_noviembre.estado_medidor_reportado || 'BUENO',
    textoCsv(a.lectura_noviembre.observaciones || '')
  ]);

  descargarCsv(`Lecturas_Noviembre_2026_${new Date().toISOString().slice(0, 10)}.csv`, encabezados, filas);
}

export function exportarReporteAtencionCsv(casosAtencion) {
  if (!casosAtencion || casosAtencion.length === 0) {
    alert('No hay casos reportados que requieran atención.');
    return;
  }

  const ordenados = ordenarPorRuta(casosAtencion);

  const encabezados = [
    'Orden Ruta',
    'No. Servicio',
    'Beneficiario',
    'Zona',
    'Caserio',
    'Medidor',
    'Estado Reportado',
    'Lectura Ingresada',
    'Detalle / Situacion'
  ];

  const filas = ordenados.map((a) => [
    a.orden_ruta ?? '',
    a.numero_servicio,
    textoCsv(a.nombre_beneficiario),
    textoCsv(a.nombre_zona),
    textoCsv(a.nombre_caserio),
    a.medidor_numero || '',
    a.lectura_noviembre.estado_medidor_reportado,
    a.lectura_noviembre.lectura_actual,
    textoCsv(a.lectura_noviembre.observaciones || 'Marcado para revisión')
  ]);

  descargarCsv('Reporte_Atencion_Medidores_Nov2026.csv', encabezados, filas);
}