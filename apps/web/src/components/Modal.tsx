"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/**
 * Accessible modal (focus trap, Esc, aria) wearing the legacy Bootstrap 3 modal classes,
 * so the legacy CSS applies unchanged. Replaces the jQuery/Bootstrap `Dialog` service.
 * Bootstrap 3.3.1 places the backdrop INSIDE `.modal` (its CSS has no z-index for it), so we do the same.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size,
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name; rendered visually hidden (the content shows its own header). */
  title: string;
  children: ReactNode;
  size?: "large" | "small";
  /** false = legacy `backdrop: "static", hideOnEsc: false` */
  dismissible?: boolean;
  className?: string;
}) {
  const sizeClass = size === "large" ? " modal-lg" : size === "small" ? " modal-sm" : "";
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && dismissible && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          className={`modal fade in${className ? ` ${className}` : ""}`}
          style={{ display: "block" }}
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          onMouseDown={(e) => {
            // the .modal wrapper covers the viewport: a click outside .modal-dialog is a backdrop click
            const target = e.target as HTMLElement;
            if (dismissible && (target === e.currentTarget || target.classList.contains("modal-backdrop"))) onClose();
          }}
        >
          <div className="modal-backdrop fade in" style={{ position: "fixed", bottom: 0 }} aria-hidden="true" />
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className={`modal-dialog${sizeClass}`}>
            <div className="modal-content">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="close" aria-label="Fechar" onClick={onClick}>
      &times;
    </button>
  );
}
