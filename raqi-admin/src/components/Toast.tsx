type ToastProps = {
  message: string | null;
  type?: 'success' | 'error';
  onClose: () => void;
};

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="ghost" onClick={onClose}>
        x
      </button>
    </div>
  );
}
