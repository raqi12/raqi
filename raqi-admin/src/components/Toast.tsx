import { Button } from './ui/Button';

type ToastProps = {
  message: string | null;
  type?: 'success' | 'error';
  onClose: () => void;
};

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;
  return (
    <div className={`toast ${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <Button type="button" variant="ghost" onClick={onClose} aria-label="إغلاق">
        ×
      </Button>
    </div>
  );
}
