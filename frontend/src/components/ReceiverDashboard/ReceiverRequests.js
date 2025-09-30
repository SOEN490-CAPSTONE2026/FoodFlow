import React from "react";
import "./ReceiverDashboard.css";


export default function ReceiverRequests({
  items = [],
  total = 0,
  loading = false,
  onCancel = () => {},
}) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div>
      <div className="card">
        <h3 style={{ color: "var(--navy)", marginTop: 0 }}>My Requests</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Donor</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Requested</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id} className="row">
                <td>{x.itemTitle ?? "—"}</td>
                <td>{x.donor ?? "—"}</td>
                <td>{x.qty ?? "—"}</td>
                <td>
                  <span className={`status ${statusClass(x.status)}`}>
                    {x.status ?? "—"}
                  </span>
                </td>
                <td>{x.requestedAt ? formatDate(x.requestedAt) : "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="button ghost"
                    onClick={() => onCancel(x)}
                    disabled={(x.status || "").toLowerCase() !== "pending"}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}

            {list.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#547f95" }}>
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="help" style={{ marginTop: 10 }}>
          {loading ? "Loading…" : `${list.length} / ${total}`}
        </div>
      </div>
    </div>
  );
}

// helpers
function statusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "st-claimed";
    case "rejected":
    case "cancelled":
    case "canceled":
      return "st-closed";
    case "pending":
      return "st-active";
    default:
      return "st-active";
  }
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
}
