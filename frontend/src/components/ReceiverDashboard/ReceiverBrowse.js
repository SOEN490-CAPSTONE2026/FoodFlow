import React from "react";
import "../DonorDashboard/Dashboards.css";

const H = () => ({ "Content-Type":"application/json", ...(localStorage.token?{Authorization:`Bearer ${localStorage.token}`}:{}) });

// mock endpoints – wire to your backend later
async function fetchAvailable({q="", page=1}={}){ 
  // returns { items:[{id,title,donor,qty,unit,expiresAt,distanceKm}], total }
  return { items: [], total: 0 };
}
async function createRequest(listingId, qty){
  // POST /receiver/requests
  return { ok:true };
}

export default function ReceiverBrowse(){
  const [q,setQ]=React.useState("");
  const [page,setPage]=React.useState(1);
  const [items,setItems]=React.useState([]);
  const [total,setTotal]=React.useState(0);
  const [loading,setLoading]=React.useState(true);
  const pageSize=10;

  const load = React.useCallback(async()=>{
    setLoading(true);
    try{
      const r = await fetchAvailable({q,page});
      setItems(r.items||[]); setTotal(r.total||0);
    } finally{ setLoading(false); }
  },[q,page]);

  React.useEffect(()=>{ load(); },[load]);

  async function requestItem(x){
    const qty = prompt(`Request quantity (available ${x.qty} ${x.unit})`, 1);
    if(!qty) return;
    await createRequest(x.id, Number(qty));
    alert("Request submitted (connect to backend).");
  }

  return (
    <div>
      <div className="ff-card ff-searchbar">
        <input className="ff-input" placeholder="Search available food…" value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} />
        <button className="ff-btn" onClick={load}>Search</button>
        <div className="spacer" />
        <div className="ff-help">{loading?"Loading…":`${items.length} / ${total}`}</div>
      </div>

      <div className="ff-card" style={{marginTop:14}}>
        <table className="ff-table">
          <thead>
            <tr>
              <th>Title</th><th>Donor</th><th>Qty</th><th>Expires</th><th>Distance</th>
              <th style={{textAlign:"right"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(x=>(
              <tr key={x.id} className="ff-row">
                <td>{x.title}</td>
                <td>{x.donor}</td>
                <td>{x.qty} {x.unit}</td>
                <td>{x.expiresAt ? new Date(x.expiresAt).toLocaleString() : "-"}</td>
                <td>{x.distanceKm ? `${x.distanceKm} km` : "—"}</td>
                <td style={{textAlign:"right"}}>
                  <button className="ff-btn secondary" onClick={()=>requestItem(x)}>Request</button>
                </td>
              </tr>
            ))}
            {items.length===0 && !loading && (
              <tr><td colSpan={6} style={{padding:12,color:"#547f95"}}>No results.</td></tr>
            )}
          </tbody>
        </table>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
          <div className="ff-help">Page {page}</div>
          <div style={{display:"flex",gap:8}}>
            <button className="ff-btn ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button>
            <button className="ff-btn" onClick={()=>setPage(p=>p + (items.length<pageSize?0:1))} disabled={items.length<pageSize}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
