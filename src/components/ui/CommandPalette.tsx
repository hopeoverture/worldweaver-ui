'use client';
import { useEffect, useState } from 'react';
import { Modal } from './Modal';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Command Palette">
      <ul>
        {/* Mock actions */}
        <li className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer">Go to world...</li>
        <li className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer">New entity...</li>
        <li className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer">New template...</li>
      </ul>
    </Modal>
  );
}
