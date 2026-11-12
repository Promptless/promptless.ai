import { useEffect, useRef, type ReactNode } from "react";

export default function Modal({
  title,
  children,
  onClose,
  locked = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="bingo-dialog"
      aria-labelledby="panel-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">AI TELLS BINGO</span>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          disabled={locked}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>
      <h2 id="panel-title">{title}</h2>
      {children}
    </dialog>
  );
}
