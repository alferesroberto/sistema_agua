import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "lecturas_v1";
const PIN_CORRECTO = "1234"; // 🔑 Cambia este PIN por el que prefieras

export default function App() {
  // 1. Estados de Autenticación
  const [pinIngresado, setPinIngresado] = useState("");
  const [autenticado, setAutenticado] = useState(false);

  // 2. Estados de la Aplicación
  const [tab, setTab] = useState(1);
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { users: [], reads: {} };
    } catch {
      return { users: [], reads: {} };
    }
  });

  const [caserio, setCaserio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [lecturaInput, setLecturaInput] = useState("");
  const [obsInput, setObsInput] = useState("");
  const [msgGps, setMsgGps] = useState("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [importText, setImportText] = useState("");
  const [msgImport, setMsgImport] = useState("");
  const [csvOutput, setCsvOutput] = useState("");
  const [msgExport, setMsgExport] = useState("");

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Error guardando en localStorage", e);
    }
  }, [state]);

  const caserios = [...new Set(state.users.map((u) => u.cas).filter(Boolean))];

  // Geolocalización
  const getGps = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({ err: "Geolocalización no soportada por el navegador" });
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: +pos.coords.latitude.toFixed(6),
            lng: +pos.coords.longitude.toFixed(6),
            acc: Math.round(pos.coords.accuracy),
          });
        },
        (err) => resolve({ err: err.message }),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    });
  };

  const toggleUserEdit = (user) => {
    if (activeUser === user.no) {
      setActiveUser(null);
    } else {
      setActiveUser(user.no);
      const read = state.reads[user.no] || {};
      setLecturaInput(read.lec !== undefined ? read.lec : "");
      setObsInput(read.obs || "");
      setMsgGps("");
    }
  };

  const handleSaveRead = async (user) => {
    if (!lecturaInput.trim()) {
      setMsgGps("Escribe la lectura.");
      return;
    }

    if (
      user.ant !== "" &&
      user.ant !== undefined &&
      +lecturaInput < +user.ant &&
      !window.confirm(
        `La lectura (${lecturaInput}) es menor que la anterior (${user.ant}). ¿Guardar igual?`
      )
    ) {
      return;
    }

    setIsGpsLoading(true);
    setMsgGps("Obteniendo ubicación GPS…");

    const gpsData = await getGps();
    const newRecord = {
      lec: lecturaInput.trim(),
      obs: obsInput.trim(),
      t: new Date().toISOString(),
    };

    if (gpsData && gpsData.lat !== undefined) {
      Object.assign(newRecord, gpsData);
    }

    setState((prev) => ({
      ...prev,
      reads: { ...prev.reads, [user.no]: newRecord },
    }));

    setIsGpsLoading(false);

    if (gpsData && gpsData.lat !== undefined) {
      setActiveUser(null);
    } else {
      setMsgGps(
        `Guardado SIN GPS (${gpsData?.err || "no disponible"}). Activa la ubicación y vuelve a guardar.`
      );
    }
  };

  const handleImport = () => {
    const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let count = 0;
    const newUsers = [...state.users];

    lines.forEach((line) => {
      const delim = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
      const p = line.split(delim).map((x) => x.trim());
      if (p.length < 5 || /^no$/i.test(p[0])) return;

      const u = {
        no: p[0],
        nom: p[1],
        zona: p[2],
        med: p[3],
        cas: p[4],
        ant: p[5] || "",
      };

      const index = newUsers.findIndex((x) => x.no === u.no);
      if (index >= 0) newUsers[index] = u;
      else newUsers.push(u);
      count++;
    });

    setState((prev) => ({ ...prev, users: newUsers }));
    setMsgImport(`${count} usuarios importados.`);
    setImportText("");
  };

  const handleClearAll = () => {
    if (window.confirm("¿Borrar usuarios y lecturas de este dispositivo?")) {
      setState({ users: [], reads: {} });
      setMsgImport("Datos borrados.");
    }
  };

  const generateExport = () => {
    const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const headers = [
      "No", "Usuario", "Zona", "Medidor", "Caserio", 
      "Lectura", "Anterior", "Consumo", "Observaciones", 
      "Latitud", "Longitud", "Precision_m", "FechaHora"
    ];

    const rows = state.users
      .filter((u) => state.reads[u.no])
      .map((u) => {
        const r = state.reads[u.no];
        return [
          u.no, u.nom, u.zona, u.med, u.cas, r.lec,
          u.ant ?? "", u.ant ? r.lec - u.ant : "", r.obs,
          r.lat, r.lng, r.acc, r.t,
        ].map(q).join(",");
      });

    setCsvOutput([headers.join(","), ...rows].join("\n"));
    setMsgExport(`${rows.length} lecturas.`);
  };

  useEffect(() => {
    if (tab === 3) generateExport();
  }, [tab, state]);

  // Filtros de usuarios
  const filteredUsers = state.users.filter((u) => {
    const matchesCaserio = !caserio || u.cas === caserio;
    const q = busqueda.toLowerCase();
    const matchesQuery = !q || `${u.no} ${u.nom} ${u.med}`.toLowerCase().includes(q);
    return matchesCaserio && matchesQuery;
  });

  const readCount = filteredUsers.filter((u) => state.reads[u.no]).length;

  // 🔒 VISTA SI NO SE HA AUTENTICADO
  if (!autenticado) {
    return (
      <div style={{ maxWidth: 320, margin: "80px auto", textAlign: "center", padding: 20, fontFamily: "sans-serif" }}>
        <h3>🔒 Acceso Restringido</h3>
        <p style={{ fontSize: 14, color: "#666" }}>Ingresa el PIN de seguridad:</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pinIngresado === PIN_CORRECTO) {
              setAutenticado(true);
            } else {
              alert("PIN incorrecto");
            }
          }}
        >
          <input
            type="password"
            placeholder="PIN de acceso"
            value={pinIngresado}
            onChange={(e) => setPinIngresado(e.target.value)}
            style={{
              padding: 10,
              width: "100%",
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            style={{
              padding: 10,
              width: "100%",
              background: "#0b6fd6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // 💧 VISTA PRINCIPAL
  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: 18, margin: "4px 0 10px" }}>
        💧 Lecturas de medidores
      </h1>

      <nav style={styles.nav}>
        <button
          style={{ ...styles.btn, ...(tab === 1 ? styles.btnOn : {}) }}
          onClick={() => setTab(1)}
        >
          Lecturas
        </button>
        <button
          style={{ ...styles.btn, ...(tab === 4 ? styles.btnOn : {}) }}
          onClick={() => setTab(4)}
        >
          📊 Dashboard
        </button>
        <button
          style={{ ...styles.btn, ...(tab === 2 ? styles.btnOn : {}) }}
          onClick={() => setTab(2)}
        >
          Importar
        </button>
        <button
          style={{ ...styles.btn, ...(tab === 3 ? styles.btnOn : {}) }}
          onClick={() => setTab(3)}
        >
          Exportar
        </button>
      </nav>

      {/* PESTAÑA 1: LECTURAS */}
      {tab === 1 && (
        <section>
          <div style={styles.row}>
            <select
              style={styles.input}
              value={caserio}
              onChange={(e) => setCaserio(e.target.value)}
            >
              <option value="">Todos los caseríos</option>
              {caserios.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Buscar usuario, No. o medidor"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={styles.msg}>
            {state.users.length > 0 && `${readCount} de ${filteredUsers.length} leídos`}
          </div>

          {state.users.length === 0 ? (
            <p style={styles.mu}>
              Aún no hay usuarios. Ve a <b>Importar</b> y pega tu listado.
            </p>
          ) : (
            filteredUsers.map((u) => {
              const r = state.reads[u.no];
              const isOpen = activeUser === u.no;
              return (
                <div key={u.no} style={styles.item}>
                  <div style={styles.itemHeader} onClick={() => toggleUserEdit(u)}>
                    <div>
                      <b>{u.no}</b> {u.nom}
                      <div style={styles.mu}>
                        Medidor {u.med || "—"} · {u.cas}
                      </div>
                    </div>
                    <div style={styles.ok}>
                      {r && (
                        <>
                          {r.lec} {r.lat ? "📍" : "⚠️"}
                          {u.ant !== "" && u.ant !== undefined && (
                            <div style={styles.mu}>+{r.lec - u.ant} m³</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={styles.editBox}>
                      {u.ant !== "" && u.ant !== undefined && (
                        <div style={styles.mu}>
                          Lectura anterior: <b>{u.ant}</b>
                        </div>
                      )}
                      <input
                        style={styles.input}
                        type="number"
                        inputMode="numeric"
                        placeholder="Lectura actual"
                        value={lecturaInput}
                        onChange={(e) => setLecturaInput(e.target.value)}
                      />
                      <input
                        style={styles.input}
                        placeholder="Observaciones"
                        value={obsInput}
                        onChange={(e) => setObsInput(e.target.value)}
                      />
                      <button
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        disabled={isGpsLoading}
                        onClick={() => handleSaveRead(u)}
                      >
                        {isGpsLoading ? "Obteniendo GPS…" : "Guardar con GPS"}
                      </button>
                      <div style={styles.msg}>{msgGps}</div>
                      {r?.lat && (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                          style={{ color: "#0b6fd6" }}
                        >
                          Ver ubicación (±{r.acc} m)
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {/* PESTAÑA 4: DASHBOARD / ESTADÍSTICAS */}
      {tab === 4 && (
        <section>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Resumen de Avance</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={styles.cardMetric}>
              <div style={styles.mu}>Total Usuarios</div>
              <div style={{ fontSize: 22, fontWeight: "bold" }}>{state.users.length}</div>
            </div>
            <div style={styles.cardMetric}>
              <div style={styles.mu}>Lecturas Tomadas</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#13804a" }}>
                {Object.keys(state.reads).length}
              </div>
            </div>
          </div>

          <div style={{ ...styles.item, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
              <span>Progreso general</span>
              <b>
                {state.users.length > 0
                  ? Math.round((Object.keys(state.reads).length / state.users.length) * 100)
                  : 0}
                %
              </b>
            </div>
            <div style={{ width: "100%", background: "#d9dde3", borderRadius: 8, height: 12, overflow: "hidden" }}>
              <div
                style={{
                  width: `${
                    state.users.length > 0
                      ? (Object.keys(state.reads).length / state.users.length) * 100
                      : 0
                  }%`,
                  background: "#0b6fd6",
                  height: "100%",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Avance por Caserío</h3>
          {caserios.map((c) => {
            const usersInCas = state.users.filter((u) => u.cas === c);
            const readInCas = usersInCas.filter((u) => state.reads[u.no]).length;
            const porcentaje = usersInCas.length > 0 ? Math.round((readInCas / usersInCas.length) * 100) : 0;

            return (
              <div key={c} style={{ ...styles.item, padding: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span><b>{c}</b></span>
                  <span style={{ color: "#6b7280" }}>{readInCas} / {usersInCas.length} ({porcentaje}%)</span>
                </div>
                <div style={{ width: "100%", background: "#d9dde366", borderRadius: 6, height: 6 }}>
                  <div style={{ width: `${porcentaje}%`, background: "#13804a", height: "100%", borderRadius: 6 }} />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* PESTAÑA 2: IMPORTAR */}
      {tab === 2 && (
        <section>
          <p style={styles.mu}>
            Pega los usuarios desde Excel/CSV con columnas:{" "}
            <b>No, Usuario, Zona, Medidor, Caserío, Lectura anterior (opcional)</b>
          </p>
          <textarea
            style={styles.textarea}
            placeholder="1,Abel Enriquez Martinez Alvarado,1,22428,EL MATASANO"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div style={{ ...styles.row, marginTop: 8 }}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleImport}
            >
              Importar
            </button>
            <button style={styles.btn} onClick={handleClearAll}>
              Borrar todo
            </button>
          </div>
          <div style={styles.msg}>{msgImport}</div>
        </section>
      )}

      {/* PESTAÑA 3: EXPORTAR */}
      {tab === 3 && (
        <section>
          <p style={styles.mu}>
            CSV con lectura, latitud, longitud, precisión (m) y fecha/hora.
          </p>
          <textarea style={styles.textarea} readOnly value={csvOutput} />
          <div style={{ ...styles.row, marginTop: 8 }}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(csvOutput);
                  setMsgExport("Copiado al portapapeles.");
                } catch {
                  setMsgExport("Selecciona y copia manualmente.");
                }
              }}
            >
              Copiar CSV
            </button>
          </div>
          <div style={styles.msg}>{msgExport}</div>
        </section>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 640,
    margin: "0 auto",
    padding: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  nav: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  row: { display: "flex", gap: 8, marginBottom: 8 },
  btn: {
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: "1px solid #d9dde3",
    background: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
  btnOn: { background: "#0b6fd6", color: "#fff", borderColor: "#0b6fd6" },
  btnPrimary: {
    background: "#0b6fd6",
    color: "#fff",
    borderColor: "#0b6fd6",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d9dde3",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d9dde3",
    fontFamily: "monospace",
    fontSize: 13,
    boxSizing: "border-box",
  },
  item: {
    background: "#fff",
    border: "1px solid #d9dde3",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  editBox: { marginTop: 10, display: "grid", gap: 8 },
  cardMetric: {
    background: "#fff",
    border: "1px solid #d9dde3",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
  },
  mu: { color: "#6b7280", fontSize: 13 },
  ok: { color: "#13804a", fontWeight: "bold" },
  msg: { fontSize: 13, color: "#6b7280", minHeight: 18, marginTop: 4 },
};
