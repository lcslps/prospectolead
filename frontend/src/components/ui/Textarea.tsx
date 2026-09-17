import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className = '', ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`input min-h-[100px] resize-y ${invalid ? '!border-red-500 !ring-red-500/30' : ''} ${className}`}
      {...rest}
    />
  );
});