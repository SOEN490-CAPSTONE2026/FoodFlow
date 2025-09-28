import React from "react";
import "./Dashboards.css";

async function fetchRequests(){ // GET /donor/requests
  // items: [{id, receiver, itemTitle, qty, status, requestedAt}]
  return { items: [], total: 0 };
}
async function setRequestStatus(id, status){ /* PATCH /donor/requests/:id/status */ return true; }

export default function DonorRequests(){
  const [items,setItems]=React.useState([]); const [total,setTotal]=React.useState(0);
  const [loading,setLoading]=React.useState(true);

  const load = React.useCallback(async()=>{ setLoading(true); try{
    const r=await fetchRequests(); setItems(r.items||[]); setTotal(r.total||0);
  } finally{ setLoading(false); } },[]);
  React.useEffect(()=>{ load(); },[load]);

  async function approve(x){ await setRequestStatus(x.id,"approved"); await load(); }
  async function reject(x){ await setRequestStatus(x.id,"rejected"); await load(); }

  return (
    <div className="ff-card">
      <h3 style={{color:"var(--ff-navy)", marginTop:0}}>Requests</h3>
      <table className="ff-table">
        <thead><tr><th>Receiver</th><th>Item</th><th>Qty</th><th>Status</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
        <tbody>
          {items.map(x=>(
            <tr key={x.id} className="ff-row">
              <td>{x.receiver}</td><td>{x.itemTitle}</td><td>{x.qty}</td>
              <td><span className={`ff-status ${x.status==="approved"?"st-claimed":x.status==="rejected"?"st-closed":"st-active"}`}>{x.status}</span></td>
              <td style={{textAlign:"right"}}>
                <button className="ff-btn secondary" style={{marginRight:8}} onClick={()=>approve(x)} disabled={x.status!=="pending"}>Approve</button>
                <button className="ff-btn ghost" onClick={()=>reject(x)} disabled={x.status!=="pending"}>Reject</button>
              </td>
            </tr>
          ))}
          {items.length===0 && !loading && <tr><td colSpan={5} style={{padding:12,color:"#547f95"}}>No requests.</td></tr>}
        </tbody>
      </table>
      <div className="ff-help">{loading?"Loading…":`${items.length} / ${total}`}</div>
    </div>
  );
}
