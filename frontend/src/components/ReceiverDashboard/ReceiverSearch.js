import React from "react";
import "../DonorDashboard/Dashboards.css";

async function searchAll(q){ // GET /receiver/search?q=
  return { items: [], total: 0 };
}

export default function ReceiverSearch(){
  const [q,setQ]=React.useState("");
  const [items,setItems]=React.useState([]); const [total,setTotal]=React.useState(0);

  async function run(){ const r=await searchAll(q); setItems(r.items||[]); setTotal(r.total||0); }

  return (
    <div>
      <div className="ff-card ff-searchbar">
        <input className="ff-input" placeholder="Search all listings…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="ff-btn" onClick={run}>Search</button>
        <div className="spacer" />
        <div className="ff-help">{items.length} / {total}</div>
      </div>

      <div className="ff-card" style={{marginTop:14}}>
        <table className="ff-table">
          <thead><tr><th>Title</th><th>Donor</th><th>Category</th><th>Qty</th><th>Expires</th></tr></thead>
          <tbody>
            {items.length===0 && <tr><td colSpan={5} style={{padding:12,color:"#547f95"}}>No results.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
