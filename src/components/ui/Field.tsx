import React from "react";

interface FieldProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`input-field ${className}`}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`input-field min-h-24 resize-y ${className}`}
      {...props}
    />
  );
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ options, className = "", ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`input-field appearance-none ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-neutral-950 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    );
  }
);
