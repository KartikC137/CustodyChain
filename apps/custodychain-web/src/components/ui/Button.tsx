"use client";

import type React from "react";

type ButtonVariant =
  | "base"
  | "add"
  | "delete"
  | "primary"
  | "secondary"
  | "warning"
  | "alert";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "base",
  isLoading = false,
  loadingText = "Processing...",
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "focus:outline-none transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles: Record<ButtonVariant, string> = {
    base: "",
    add: "text-green-900 border-2 border-green-900 bg-green-100 hover:text-green-50 hover:bg-green-600 hover:font-bold",
    delete:
      "border-2 border-red-600 bg-red-400 hover:bg-red-600 hover:font-bold",
    primary:
      "rounded px-4 py-3 font-bold  text-white border-2 border-blue-700 hover:border-blue-900 bg-blue-500 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "rounded px-4 py-3 font-bold  text-orange-700 border-2 border-orange-700 hover:bg-orange-500 bg-orange-50 focus:ring-orange-500",
    warning:
      "rounded px-4 py-3 font-bold  text-white border-2 border-yellow-700 hover:border-yellow-900 bg-yellow-500 hover:bg-yellow-700 focus:ring-yellow-500",
    alert:
      "rounded px-4 py-3 font-bold text-white border-2 border-red-700 hover:border-red-700 bg-red-500 hover:bg-red-700 focus:ring-red-500",
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${
    className || ""
  }`;

  return (
    <button
      className={combinedClassName}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          <output aria-live="polite" className="sr-only">
            {loadingText}
          </output>

          <span className="ml-1">{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
