import { InternalRequisition } from "./internalRequestTypes";

export function generatePrintable(requests: InternalRequisition[]) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

            @page { size: A4; margin: 18mm 20mm; }

            * { box-sizing: border-box; margin: 0; padding: 0; }

            body {
                font-family: 'IBM Plex Sans', sans-serif;
                color: #000;
                background: #fff;
                font-size: 13px;
                line-height: 1.4;
            }

            .page-header {
                text-align: center;
                margin-bottom: 36px;
                padding-bottom: 16px;
                border-bottom: 3px solid #000;
            }

            .page-header h1 {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.35em;
                text-transform: uppercase;
                margin-bottom: 4px;
            }

            .page-header p {
                font-size: 11px;
                color: #555;
                letter-spacing: 0.05em;
            }

            .container {
                display: flex;
                flex-direction: column;
                gap: 36px;
            }

            /* ── Requisition Card ── */
            .req-card {
                border: 1.5px solid #000;
                page-break-inside: avoid;
            }

            /* Card top bar */
            .card-topbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #000;
                color: #fff;
                padding: 9px 14px;
            }

            .card-topbar .req-number {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.05em;
            }

            .card-topbar .req-status {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                border: 1px solid #fff;
                padding: 3px 10px;
            }

            /* Meta section */
            .card-meta {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-bottom: 1.5px solid #000;
            }

            .meta-cell {
                padding: 9px 14px;
                border-right: 1px solid #ccc;
                border-bottom: 1px solid #ccc;
            }

            .meta-cell:nth-child(2n) { border-right: none; }
            .meta-cell:nth-last-child(-n+2) { border-bottom: none; }

            .meta-label {
                display: block;
                font-family: 'IBM Plex Mono', monospace;
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #666;
                margin-bottom: 3px;
            }

            .meta-value {
                font-size: 13px;
                font-weight: 500;
                color: #000;
            }

            /* Items table */
            .items-wrap {
                padding: 14px;
                border-bottom: 1.5px solid #000;
            }

            .section-label {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #666;
                margin-bottom: 8px;
            }

            table.items {
                width: 100%;
                border-collapse: collapse;
            }

            table.items thead tr {
                border-bottom: 1.5px solid #000;
            }

            table.items th {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                padding: 6px 8px;
                text-align: left;
                color: #000;
            }

            table.items td {
                padding: 7px 8px;
                font-size: 13px;
                border-bottom: 1px solid #e0e0e0;
                vertical-align: top;
            }

            table.items tr:last-child td { border-bottom: none; }

            .text-right { text-align: right; }
            .text-center { text-align: center; }

            /* Total row */
            .total-row {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding: 10px 14px;
                border-bottom: 1.5px solid #000;
                gap: 20px;
            }

            .total-row .total-label {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #555;
            }

            .total-row .total-amount {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 18px;
                font-weight: 700;
                color: #000;
            }

            /* Card footer: account + signature */
            .card-footer {
                display: grid;
                grid-template-columns: 1fr 1fr;
            }

            .footer-section {
                padding: 12px 14px;
            }

            .footer-section:first-child {
                border-right: 1px solid #ccc;
            }

            .footer-section .section-label {
                margin-bottom: 10px;
            }

            .account-grid {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .account-line {
                display: flex;
                gap: 8px;
                font-size: 12px;
            }

            .account-line .acc-label {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 10px;
                font-weight: 600;
                color: #666;
                min-width: 90px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .account-line .acc-value {
                font-weight: 500;
            }

            .sig-line {
                margin-top: 22px;
                border-bottom: 1px solid #000;
                width: 80%;
            }

            .sig-caption {
                margin-top: 4px;
                font-size: 10px;
                color: #666;
                font-family: 'IBM Plex Mono', monospace;
                letter-spacing: 0.1em;
            }

            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .req-card { break-inside: avoid; }
            }
        </style>
    </head>
    <body>
             <div class="container">
            ${requests
              .slice(0, 2)
              .map(
                (req) => `
                <div class="req-card">

                    <div class="card-topbar">
                        <span class="req-number">${req.requisitionNumber || "N/A"}</span>
                        <span class="req-status">${req.status?.toUpperCase() || "—"}</span>
                    </div>

                    <div class="card-meta">
                        <div class="meta-cell">
                            <span class="meta-label">Title</span>
                            <span class="meta-value">${req.title || "—"}</span>
                        </div>
                        <div class="meta-cell">
                            <span class="meta-label">Date Requested</span>
                            <span class="meta-value">${req.requestedOn ? new Date(req.requestedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        </div>
                        <div class="meta-cell">
                            <span class="meta-label">Requested By</span>
                            <span class="meta-value">${req.user?.name || "—"}</span>
                        </div>
                        <div class="meta-cell">
                            <span class="meta-label">Department / Location</span>
                            <span class="meta-value">${req.department || "—"} / ${req.location || "—"}</span>
                        </div>
                    </div>

                    <div class="items-wrap">
                        <div class="section-label">Line Items</div>
                        <table class="items">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th class="text-center" style="width:55px">Qty</th>
                                    <th class="text-right" style="width:110px">Unit Price</th>
                                    <th class="text-right" style="width:110px">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(req.items || [])
                                  .map(
                                    (item) => `
                                    <tr>
                                        <td>${item.description || "—"}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">NGN ${item.unitPrice?.toLocaleString()}</td>
                                        <td class="text-right">NGN ${item.total?.toLocaleString()}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>

                    <div class="total-row">
                        <span class="total-label">Grand Total</span>
                        <span class="total-amount">NGN ${req.totalAmount?.toLocaleString()}</span>
                    </div>

                    <div class="card-footer">
                        <div class="footer-section">
                            <div class="section-label">Payment Account</div>
                            <div class="account-grid">
                                <div class="account-line">
                                    <span class="acc-label">Account Name</span>
                                    <span class="acc-value">${req.accountToPay?.accountName || "—"}</span>
                                </div>
                                <div class="account-line">
                                    <span class="acc-label">Bank</span>
                                    <span class="acc-value">${req.accountToPay?.bankName || "—"}</span>
                                </div>
                                <div class="account-line">
                                    <span class="acc-label">Account No.</span>
                                    <span class="acc-value">${req.accountToPay?.accountNumber || "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div class="footer-section">
                            <div class="section-label">Authorisation</div>
                            <div class="sig-line"></div>
                            <div class="sig-caption">Authorised Signature &amp; Date</div>
                        </div>
                    </div>

                </div>
            `,
              )
              .join("")}
        </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
