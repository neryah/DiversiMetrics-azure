import React from "react";

export const Checkbox = ({ id, checked, onCheckedChange }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="form-checkbox h-4 w-4 text-blue-600"
  />
);
