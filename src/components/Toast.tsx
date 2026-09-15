import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="toast-notify"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#213145] text-[#eaf1ff] text-xs font-bold shadow-xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle2 className="w-4 h-4 text-[#57dffe] flex-shrink-0" />
      <span id="toast-message" className="truncate max-w-[280px]">
        {message}
      </span>
    </div>
  );
};
