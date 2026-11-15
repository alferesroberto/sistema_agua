import { useEffect, useState } from 'react';

const CLAVE = 'sistema_agua_tema';

export function useTema() {
  const [preferencia, setPreferencia] = useState(() => {
    try {
      return localStorage.getItem(CLAVE) || 'sistema';
    } catch {
      return 'sistema';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.tema = preferencia;
    try {
      localStorage.setItem(CLAVE, preferencia);
    } catch {
      /* ignore */
    }
  }, [preferencia]);

  return { preferencia, setPreferencia };
}
