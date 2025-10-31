"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  id,
  className,
  error,
  ...props
}: InputProps) {
  const baseStyles =
    "w-full px-3 py-2 text-lg text-red-700 font-mono rounded border-2 border-orange-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-700 disabled:bg-gray-100";
  const errorStyles = error
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300";

  const combinedClassName = `${baseStyles} ${errorStyles} ${className || ""}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input id={id} className={combinedClassName} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
