'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for focus trap within modals/sheets
 * Keeps focus within the container and returns to trigger on close
 */
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening
      triggerRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element
      const focusFirst = () => {
        const container = containerRef.current;
        if (!container) return;

        const focusable = getFocusableElements(container);
        if (focusable.length > 0) {
          (focusable[0] as HTMLElement).focus();
        }
      };

      // Small delay to ensure the sheet is rendered
      const timer = setTimeout(focusFirst, 50);
      return () => clearTimeout(timer);
    } else {
      // Return focus to trigger element
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [isOpen]);

  // Handle Tab key to trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}

/**
 * Hook for ESC to close and Enter to submit
 */
export function useSheetKeyboard({
  isOpen,
  onClose,
  onSubmit,
  submitEnabled = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  submitEnabled?: boolean;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Enter to submit (when Ctrl/Cmd + Enter or just Enter if not in textarea)
      if (e.key === 'Enter' && onSubmit && submitEnabled) {
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === 'TEXTAREA';
        const isContentEditable = target.isContentEditable;

        // Allow Enter in textareas and contenteditable
        if (isTextarea || isContentEditable) {
          // Only submit on Ctrl/Cmd + Enter
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSubmit();
          }
        } else {
          // Submit on Enter for other inputs
          e.preventDefault();
          onSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSubmit, submitEnabled]);
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
}

/**
 * Props for accessible sheet components
 */
export interface AccessibleSheetProps {
  /** Unique ID for the sheet */
  id: string;
  /** Title for screen readers */
  'aria-labelledby'?: string;
  /** Description for screen readers */
  'aria-describedby'?: string;
  /** Role (default: dialog) */
  role?: 'dialog' | 'alertdialog';
  /** Whether the sheet is modal (traps focus) */
  'aria-modal'?: boolean;
}

/**
 * Generate accessible props for a sheet
 */
export function getAccessibleSheetProps(id: string): AccessibleSheetProps {
  return {
    id,
    'aria-labelledby': `${id}-title`,
    'aria-describedby': `${id}-description`,
    role: 'dialog',
    'aria-modal': true,
  };
}

/**
 * Component wrapper that adds skip-to-content functionality
 */
export function SkipToContent({ contentId }: { contentId: string }) {
  const handleSkip = useCallback(() => {
    const content = document.getElementById(contentId);
    if (content) {
      content.focus();
      content.scrollIntoView({ behavior: 'smooth' });
    }
  }, [contentId]);

  return (
    <a
      href={`#${contentId}`}
      onClick={(e) => {
        e.preventDefault();
        handleSkip();
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to content
    </a>
  );
}
