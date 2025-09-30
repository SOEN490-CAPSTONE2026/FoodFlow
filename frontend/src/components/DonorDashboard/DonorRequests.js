import React from "react";
import "./Dashboards.css";

/**
 * Props:
 * - items: [{ id, receiver, itemTitle, qty, status ('pending'|'approved'|'rejected'), requestedAt? }]
 * - total: number
 * - loading: boolean
 * - onApprove: (id) => void|Promise<void>
 * - onReject: (id) => void|Promise<void>
 */
export default function DonorRequests({
  items = [],
  total = 0,
  loading = false,
  onApprove = async () => {},
  onReject = async () => {},
}) {
  const approve = (x) => onApprove(x.id);
  const reject = (x) => onReject(x.id);

  return (
    <div className="ff-card">
      <h3 style={{ color: "var(--ff-navy)", marginTop: 0 }}>Requests</h3>

      <table className="ff-table">
        <thead>
          <tr>
            <th>Receiver</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <tr key={x.id} className="ff-row">
              <td>{x.receiver}</td>
              <td>{x.itemTitle}</td>
              <td>{x.qty}</td>
              <td>
                <span
                  className={`ff-status ${
                    x.status === "approved"
                      ? "st-claimed"
                      : x.status === "rejected"
                      ? "st-closed"
                      : "st-active"
                  }`}
                >
                  {x.status}
                </span>
              </td>
              <td style={{ textAlign: "right" }}>
                <button
                  className="ff-btn secondary"
                  style={{ marginRight: 8 }}
                  onClick={() => approve(x)}
                  disabled={x.status !== "pending"}
                >
                  Approve
                </button>
                <button
                  className="ff-btn ghost"
                  onClick={() => reject(x)}
                  disabled={x.status !== "pending"}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && !loading && (
            <tr>
              <td colSpan={5} style={{ padding: 12, color: "#547f95" }}>
                No requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="ff-help">{loading ? "Loading…" : `${items.length} / ${total}`}</div>
    </div>
  );
}
