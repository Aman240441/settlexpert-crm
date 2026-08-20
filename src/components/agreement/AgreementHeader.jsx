import React from 'react';
import agreementLogo from './agreementLogoBase64';

export default function AgreementHeader() {
  return (
    <div
      className="agreement-header-block letterhead"
      style={{
        width: '100%',
        marginBottom: '0',
        boxSizing: 'border-box',
        fontFamily: "'Montserrat', sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact'
      }}
    >
      <div
        style={{
          background: '#ebfaf0',
          padding: '10px 0',
          width: '100%',
          borderBottom: '2px solid #16a34a',
          boxSizing: 'border-box',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          colorAdjust: 'exact'
        }}
      >
        {/* Inner Content positioned with left 10% offset */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '26px',
            boxSizing: 'border-box',
            paddingLeft: '10%',
            paddingRight: '5%'
          }}
        >
          {/* Left Logo: Cleanly blended onto background with crisp natural aspect ratio */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img
              src={agreementLogo}
              alt="SettleXpert"
              style={{
                height: '52px',
                width: 'auto',
                maxHeight: '56px',
                maxWidth: '165px',
                objectFit: 'contain',
                display: 'block',
                background: 'transparent',
                padding: 0,
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                mixBlendMode: 'multiply'
              }}
            />
          </div>

          {/* Text Block: Right of Logo (Clean vertical hierarchy) */}
          <div style={{ textAlign: 'left', color: '#0f172a', fontFamily: "'Montserrat', sans-serif", flex: '0 0 auto' }}>
            {/* Company Name */}
            <div
              style={{
                fontSize: '15.5px',
                fontWeight: 800,
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: 'normal',
                color: '#000000',
                margin: '0 0 3px 0',
                textTransform: 'uppercase',
                lineHeight: 1.2
              }}
            >
              SETTLEXPERT FINANCIAL SERVICES
            </div>

            {/* Detail Lines */}
            <div style={{ fontSize: '10.5px', color: '#1e293b', lineHeight: 1.45, margin: '1px 0' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#000000' }}>Address : </span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India</span>
            </div>

            <div style={{ fontSize: '10.5px', color: '#1e293b', lineHeight: 1.45, margin: '1px 0' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#000000' }}>Phone : </span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>+91 89292 23949</span>
            </div>

            <div style={{ fontSize: '10.5px', color: '#1e293b', lineHeight: 1.45, margin: '1px 0' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#000000' }}>Email : </span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>SettleXperts@gmail.com</span>
            </div>

            <div style={{ fontSize: '10.5px', color: '#1e293b', lineHeight: 1.45, margin: '1px 0' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#000000' }}>Website : </span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>www.settlexpert.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
