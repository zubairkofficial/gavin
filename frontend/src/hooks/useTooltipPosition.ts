import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface TooltipPosition {
  left: number;
  transform: string;
}

export const useTooltipPosition = (
  tooltipRef: RefObject<HTMLDivElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  isOpen: boolean
): TooltipPosition => {
  const [position, setPosition] = useState<TooltipPosition>({
    left: 50,
    transform: 'translateX(-50%)',
  });

  useEffect(() => {
    if (isOpen && tooltipRef.current && containerRef.current) {
      const updatePosition = () => {
        const tooltip = tooltipRef.current;
        const container = containerRef.current;
        
        if (!tooltip || !container) return;

        const tooltipRect = tooltip.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const triggerRect = tooltip.parentElement?.getBoundingClientRect();

        if (!triggerRect) return;

        // Calculate center position
        let left = 50;
        let transform = 'translateX(-50%)';

        // Check if tooltip would overflow right
        if (triggerRect.left + (tooltipRect.width / 2) > containerRect.right) {
          left = 100;
          transform = 'translateX(-100%)';
        }
        // Check if tooltip would overflow left
        else if (triggerRect.left - (tooltipRect.width / 2) < containerRect.left) {
          left = 0;
          transform = 'translateX(0)';
        }

        setPosition({ left, transform });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen, tooltipRef, containerRef]);

  return position;
};
