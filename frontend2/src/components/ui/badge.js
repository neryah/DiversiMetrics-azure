import React from "react";

export const Badge = ({ children, className = "" }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${className}`}>
    {children}
  </span>
);
