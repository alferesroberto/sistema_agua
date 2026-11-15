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

export function exportarLecturasCsv(acometidas) {
  const realizadas = acometidas.filter((a) => Boolean(a.lectura_noviembre));
  if (realizadas.length === 0) {
    alert('Aún no hay lecturas realizadas en noviembre para exportar.');
    return;
  }

  const encabezados = [
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
  if (casosAtencion.length === 0) {
    alert('No hay casos reportados que requieran atención.');
    return;
  }

  const encabezados = [
    'No. Servicio',
    'Beneficiario',
    'Zona',
    'Caserio',
    'Medidor',
    'Estado Reportado',
    'Lectura Ingresada',
    'Detalle / Situacion'
  ];

  const filas = casosAtencion.map((a) => [
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
