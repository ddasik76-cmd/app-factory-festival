import { useEffect, useRef } from 'react';

export function useModal(isOpen: boolean, id: string, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const modal = document.getElementById(id);
    if (!modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const inertElements: HTMLElement[] = [];
    let branch: HTMLElement = modal;
    while (branch.parentElement && branch.parentElement !== document.body) {
      for (const child of branch.parentElement.children) {
        if (child !== branch && child instanceof HTMLElement && !child.inert) {
          child.inert = true;
          inertElements.push(child);
        }
      }
      branch = branch.parentElement;
    }
    const focusables = () => [...modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]')].filter(el => el.getClientRects().length);
    focusables()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = focusables(), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      inertElements.forEach(el => { el.inert = false; });
      document.removeEventListener('keydown', keydown);
      previousFocus?.focus();
    };
  }, [isOpen, id]);
}
