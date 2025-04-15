import React, { useState, cloneElement, isValidElement } from "react";


export const Dialog = ({ children, open, onOpenChange }) => {
  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    if (child.type === DialogTrigger) {
      return cloneElement(child, {
        onClick: () => onOpenChange?.(true),
      });
    }

    if (child.type === DialogContent) {
      return open ? cloneElement(child, { onClose: () => onOpenChange?.(false) }) : null;
    }

    return child;
  });
};


export const DialogTrigger = ({ children, onClick }) =>
  isValidElement(children)
    ? cloneElement(children, { onClick })
    : <button onClick={onClick}>{children}</button>;

export const DialogContent = ({ children, className = "", onClose }) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
    <div className={`bg-white p-6 rounded shadow-lg ${className}`}>
      <button onClick={onClose} className="absolute top-2 right-2 text-sm">×</button>
      {children}
    </div>
  </div>
);

export const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>;
