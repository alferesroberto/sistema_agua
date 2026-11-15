export default function TemaToggle({ preferencia, onCambiar }) {
  const opciones = [
    { id: 'sistema', etiqueta: 'Auto' },
    { id: 'claro', etiqueta: 'Claro' },
    { id: 'oscuro', etiqueta: 'Oscuro' }
  ];

  return (
    <div className="tema-toggle" role="group" aria-label="Tema de la aplicación">
      {opciones.map((op) => (
        <button
          key={op.id}
          type="button"
          className={preferencia === op.id ? 'is-activo' : ''}
          onClick={() => onCambiar(op.id)}
        >
          {op.etiqueta}
        </button>
      ))}
    </div>
  );
}
