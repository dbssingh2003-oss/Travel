import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useUIStore, ToastItem } from "../../store/uiStore";

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-danger-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
};

const toastBorderStyles = {
  success: "border-success-500/30 bg-surface",
  warning: "border-warning-500/30 bg-surface",
  error: "border-danger-500/30 bg-surface",
  info: "border-brand-500/30 bg-surface",
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-elevated text-text-main ${toastBorderStyles[toast.type]}`}
          >
            <span className="mt-0.5">{icons[toast.type]}</span>
            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="text-sm font-semibold mb-0.5">{toast.title}</h5>}
              <p className="text-xs text-muted-fg leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-fg hover:text-text-main p-1 rounded-md transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
