import React from "react";
import "./Receiver_Styles/ReceiverDashboard.css";

export default function ReceiverSearch({
  items = [],
  total = 0,
  loading = false,
  onSearch = () => {},
}) {
  const [q, setQ] = React.useState("");

  const run = () => onSearch(q);
  const onKeyDown = (e) => {
    if (e.key === "Enter") run();
  };

  const list = Array.isArray(items) ? items : [];

  return (
    <div>
      <div className="card searchbar">
        <input
          className="input"
          placeholder="Search all listings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="button" onClick={run} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
        <div className="spacer" />
        <div className="help">{loading ? "Searching…" : `${list.length} / ${total}`}</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Donor</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Expires</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id ?? `${item.title}-${Math.random()}`} className="row">
                <td>{item.title ?? "—"}</td>
                <td>{item.donor ?? "—"}</td>
                <td>{item.category ?? "—"}</td>
                <td>
                  {item.qty ?? "—"} {item.unit ?? ""}
                </td>
                <td>{item.expiresAt ? formatDate(item.expiresAt) : "—"}</td>
                <td>{isFiniteNumber(item.distanceKm) ? `${item.distanceKm} km` : "—"}</td>
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
      </div>
    </div>
  );
}

// helpers
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
