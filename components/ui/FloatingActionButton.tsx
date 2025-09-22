'use client';

import { PlusIcon } from '@heroicons/react/24/outline';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-manipulation"
      aria-label="일정 추가"
    >
      <PlusIcon className="w-7 h-7" />
    </button>
  );
}