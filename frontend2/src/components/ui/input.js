import React from "react";

export const Input = ({ className = "", ...props }) => (
  <input
    className={`border border-gray-300 px-3 py-2 rounded w-full ${className}`}
    {...props}
  />
);
