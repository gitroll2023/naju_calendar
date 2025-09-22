'use client';

import { ReactNode, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 스크롤 막기
      document.body.style.overflow = 'hidden';
    } else {
      // 애니메이션 후 숨기기
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 하단 시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl transform transition-transform duration-300 max-h-[70vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center py-3 border-b border-gray-200">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* 내용 */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}