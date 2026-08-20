import React from 'react';

export default function SettleXpertLogo({ height = 32, className = '', style = {} }) {
  return (
    <div 
      className={`settle-xpert-brand ${className}`} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        userSelect: 'none',
        ...style 
      }}
    >
      <img 
        src="/logo.png" 
        alt="SettleXpert" 
        style={{ 
          height: `${height}px`, 
          width: 'auto', 
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block' 
        }} 
      />
    </div>
  );
}
