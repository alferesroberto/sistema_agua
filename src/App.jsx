import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "lecturas_v1";
const PIN_CORRECTO = "1234"; // 🔑 PIN de acceso al sistema
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxigieAgwwA-huTB3_kTBDe_Xag2DIGBzAG4UEAcAd2ds355MuuyBCuPIDeXSxQWfXnOw/exec"; 

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
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos" | "pendientes" | "leidos"
  
  // 📄 Estados de Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 15;

  const [activeUser, setActiveUser] = useState(null);
  const [lecturaInput, setLecturaInput] = useState("");
  const [obsInput, setObsInput] = useState("");
  const [msgGps, setMsgGps] = useState("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [importText, setImportText] = useState("");
  const [msgImport, setMsgImport] = useState("");
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

  // Función para enviar respaldo en segundo plano a Google Sheets
  const sendToGoogleSheets = async (user, readRecord) => {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("PEGA_AQUI_TU_URL")) return;

    try {
      const payload = {
        no: user.no,
        nom: user.nom,
        med: user.med || "",
        cas: user.cas || "",
        lec: readRecord.lec,
        obs: readRecord.obs,
        lat: readRecord.lat || "",
        lng: readRecord.lng || "",
        t: readRecord.t
      };

      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Error al respaldar en Google Sheets:", error);
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

    sendToGoogleSheets(user, newRecord);
    setIsGpsLoading(false);

    if (gpsData && gpsData.lat !== undefined) {
      setActiveUser(null);
    } else {
      setMsgGps(
        `Guardado SIN GPS (${gpsData?.err || "no disponible"}). Respaldado en nube.`
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
    setPaginaActual(1);
  };

  const handleClearAll = () => {
    if (window.confirm("¿Borrar usuarios y lecturas de este dispositivo?")) {
      setState({ users: [], reads: {} });
      setMsgImport("Datos borrados.");
      setPaginaActual(1);
    }
  };

  // Filtros de usuarios (Caserío, Búsqueda y Estado de Lectura)
  const filteredUsers = state.users.filter((u) => {
    const matchesCaserio = !caserio || u.cas === caserio;
    const q = busqueda.toLowerCase();
    const matchesQuery = !q || `${u.no} ${u.nom} ${u.med}`.toLowerCase().includes(q);
    
    const isRead = !!state.reads[u.no];
    let matchesEstado = true;
    if (filtroEstado === "pendientes") matchesEstado = !isRead;
    if (filtroEstado === "leidos") matchesEstado = isRead;

    return matchesCaserio && matchesQuery && matchesEstado;
  });

  // Cálculo de Paginación
  const totalPaginas = Math.ceil(filteredUsers.length / porPagina) || 1;
  const indiceInicio = (paginaActual - 1) * porPagina;
  const usuariosVisibles = filteredUsers.slice(indiceInicio, indiceInicio + porPagina);

  const readCount = state.users.filter((u) => state.reads[u.no]).length;

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
              onChange={(e) => {
                setCaserio(e.target.value);
                setPaginaActual(1);
              }}
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
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          {/* BOTONES DE FILTRO RÁPIDO */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button
              style={{ ...styles.btnFilter, ...(filtroEstado === "todos" ? styles.btnFilterActive : {}) }}
              onClick={() => { setFiltroEstado("todos"); setPaginaActual(1); }}
            >
              Todos ({state.users.length})
            </button>
            <button
              style={{
                ...styles.btnFilter,
                ...(filtroEstado === "pendientes" ? styles.btnFilterActive : {}),
              }}
              onClick={() => { setFiltroEstado("pendientes"); setPaginaActual(1); }}
            >
              Pendientes ({state.users.length - readCount})
            </button>
            <button
              style={{
                ...styles.btnFilter,
                ...(filtroEstado === "leidos" ? styles.btnFilterActive : {}),
              }}
              onClick={() => { setFiltroEstado("leidos"); setPaginaActual(1); }}
            >
              Leídos ({readCount})
            </button>
          </div>

          <div style={styles.msg}>
            {state.users.length > 0 && `Mostrando ${filteredUsers.length} usuarios (Pág. ${paginaActual} de ${totalPaginas})`}
          </div>

          {state.users.length === 0 ? (
            <p style={styles.mu}>
              Aún no hay usuarios. Ve a <b>Importar</b> y pega tu listado.
            </p>
          ) : filteredUsers.length === 0 ? (
            <p style={styles.mu}>No hay usuarios que coincidan con este filtro.</p>
          ) : (
            <>
              {usuariosVisibles.map((u) => {
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
              })}

              {/* CONTROLES DE PAGINACIÓN */}
              {totalPaginas > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0", gap: 8 }}>
                  <button
                    style={{ ...styles.btn, opacity: paginaActual === 1 ? 0.4 : 1 }}
                    disabled={paginaActual === 1}
                    onClick={() => {
                      setPaginaActual(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    ⬅️ Anterior
                  </button>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: "bold" }}>
                    {paginaActual} / {totalPaginas}
                  </span>
                  <button
                    style={{ ...styles.btn, opacity: paginaActual === totalPaginas ? 0.4 : 1 }}
                    disabled={paginaActual === totalPaginas}
                    onClick={() => {
                      setPaginaActual(prev => Math.min(prev + 1, totalPaginas));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Siguiente ➡️
                  </button>
                </div>
              )}
            </>
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
            Descarga un archivo CSV con las <b>{state.users.filter((u) => state.reads[u.no]).length} lecturas</b> realizadas hasta el momento (con GPS, fecha y hora).
          </p>
          
          <div style={{ ...styles.row, marginTop: 16 }}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, padding: 14, fontSize: 16 }}
              onClick={() => {
                const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
                const headers = [
                  "No", "Usuario", "Zona", "Medidor", "Caserio", 
                  "Lectura", "Anterior", "Consumo", "Observaciones", 
                  "Latitud", "Longitud", "Precision_m", "FechaHora"
                ];

                const readUsers = state.users.filter((u) => state.reads[u.no]);
                const rows = readUsers.map((u) => {
                  const r = state.reads[u.no];
                  return [
                    u.no, u.nom, u.zona, u.med, u.cas, r.lec,
                    u.ant ?? "", u.ant ? r.lec - u.ant : "", r.obs,
                    r.lat, r.lng, r.acc, r.t,
                  ].map(q).join(",");
                });

                const csvContent = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `lecturas_respaldo_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setMsgExport(`¡Archivo descargado con éxito (${readUsers.length} lecturas)!`);
              }}
            >
              📥 Descargar Archivo CSV
            </button>
          </div>
          <div style={{ ...styles.msg, textAlign: "center", fontWeight: "bold", color: "#13804a", marginTop: 10 }}>{msgExport}</div>
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
  btnFilter: {
    flex: 1,
    padding: "8px 4px",
    borderRadius: 8,
    border: "1px solid #d9dde3",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "center",
  },
  btnFilterActive: {
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
