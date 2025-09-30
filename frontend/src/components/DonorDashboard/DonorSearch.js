import React from "react";
import "./Dashboards.css";

/**
 * Props:
 * - items: [{ id, title, category, qty, unit, expiresAt, status }]
 * - total: number
 * - loading: boolean
 * - onSearch: (q: string) => void|Promise<void>
 */
export default function DonorSearch({
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

  return (
    <div>
      <div className="ff-card ff-searchbar">
        <input
          className="ff-input"
          placeholder="Search by title, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="ff-btn" onClick={run} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
        <div className="spacer" />
        <div className="ff-help">
          {loading ? "Loading…" : `${items.length} / ${total}`}
        </div>
      </div>

      <div className="ff-card" style={{ marginTop: 14 }}>
        <table className="ff-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: "#547f95" }}>
                  No results. Try another query.
                </td>
              </tr>
            )}

            {items.map((x) => (
              <tr key={x.id} className="ff-row">
                <td>{x.title}</td>
                <td>{x.category}</td>
                <td>{x.qty}{x.unit ? ` ${x.unit}` : ""}</td>
                <td>{x.expiresAt ? formatDateTime(x.expiresAt) : "—"}</td>
                <td>
                  <span className={`ff-status ${statusClass(x.status)}`}>
                    {x.status ?? "—"}
                  </span>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: "#547f95" }}>
                  Loading…
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
function formatDateTime(dateString) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "approved":
    case "active":
      return "st-claimed";
    case "rejected":
    case "expired":
      return "st-closed";
    case "pending":
      return "st-pending";
    default:
      return "st-active";
  }
}
