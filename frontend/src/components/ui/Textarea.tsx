import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  unstyled?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, unstyled = false, className = '', ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`${unstyled ? '' : 'input min-h-[100px] resize-y'} ${invalid ? '!border-red-500 !ring-red-500/30' : ''} ${className}`}
      {...rest}
    />
  );
});
