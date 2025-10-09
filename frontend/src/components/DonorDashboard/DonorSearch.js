import React from "react";
import "./Dashboards.css";


export default function DonorSearch({
  items = [],
  total = 0,
  loading = false,
  onSearch = () => {},
}) {
  const [q, setQ] = React.useState("");
  const searchBtnRef = React.useRef(null);

  // NEW: scroll/focus the Search button when arriving with #org-search
  React.useEffect(() => {
    if (window.location.hash === "#org-search" && searchBtnRef.current) {
      searchBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(
        () => searchBtnRef.current?.focus({ preventScroll: true }),
        150
      );
      return () => clearTimeout(t);
    }
  }, []);

  const run = () => onSearch(q);
  const onKeyDown = (e) => {
    if (e.key === "Enter") run();
  };

  return (
    <div>
      <div className="card searchbar">
        <input
          className="input"
          placeholder="Search by title, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          id="org-search"              // <-- anchor target
          ref={searchBtnRef}           // <-- used by the effect above
          className="btn"
          onClick={run}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        <div className="spacer" />
        <div className="help">
          {loading ? "Loading…" : `${items.length} / ${total}`}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <table className="table">
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
              <tr key={x.id} className="row">
                <td>{x.title}</td>
                <td>{x.category}</td>
                <td>
                  {x.qty}
                  {x.unit ? ` ${x.unit}` : ""}
                </td>
                <td>{x.expiresAt ? formatDateTime(x.expiresAt) : "—"}</td>
                <td>
                  <span className={`status ${statusClass(x.status)}`}>
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
