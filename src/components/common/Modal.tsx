import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/scrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  layerLevel?: 'modal' | 'nested';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  layerLevel = 'modal',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      lockBodyScroll();
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (isOpen) {
        unlockBodyScroll();
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const isNested = layerLevel === 'nested';
  const containerZIndex = isNested ? 'z-[1100]' : 'z-[1000]';
  const backdropZIndex = isNested ? 'z-[1050]' : 'z-[900]';

  const modalElement = (
    <div
      className={`fixed inset-0 ${containerZIndex} flex items-center justify-center p-4 sm:p-6 overflow-y-auto w-screen h-screen`}
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop covering full screen */}
      <div
        className={`fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity ${backdropZIndex}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card centered in viewport */}
      <div
        className={`relative transform overflow-hidden rounded-2xl bg-white border border-gray-200 text-left shadow-2xl transition-all w-full ${maxWidthMap[maxWidth]} max-h-[90vh] flex flex-col ${containerZIndex} my-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/95 backdrop-blur-xs shrink-0">
          <div>
            <h3 id="modal-headline" className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body with Dedicated Scrolling */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 font-sans">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};
