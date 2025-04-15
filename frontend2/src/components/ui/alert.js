import React from "react";

export const Alert = ({ children, variant = "default", className = "" }) => {
  const bg = variant === "destructive" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-800";
  return (
    <div className={`p-3 rounded ${bg} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <p className="text-sm">{children}</p>
);
