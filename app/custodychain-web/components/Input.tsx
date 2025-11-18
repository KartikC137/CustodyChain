"use client";

import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className, ...props }: InputProps) {
  const baseStyles =
    "w-full px-3 py-2 text-lg text-red-700 font-mono bg-orange-50 rounded border-2 border-orange-600 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-400 disabled:bg-gray-100";

  const combinedClassName = `${baseStyles} ${className || ""}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-md font-sans font-medium text-orange-700"
        >
          {label}
        </label>
      )}
      <input id={id} className={combinedClassName} {...props} />
    </div>
  );
}
