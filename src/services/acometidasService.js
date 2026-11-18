import { supabase } from './supabase';

export function compararOrdenRuta(a, b) {
  const ordenA = Number(a.orden_ruta);
  const ordenB = Number(b.orden_ruta);
  const aSinOrden = a.orden_ruta == null || Number.isNaN(ordenA);
  const bSinOrden = b.orden_ruta == null || Number.isNaN(ordenB);

  if (aSinOrden && bSinOrden) {
    return Number(a.numero_servicio) - Number(b.numero_servicio);
  }
  if (aSinOrden) return 1;
  if (bSinOrden) return -1;
  if (ordenA !== ordenB) return ordenA - ordenB;
  return Number(a.numero_servicio) - Number(b.numero_servicio);
}

export async function obtenerAcometidas() {
  return supabase
    .from('acometidas')
    .select('*')
    .order('orden_ruta', { ascending: true, nullsFirst: false })
    .order('numero_servicio', { ascending: true });
}

export function acometidasDeLaZona(acometidas, zonaId) {
  return acometidas
    .filter((a) => String(a.zona_id) === String(zonaId))
    .sort(compararOrdenRuta);
}

export async function reubicarEnRutaZona({ acometidasZona, acometidaId, despuesDeId }) {
  const ordenadas = [...acometidasZona].sort(compararOrdenRuta);
  const movida = ordenadas.find((a) => a.id === acometidaId);
  if (!movida) throw new Error('No se encontró la acometida a reubicar.');

  const resto = ordenadas.filter((a) => a.id !== acometidaId);
  let insertAt = 0;

  if (despuesDeId) {
    const idx = resto.findIndex((a) => a.id === despuesDeId);
    insertAt = idx === -1 ? resto.length : idx + 1;
  }

  resto.splice(insertAt, 0, movida);

  const secuencia = resto.map((a, i) => ({
    id: a.id,
    ordenAnterior: a.orden_ruta,
    orden_ruta: i + 1
  }));

  const cambios = secuencia.filter((item) => Number(item.ordenAnterior) !== item.orden_ruta);
  if (cambios.length === 0) return secuencia;

  const OFFSET = 100000;
  const ahora = new Date().toISOString();

  for (const item of cambios) {
    const { error } = await supabase
      .from('acometidas')
      .update({ orden_ruta: OFFSET + item.orden_ruta })
      .eq('id', item.id);
    if (error) throw error;
  }

  for (const item of cambios) {
    const { error } = await supabase
      .from('acometidas')
      .update({ orden_ruta: item.orden_ruta, actualizado_en: ahora })
      .eq('id', item.id);
    if (error) throw error;
  }

  return secuencia;
}
