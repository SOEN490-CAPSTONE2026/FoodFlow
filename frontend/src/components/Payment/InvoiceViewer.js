import React, { useState } from 'react';
import { invoiceAPI } from '../../services/api';

function InvoiceViewer({ paymentId }) {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadInvoice = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await invoiceAPI.getForPayment(paymentId);
      setInvoice(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load the invoice for this payment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice?.id) {
      return;
    }

    try {
      const response = await invoiceAPI.download(invoice.id);
      const pdfBlob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to download the invoice PDF.'
      );
    }
  };

  return (
    <section className="payment-tools-card">
      <div className="payment-tools-card__header">
        <div>
          <h3>Invoice Viewer</h3>
          <p>Generate and download invoices for successful payments.</p>
        </div>
        <button
          type="button"
          className="secondary-btn payment-tools-btn"
          onClick={loadInvoice}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Invoice'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {invoice && (
        <div className="payment-tools-item">
          <div>
            <h4>{invoice.invoiceNumber}</h4>
            <p>
              Issued {invoice.issuedDate} • Total {invoice.totalAmount}
            </p>
          </div>
          <div className="payment-tools-actions">
            <button
              type="button"
              className="primary-btn payment-tools-btn"
              onClick={handleDownload}
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default InvoiceViewer;
