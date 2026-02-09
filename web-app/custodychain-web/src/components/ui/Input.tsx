"use client";

import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | null;
  labelStyle?: string | null;
}

export default function Input({
  label,
  labelStyle,
  id,
  className,
  ...props
}: InputProps) {
  const baseStyles =
    "w-full px-3 py-2 text-lg text-red-700 font-mono bg-orange-50 rounded border-2 border-orange-600 focus:outline-none focus:bg-white focus:ring-none focus:ring-orange-400 disabled:bg-gray-100";
  const baseLabelStyle = "block font-mono pl-1";

  const combinedClassName = `${baseStyles} ${className || ""}`;
  const combinedLabelStyle = `${baseLabelStyle} ${labelStyle || "font-medium text-md text-orange-700"}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className={combinedLabelStyle}>
          {label}
        </label>
      )}
      <input id={id} className={combinedClassName} {...props} />
    </div>
  );
}
