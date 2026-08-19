'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

/**
 * HeroSelect: Premium HeroUI-styled custom select component
 * Replaces native HTML select elements with sleek curved glass triggers and animated popovers.
 * Supports placement="top" | "bottom" | "auto" so dropdowns at the bottom of cards open upwards without clipping.
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
  const [effectivePlacement, setEffectivePlacement] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Determine direction (open upwards or downwards)
  const updatePlacement = useCallback(() => {
    if (placement === 'top') {
      setEffectivePlacement('top');
      return;
    }
    if (placement === 'bottom') {
      setEffectivePlacement('bottom');
      return;
    }
    // auto placement
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = windowHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setEffectivePlacement('top');
      } else {
        setEffectivePlacement('bottom');
      }
    }
  }, [placement]);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        updatePlacement();
      }
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    if (isOpen) {
      updatePlacement();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown, updatePlacement]);

  const sizeClasses =
    size === 'sm'
      ? 'h-8 px-3 text-xs rounded-lg'
      : 'h-11 px-3.5 text-xs rounded-full';

  const popoverPositionClasses =
    effectivePlacement === 'top'
      ? 'bottom-full mb-1.5'
      : 'top-full mt-1.5';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex items-center justify-between gap-2.5 bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs select-none ${sizeClasses} ${
          isOpen ? 'bg-white border-[#0B2E23] ring-2 ring-[#0B2E23]/10 shadow-xs' : ''
        } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${triggerClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`size-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0B2E23]' : ''
          }`}
        />
      </button>

      {/* Animated Popover Menu (Opens Above or Below dynamically) */}
      {isOpen && (
        <div
          className={`absolute z-50 ${popoverPositionClasses} min-w-[200px] max-h-60 w-full overflow-y-auto rounded-3xl bg-white p-1.5 shadow-xl border border-[#E5E7EB] animate-fadeIn focus:outline-none`}
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
                        : 'text-slate-700 hover:bg-[#F3F4F6]'
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
        </div>
      )}
    </div>
  );
}

export default HeroSelect;
