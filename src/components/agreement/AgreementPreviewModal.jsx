import React, { useState } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText
} from 'lucide-react';
import AgreementDocument from './AgreementDocument';

export default function AgreementPreviewModal({ isOpen, onClose, agreement }) {
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 11;

  if (!isOpen || !agreement) return null;

  const clientName = agreement.client_name || agreement.name || 'Mukesh Kumar';

  // Dedicated multi-page print handler (Guarantees all 11 pages in 1 PDF)
  const handlePrint = () => {
    const printDocElement = document.getElementById('print-only-agreement-doc');
    if (!printDocElement) {
      window.print();
      return;
    }

    const printContent = printDocElement.innerHTML;

    // Create an isolated hidden iframe to avoid modal overflow/fixed position clipping
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.id = 'agreement-print-iframe';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Agreement - ${clientName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap');
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 0mm !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: 'Montserrat', sans-serif !important;
              width: 210mm !important;
            }
            h1, h2, h3, h4, h5, h6, strong, b, th, .bold-text {
              font-family: 'Montserrat', sans-serif !important;
            }
            #agreement-printable-doc {
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: none !important;
              font-family: 'Montserrat', sans-serif !important;
            }
            .a4-page-sheet {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 0 0 16mm 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-before: auto !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-after: page !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .a4-page-sheet.annexure-a-sheet {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            table {
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .a4-page-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after styles & images load
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.6));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleFitPage = () => {
    setScale(0.92);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, 11)); // All 11 pages
  };

  return (
    <div className="modal-overlay agreement-preview-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.88)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      {/* Top Control Bar */}
      <div style={{
        background: '#1e293b',
        color: '#ffffff',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #334155',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: 100,
        flexShrink: 0
      }}>
        {/* Document Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} color="#34d399" />
          <span style={{ fontWeight: 600, fontSize: '13.5px', letterSpacing: '0.3px', color: '#f8fafc' }}>
            Agreement Preview — {clientName}
          </span>
        </div>

        {/* Center: Page Indicator & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Page Navigation Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0f172a',
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            fontSize: '12px',
            fontWeight: 600,
            color: '#f8fafc'
          }}>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: currentPage === 1 ? '#475569' : '#38bdf8',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                padding: '0 2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span>Page {currentPage} / {totalPages}</span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= 11}
              style={{
                background: 'transparent',
                border: 'none',
                color: currentPage >= 11 ? '#475569' : '#38bdf8',
                cursor: currentPage >= 11 ? 'not-allowed' : 'pointer',
                padding: '0 2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0f172a', padding: '2px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '11px', color: '#cbd5e1', width: '38px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={handleFitPage}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', marginLeft: '2px' }}
              title="Fit to Page"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <Printer size={14} />
            <span>Print / Download PDF (All 11 Pages)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '30px 10px',
        display: 'flex',
        justifyContent: 'center',
        background: '#475569'
      }}>
        <div style={{ margin: '0 auto' }}>
          <AgreementDocument agreement={agreement} scale={scale} activePage={currentPage} />
        </div>
      </div>

      {/* Hidden Print Document Layer Containing ALL 11 pages */}
      <div id="print-only-agreement-doc" style={{ display: 'none' }}>
        <AgreementDocument agreement={agreement} scale={1} activePage={null} />
      </div>
    </div>
  );
}
