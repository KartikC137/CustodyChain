"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "warning" | "alert";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  isLoading = false,
  loadingText = "Processing...",
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "px-4 py-2 font-bold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-blue-500 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
    warning:
      "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500",
    alert: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
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
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
