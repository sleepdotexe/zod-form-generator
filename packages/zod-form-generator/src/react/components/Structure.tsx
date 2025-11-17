import { cva } from 'class-variance-authority';

import { cn } from '../../core/util';
import { ErrorIcon } from './Icons';

import type { VariantProps } from 'class-variance-authority';
import type { Component } from '../../core/types';

export const Form: Component<'form'> = ({ className, children, ...props }) => {
  return (
    <form
      className={cn(
        'flex flex-col justify-start items-stretch gap-9 max-w-md w-full',
        className
      )}
      {...props}
    >
      {children}
    </form>
  );
};

export const FormError: Component<'p'> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn(
        'flex gap-3 text-red-600 bg-red-100/50 dark:bg-red-950/50 dark:text-red-400 border border-red-300 dark:border-red-900 px-4 py-3 rounded-md text-xs font-medium motion-safe:animate-zfg-fade-in',
        className
      )}
      {...props}
    >
      <ErrorIcon className='w-[1.5em] -mt-px h-auto' />
      <span>{children}</span>
    </p>
  );
};

export const Fieldset: Component<
  'fieldset',
  { legend?: string; description?: string }
> = ({ className, children, legend, description, ...props }) => {
  return (
    <fieldset
      className={cn('flex flex-col gap-4', className)}
      {...props}
    >
      {(legend || description) && (
        <div>
          {legend && <FormLegend>{legend}</FormLegend>}
          {description && <FieldDescription>{description}</FieldDescription>}
        </div>
      )}
      {children}
    </fieldset>
  );
};

export const FormLegend: Component<'legend'> = ({ className, children, ...props }) => {
  return (
    <legend
      className={cn('inline-block text-lg font-bold m-0 mb-1', className)}
      {...props}
    >
      {children}
    </legend>
  );
};

export const FieldLabel: Component<'label', { showRequiredAsterisk?: boolean }> = ({
  className,
  children,
  showRequiredAsterisk = true,
  ...props
}) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: generic component
    <label
      className={cn(
        'font-semibold text-sm m-0 group-has-required:after:ml-0.5 group-has-required:after:text-red-600 dark:group-has-required:after:text-red-400 cursor-pointer group-has-disabled:cursor-auto',
        showRequiredAsterisk &&
          "group-has-required:after:content-['*'/''] after:[speak:none]",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};

export const FieldDescription: Component<'p'> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn(
        'font-normal text-xs m-0 mb-1 text-neutral-600 dark:text-neutral-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

export const FieldError: Component<'p'> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn(
        'flex gap-2 text-red-600 dark:text-red-500 text-xs font-medium motion-safe:animate-zfg-fade-in',
        className
      )}
      {...props}
    >
      <ErrorIcon className='w-[1.5em] -mt-px h-auto' />
      <span>{children}</span>
    </p>
  );
};

export const ButtonContainer: Component<'div'> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex flex-col items-stretch gap-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const buttonStlyes = cva(
  'flex justify-center items-center gap-[0.8em] px-[2em] py-[0.75em] whitespace-nowrap rounded-md max-w-full text-sm text-center text-zfg-primary font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-2 border-transparent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zfg-primary focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        filled:
          'bg-zfg-primary hover:bg-zfg-primary-hover focus-visible:bg-zfg-primary-hover active:bg-zfg-primary-active text-zfg-primary-contrast',
        outline: 'border-current',
      },
    },
    defaultVariants: {
      variant: 'filled',
    },
  }
);

export const Button: Component<'button', VariantProps<typeof buttonStlyes>> = ({
  className,
  children,
  type = 'button',
  variant = 'filled',
  ...props
}) => {
  return (
    <button
      className={cn(buttonStlyes({ variant }), className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};
