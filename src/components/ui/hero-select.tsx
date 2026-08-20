'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface HeroSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md';
  placement?: 'bottom' | 'top' | 'auto';
  disabled?: boolean;
}

interface PopoverCoords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

/**
 * HeroSelect: Premium HeroUI-styled custom select component.
 * Uses React Portal and fixed viewport positioning to guarantee that dropdown menus
 * NEVER get clipped or cut off by modals, cards, or tables with overflow-hidden / overflow-auto.
 */
export function HeroSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  triggerClassName = '',
  size = 'md',
  placement = 'auto',
  disabled = false,
}: HeroSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate precise fixed coordinates relative to the viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Estimate dropdown height (max-h-60 is ~240px)
    const estimatedHeight = Math.min(240, Math.max(80, options.length * 38 + 16));

    let chosenPlacement: 'top' | 'bottom' = 'bottom';
    if (placement === 'top') {
      chosenPlacement = 'top';
    } else if (placement === 'bottom') {
      chosenPlacement = 'bottom';
    } else {
      // auto: if space below is too small and there is more room above, flip upwards
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        chosenPlacement = 'top';
      } else {
        chosenPlacement = 'bottom';
      }
    }

    const minWidth = Math.max(rect.width, 200);
    // Ensure dropdown does not overflow right edge of viewport
    let left = rect.left;
    if (left + minWidth > windowWidth - 12) {
      left = Math.max(12, windowWidth - minWidth - 12);
    }

    if (chosenPlacement === 'top') {
      setCoords({
        bottom: windowHeight - rect.top + 6,
        left,
        width: Math.max(rect.width, minWidth),
        placement: 'top',
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: Math.max(rect.width, minWidth),
        placement: 'bottom',
      });
    }
  }, [options.length, placement]);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        updatePosition();
      }
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Close when clicking outside of both trigger and portal popover
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (
      containerRef.current &&
      !containerRef.current.contains(target) &&
      popoverRef.current &&
      !popoverRef.current.contains(target)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  // Reposition on scroll (capture phase) or window resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScrollOrResize = () => {
        updatePosition();
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      };
    }
  }, [isOpen, handleClickOutside, handleKeyDown, updatePosition]);

  const sizeClasses =
    size === 'sm'
      ? 'h-8 px-3 text-xs rounded-lg'
      : 'h-11 px-3.5 text-xs rounded-full';

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2.5 bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs select-none ${sizeClasses} ${
          isOpen ? 'bg-white border-[#0B2E23] ring-2 ring-[#0B2E23]/10 shadow-xs' : ''
        } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${triggerClassName}`}
      >
        <span className="truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`size-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0B2E23]' : ''
          }`}
        />
      </button>

      {/* Portal Popover Menu rendered directly in document.body */}
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="max-h-60 overflow-y-auto rounded-3xl bg-white p-1.5 shadow-2xl border border-[#E5E7EB] animate-scaleUp focus:outline-none select-none backdrop-blur-md"
          >
            {options.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                No options available
              </div>
            ) : (
              <div className="space-y-0.5">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B2E23]/10 text-[#0B251A] font-bold'
                          : 'text-slate-700 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-[#0B2E23] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default HeroSelect;
