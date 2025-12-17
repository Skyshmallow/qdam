import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './OverlayBase.css';

interface OverlayBaseProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function OverlayBase({ 
  title, 
  isOpen, 
  onClose, 
  children,
  maxWidth = 'md' 
}: OverlayBaseProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div 
        className={`overlay-content ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="overlay-content"
      >
        {/* Header */}
        <div className="overlay-header">
          <h2 className="overlay-title">{title}</h2>
          <button
            onClick={onClose}
            className="overlay-close-btn"
            aria-label="Close"
            data-testid="overlay-close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overlay-body">
          {children}
        </div>
      </div>
    </div>
  );
}
