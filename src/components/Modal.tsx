import { useEffect, useId, useRef, type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'primary' | 'pink';
}

/** Zugänglicher Bestätigungsdialog mit Fokusfalle und Escape zum Abbrechen. */
export function Modal({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel, tone = 'primary' }: ModalProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus?.();
  }, []);

  const confirm = () => {
    // Doppelklick-Schutz: Bestätigung nur einmal auslösen.
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    onConfirm();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const focusables = ref.current.querySelectorAll<HTMLElement>('button');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" onKeyDown={onKeyDown}>
      <div ref={ref} className="modal card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children && <div className="modal-body">{children}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${tone === 'pink' ? 'btn-pink' : 'btn-primary'}`} onClick={confirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
