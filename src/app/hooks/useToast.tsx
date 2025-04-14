import { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Component to render in your layout
  const ToastContainer = () => {
    if (toasts.length === 0) return null;
    
    return (
      <div className="fixed z-50 flex flex-col gap-2 bottom-4 right-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-4 py-2 rounded-md shadow-md flex items-center justify-between max-w-xs animate-fade-in
              ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500 text-white' : ''}`}
          >
            <span>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  return { showToast, removeToast, ToastContainer };
};
