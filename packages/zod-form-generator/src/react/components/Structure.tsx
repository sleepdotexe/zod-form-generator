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
        'flex gap-3 text-red-600 bg-red-100/50 dark:bg-red-950/50 dark:text-red-400 border border-red-300 dark:border-red-900 px-4 py-3 rounded-md text-xs font-medium motion-safe:animate-fade-in',
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
        showRequiredAsterisk && "group-has-required:after:content-['*']",
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
        'flex gap-3 text-red-600 dark:text-red-400 text-xs font-medium motion-safe:animate-fade-in',
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
  'flex justify-center items-center gap-[0.8em] px-[2em] py-[0.75em] text-center whitespace-nowrap rounded-md max-w-full text-sm font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-2 border-transparent transition-colors duration-200',
  {
    variants: {
      variant: {
        filled:
          'bg-black hover:bg-neutral-800 focus-visible:bg-neutral-800 active:bg-neutral-700 text-white dark:bg-white dark:hover:bg-neutral-200 dark:focus-visible:bg-neutral-200 dark:active:bg-neutral-300 dark:text-black',
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
