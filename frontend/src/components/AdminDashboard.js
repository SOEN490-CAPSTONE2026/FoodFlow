import React from "react";
import logo from "../logo.svg";

/** Minimal fetch helpers (inline to keep files down) */
const H = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};
async function getUsers({ q="", page=1, sort="name" }={}) {
  const r = await fetch(`/admin/users?q=${encodeURIComponent(q)}&page=${page}&sort=${sort}`, { headers: H() });
  if(!r.ok) throw new Error(await r.text()); return r.json();
}
async function patchRole(id, role){
  const r = await fetch(`/admin/users/${id}/role`, { method:"PATCH", headers:{ "Content-Type":"application/json", ...H() }, body:JSON.stringify({role}) });
  if(!r.ok) throw new Error(await r.text()); return r.json();
}
async function patchStatus(id, enabled){
  const r = await fetch(`/admin/users/${id}/status`, { method:"PATCH", headers:{ "Content-Type":"application/json", ...H() }, body:JSON.stringify({enabled}) });
  if(!r.ok) throw new Error(await r.text()); return r.json();
}
async function getAudit(){ const r = await fetch(`/admin/audit`, { headers:H() }); if(!r.ok) throw new Error(await r.text()); return r.json(); }

/** Simple inline components (no extra files) */
function TopBar({title}) {
  return (
    <header style={{position:"sticky",top:0,zIndex:10,background:"linear-gradient(90deg,var(--ff-navy),var(--ff-sky))",padding:"10px 16px",color:"#fff"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src={logo} alt="FoodFlow" style={{height:34}}/>
        <h1 style={{margin:0,fontSize:20,fontWeight:800}}>FoodFlow · {title}</h1>
        <a href="/" style={{marginLeft:"auto",color:"#fff",textDecoration:"none",fontWeight:600}}>Home</a>
      </div>
    </header>
  );
}
function Badge({role}) {
  const r=(role||"").toLowerCase();
  const bg = r==="admin" ? "var(--ff-navy)" : r==="donor" ? "var(--ff-green)" : "var(--ff-sky)";
  const fg = r==="receiver" ? "#072b3a" : "#fff";
  return <span style={{background:bg,color:fg,padding:"3px 10px",borderRadius:999,fontSize:12,fontWeight:700}}>{role}</span>;
}
function Card({children,style}) {
  return <div style={{background:"#fff",border:"1px solid rgba(0,0,0,.07)",borderRadius:12,boxShadow:"0 2px 10px rgba(0,0,0,.04)",padding:14,...style}}>{children}</div>;
}
function Modal({open,onClose,children,width=420,title}) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"grid",placeItems:"center",zIndex:50}}>
      <div style={{background:"#fff",borderRadius:12,boxShadow:"0 10px 30px rgba(0,0,0,.25)",width, padding:16}}>
        {title && <h3 style={{marginTop:0,color:"var(--ff-navy)"}}>{title}</h3>}
        {children}
        <div style={{textAlign:"right",marginTop:10}}>
          <button onClick={onClose} style={{border:"1px solid var(--ff-navy)",background:"transparent",color:"var(--ff-navy)",borderRadius:10,padding:"8px 12px"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

/** THE PAGE */
export default function AdminDashboard(){
  const [q,setQ]=React.useState("");
  const [page,setPage]=React.useState(1);
  const [sort,setSort]=React.useState("name");
  const [loading,setLoading]=React.useState(true);
  const [items,setItems]=React.useState([]);
  const [total,setTotal]=React.useState(0);
  const [stats,setStats]=React.useState({admins:0,donors:0,receivers:0,active:0});
  const [audit,setAudit]=React.useState([]);
  const [roleDlg,setRoleDlg]=React.useState(null);
  const [statusDlg,setStatusDlg]=React.useState(null);
  const pageSize=10;

  const load = React.useCallback(async () => {
    setLoading(true);
    try{
      const [u,a] = await Promise.all([ getUsers({q,page,sort}), getAudit() ]);
      setItems(u.items||[]); setTotal(u.total||0); setStats(u.stats||{});
      setAudit(a.items||[]);
    }finally{ setLoading(false); }
   }, [q, page, sort]);

  React.useEffect(() => { load(); }, [load]);

  async function saveRole(newRole){
    await patchRole(roleDlg.id,newRole);
    setRoleDlg(null); await load();
  }
  async function toggleStatus(){
    await patchStatus(statusDlg.id,!statusDlg.enabled);
    setStatusDlg(null); await load();
  }

  return (
    <div>
      <TopBar title="Admin Dashboard" />

      <main style={{maxWidth:1100,margin:"22px auto",padding:"0 14px"}}>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[
            {label:"Admins",num:stats.admins},
            {label:"Donors",num:stats.donors},
            {label:"Receivers",num:stats.receivers},
            {label:"Active Users",num:stats.active},
          ].map((k,i)=>(
            <Card key={i}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:"var(--ff-navy)"}}>{k.num??0}</div>
                <div style={{color:"#24506a"}}>{k.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card style={{marginTop:14,display:"flex",gap:10,alignItems:"center"}}>
          <input value={q} onChange={e=>{setQ(e.target.value); setPage(1);}}
                 placeholder="Search users…" 
                 style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(0,0,0,.12)"}}/>
          <button onClick={load} style={{border:0,borderRadius:10,padding:"10px 14px",background:"var(--ff-navy)",color:"#fff",fontWeight:700}}>Search</button>
          <div style={{marginLeft:"auto",color:"#3a657e"}}>{loading?"Loading…":`${items.length} / ${total}`}</div>
        </Card>

        {/* Table */}
        <Card style={{marginTop:14}}>
          <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 10px"}}>
            <thead>
              <tr>
                {["name","email","role","status","actions"].map(h=>(
                  <th key={h} style={{textAlign:h==="actions"?"right":"left",padding:"6px 10px",fontSize:12,letterSpacing:".04em",color:"#355a71"}}>
                    {h!=="actions" ? <button onClick={()=>setSort(h)} style={{all:"unset",cursor:"pointer",color:"#355a71"}}>{h} {sort===h?"▲":""}</button> : "actions"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(u=>(
                <tr key={u.id} style={{background:"#fff"}}>
                  <td style={{padding:"12px 10px"}}>{u.name}</td>
                  <td style={{padding:"12px 10px"}}>{u.email}</td>
                  <td style={{padding:"12px 10px"}}><Badge role={u.role}/></td>
                  <td style={{padding:"12px 10px"}}>{u.enabled?"Active":"Disabled"}</td>
                  <td style={{padding:"12px 10px",textAlign:"right"}}>
                    <button onClick={()=>setRoleDlg(u)} style={{border:0,borderRadius:10,padding:"8px 12px",background:"var(--ff-green)",color:"#fff",fontWeight:700,marginRight:8}}>Change role</button>
                    <button onClick={()=>setStatusDlg(u)} style={{border:"1px solid var(--ff-navy)",background:"transparent",color:"var(--ff-navy)",borderRadius:10,padding:"8px 12px"}}>
                      {u.enabled?"Disable":"Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length===0 && !loading && (
                <tr><td colSpan={5} style={{padding:12,color:"#547f95"}}>No users.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
            <div style={{color:"#3a657e"}}>Page {page}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                      style={{border:"1px solid var(--ff-navy)",background:"transparent",color:"var(--ff-navy)",borderRadius:10,padding:"8px 12px"}}>Prev</button>
              <button onClick={()=>setPage(p=>p + (items.length<pageSize?0:1))} disabled={items.length<pageSize}
                      style={{border:0,borderRadius:10,padding:"8px 12px",background:"var(--ff-navy)",color:"#fff",fontWeight:700}}>Next</button>
            </div>
          </div>
        </Card>

        {/* Audit */}
        <Card style={{marginTop:14}}>
          <h3 style={{margin:"4px 0 10px",color:"var(--ff-navy)"}}>Recent Admin Actions</h3>
          <ul style={{margin:0,paddingLeft:18}}>
            {audit.map(ev=>(
              <li key={ev.id} style={{marginBottom:6}}>
                <span style={{color:"#24506a"}}>{new Date(ev.at).toLocaleString()}</span> — <b>{ev.actor}</b> {ev.action} <i>{ev.target}</i>
              </li>
            ))}
            {audit.length===0 && <li style={{color:"#547f95"}}>No recent actions.</li>}
          </ul>
        </Card>
      </main>

      {/* Role modal */}
      <Modal open={!!roleDlg} onClose={()=>setRoleDlg(null)} title="Change Role">
        <p style={{marginTop:0}}>User: <b>{roleDlg?.name}</b> ({roleDlg?.email})</p>
        <select defaultValue={roleDlg?.role} id="roleSel"
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid rgba(0,0,0,.12)"}}>
          <option value="admin">Admin</option>
          <option value="donor">Donor</option>
          <option value="receiver">Receiver</option>
        </select>
        <div style={{textAlign:"right",marginTop:12}}>
          <button onClick={async()=>{ const v=document.getElementById("roleSel").value; await saveRole(v); }}
                  style={{border:0,borderRadius:10,padding:"8px 12px",background:"var(--ff-navy)",color:"#fff",fontWeight:700}}>
            Save
          </button>
        </div>
      </Modal>

      {/* Enable/Disable confirm */}
      <Modal open={!!statusDlg} onClose={()=>setStatusDlg(null)} title={(statusDlg?.enabled?"Disable":"Enable")+" User"}>
        <p>Are you sure you want to {statusDlg?.enabled?"disable":"enable"} <b>{statusDlg?.name}</b>?</p>
        <div style={{textAlign:"right"}}>
          <button onClick={toggleStatus}
                  style={{border:0,borderRadius:10,padding:"8px 12px",background:"var(--ff-green)",color:"#fff",fontWeight:700}}>
            {statusDlg?.enabled?"Disable":"Enable"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
