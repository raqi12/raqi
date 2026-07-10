import { Button } from './ui/Button';

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
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title">{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm}>
            تأكيد
          </Button>
        </div>
      </div>
    </div>
  );
}
