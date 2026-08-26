/**
 * Global Reference-Counted Body Scroll Lock Manager
 * Ensures nested/multiple modals and drawers do not prematurely unlock
 * or leave permanent overflow: hidden on document.body.
 */

let lockCount = 0;
let originalOverflow = '';

export const lockBodyScroll = (): void => {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
};

export const unlockBodyScroll = (): void => {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow || '';
  }
};
