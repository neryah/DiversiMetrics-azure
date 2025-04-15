import React from "react";

export const Switch = ({ id, checked, onCheckedChange }) => (
  <label className="flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="hidden"
    />
    <div className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 ${checked ? 'bg-blue-600' : ''}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${checked ? 'translate-x-5' : ''}`}></div>
    </div>
  </label>
);
