'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 드래그 이벤트 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setDragY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    // 스크롤 방지
    e.preventDefault();
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // 아래로만 드래그 허용
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // 드래그 거리가 100px 이상이면 닫기
    if (dragY > 100) {
      onClose();
    } else {
      // 원래 위치로 되돌리기
      setDragY(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setDragY(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    
    // 아래로만 드래그 허용
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // 드래그 거리가 100px 이상이면 닫기
    if (dragY > 100) {
      onClose();
    } else {
      // 원래 위치로 되돌리기
      setDragY(0);
    }
  };

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

  // 드래그 중일 때 전역 마우스 이벤트 리스너 추가
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        if (deltaY > 0) {
          setDragY(deltaY);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        if (dragY > 100) {
          onClose();
        } else {
          setDragY(0);
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startY, dragY, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={isDragging ? undefined : onClose}
      />

      {/* 하단 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl transform transition-transform duration-300 max-h-[70vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${isDragging ? 'transition-none' : ''}`}
        style={{
          transform: `translateY(${isDragging ? dragY : 0}px)`,
        }}
      >
        {/* 핸들 바 - 드래그 가능한 영역 */}
        <div 
          className="flex justify-center py-3 border-b border-gray-200 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
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