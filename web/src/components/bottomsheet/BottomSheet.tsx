import { ReactNode, useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  breakpoint?: number; // px width below which bottom sheet appears (default: 600)
}

export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  className = '',
  breakpoint = 600
}: BottomSheetProps) => {
  const [shouldHide, setShouldHide] = useState(!isOpen);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle window resize to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  // Handle animation and rendering state
  useEffect(() => {
    if (isOpen) {
      // Show immediately when opening
      setShouldHide(false);
    } else {
      // Delay hiding until animation completes (300ms)
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Handle drag to close on mobile
  const handleDragStart = (clientY: number) => {
    if (!isMobile) return; // Only on mobile
    if (!isOpen) return; // Only when open

    // Only start drag if the container is scrolled to top
    const container = containerRef.current;
    if (container && container.scrollTop > 0) return;

    setIsDragging(true);
    startYRef.current = clientY;
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = clientY - startYRef.current;

    // Only allow dragging down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      onClose();
    }

    // Reset drag offset
    setDragOffset(0);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      handleDragMove(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Don't render if hidden (optimization)
  if (shouldHide) return null;

  return (
    <>
      {/* Backdrop - only visible when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet / Dialog */}
      <div
        ref={containerRef}
        className={`
          ${!isOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
          ${isDragging ? '' : 'transition-all duration-300 ease-out'}
          fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl
          overflow-y-auto z-50 bg-white dark:bg-neutral-900
          ${className}
        `}
        style={{
          transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
        }}
      >
        {/* Drag handle - only visible on mobile */}
        {isMobile && (
          <div
            className="sticky top-0 z-10 flex items-center justify-center py-2 cursor-grab active:cursor-grabbing bg-white dark:bg-neutral-900 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}
        {children}
      </div>
    </>
  );
};

export default BottomSheet;
