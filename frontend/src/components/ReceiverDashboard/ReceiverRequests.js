import React from "react";
import "../DonorDashboard/Dashboards.css";

async function fetchMyRequests(){ // GET /receiver/requests
  // { items:[{id,itemTitle,donor,qty,status,requestedAt,pickupWindow}], total }
  return { items: [], total: 0 };
}
async function cancelMyRequest(id){ /* PATCH /receiver/requests/:id/cancel */ return true; }

export default function ReceiverRequests(){
  const [items,setItems]=React.useState([]); const [total,setTotal]=React.useState(0);
  const [loading,setLoading]=React.useState(true);

  const load = React.useCallback(async()=>{ setLoading(true);
    try{ const r=await fetchMyRequests(); setItems(r.items||[]); setTotal(r.total||0); }
    finally{ setLoading(false); }
  },[]);
  React.useEffect(()=>{ load(); },[load]);

  async function cancel(x){ await cancelMyRequest(x.id); await load(); }

  return (
    <div className="ff-card">
      <h3 style={{color:"var(--ff-navy)", marginTop:0}}>My Requests</h3>
      <table className="ff-table">
        <thead><tr>
          <th>Item</th><th>Donor</th><th>Qty</th><th>Status</th><th>Pickup</th><th style={{textAlign:"right"}}>Action</th>
        </tr></thead>
        <tbody>
          {items.map(x=>(
            <tr key={x.id} className="ff-row">
              <td>{x.itemTitle}</td>
              <td>{x.donor}</td>
              <td>{x.qty}</td>
              <td><span className={`ff-status ${x.status==="approved"?"st-claimed":x.status==="rejected"?"st-closed":"st-active"}`}>{x.status}</span></td>
              <td>{x.pickupWindow || "—"}</td>
              <td style={{textAlign:"right"}}>
                <button className="ff-btn ghost" onClick={()=>cancel(x)} disabled={x.status!=="pending"}>Cancel</button>
              </td>
            </tr>
          ))}
          {items.length===0 && !loading && <tr><td colSpan={6} style={{padding:12,color:"#547f95"}}>No requests yet.</td></tr>}
        </tbody>
      </table>
      <div className="ff-help">{loading?"Loading…":`${items.length} / ${total}`}</div>
    </div>
  );
}
