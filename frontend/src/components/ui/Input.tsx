import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  unstyled?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, unstyled = false, className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`${rest.type === 'checkbox' ? 'ui-check-input' : unstyled ? '' : 'input'} ${invalid ? '!border-red-500 !ring-red-500/30' : ''} ${className}`}
      {...rest}
    />
  );
});
