import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

// Input chuẩn theo DESIGN.md mục 5: nhãn phía trên, viền --color-line,
// bo gần vuông 2px (rounded-[2px]) — DESIGN.md v2 Editorial, lỗi hiển thị bằng chữ --color-error ngay dưới ô.
// Field bọc nhãn + ô nhập + dòng lỗi, dùng cho các form (checkout, admin...).

const inputClasses =
  "w-full rounded-[2px] border border-line bg-surface px-4 py-2.5 text-base text-ink placeholder:text-muted/70 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 aria-[invalid=true]:border-error";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ error, className = "", ...props }: InputProps) {
  return (
    <input
      className={`${inputClasses} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`${inputClasses} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}
