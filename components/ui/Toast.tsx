'use client';

import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export default function Toast({
  message,
  isVisible,
  onClose,
  type = 'success',
  duration = 2000
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <XMarkIcon className="w-5 h-5" />;
      default:
        return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
      <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${getToastStyles()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}