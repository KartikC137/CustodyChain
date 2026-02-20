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
    "w-full px-3 py-2 text-lg text-red-700 font-mono bg-orange-50 rounded border-2 border-orange-700 focus:outline-none focus:bg-white focus:ring-none focus:ring-orange-400 disabled:text-gray-400 disabled:border-gray-400 disabled:bg-gray-100";
  const baseLabelStyle = "block font-mono pl-1";

  const combinedClassName = `${baseStyles} ${className || ""}`;
  const combinedLabelStyle = `${baseLabelStyle} ${labelStyle || "font-medium text-md text-orange-700"}`;

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className={combinedLabelStyle}>
          {label}
        </label>
      )}
      <input id={id} className={combinedClassName} {...props} />
      {/* <div
        className="absolute top-3 right-3 text-center h-[25px] w-[25px] rounded-full border-2 border-orange-700 text-orange-700
      hover:bg-orange-200 active:bg-orange-500 active:text-white
      "
      >
        ⯆
      </div> */}
    </div>
  );
}
