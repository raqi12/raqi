type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
