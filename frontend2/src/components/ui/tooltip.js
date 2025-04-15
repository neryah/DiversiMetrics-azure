import React from "react";

export const TooltipProvider = ({ children }) => <>{children}</>;

export const Tooltip = ({ children }) => <>{children}</>;

export const TooltipTrigger = ({ children }) => children;

export const TooltipContent = ({ children, className = "" }) => (
  <div className={`absolute bg-black text-white text-xs p-2 rounded mt-1 ${className}`}>
    {children}
  </div>
);
