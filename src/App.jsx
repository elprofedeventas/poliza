import { useState, useEffect, useMemo, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// En producción: "/api/proxy" (Vercel)
// En desarrollo local: cambia a tu URL directa de GAS (sin proxy)
const API = "/api/proxy";

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F2ED", surface: "#FFFFFF", ink: "#1A1611", ink2: "#6B6560",
  ink3: "#A8A39E", border: "#E4DFD8", accent: "#C8501A", accentBg: "#FDF1EC",
  green: "#1A7A4A", greenBg: "#EAF6EE", amber: "#B45309", amberBg: "#FEF3C7",
  blue: "#1D4ED8", blueBg: "#EFF6FF", red: "#B91C1C", redBg: "#FEE2E2",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const fmtFecha = d => new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const fmtDinero = n => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 });
const diasPara = fin => Math.round((new Date(fin) - hoy) / 86400000);
const iso = d => d.toISOString().split("T")[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const RAMOS = ["Vida / GMM", "Autos", "Daños / Hogar", "Empresarial / RC"];
const ASEGURADORAS = ["GNP", "AXA", "Qualitas", "Mapfre", "HDI", "BBVA Seguros", "Inbursa"];
const FORMAS_PAGO = ["Anual", "Semestral", "Trimestral", "Mensual"];
const RAMO_ICON = { "Vida / GMM": "🫀", "Autos": "🚗", "Daños / Hogar": "🏠", "Empresarial / RC": "🏢" };

// ─── CAPA API ─────────────────────────────────────────────────────────────────
const api = {
  // GET: carga todo de una vez
  getAll: () =>
    fetch(`${API}?action=getAll`).then(r => r.json()),

  // POST genérico
  post: (body) =>
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  savePoliza:      (data) => api.post({ action: "savePoliza", data }),
  deletePoliza:    (id)   => api.post({ action: "deletePoliza", id }),
  saveProspecto:   (data) => api.post({ action: "saveProspecto", data }),
  deleteProspecto: (id)   => api.post({ action: "deleteProspecto", id }),
  saveCobro:       (data) => api.post({ action: "saveCobro", data }),
  deleteCobro:     (id)   => api.post({ action: "deleteCobro", id }),
  addSeguimiento:  (data) => api.post({ action: "addSeguimiento", data }),
  addSiniestro:    (data) => api.post({ action: "addSiniestro", data }),
  updateSiniestro: (data) => api.post({ action: "updateSiniestro", data }),
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const inp = { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.ink, background: C.bg, boxSizing: "border-box", fontFamily: "inherit", outline: "none" };
const btnPrim = { background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const btnSec = { background: "transparent", color: C.ink2, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const btnGreen = { ...btnPrim, background: C.green };

// ─── BADGE ───────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  "Vigente": { bg: C.greenBg, color: C.green }, "Por vencer": { bg: C.amberBg, color: C.amber },
  "Vencida": { bg: C.redBg, color: C.red }, "Cancelada": { bg: "#F3F4F6", color: "#4B5563" },
  "En trámite": { bg: C.blueBg, color: C.blue }, "Primer contacto": { bg: C.blueBg, color: C.blue },
  "Cotización enviada": { bg: C.amberBg, color: C.amber }, "Reunión agendada": { bg: "#EDE9FE", color: "#5B21B6" },
  "Cerrado ganado": { bg: C.greenBg, color: C.green }, "Cerrado perdido": { bg: C.redBg, color: C.red },
  "Pendiente": { bg: C.amberBg, color: C.amber }, "Cobrado": { bg: C.greenBg, color: C.green },
  "Vencido": { bg: C.redBg, color: C.red }, "Abierto": { bg: C.amberBg, color: C.amber },
  "En proceso": { bg: C.blueBg, color: C.blue }, "Cerrado": { bg: "#F3F4F6", color: "#4B5563" },
};
const Badge = ({ label }) => {
  const s = BADGE_MAP[label] || { bg: "#F3F4F6", color: "#4B5563" };
  return <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, accent }) => (
  <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: accent || C.ink, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.ink3, marginTop: 6 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
    <div>
      <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{sub}</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: "'Playfair Display', serif", margin: 0 }}>{title}</h2>
    </div>
    {action}
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(26,22,17,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: C.surface, borderRadius: 18, width: "100%", maxWidth: wide ? 680 : 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.25)" }}>
      <div style={{ padding: "22px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: "'Playfair Display', serif" }}>{title}</h3>
        <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: C.ink2 }}>✕</button>
      </div>
      <div style={{ padding: "0 26px 26px" }}>{children}</div>
    </div>
  </div>
);

const Campo = ({ label, children, span }) => (
  <div style={span ? { gridColumn: "span 2" } : {}}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

// ─── SEGUIMIENTO LOG ──────────────────────────────────────────────────────────
const SeguimientoLog = ({ items, onAdd, loading }) => {
  const [texto, setTexto] = useState("");
  const enviar = () => { if (texto.trim()) { onAdd(texto.trim()); setTexto(""); } };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📋 Seguimiento</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar()} placeholder="Registrar acción, llamada, acuerdo… (Enter)" style={{ ...inp, flex: 1 }} disabled={loading} />
        <button onClick={enviar} style={btnPrim} disabled={loading}>{loading ? "…" : "+"}</button>
      </div>
      {items.length === 0 && <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>Sin registros aún.</p>}
      {[...items].sort((a,b) => b.fecha.localeCompare(a.fecha)).map(s => (
        <div key={s.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 11, color: C.ink3, whiteSpace: "nowrap", paddingTop: 1 }}>{fmtFecha(s.fecha)}</span>
          <span style={{ fontSize: 13, color: C.ink }}>{s.texto}</span>
        </div>
      ))}
    </div>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
const Spinner = ({ msg }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ fontSize: 14, color: C.ink3 }}>{msg || "Cargando…"}</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, tipo }) => {
  if (!msg) return null;
  const bg = tipo === "error" ? C.red : C.green;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: bg, color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,.2)", maxWidth: 320 }}>
      {tipo === "error" ? "⚠️ " : "✓ "}{msg}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({ polizas, prospectos, cobros, setVista }) {
  const vencen30 = polizas.filter(p => { const d = diasPara(p.vigenciaFin); return d >= 0 && d <= 30; });
  const primaActiva = polizas.filter(p => p.estatus !== "Vencida" && p.estatus !== "Cancelada").reduce((s, p) => s + Number(p.prima), 0);
  const pendienteCobro = cobros.filter(c => c.estatus === "Pendiente").reduce((s, c) => s + Number(c.monto), 0);
  const siniestrosAbiertos = polizas.flatMap(p => p.siniestros || []).filter(s => s.estatus === "Abierto" || s.estatus === "En proceso").length;
  const vencidas = polizas.filter(p => p.estatus === "Vencida");
  const prospectosCal = prospectos.filter(p => p.estatus === "Reunión agendada" || p.estatus === "Cotización enviada");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Buenos días</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: C.ink, fontFamily: "'Playfair Display', serif", margin: "4px 0 0" }}>Mi cartera hoy</h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <Stat label="Pólizas activas" value={polizas.filter(p => p.estatus === "Vigente" || p.estatus === "Por vencer").length} sub={`${polizas.length} en total`} />
        <Stat label="Prima bajo gestión" value={fmtDinero(primaActiva)} />
        <Stat label="Por cobrar" value={fmtDinero(pendienteCobro)} accent={C.amber} />
        <Stat label="Siniestros abiertos" value={siniestrosAbiertos} accent={siniestrosAbiertos > 0 ? C.red : C.green} />
      </div>

      {vencen30.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>🔔 Renovaciones urgentes — próximos 30 días</div>
            <button onClick={() => setVista("polizas")} style={{ ...btnSec, fontSize: 12, padding: "5px 12px" }}>Ver todas →</button>
          </div>
          {vencen30.sort((a,b) => diasPara(a.vigenciaFin) - diasPara(b.vigenciaFin)).map(p => {
            const d = diasPara(p.vigenciaFin);
            return (
              <div key={p.id} style={{ background: d <= 7 ? C.accentBg : C.amberBg, border: `1.5px solid ${d <= 7 ? "#F4B8A0" : "#FCD34D"}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{p.clienteNombre}</div>
                  <div style={{ fontSize: 12, color: C.ink2, marginTop: 3 }}>{RAMO_ICON[p.ramo]} {p.ramo} · {p.aseguradora} · {fmtDinero(p.prima)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: d <= 7 ? C.accent : C.amber, fontFamily: "'Playfair Display', serif" }}>{d}d</div>
                  <div style={{ fontSize: 11, color: C.ink3 }}>{p.clienteTel}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {prospectosCal.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 12 }}>⚡ Prospectos en acción</div>
          {prospectosCal.map(p => (
            <div key={p.id} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: C.ink2, marginTop: 3 }}>{RAMO_ICON[p.interes]} {p.interes} · Prima est. {fmtDinero(p.prima || 0)}</div>
              </div>
              <Badge label={p.estatus} />
            </div>
          ))}
        </div>
      )}

      {vencidas.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.red, marginBottom: 12 }}>⚠️ Pólizas vencidas sin renovar</div>
          {vencidas.map(p => (
            <div key={p.id} style={{ background: C.redBg, border: "1.5px solid #FCA5A5", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{p.clienteNombre}</div>
                <div style={{ fontSize: 12, color: C.ink2, marginTop: 3 }}>{RAMO_ICON[p.ramo]} {p.ramo} · venció hace {Math.abs(diasPara(p.vigenciaFin))} días</div>
              </div>
              <div style={{ fontSize: 11, color: C.ink3 }}>{p.clienteTel}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MODAL PÓLIZA ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ModalPoliza({ poliza, modo, setModo, onClose, onGuardar, onAddSeg, onAddSiniestro, saving }) {
  const [form, setForm] = useState({ ...poliza });
  const [tabSin, setTabSin] = useState(false);
  const [nuevoSin, setNuevoSin] = useState({ tipo: "", descripcion: "", estatus: "Abierto" });
  const [agregarSin, setAgregarSin] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdicion = modo === "editar";

  const guardarSiniestro = () => {
    if (!nuevoSin.tipo) return;
    const s = { id: uid(), polizaId: poliza.id, fecha: iso(hoy), ...nuevoSin };
    onAddSiniestro(s);
    setForm(f => ({ ...f, siniestros: [s, ...(f.siniestros || [])] }));
    setNuevoSin({ tipo: "", descripcion: "", estatus: "Abierto" });
    setAgregarSin(false);
  };

  return (
    <Modal title={isEdicion ? (poliza.clienteNombre || "Nueva póliza") : poliza.clienteNombre} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1.5px solid ${C.border}`, paddingBottom: 12 }}>
        {[["📄 Póliza", false], ["⚠️ Siniestros", true]].map(([label, val]) => (
          <button key={label} onClick={() => setTabSin(val)} style={{ background: tabSin === val ? C.ink : "transparent", color: tabSin === val ? "#fff" : C.ink2, border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {!isEdicion && <button onClick={() => setModo("editar")} style={{ ...btnSec, fontSize: 12, padding: "5px 14px" }}>✏️ Editar</button>}
      </div>

      {!tabSin ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>👤 Datos del asegurado</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <Campo label="Nombre / Razón social" span>{isEdicion ? <input value={form.clienteNombre} onChange={e => set("clienteNombre", e.target.value)} style={inp} /> : <div style={{ fontSize: 14, fontWeight: 700 }}>{form.clienteNombre}</div>}</Campo>
            <Campo label="RFC">{isEdicion ? <input value={form.clienteRFC} onChange={e => set("clienteRFC", e.target.value)} style={inp} /> : <div style={{ fontSize: 13 }}>{form.clienteRFC || "—"}</div>}</Campo>
            <Campo label="Teléfono">{isEdicion ? <input value={form.clienteTel} onChange={e => set("clienteTel", e.target.value)} style={inp} /> : <a href={`tel:${form.clienteTel}`} style={{ fontSize: 13, color: C.blue }}>{form.clienteTel || "—"}</a>}</Campo>
            <Campo label="Email">{isEdicion ? <input value={form.clienteEmail} onChange={e => set("clienteEmail", e.target.value)} style={inp} /> : <a href={`mailto:${form.clienteEmail}`} style={{ fontSize: 13, color: C.blue }}>{form.clienteEmail || "—"}</a>}</Campo>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🛡️ Datos de la póliza</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <Campo label="No. póliza" span>{isEdicion ? <input value={form.numPoliza} onChange={e => set("numPoliza", e.target.value)} style={inp} /> : <div style={{ fontSize: 14, fontWeight: 700 }}>{form.numPoliza || "—"}</div>}</Campo>
            <Campo label="Ramo">{isEdicion ? <select value={form.ramo} onChange={e => set("ramo", e.target.value)} style={inp}>{RAMOS.map(r => <option key={r}>{r}</option>)}</select> : <div style={{ fontSize: 13 }}>{RAMO_ICON[form.ramo]} {form.ramo}</div>}</Campo>
            <Campo label="Aseguradora">{isEdicion ? <select value={form.aseguradora} onChange={e => set("aseguradora", e.target.value)} style={inp}>{ASEGURADORAS.map(a => <option key={a}>{a}</option>)}</select> : <div style={{ fontSize: 13 }}>{form.aseguradora}</div>}</Campo>
            <Campo label="Prima anual (MXN)">{isEdicion ? <input type="number" value={form.prima} onChange={e => set("prima", Number(e.target.value))} style={inp} /> : <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDinero(form.prima)}</div>}</Campo>
            <Campo label="Forma de pago">{isEdicion ? <select value={form.formaPago} onChange={e => set("formaPago", e.target.value)} style={inp}>{FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}</select> : <div style={{ fontSize: 13 }}>{form.formaPago}</div>}</Campo>
            <Campo label="Estatus">{isEdicion ? <select value={form.estatus} onChange={e => set("estatus", e.target.value)} style={inp}>{["Vigente","Por vencer","Vencida","En trámite","Cancelada"].map(s => <option key={s}>{s}</option>)}</select> : <Badge label={form.estatus} />}</Campo>
            <Campo label="Vigencia inicio">{isEdicion ? <input type="date" value={form.vigenciaInicio} onChange={e => set("vigenciaInicio", e.target.value)} style={inp} /> : <div style={{ fontSize: 13 }}>{fmtFecha(form.vigenciaInicio)}</div>}</Campo>
            <Campo label="Vigencia fin">{isEdicion ? <input type="date" value={form.vigenciaFin} onChange={e => set("vigenciaFin", e.target.value)} style={inp} /> : <div style={{ fontSize: 13 }}>{fmtFecha(form.vigenciaFin)}</div>}</Campo>
            <Campo label="Coberturas" span>{isEdicion ? <textarea value={form.coberturas} onChange={e => set("coberturas", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} /> : <div style={{ fontSize: 13, lineHeight: 1.5 }}>{form.coberturas || "—"}</div>}</Campo>
          </div>

          <SeguimientoLog items={form.seguimiento || []} loading={saving} onAdd={texto => {
            const nuevo = { id: uid(), entidadTipo: "poliza", entidadId: poliza.id, fecha: iso(hoy), texto };
            setForm(f => ({ ...f, seguimiento: [nuevo, ...(f.seguimiento || [])] }));
            onAddSeg(nuevo);
          }} />

          {isEdicion && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={btnSec}>Cancelar</button>
              <button onClick={() => onGuardar(form)} style={btnPrim} disabled={saving}>{saving ? "Guardando…" : "Guardar póliza"}</button>
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Siniestros ({(form.siniestros || []).length})</span>
            <button onClick={() => setAgregarSin(true)} style={btnPrim}>+ Nuevo siniestro</button>
          </div>
          {agregarSin && (
            <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Campo label="Tipo"><input value={nuevoSin.tipo} onChange={e => setNuevoSin(s => ({...s, tipo: e.target.value}))} placeholder="Robo, Choque, Incendio…" style={inp} /></Campo>
                <Campo label="Estatus"><select value={nuevoSin.estatus} onChange={e => setNuevoSin(s => ({...s, estatus: e.target.value}))} style={inp}><option>Abierto</option><option>En proceso</option><option>Cerrado</option></select></Campo>
                <Campo label="Descripción" span><textarea value={nuevoSin.descripcion} onChange={e => setNuevoSin(s => ({...s, descripcion: e.target.value}))} rows={2} style={{ ...inp, resize: "vertical" }} /></Campo>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAgregarSin(false)} style={btnSec}>Cancelar</button>
                <button onClick={guardarSiniestro} style={btnPrim}>Registrar</button>
              </div>
            </div>
          )}
          {(form.siniestros || []).length === 0 && !agregarSin && <p style={{ color: C.ink3, fontSize: 13 }}>Sin siniestros registrados.</p>}
          {(form.siniestros || []).map(s => (
            <div key={s.id} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.tipo}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{fmtFecha(s.fecha)}</div>
                  {s.descripcion && <div style={{ fontSize: 13, color: C.ink2, marginTop: 6 }}>{s.descripcion}</div>}
                </div>
                <Badge label={s.estatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PÓLIZAS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function Polizas({ polizas, setPolizas, toast }) {
  const [filtroEstatus, setFiltroEstatus] = useState("Todas");
  const [filtroRamo, setFiltroRamo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(null);
  const [modo, setModo] = useState("ver");
  const [saving, setSaving] = useState(false);

  const filtradas = useMemo(() => polizas.filter(p => {
    const okE = filtroEstatus === "Todas" || p.estatus === filtroEstatus;
    const okR = filtroRamo === "Todos" || p.ramo === filtroRamo;
    const okB = !busqueda || p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) || p.numPoliza?.toLowerCase().includes(busqueda.toLowerCase());
    return okE && okR && okB;
  }), [polizas, filtroEstatus, filtroRamo, busqueda]);

  const polizaVacia = () => ({
    id: "POL-" + uid(), clienteNombre: "", clienteRFC: "", clienteTel: "", clienteEmail: "",
    ramo: RAMOS[0], aseguradora: ASEGURADORAS[0], numPoliza: "", prima: 0,
    formaPago: FORMAS_PAGO[0], coberturas: "", vigenciaInicio: iso(hoy),
    vigenciaFin: iso(addDays(hoy, 365)), estatus: "En trámite", siniestros: [], seguimiento: [],
  });

  const guardar = async (form) => {
    setSaving(true);
    try {
      const res = await api.savePoliza(form);
      if (!res.ok) throw new Error(res.error);
      setPolizas(ps => ps.find(p => p.id === form.id) ? ps.map(p => p.id === form.id ? form : p) : [...ps, form]);
      toast("Póliza guardada ✓", "ok");
      setModal(null);
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const addSeg = async (entrada) => {
    try {
      await api.addSeguimiento(entrada);
      setPolizas(ps => ps.map(p => p.id !== entrada.entidadId ? p : { ...p, seguimiento: [entrada, ...(p.seguimiento || [])] }));
    } catch (e) { toast(e.message, "error"); }
  };

  const addSiniestro = async (sin) => {
    try {
      await api.addSiniestro(sin);
      setPolizas(ps => ps.map(p => p.id !== sin.polizaId ? p : { ...p, siniestros: [sin, ...(p.siniestros || [])] }));
      toast("Siniestro registrado ✓", "ok");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <SectionHeader title="Mis Pólizas" sub="Cartera completa"
        action={<button onClick={() => { setModal(polizaVacia()); setModo("editar"); }} style={btnPrim}>+ Nueva póliza</button>} />
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente o No. póliza…" style={{ ...inp, maxWidth: 240 }} />
        <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)} style={{ ...inp, width: 150 }}>
          <option>Todas</option>
          {["Vigente","Por vencer","Vencida","En trámite","Cancelada"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroRamo} onChange={e => setFiltroRamo(e.target.value)} style={{ ...inp, width: 170 }}>
          <option>Todos</option>
          {RAMOS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: C.bg }}>
              {["Cliente","Ramo","Prima / Pago","Vence","Estatus",""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.ink3 }}>No hay pólizas con esos filtros.</td></tr>}
            {filtradas.sort((a,b) => diasPara(a.vigenciaFin) - diasPara(b.vigenciaFin)).map((p, i) => {
              const d = diasPara(p.vigenciaFin);
              return (
                <tr key={p.id} onClick={() => { setModal(p); setModo("ver"); }}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: i % 2 === 0 ? C.surface : C.bg }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FDF8F2"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.bg}>
                  <td style={{ padding: "13px 16px" }}><div style={{ fontWeight: 700, color: C.ink }}>{p.clienteNombre}</div><div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{p.numPoliza}</div></td>
                  <td style={{ padding: "13px 16px", color: C.ink2 }}>{RAMO_ICON[p.ramo]} {p.ramo}</td>
                  <td style={{ padding: "13px 16px" }}><div style={{ fontWeight: 700 }}>{fmtDinero(p.prima)}</div><div style={{ fontSize: 11, color: C.ink3 }}>{p.formaPago}</div></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div>{fmtFecha(p.vigenciaFin)}</div>
                    {d >= 0 && d <= 30 && <div style={{ fontSize: 11, fontWeight: 800, color: d <= 7 ? C.accent : C.amber }}>⚑ {d}d</div>}
                    {d < 0 && <div style={{ fontSize: 11, fontWeight: 800, color: C.red }}>hace {Math.abs(d)}d</div>}
                  </td>
                  <td style={{ padding: "13px 16px" }}><Badge label={p.estatus} /></td>
                  <td style={{ padding: "13px 16px" }}><button onClick={e => { e.stopPropagation(); setModal(p); setModo("editar"); }} style={{ ...btnSec, fontSize: 12, padding: "5px 12px" }}>Editar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && <ModalPoliza poliza={modal} modo={modo} setModo={setModo} onClose={() => setModal(null)} onGuardar={guardar} onAddSeg={addSeg} onAddSiniestro={addSiniestro} saving={saving} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROSPECTOS ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function Prospectos({ prospectos, setProspectos, toast }) {
  const [modal, setModal] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const vacío = () => ({ id: "PR-" + uid(), nombre: "", tel: "", email: "", interes: RAMOS[0], origen: "Referido", estatus: "Primer contacto", prima: 0, seguimiento: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    try {
      const res = await api.saveProspecto(form);
      if (!res.ok) throw new Error(res.error);
      setProspectos(ps => ps.find(p => p.id === form.id) ? ps.map(p => p.id === form.id ? form : p) : [...ps, form]);
      toast("Prospecto guardado ✓", "ok");
      setModal(null); setForm(null); setEditando(false);
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const addSeg = async (prospectoId, texto) => {
    const nuevo = { id: uid(), entidadTipo: "prospecto", entidadId: prospectoId, fecha: iso(hoy), texto };
    try {
      await api.addSeguimiento(nuevo);
      setProspectos(ps => ps.map(p => p.id !== prospectoId ? p : { ...p, seguimiento: [nuevo, ...(p.seguimiento || [])] }));
      setForm(f => f ? { ...f, seguimiento: [nuevo, ...(f.seguimiento || [])] } : f);
    } catch (e) { toast(e.message, "error"); }
  };

  const ESTATUS_PROS = ["Primer contacto","Cotización enviada","Reunión agendada","Cerrado ganado","Cerrado perdido"];
  const ORIGENES = ["Referido","Redes sociales","Recomendación","Puerta fría","Web"];

  return (
    <div>
      <SectionHeader title="Prospectos" sub="Pipeline de ventas"
        action={<button onClick={() => { const v = vacío(); setForm(v); setModal(v); setEditando(true); }} style={btnPrim}>+ Nuevo prospecto</button>} />

      {["Primer contacto","Cotización enviada","Reunión agendada"].map(col => {
        const items = prospectos.filter(p => p.estatus === col);
        return (
          <div key={col} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Badge label={col} />
              <span style={{ fontSize: 12, color: C.ink3, fontWeight: 600 }}>{items.length} prospecto{items.length !== 1 ? "s" : ""}</span>
            </div>
            {items.length === 0 && <div style={{ fontSize: 13, color: C.ink3, paddingLeft: 16 }}>—</div>}
            {items.map(p => (
              <div key={p.id} onClick={() => { setModal(p); setForm({ ...p }); setEditando(false); }} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: C.ink2, marginTop: 3 }}>{RAMO_ICON[p.interes]} {p.interes} · Prima est. {fmtDinero(p.prima || 0)}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{p.origen} · {p.tel}</div>
                </div>
                {(p.seguimiento || []).length > 0 && <span style={{ fontSize: 11, color: C.ink3 }}>📋 {p.seguimiento.length}</span>}
              </div>
            ))}
          </div>
        );
      })}

      {prospectos.filter(p => p.estatus === "Cerrado ganado" || p.estatus === "Cerrado perdido").length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Cerrados</div>
          {prospectos.filter(p => p.estatus === "Cerrado ganado" || p.estatus === "Cerrado perdido").map(p => (
            <div key={p.id} onClick={() => { setModal(p); setForm({ ...p }); setEditando(false); }} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.ink2 }}>{p.nombre} · {p.interes}</div>
              <Badge label={p.estatus} />
            </div>
          ))}
        </div>
      )}

      {modal && form && (
        <Modal title={editando ? (form.nombre || "Nuevo prospecto") : form.nombre} onClose={() => { setModal(null); setForm(null); setEditando(false); }} wide>
          {!editando && <button onClick={() => setEditando(true)} style={{ ...btnSec, fontSize: 12, padding: "5px 14px", marginBottom: 20 }}>✏️ Editar</button>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <Campo label="Nombre" span>{editando ? <input value={form.nombre} onChange={e => set("nombre", e.target.value)} style={inp} /> : <div style={{ fontSize: 14, fontWeight: 700 }}>{form.nombre}</div>}</Campo>
            <Campo label="Teléfono">{editando ? <input value={form.tel} onChange={e => set("tel", e.target.value)} style={inp} /> : <a href={`tel:${form.tel}`} style={{ fontSize: 13, color: C.blue }}>{form.tel || "—"}</a>}</Campo>
            <Campo label="Email">{editando ? <input value={form.email} onChange={e => set("email", e.target.value)} style={inp} /> : <a href={`mailto:${form.email}`} style={{ fontSize: 13, color: C.blue }}>{form.email || "—"}</a>}</Campo>
            <Campo label="Ramo de interés">{editando ? <select value={form.interes} onChange={e => set("interes", e.target.value)} style={inp}>{RAMOS.map(r => <option key={r}>{r}</option>)}</select> : <div style={{ fontSize: 13 }}>{RAMO_ICON[form.interes]} {form.interes}</div>}</Campo>
            <Campo label="Origen">{editando ? <select value={form.origen} onChange={e => set("origen", e.target.value)} style={inp}>{ORIGENES.map(o => <option key={o}>{o}</option>)}</select> : <div style={{ fontSize: 13 }}>{form.origen}</div>}</Campo>
            <Campo label="Estatus">{editando ? <select value={form.estatus} onChange={e => set("estatus", e.target.value)} style={inp}>{ESTATUS_PROS.map(s => <option key={s}>{s}</option>)}</select> : <Badge label={form.estatus} />}</Campo>
            <Campo label="Prima estimada (MXN)">{editando ? <input type="number" value={form.prima} onChange={e => set("prima", Number(e.target.value))} style={inp} /> : <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDinero(form.prima || 0)}</div>}</Campo>
          </div>
          <SeguimientoLog items={form.seguimiento || []} loading={saving} onAdd={texto => addSeg(form.id, texto)} />
          {editando && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setModal(null); setForm(null); setEditando(false); }} style={btnSec}>Cancelar</button>
              <button onClick={guardar} style={btnPrim} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── COBROS ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function Cobros({ cobros, setCobros, polizas, toast }) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clienteNombre: "", concepto: "", monto: "", vencimiento: iso(addDays(hoy, 30)), estatus: "Pendiente", polizaId: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pendientes = cobros.filter(c => c.estatus === "Pendiente");
  const cobrados   = cobros.filter(c => c.estatus === "Cobrado");
  const totalPend  = pendientes.reduce((s, c) => s + Number(c.monto), 0);
  const totalCob   = cobrados.reduce((s, c) => s + Number(c.monto), 0);

  const marcarCobrado = async (id) => {
    const cobro = cobros.find(c => c.id === id);
    const actualizado = { ...cobro, estatus: "Cobrado" };
    try {
      const res = await api.saveCobro(actualizado);
      if (!res.ok) throw new Error(res.error);
      setCobros(cs => cs.map(c => c.id === id ? actualizado : c));
      toast("Cobro registrado ✓", "ok");
    } catch (e) { toast(e.message, "error"); }
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const nuevo = { ...form, id: "COB-" + uid(), monto: Number(form.monto) };
      const res = await api.saveCobro(nuevo);
      if (!res.ok) throw new Error(res.error);
      setCobros(cs => [...cs, nuevo]);
      toast("Cobro registrado ✓", "ok");
      setModal(false);
      setForm({ clienteNombre: "", concepto: "", monto: "", vencimiento: iso(addDays(hoy, 30)), estatus: "Pendiente", polizaId: "" });
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const FilaCobro = ({ c }) => (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{c.clienteNombre}</div>
        <div style={{ fontSize: 12, color: C.ink2, marginTop: 3 }}>{c.concepto}</div>
        <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>Vence: {fmtFecha(c.vencimiento)}</div>
      </div>
      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{fmtDinero(c.monto)}</div>
        {c.estatus === "Pendiente" ? <button onClick={() => marcarCobrado(c.id)} style={{ ...btnGreen, fontSize: 12, padding: "5px 12px" }}>✓ Cobrado</button> : <Badge label={c.estatus} />}
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="Cobros & Comisiones" sub="Flujo de caja"
        action={<button onClick={() => setModal(true)} style={btnPrim}>+ Nuevo cobro</button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <Stat label="Por cobrar" value={fmtDinero(totalPend)} sub={`${pendientes.length} cobros pendientes`} accent={C.amber} />
        <Stat label="Cobrado" value={fmtDinero(totalCob)} sub={`${cobrados.length} completados`} accent={C.green} />
        <Stat label="Comisión est. (8%)" value={fmtDinero(totalCob * 0.08)} sub="Sobre lo cobrado" />
      </div>

      {pendientes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 12 }}>⏳ Pendientes de cobro</div>
          {pendientes.sort((a,b) => new Date(a.vencimiento) - new Date(b.vencimiento)).map(c => <FilaCobro key={c.id} c={c} />)}
        </div>
      )}
      {cobrados.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12 }}>✅ Cobrados</div>
          {cobrados.map(c => <FilaCobro key={c.id} c={c} />)}
        </div>
      )}

      {modal && (
        <Modal title="Nuevo cobro" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Campo label="Póliza / Cliente">
              <select value={form.polizaId} onChange={e => { const p = polizas.find(p => p.id === e.target.value); set("polizaId", e.target.value); if (p) set("clienteNombre", p.clienteNombre); }} style={inp}>
                <option value="">— Seleccionar póliza —</option>
                {polizas.map(p => <option key={p.id} value={p.id}>{p.clienteNombre} · {p.numPoliza}</option>)}
              </select>
            </Campo>
            <Campo label="Concepto"><input value={form.concepto} onChange={e => set("concepto", e.target.value)} placeholder="Ej: Renovación anual" style={inp} /></Campo>
            <Campo label="Monto (MXN)"><input type="number" value={form.monto} onChange={e => set("monto", e.target.value)} style={inp} /></Campo>
            <Campo label="Fecha de vencimiento"><input type="date" value={form.vencimiento} onChange={e => set("vencimiento", e.target.value)} style={inp} /></Campo>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={() => setModal(false)} style={btnSec}>Cancelar</button>
              <button onClick={guardar} style={btnPrim} disabled={saving}>{saving ? "Guardando…" : "Guardar cobro"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista] = useState("dashboard");
  const [polizas, setPolizas] = useState([]);
  const [prospectos, setProspectos] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastTipo, setToastTipo] = useState("ok");

  // ── Carga inicial ──────────────────────────────────────────
  useEffect(() => {
    api.getAll()
      .then(res => {
        if (!res.ok) throw new Error(res.error);
        setPolizas(res.data.polizas || []);
        setProspectos(res.data.prospectos || []);
        setCobros(res.data.cobros || []);
      })
      .catch(e => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);

  // ── Toast ──────────────────────────────────────────────────
  const toast = useCallback((msg, tipo = "ok") => {
    setToastMsg(msg); setToastTipo(tipo);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const NAV = [
    { id: "dashboard",  icon: "◈",  label: "Dashboard"  },
    { id: "polizas",    icon: "🛡️", label: "Pólizas"    },
    { id: "prospectos", icon: "⚡", label: "Prospectos" },
    { id: "cobros",     icon: "💰", label: "Cobros"     },
  ];

  const vencen30 = polizas.filter(p => { const d = diasPara(p.vigenciaFin); return d >= 0 && d <= 30; }).length;
  const cobPend = cobros.filter(c => c.estatus === "Pendiente").length;
  const primaActiva = polizas.filter(p => p.estatus !== "Vencida" && p.estatus !== "Cancelada").reduce((s, p) => s + Number(p.prima), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${C.bg}; color: ${C.ink}; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input:focus, select:focus, textarea:focus { border-color: ${C.accent} !important; background: #fff !important; }
        a { text-decoration: none; } button { transition: opacity .15s; } button:hover { opacity: .85; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* SIDEBAR */}
        <aside style={{ width: 200, background: C.ink, display: "flex", flexDirection: "column", padding: "0 0 24px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
          <div style={{ padding: "26px 20px 22px", borderBottom: "1px solid #2A2520" }}>
            <div style={{ fontSize: 10, color: "#6B6560", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>🛡️ PÓLIZA</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>Agent<br/><span style={{ color: C.accent }}>Manager</span></div>
          </div>
          <nav style={{ flex: 1, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map(item => {
              const activo = vista === item.id;
              const badge = item.id === "polizas" && vencen30 > 0 ? vencen30 : item.id === "cobros" && cobPend > 0 ? cobPend : null;
              return (
                <button key={item.id} onClick={() => setVista(item.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: "none", background: activo ? C.accent : "transparent", color: activo ? "#fff" : "#9A8F89", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span>{item.icon}</span> {item.label}</span>
                  {badge && <span style={{ background: activo ? "rgba(255,255,255,.3)" : C.accent, color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{badge}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "0 16px" }}>
            <div style={{ background: "#2A2520", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#6B6560", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Prima bajo gestión</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{fmtDinero(primaActiva)}</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
          {cargando && <Spinner msg="Cargando cartera desde Google Sheets…" />}
          {errorCarga && (
            <div style={{ background: C.redBg, border: `1.5px solid #FCA5A5`, borderRadius: 14, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ Error de conexión</div>
              <div style={{ fontSize: 13, color: C.ink2, marginBottom: 16 }}>{errorCarga}</div>
              <div style={{ fontSize: 12, color: C.ink3 }}>Verifica que la variable <code>GAS_URL</code> esté configurada en Vercel y que el Web App de GAS esté publicado.</div>
            </div>
          )}
          {!cargando && !errorCarga && (
            <>
              {vista === "dashboard"  && <Dashboard polizas={polizas} prospectos={prospectos} cobros={cobros} setVista={setVista} />}
              {vista === "polizas"    && <Polizas polizas={polizas} setPolizas={setPolizas} toast={toast} />}
              {vista === "prospectos" && <Prospectos prospectos={prospectos} setProspectos={setProspectos} toast={toast} />}
              {vista === "cobros"     && <Cobros cobros={cobros} setCobros={setCobros} polizas={polizas} toast={toast} />}
            </>
          )}
        </main>
      </div>

      <Toast msg={toastMsg} tipo={toastTipo} />
    </>
  );
}
