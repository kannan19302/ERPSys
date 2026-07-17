'use client';

import { useEffect, useRef, type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import styles from './modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  children?: ReactNode;
  closeOnOverlay?: boolean;
}

/** Accessible modal: Native HTML5 <dialog> element with native focus trapping and backdrop. */
export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  closeOnOverlay = true,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keep dialog.open in sync with React open prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    let originalOverflow: string | undefined;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        // Prevent body scroll
        originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }

    return () => {
      if (originalOverflow !== undefined) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [open]);

  // Handle native ESC cancel and overlay clicks (light dismiss)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleOverlayClick = (e: MouseEvent) => {
      if (!closeOnOverlay) return;
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleOverlayClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleOverlayClick);
    };
  }, [onClose, closeOnOverlay]);

  const dialogClass = [
    styles.dialog,
    styles[size],
  ].join(' ');

  return (
    <dialog
      ref={dialogRef}
      className={dialogClass}
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {(title || description) && (
        <div className={styles.header}>
          <div>
            {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <button
            onClick={onClose}
            className={styles.close_btn}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </dialog>
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

/** Confirmation dialog — error prevention (Nielsen #5) for destructive/irreversible actions. */
export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm,
  title = 'Are you sure?', message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'primary', loading,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </>
    }
  >
    {message && (
      <div className={styles.confirm_msg}>
        {message}
      </div>
    )}
  </Modal>
);

