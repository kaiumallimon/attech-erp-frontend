'use client';

import React from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonWithIconProps = {
  label?: string;
  loading?: boolean;
  loadingLabel?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'>;

export default function ButtonWithIcon({
  label = 'Sign In to Workstation',
  loading = false,
  loadingLabel = 'Authenticating...',
  onClick,
  className,
  icon = <ArrowUpRight size={16} strokeWidth={2.5} />,
  disabled = false,
  type = 'button',
  fullWidth = false,
  ...props
}: ButtonWithIconProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "group relative h-[50px] cursor-pointer overflow-hidden rounded-full p-1 text-sm font-semibold text-white transition-all duration-500",
        fullWidth ? "w-full" : "min-w-[170px]",
        "ps-6 pe-14 hover:ps-14 hover:pe-6",
        "bg-[#0B2E23] hover:bg-[#0e3b2d] border border-white/10 shadow-lg shadow-[#0B2E23]/40",
        "inline-flex items-center justify-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#AEFF48]",
        isDisabled && 'pointer-events-none opacity-70',
        className,
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2 transition-all duration-500">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#AEFF48]" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          label
        )}
      </span>
      {!loading && (
        <div
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2 flex h-[38px] w-[38px] items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-46px)] overflow-hidden",
            "bg-[#AEFF48] text-[#0B251A] group-hover:rotate-45 shadow-sm"
          )}
        >
          {icon}
        </div>
      )}
    </button>
  );
}
