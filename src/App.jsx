import { useState, useEffect, useMemo, useCallback } from "react";

const API = "/api/proxy";

const C = {
  bg:"#F5F2ED",surface:"#FFFFFF",ink:"#1A1611",ink2:"#6B6560",ink3:"#A8A39E",
  border:"#E4DFD8",accent:"#C8501A",accentBg:"#FDF1EC",green:"#1A7A4A",
  greenBg:"#EAF6EE",amber:"#B45309",amberBg:"#FEF3C7",blue:"#1D4ED8",
  blueBg:"#EFF6FF",red:"#B91C1C",redBg:"#FEE2E2",nav:"#1A1611",
};

const hoy = new Date(); hoy.setHours(0,0,0,0);
const fmtFecha = d => new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"});
const fmtMes   = d => new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"short"});
const fmtDin   = n => Number(n).toLocaleString("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:0});
const diasPara = fin => Math.round((new Date(fin)-hoy)/86400000);
const iso = d => d.toISOString().split("T")[0];
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const uid = () => Math.random().toString(36).slice(2,8).toUpperCase();

const RAMOS        = ["Vida / GMM","Autos","Daños / Hogar","Empresarial / RC"];
const ASEGURADORAS = ["GNP","AXA","Qualitas","Mapfre","HDI","BBVA Seguros","Inbursa"];
const FORMAS_PAGO  = ["Anual","Semestral","Trimestral","Mensual"];
const RAMO_ICON    = {"Vida / GMM":"🫀","Autos":"🚗","Daños / Hogar":"🏠","Empresarial / RC":"🏢"};

const api = {
  getAll: () => fetch(`${API}?action=getAll`).then(r=>r.json()),
  post: body => fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json()),
  savePoliza:     d => api.post({action:"savePoliza",data:d}),
  saveProspecto:  d => api.post({action:"saveProspecto",data:d}),
  saveCobro:      d => api.post({action:"saveCobro",data:d}),
  addSeguimiento: d => api.post({action:"addSeguimiento",data:d}),
  addSiniestro:   d => api.post({action:"addSiniestro",data:d}),
};

const BADGE_MAP = {
  "Vigente":{bg:C.greenBg,color:C.green},"Por vencer":{bg:C.amberBg,color:C.amber},
  "Vencida":{bg:C.redBg,color:C.red},"Cancelada":{bg:"#F3F4F6",color:"#4B5563"},
  "En trámite":{bg:C.blueBg,color:C.blue},"Primer contacto":{bg:C.blueBg,color:C.blue},
  "Cotización enviada":{bg:C.amberBg,color:C.amber},"Reunión agendada":{bg:"#EDE9FE",color:"#5B21B6"},
  "Cerrado ganado":{bg:C.greenBg,color:C.green},"Cerrado perdido":{bg:C.redBg,color:C.red},
  "Pendiente":{bg:C.amberBg,color:C.amber},"Cobrado":{bg:C.greenBg,color:C.green},
  "Vencido":{bg:C.redBg,color:C.red},"Abierto":{bg:C.amberBg,color:C.amber},
  "En proceso":{bg:C.blueBg,color:C.blue},"Cerrado":{bg:"#F3F4F6",color:"#4B5563"},
};
const Badge = ({label}) => {
  const s=BADGE_MAP[label]||{bg:"#F3F4F6",color:"#4B5563"};
  return <span style={{background:s.bg,color:s.color,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
};

const inp  = {width:"100%",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:15,color:C.ink,background:C.bg,boxSizing:"border-box",fontFamily:"inherit",outline:"none",WebkitAppearance:"none"};
const btnP = {background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"center"};
const btnS = {background:"transparent",color:C.ink2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"13px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"center"};
const btnG = {...btnP,background:C.green};
const btnSm  = {background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"};
const btnSmS = {background:"transparent",color:C.ink2,border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"};

const Campo = ({label,children}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{label}</label>
    {children}
  </div>
);

const Spinner = ({msg}) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>
    <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <div style={{fontSize:14,color:C.ink3}}>{msg||"Cargando…"}</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Toast = ({msg,tipo}) => {
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:90,left:16,right:16,background:tipo==="error"?C.red:C.green,color:"#fff",borderRadius:12,padding:"14px 18px",fontSize:14,fontWeight:700,zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,.25)",textAlign:"center"}}>{tipo==="error"?"⚠️ ":"✓ "}{msg}</div>;
};

const Sheet = ({open,onClose,title,children,fullscreen}) => {
  useEffect(()=>{
    document.body.style.overflow=open?"hidden":"";
    return ()=>{ document.body.style.overflow=""; };
  },[open]);
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:300}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,top:fullscreen?0:"auto",background:C.surface,borderRadius:fullscreen?"0":"20px 20px 0 0",maxHeight:fullscreen?"100%":"92vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {!fullscreen&&<div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:fullscreen?"16px 20px":"16px 20px 12px"}}>
          <div style={{fontSize:18,fontWeight:800,color:C.ink,fontFamily:"'Playfair Display',serif"}}>{title}</div>
          <button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:10,width:36,height:36,fontSize:18,cursor:"pointer",color:C.ink2,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"0 20px 40px",flex:1}}>{children}</div>
      </div>
    </div>
  );
};

const SeguimientoLog = ({items,onAdd,loading}) => {
  const [texto,setTexto] = useState("");
  const enviar = () => { if(texto.trim()){ onAdd(texto.trim()); setTexto(""); }};
  return (
    <div>
      <div style={{fontSize:12,fontWeight:700,color:C.ink2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📋 Seguimiento</div>
      <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Registrar acción, llamada, acuerdo…" rows={2} style={{...inp,resize:"none",marginBottom:10}}/>
      <button onClick={enviar} disabled={loading||!texto.trim()} style={{...btnP,marginBottom:16,opacity:(!texto.trim()||loading)?.5:1}}>{loading?"Guardando…":"+ Añadir registro"}</button>
      {items.length===0&&<p style={{fontSize:13,color:C.ink3}}>Sin registros aún.</p>}
      {[...items].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(s=>(
        <div key={s.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.ink3,fontWeight:600,marginBottom:4}}>{fmtFecha(s.fecha)}</div>
          <div style={{fontSize:14,color:C.ink,lineHeight:1.4}}>{s.texto}</div>
        </div>
      ))}
    </div>
  );
};

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({polizas,prospectos,cobros,setVista}) {
  const vencen30 = polizas.filter(p=>{ const d=diasPara(p.vigenciaFin); return d>=0&&d<=30; });
  const primaActiva = polizas.filter(p=>p.estatus!=="Vencida"&&p.estatus!=="Cancelada").reduce((s,p)=>s+Number(p.prima),0);
  const pendienteCobro = cobros.filter(c=>c.estatus==="Pendiente").reduce((s,c)=>s+Number(c.monto),0);
  const siniestrosAb = polizas.flatMap(p=>p.siniestros||[]).filter(s=>s.estatus==="Abierto"||s.estatus==="En proceso").length;
  const vencidas = polizas.filter(p=>p.estatus==="Vencida");
  const prosCal  = prospectos.filter(p=>p.estatus==="Reunión agendada"||p.estatus==="Cotización enviada");

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.ink3,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Buenos días</div>
        <h1 style={{fontSize:26,fontWeight:800,color:C.ink,fontFamily:"'Playfair Display',serif",margin:"2px 0 0"}}>Mi cartera hoy</h1>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {label:"Pólizas activas",value:polizas.filter(p=>p.estatus==="Vigente"||p.estatus==="Por vencer").length,sub:`de ${polizas.length} total`,color:C.ink},
          {label:"Prima gestión",  value:fmtDin(primaActiva),sub:"anual activa",color:C.ink},
          {label:"Por cobrar",     value:fmtDin(pendienteCobro),sub:"pendiente",color:C.amber},
          {label:"Siniestros",     value:siniestrosAb,sub:"abiertos",color:siniestrosAb>0?C.red:C.green},
        ].map(s=>(
          <div key={s.label} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:C.ink3,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:s.value.toString().length>7?17:22,fontWeight:800,color:s.color,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:C.ink3,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {vencen30.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:800,color:C.accent}}>🔔 Renovaciones urgentes</div>
            <button onClick={()=>setVista("polizas")} style={{...btnSm,background:"transparent",color:C.accent,border:`1px solid ${C.accent}`,padding:"5px 12px"}}>Ver todas</button>
          </div>
          {vencen30.sort((a,b)=>diasPara(a.vigenciaFin)-diasPara(b.vigenciaFin)).map(p=>{
            const d=diasPara(p.vigenciaFin);
            return (
              <div key={p.id} style={{background:d<=7?C.accentBg:C.amberBg,border:`1.5px solid ${d<=7?"#F4B8A0":"#FCD34D"}`,borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1,marginRight:12}}>
                  <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.clienteNombre}</div>
                  <div style={{fontSize:12,color:C.ink2,marginTop:3}}>{RAMO_ICON[p.ramo]} {p.aseguradora} · {fmtDin(p.prima)}</div>
                  <div style={{fontSize:11,color:C.ink3,marginTop:2}}>{p.clienteTel}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:28,fontWeight:900,color:d<=7?C.accent:C.amber,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{d}</div>
                  <div style={{fontSize:10,color:C.ink3}}>días</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {prosCal.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:10}}>⚡ Prospectos en acción</div>
          {prosCal.map(p=>(
            <div key={p.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.nombre}</div>
                <div style={{fontSize:12,color:C.ink2,marginTop:3}}>{RAMO_ICON[p.interes]} {p.interes}</div>
              </div>
              <Badge label={p.estatus}/>
            </div>
          ))}
        </div>
      )}

      {vencidas.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:800,color:C.red,marginBottom:10}}>⚠️ Pólizas vencidas sin renovar</div>
          {vencidas.map(p=>(
            <div key={p.id} style={{background:C.redBg,border:"1.5px solid #FCA5A5",borderRadius:14,padding:"14px 16px",marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.clienteNombre}</div>
              <div style={{fontSize:12,color:C.ink2,marginTop:3}}>{RAMO_ICON[p.ramo]} {p.ramo} · venció hace {Math.abs(diasPara(p.vigenciaFin))}d</div>
              <div style={{fontSize:11,color:C.ink3,marginTop:2}}>{p.clienteTel}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PÓLIZAS ──────────────────────────────────────────────────────────────────
function Polizas({polizas,setPolizas,toast}) {
  const [filtroEstatus,setFiltroEstatus] = useState("Todas");
  const [busqueda,setBusqueda]           = useState("");
  const [polizaActiva,setPolizaActiva]   = useState(null);
  const [modoEdicion,setModoEdicion]     = useState(false);
  const [esNueva,setEsNueva]             = useState(false);
  const [form,setForm]                   = useState(null);
  const [tabSin,setTabSin]               = useState(false);
  const [agregarSin,setAgregarSin]       = useState(false);
  const [nuevoSin,setNuevoSin]           = useState({tipo:"",descripcion:"",estatus:"Abierto"});
  const [saving,setSaving]               = useState(false);

  const filtradas = useMemo(()=>polizas.filter(p=>{
    const okE=filtroEstatus==="Todas"||p.estatus===filtroEstatus;
    const okB=!busqueda||p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase())||p.numPoliza?.toLowerCase().includes(busqueda.toLowerCase());
    return okE&&okB;
  }),[polizas,filtroEstatus,busqueda]);

  const polizaVacia = ()=>({id:"POL-"+uid(),clienteNombre:"",clienteRFC:"",clienteTel:"",clienteEmail:"",ramo:RAMOS[0],aseguradora:ASEGURADORAS[0],numPoliza:"",prima:0,formaPago:FORMAS_PAGO[0],coberturas:"",vigenciaInicio:iso(hoy),vigenciaFin:iso(addDays(hoy,365)),estatus:"En trámite",siniestros:[],seguimiento:[]});

  const abrirPoliza = p => { setPolizaActiva(p); setForm({...p}); setModoEdicion(false); setEsNueva(false); setTabSin(false); };
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const guardar = async () => {
    setSaving(true);
    try {
      const res=await api.savePoliza(form);
      if(!res.ok) throw new Error(res.error);
      setPolizas(ps=>ps.find(p=>p.id===form.id)?ps.map(p=>p.id===form.id?form:p):[...ps,form]);
      toast("Póliza guardada ✓","ok"); setPolizaActiva(null);
    } catch(e){ toast(e.message,"error"); }
    setSaving(false);
  };

  const addSeg = async texto => {
    const nuevo={id:uid(),entidadTipo:"poliza",entidadId:form.id,fecha:iso(hoy),texto};
    try {
      await api.addSeguimiento(nuevo);
      const upd={...form,seguimiento:[nuevo,...(form.seguimiento||[])]};
      setForm(upd); setPolizas(ps=>ps.map(p=>p.id===form.id?{...p,seguimiento:[nuevo,...(p.seguimiento||[])]}:p));
    } catch(e){ toast(e.message,"error"); }
  };

  const guardarSin = async () => {
    if(!nuevoSin.tipo) return;
    const s={id:uid(),polizaId:form.id,fecha:iso(hoy),...nuevoSin};
    try {
      await api.addSiniestro(s);
      const upd={...form,siniestros:[s,...(form.siniestros||[])]};
      setForm(upd); setPolizas(ps=>ps.map(p=>p.id===form.id?{...p,siniestros:[s,...(p.siniestros||[])]}:p));
      setNuevoSin({tipo:"",descripcion:"",estatus:"Abierto"}); setAgregarSin(false); toast("Siniestro registrado ✓","ok");
    } catch(e){ toast(e.message,"error"); }
  };

  const ESTATUS_LIST=["Todas","Vigente","Por vencer","Vencida","En trámite","Cancelada"];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:22,fontWeight:800,color:C.ink,fontFamily:"'Playfair Display',serif",margin:0}}>Pólizas</h2>
        <button onClick={()=>{ const v=polizaVacia(); setPolizaActiva(v); setForm(v); setModoEdicion(true); setEsNueva(true); }} style={btnSm}>+ Nueva</button>
      </div>

      <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar cliente o No. póliza…" style={{...inp,marginBottom:12}}/>

      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12,scrollbarWidth:"none"}}>
        {ESTATUS_LIST.map(e=>(
          <button key={e} onClick={()=>setFiltroEstatus(e)} style={{flexShrink:0,background:filtroEstatus===e?C.ink:"transparent",color:filtroEstatus===e?"#fff":C.ink2,border:`1.5px solid ${filtroEstatus===e?C.ink:C.border}`,borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{e}</button>
        ))}
      </div>

      {filtradas.length===0&&<div style={{textAlign:"center",color:C.ink3,padding:"40px 0",fontSize:14}}>Sin pólizas con esos filtros.</div>}
      {filtradas.sort((a,b)=>diasPara(a.vigenciaFin)-diasPara(b.vigenciaFin)).map(p=>{
        const d=diasPara(p.vigenciaFin);
        const barColor=d<=7&&d>=0?C.accent:d<=30&&d>=0?C.amber:p.estatus==="Vencida"?C.red:p.estatus==="Vigente"?C.green:C.border;
        return (
          <div key={p.id} onClick={()=>abrirPoliza(p)} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"16px 16px 16px 20px",marginBottom:10,cursor:"pointer",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:barColor,borderRadius:"16px 0 0 16px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{flex:1,marginRight:8}}>
                <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.clienteNombre}</div>
                <div style={{fontSize:12,color:C.ink2,marginTop:2}}>{RAMO_ICON[p.ramo]} {p.ramo} · {p.aseguradora}</div>
              </div>
              <Badge label={p.estatus}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontWeight:800,fontSize:15,color:C.ink}}>{fmtDin(p.prima)}</span>
                <span style={{fontSize:11,color:C.ink3,marginLeft:6}}>{p.formaPago}</span>
              </div>
              <div style={{textAlign:"right"}}>
                {d>=0&&d<=30&&<div style={{fontSize:12,fontWeight:800,color:d<=7?C.accent:C.amber}}>⚑ {d}d para vencer</div>}
                {d<0&&<div style={{fontSize:12,fontWeight:800,color:C.red}}>Venció hace {Math.abs(d)}d</div>}
                {d>30&&<div style={{fontSize:11,color:C.ink3}}>Vence {fmtMes(p.vigenciaFin)}</div>}
              </div>
            </div>
          </div>
        );
      })}

      <Sheet open={!!polizaActiva} onClose={()=>setPolizaActiva(null)} title={esNueva?"Nueva póliza":modoEdicion?(form?.clienteNombre||"Editar"):form?.clienteNombre||""} fullscreen>
        {form&&(
          <>
            <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`1.5px solid ${C.border}`,paddingBottom:12}}>
              {[["📄 Póliza",false],["⚠️ Siniestros",true]].map(([label,val])=>(
                <button key={label} onClick={()=>setTabSin(val)} style={{background:tabSin===val?C.ink:"transparent",color:tabSin===val?"#fff":C.ink2,border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
              ))}
              <div style={{flex:1}}/>
              {!modoEdicion&&<button onClick={()=>setModoEdicion(true)} style={btnSmS}>✏️ Editar</button>}
            </div>

            {!tabSin?(
              <>
                <div style={{fontSize:12,fontWeight:700,color:C.ink2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>👤 Asegurado</div>
                <Campo label="Nombre / Razón social">{modoEdicion?<input value={form.clienteNombre} onChange={set("clienteNombre")} style={inp}/>:<div style={{fontSize:15,fontWeight:700,color:C.ink}}>{form.clienteNombre||"—"}</div>}</Campo>
                <Campo label="RFC">{modoEdicion?<input value={form.clienteRFC} onChange={set("clienteRFC")} style={inp}/>:<div style={{fontSize:14,color:C.ink}}>{form.clienteRFC||"—"}</div>}</Campo>
                <Campo label="Teléfono">{modoEdicion?<input value={form.clienteTel} onChange={set("clienteTel")} type="tel" style={inp}/>:<a href={`tel:${form.clienteTel}`} style={{fontSize:15,color:C.blue,fontWeight:600,display:"block",padding:"4px 0"}}>{form.clienteTel||"—"}</a>}</Campo>
                <Campo label="Email">{modoEdicion?<input value={form.clienteEmail} onChange={set("clienteEmail")} type="email" style={inp}/>:<a href={`mailto:${form.clienteEmail}`} style={{fontSize:14,color:C.blue,display:"block",padding:"4px 0"}}>{form.clienteEmail||"—"}</a>}</Campo>
                <div style={{height:1,background:C.border,margin:"8px 0 20px"}}/>
                <div style={{fontSize:12,fontWeight:700,color:C.ink2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🛡️ Póliza</div>
                <Campo label="No. póliza">{modoEdicion?<input value={form.numPoliza} onChange={set("numPoliza")} style={inp}/>:<div style={{fontSize:15,fontWeight:700,color:C.ink}}>{form.numPoliza||"—"}</div>}</Campo>
                <Campo label="Ramo">{modoEdicion?<select value={form.ramo} onChange={set("ramo")} style={inp}>{RAMOS.map(r=><option key={r}>{r}</option>)}</select>:<div style={{fontSize:14,color:C.ink}}>{RAMO_ICON[form.ramo]} {form.ramo}</div>}</Campo>
                <Campo label="Aseguradora">{modoEdicion?<select value={form.aseguradora} onChange={set("aseguradora")} style={inp}>{ASEGURADORAS.map(a=><option key={a}>{a}</option>)}</select>:<div style={{fontSize:14,color:C.ink}}>{form.aseguradora}</div>}</Campo>
                <Campo label="Prima anual (MXN)">{modoEdicion?<input value={form.prima} onChange={e=>setForm(f=>({...f,prima:Number(e.target.value)}))} type="number" inputMode="numeric" style={inp}/>:<div style={{fontSize:17,fontWeight:800,color:C.ink}}>{fmtDin(form.prima)}</div>}</Campo>
                <Campo label="Forma de pago">{modoEdicion?<select value={form.formaPago} onChange={set("formaPago")} style={inp}>{FORMAS_PAGO.map(f=><option key={f}>{f}</option>)}</select>:<div style={{fontSize:14,color:C.ink}}>{form.formaPago}</div>}</Campo>
                <Campo label="Estatus">{modoEdicion?<select value={form.estatus} onChange={set("estatus")} style={inp}>{["Vigente","Por vencer","Vencida","En trámite","Cancelada"].map(s=><option key={s}>{s}</option>)}</select>:<Badge label={form.estatus}/>}</Campo>
                <Campo label="Vigencia inicio">{modoEdicion?<input value={form.vigenciaInicio} onChange={set("vigenciaInicio")} type="date" style={inp}/>:<div style={{fontSize:14,color:C.ink}}>{fmtFecha(form.vigenciaInicio)}</div>}</Campo>
                <Campo label="Vigencia fin">{modoEdicion?<input value={form.vigenciaFin} onChange={set("vigenciaFin")} type="date" style={inp}/>:<div style={{fontSize:14,color:C.ink}}>{fmtFecha(form.vigenciaFin)}</div>}</Campo>
                <Campo label="Coberturas">{modoEdicion?<textarea value={form.coberturas} onChange={set("coberturas")} rows={3} style={{...inp,resize:"none"}}/>:<div style={{fontSize:13,color:C.ink2,lineHeight:1.5}}>{form.coberturas||"—"}</div>}</Campo>
                {modoEdicion?(
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                    <button onClick={guardar} disabled={saving} style={{...btnP,opacity:saving?.6:1}}>{saving?"Guardando…":"Guardar póliza"}</button>
                    <button onClick={()=>{ setModoEdicion(false); setEsNueva(false); }} style={btnS}>Cancelar</button>
                  </div>
                ):(
                  <div style={{marginTop:20}}>
                    <div style={{height:1,background:C.border,marginBottom:20}}/>
                    <SeguimientoLog items={form.seguimiento||[]} onAdd={addSeg} loading={saving}/>
                  </div>
                )}
              </>
            ):(
              <div>
                <button onClick={()=>setAgregarSin(true)} style={{...btnP,marginBottom:16}}>+ Nuevo siniestro</button>
                {agregarSin&&(
                  <div style={{background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:16}}>
                    <Campo label="Tipo de siniestro"><input value={nuevoSin.tipo} onChange={e=>setNuevoSin(s=>({...s,tipo:e.target.value}))} placeholder="Ej: Robo, Choque…" style={inp}/></Campo>
                    <Campo label="Estatus"><select value={nuevoSin.estatus} onChange={e=>setNuevoSin(s=>({...s,estatus:e.target.value}))} style={inp}><option>Abierto</option><option>En proceso</option><option>Cerrado</option></select></Campo>
                    <Campo label="Descripción"><textarea value={nuevoSin.descripcion} onChange={e=>setNuevoSin(s=>({...s,descripcion:e.target.value}))} rows={2} style={{...inp,resize:"none"}}/></Campo>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      <button onClick={guardarSin} style={btnP}>Registrar siniestro</button>
                      <button onClick={()=>setAgregarSin(false)} style={btnS}>Cancelar</button>
                    </div>
                  </div>
                )}
                {(form.siniestros||[]).length===0&&!agregarSin&&<p style={{color:C.ink3,fontSize:14}}>Sin siniestros registrados.</p>}
                {(form.siniestros||[]).map(s=>(
                  <div key={s.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{s.tipo}</div>
                      <Badge label={s.estatus}/>
                    </div>
                    <div style={{fontSize:11,color:C.ink3,marginBottom:4}}>{fmtFecha(s.fecha)}</div>
                    {s.descripcion&&<div style={{fontSize:13,color:C.ink2,lineHeight:1.4}}>{s.descripcion}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}

// ── PROSPECTOS ───────────────────────────────────────────────────────────────
function Prospectos({prospectos,setProspectos,toast}) {
  const [activo,setActivo]     = useState(null);
  const [editando,setEditando] = useState(false);
  const [form,setForm]         = useState(null);
  const [saving,setSaving]     = useState(false);

  const vacío = ()=>({id:"PR-"+uid(),nombre:"",tel:"",email:"",interes:RAMOS[0],origen:"Referido",estatus:"Primer contacto",prima:0,seguimiento:[]});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const guardar = async () => {
    setSaving(true);
    try {
      const res=await api.saveProspecto(form);
      if(!res.ok) throw new Error(res.error);
      setProspectos(ps=>ps.find(p=>p.id===form.id)?ps.map(p=>p.id===form.id?form:p):[...ps,form]);
      toast("Prospecto guardado ✓","ok"); setActivo(null);
    } catch(e){ toast(e.message,"error"); }
    setSaving(false);
  };

  const addSeg = async texto => {
    const nuevo={id:uid(),entidadTipo:"prospecto",entidadId:form.id,fecha:iso(hoy),texto};
    try {
      await api.addSeguimiento(nuevo);
      const upd={...form,seguimiento:[nuevo,...(form.seguimiento||[])]};
      setForm(upd); setProspectos(ps=>ps.map(p=>p.id===form.id?{...p,seguimiento:[nuevo,...(p.seguimiento||[])]}:p));
    } catch(e){ toast(e.message,"error"); }
  };

  const ESTATUS_PROS = ["Primer contacto","Cotización enviada","Reunión agendada","Cerrado ganado","Cerrado perdido"];
  const ORIGENES     = ["Referido","Redes sociales","Recomendación","Puerta fría","Web"];
  const COLS         = ["Primer contacto","Cotización enviada","Reunión agendada"];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:22,fontWeight:800,color:C.ink,fontFamily:"'Playfair Display',serif",margin:0}}>Prospectos</h2>
        <button onClick={()=>{ const v=vacío(); setActivo(v); setForm(v); setEditando(true); }} style={btnSm}>+ Nuevo</button>
      </div>

      {COLS.map(col=>{
        const items=prospectos.filter(p=>p.estatus===col);
        return (
          <div key={col} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Badge label={col}/><span style={{fontSize:12,color:C.ink3,fontWeight:600}}>{items.length}</span></div>
            {items.length===0&&<div style={{fontSize:13,color:C.ink3,paddingLeft:4,marginBottom:4}}>—</div>}
            {items.map(p=>(
              <div key={p.id} onClick={()=>{ setActivo(p); setForm({...p}); setEditando(false); }} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.nombre}</div>
                    <div style={{fontSize:12,color:C.ink2,marginTop:3}}>{RAMO_ICON[p.interes]} {p.interes} · {fmtDin(p.prima||0)}</div>
                    <div style={{fontSize:11,color:C.ink3,marginTop:2}}>{p.origen} · {p.tel}</div>
                  </div>
                  {(p.seguimiento||[]).length>0&&<span style={{fontSize:11,color:C.ink3}}>📋 {p.seguimiento.length}</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {prospectos.filter(p=>p.estatus==="Cerrado ganado"||p.estatus==="Cerrado perdido").length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Cerrados</div>
          {prospectos.filter(p=>p.estatus==="Cerrado ganado"||p.estatus==="Cerrado perdido").map(p=>(
            <div key={p.id} onClick={()=>{ setActivo(p); setForm({...p}); setEditando(false); }} style={{background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div style={{fontWeight:600,fontSize:14,color:C.ink2}}>{p.nombre} · {p.interes}</div>
              <Badge label={p.estatus}/>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!activo} onClose={()=>setActivo(null)} title={editando?(form?.nombre||"Nuevo prospecto"):form?.nombre||""} fullscreen>
        {form&&(
          <>
            {!editando&&<button onClick={()=>setEditando(true)} style={{...btnSmS,marginBottom:20}}>✏️ Editar</button>}
            <Campo label="Nombre">{editando?<input value={form.nombre} onChange={set("nombre")} style={inp}/>:<div style={{fontSize:16,fontWeight:700,color:C.ink}}>{form.nombre}</div>}</Campo>
            <Campo label="Teléfono">{editando?<input value={form.tel} onChange={set("tel")} type="tel" style={inp}/>:<a href={`tel:${form.tel}`} style={{fontSize:15,color:C.blue,fontWeight:600,display:"block",padding:"4px 0"}}>{form.tel||"—"}</a>}</Campo>
            <Campo label="Email">{editando?<input value={form.email} onChange={set("email")} type="email" style={inp}/>:<a href={`mailto:${form.email}`} style={{fontSize:14,color:C.blue,display:"block",padding:"4px 0"}}>{form.email||"—"}</a>}</Campo>
            <Campo label="Ramo de interés">{editando?<select value={form.interes} onChange={set("interes")} style={inp}>{RAMOS.map(r=><option key={r}>{r}</option>)}</select>:<div style={{fontSize:14,color:C.ink}}>{RAMO_ICON[form.interes]} {form.interes}</div>}</Campo>
            <Campo label="Origen">{editando?<select value={form.origen} onChange={set("origen")} style={inp}>{ORIGENES.map(o=><option key={o}>{o}</option>)}</select>:<div style={{fontSize:14,color:C.ink}}>{form.origen}</div>}</Campo>
            <Campo label="Estatus">{editando?<select value={form.estatus} onChange={set("estatus")} style={inp}>{ESTATUS_PROS.map(s=><option key={s}>{s}</option>)}</select>:<Badge label={form.estatus}/>}</Campo>
            <Campo label="Prima estimada (MXN)">{editando?<input value={form.prima} onChange={e=>setForm(f=>({...f,prima:Number(e.target.value)}))} type="number" inputMode="numeric" style={inp}/>:<div style={{fontSize:17,fontWeight:800,color:C.ink}}>{fmtDin(form.prima||0)}</div>}</Campo>
            {editando?(
              <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                <button onClick={guardar} disabled={saving} style={{...btnP,opacity:saving?.6:1}}>{saving?"Guardando…":"Guardar prospecto"}</button>
                <button onClick={()=>setEditando(false)} style={btnS}>Cancelar</button>
              </div>
            ):(
              <div style={{marginTop:20}}>
                <div style={{height:1,background:C.border,marginBottom:20}}/>
                <SeguimientoLog items={form.seguimiento||[]} onAdd={addSeg} loading={saving}/>
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}

// ── COBROS ───────────────────────────────────────────────────────────────────
function Cobros({cobros,setCobros,polizas,toast}) {
  const [sheetNuevo,setSheetNuevo] = useState(false);
  const [saving,setSaving]         = useState(false);
  const [form,setForm]             = useState({clienteNombre:"",concepto:"",monto:"",vencimiento:iso(addDays(hoy,30)),estatus:"Pendiente",polizaId:""});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const pendientes = cobros.filter(c=>c.estatus==="Pendiente");
  const vencidos   = cobros.filter(c=>c.estatus==="Vencido");
  const cobrados   = cobros.filter(c=>c.estatus==="Cobrado");
  const totalPend  = pendientes.reduce((s,c)=>s+Number(c.monto),0);
  const totalCob   = cobrados.reduce((s,c)=>s+Number(c.monto),0);

  const marcarCobrado = async id => {
    const upd={...cobros.find(c=>c.id===id),estatus:"Cobrado"};
    try {
      const res=await api.saveCobro(upd);
      if(!res.ok) throw new Error(res.error);
      setCobros(cs=>cs.map(c=>c.id===id?upd:c)); toast("Cobro registrado ✓","ok");
    } catch(e){ toast(e.message,"error"); }
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const nuevo={...form,id:"COB-"+uid(),monto:Number(form.monto)};
      const res=await api.saveCobro(nuevo);
      if(!res.ok) throw new Error(res.error);
      setCobros(cs=>[...cs,nuevo]); toast("Cobro registrado ✓","ok"); setSheetNuevo(false);
      setForm({clienteNombre:"",concepto:"",monto:"",vencimiento:iso(addDays(hoy,30)),estatus:"Pendiente",polizaId:""});
    } catch(e){ toast(e.message,"error"); }
    setSaving(false);
  };

  const FilaCobro = ({c}) => (
    <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,marginRight:8}}>
          <div style={{fontWeight:700,fontSize:15,color:C.ink}}>{c.clienteNombre}</div>
          <div style={{fontSize:12,color:C.ink2,marginTop:2}}>{c.concepto}</div>
          <div style={{fontSize:11,color:C.ink3,marginTop:2}}>Vence: {fmtFecha(c.vencimiento)}</div>
        </div>
        <div style={{fontWeight:800,fontSize:16,color:C.ink,flexShrink:0}}>{fmtDin(c.monto)}</div>
      </div>
      {c.estatus==="Pendiente"?<button onClick={()=>marcarCobrado(c.id)} style={{...btnG,padding:"11px 0"}}>✓ Marcar como cobrado</button>:<Badge label={c.estatus}/>}
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:22,fontWeight:800,color:C.ink,fontFamily:"'Playfair Display',serif",margin:0}}>Cobros</h2>
        <button onClick={()=>setSheetNuevo(true)} style={btnSm}>+ Nuevo</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <div style={{background:C.amberBg,border:"1.5px solid #FCD34D",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:10,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Por cobrar</div>
          <div style={{fontSize:20,fontWeight:800,color:C.amber,fontFamily:"'Playfair Display',serif"}}>{fmtDin(totalPend)}</div>
          <div style={{fontSize:11,color:C.amber,marginTop:2}}>{pendientes.length} cobros</div>
        </div>
        <div style={{background:C.greenBg,border:"1.5px solid #6EE7B7",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Cobrado</div>
          <div style={{fontSize:20,fontWeight:800,color:C.green,fontFamily:"'Playfair Display',serif"}}>{fmtDin(totalCob)}</div>
          <div style={{fontSize:11,color:C.green,marginTop:2}}>Com. ~{fmtDin(totalCob*.08)}</div>
        </div>
      </div>

      {vencidos.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:10}}>🔴 Vencidos sin cobrar</div>{vencidos.map(c=><FilaCobro key={c.id} c={c}/>)}</div>}
      {pendientes.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:10}}>⏳ Pendientes</div>{pendientes.sort((a,b)=>new Date(a.vencimiento)-new Date(b.vencimiento)).map(c=><FilaCobro key={c.id} c={c}/>)}</div>}
      {cobrados.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:10}}>✅ Cobrados</div>{cobrados.map(c=><FilaCobro key={c.id} c={c}/>)}</div>}

      <Sheet open={sheetNuevo} onClose={()=>setSheetNuevo(false)} title="Nuevo cobro">
        <Campo label="Póliza / Cliente">
          <select value={form.polizaId} onChange={e=>{ const p=polizas.find(p=>p.id===e.target.value); setForm(f=>({...f,polizaId:e.target.value,clienteNombre:p?p.clienteNombre:f.clienteNombre})); }} style={inp}>
            <option value="">— Seleccionar póliza —</option>
            {polizas.map(p=><option key={p.id} value={p.id}>{p.clienteNombre} · {p.numPoliza}</option>)}
          </select>
        </Campo>
        <Campo label="Concepto"><input value={form.concepto} onChange={set("concepto")} placeholder="Ej: Renovación anual" style={inp}/></Campo>
        <Campo label="Monto (MXN)"><input value={form.monto} onChange={set("monto")} type="number" inputMode="numeric" style={inp}/></Campo>
        <Campo label="Fecha de vencimiento"><input value={form.vencimiento} onChange={set("vencimiento")} type="date" style={inp}/></Campo>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
          <button onClick={guardar} disabled={saving} style={{...btnP,opacity:saving?.6:1}}>{saving?"Guardando…":"Guardar cobro"}</button>
          <button onClick={()=>setSheetNuevo(false)} style={btnS}>Cancelar</button>
        </div>
      </Sheet>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vista,setVista]           = useState("dashboard");
  const [polizas,setPolizas]       = useState([]);
  const [prospectos,setProspectos] = useState([]);
  const [cobros,setCobros]         = useState([]);
  const [cargando,setCargando]     = useState(true);
  const [errorCarga,setErrorCarga] = useState(null);
  const [toastMsg,setToastMsg]     = useState(null);
  const [toastTipo,setToastTipo]   = useState("ok");

  useEffect(()=>{
    api.getAll()
      .then(res=>{ if(!res.ok) throw new Error(res.error); setPolizas(res.data.polizas||[]); setProspectos(res.data.prospectos||[]); setCobros(res.data.cobros||[]); })
      .catch(e=>setErrorCarga(e.message))
      .finally(()=>setCargando(false));
  },[]);

  const toast = useCallback((msg,tipo="ok")=>{ setToastMsg(msg); setToastTipo(tipo); setTimeout(()=>setToastMsg(null),3500); },[]);

  const vencen30    = polizas.filter(p=>{ const d=diasPara(p.vigenciaFin); return d>=0&&d<=30; }).length;
  const cobPend     = cobros.filter(c=>c.estatus==="Pendiente").length;
  const primaActiva = polizas.filter(p=>p.estatus!=="Vencida"&&p.estatus!=="Cancelada").reduce((s,p)=>s+Number(p.prima),0);

  const NAV = [
    {id:"dashboard", icon:"◈",  label:"Inicio"},
    {id:"polizas",   icon:"🛡️", label:"Pólizas",   badge:vencen30||null},
    {id:"prospectos",icon:"⚡", label:"Prospectos"},
    {id:"cobros",    icon:"💰", label:"Cobros",     badge:cobPend||null},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; font-family:'DM Sans',sans-serif; background:${C.bg}; color:${C.ink}; -webkit-font-smoothing:antialiased; }
        input,select,textarea,button { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; } * { scrollbar-width:none; }
        input:focus,select:focus,textarea:focus { border-color:${C.accent}!important; background:#fff!important; outline:none; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{minHeight:"100vh",paddingBottom:80}}>
        {/* Top bar */}
        <div style={{position:"sticky",top:0,zIndex:100,background:C.nav,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,color:"#6B6560",fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>🛡️ PÓLIZA</div>
            <div style={{fontSize:17,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>Agent <span style={{color:C.accent}}>Manager</span></div>
          </div>
          <div style={{background:"#2A2520",borderRadius:10,padding:"8px 12px",textAlign:"right"}}>
            <div style={{fontSize:9,color:"#6B6560",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Prima activa</div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif"}}>{fmtDin(primaActiva)}</div>
          </div>
        </div>

        {/* Contenido */}
        <div style={{padding:"20px 16px"}}>
          {cargando&&<Spinner msg="Cargando cartera…"/>}
          {errorCarga&&(
            <div style={{background:C.redBg,border:"1.5px solid #FCA5A5",borderRadius:16,padding:24,textAlign:"center",marginTop:20}}>
              <div style={{fontSize:16,fontWeight:700,color:C.red,marginBottom:8}}>⚠️ Error de conexión</div>
              <div style={{fontSize:13,color:C.ink2,marginBottom:12}}>{errorCarga}</div>
              <div style={{fontSize:11,color:C.ink3}}>Verifica la variable <code>GAS_URL</code> en Vercel.</div>
            </div>
          )}
          {!cargando&&!errorCarga&&(
            <>
              {vista==="dashboard"  &&<Dashboard  polizas={polizas} prospectos={prospectos} cobros={cobros} setVista={setVista}/>}
              {vista==="polizas"    &&<Polizas    polizas={polizas} setPolizas={setPolizas} toast={toast}/>}
              {vista==="prospectos" &&<Prospectos prospectos={prospectos} setProspectos={setProspectos} toast={toast}/>}
              {vista==="cobros"     &&<Cobros     cobros={cobros} setCobros={setCobros} polizas={polizas} toast={toast}/>}
            </>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.nav,borderTop:"1px solid #2A2520",display:"flex",zIndex:200,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(item=>{
          const activo=vista===item.id;
          return (
            <button key={item.id} onClick={()=>setVista(item.id)} style={{flex:1,background:"none",border:"none",padding:"10px 4px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",position:"relative"}}>
              <span style={{fontSize:20,lineHeight:1}}>{item.icon}</span>
              <span style={{fontSize:10,fontWeight:activo?700:500,color:activo?"#fff":"#6B6560",letterSpacing:.3}}>{item.label}</span>
              {activo&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:2,background:C.accent,borderRadius:99}}/>}
              {item.badge&&<div style={{position:"absolute",top:6,right:"18%",background:C.accent,color:"#fff",borderRadius:99,minWidth:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{item.badge}</div>}
            </button>
          );
        })}
      </div>

      <Toast msg={toastMsg} tipo={toastTipo}/>
    </>
  );
}
