import React from "react";
import "./ReceiverDashboard.css";

export default function ReceiverBrowse({
  items = [],            
  total = 0,                
  loading = false,          
  page = 1,                 
  pageSize = 10,            
  onSearch = () => {},      
  onPageChange = () => {},  
  onRequestClick = () => {},
}) {
  const [q, setQ] = React.useState("");

  const runSearch = () => onSearch(q);
  const onKeyDown = (e) => { if (e.key === "Enter") runSearch(); };

  const list = Array.isArray(items) ? items : [];  // ← guard
  const nextDisabled = list.length < pageSize;
  const prevDisabled = page <= 1;

  return (
    <div>
      <div className="card searchbar">
        <input
          className="input"
          placeholder="Search available food…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="button" onClick={runSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
        <div className="spacer" />
        <div className="help">{loading ? "Loading…" : `${list.length} / ${total}`}</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Donor</th>
              <th>Qty</th>
              <th>Expires</th>
              <th>Distance</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id ?? `${x.title}-${Math.random()}`} className="row">
                <td>{x.title ?? "—"}</td>
                <td>{x.donor ?? "—"}</td>
                <td>{x.qty ?? "—"} {x.unit ?? ""}</td>
                <td>{x.expiresAt ? formatDate(x.expiresAt) : "—"}</td>
                <td>{isFiniteNumber(x.distanceKm) ? `${x.distanceKm} km` : "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="button secondary" onClick={() => onRequestClick(x)}>
                    Request
                  </button>
                </td>
              </tr>
            ))}

            {list.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#547f95" }}>
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <div className="help">Page {page}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button ghost"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={prevDisabled}
            >
              Prev
            </button>
            <button
              className="button"
              onClick={() => onPageChange(page + (nextDisabled ? 0 : 1))}
              disabled={nextDisabled}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
}
function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}
