import { Fragment, useId } from 'react';

import { cn } from '../../core/util';
import { FieldDescription, FieldError, FieldLabel } from './Structure';

import type * as z from 'zod/v4/core';
import type { Component } from '../../core/types';

export type BaseInputProps = {
  unwrap?: boolean;
  label?: string;
  labelSlot?: typeof FieldLabel;
  description?: string;
  descriptionSlot?: typeof FieldDescription;
  errors?: z.$ZodError['issues'];
  errorSlot?: typeof FieldError;
  showRequiredAsterisk?: boolean;
};

const InputWrapper: Component<'div', { unwrap?: boolean }> = ({
  unwrap,
  className,
  children,
  ...props
}) => {
  const Slot = unwrap ? Fragment : 'div';

  return (
    <Slot
      className={unwrap ? undefined : cn('group flex flex-col gap-2', className)}
      {...props}
    >
      {children}
    </Slot>
  );
};

export const Input: Component<'input', BaseInputProps> = ({
  id: providedId,
  className,
  unwrap,
  label,
  labelSlot: LabelSlot = FieldLabel,
  description,
  descriptionSlot: DescriptionSlot = FieldDescription,
  errors,
  errorSlot: ErrorSlot = FieldError,
  showRequiredAsterisk,
  ...props
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <InputWrapper unwrap={unwrap}>
      {(label || description) && (
        <div>
          {label && (
            <LabelSlot
              htmlFor={id}
              showRequiredAsterisk={showRequiredAsterisk}
            >
              {label}
            </LabelSlot>
          )}
          {description && <DescriptionSlot>{description}</DescriptionSlot>}
        </div>
      )}
      <input
        className={cn(
          'rounded-md px-4 py-2.5 text-sm transition-colors duration-200',
          'border border-neutral-300 dark:border-neutral-700',
          'disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed',
          'focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-300',
          !!errors?.length && 'border-red-400 dark:border-red-700',
          className
        )}
        id={id}
        {...props}
      />
      {!!errors?.length && (
        <div className='flex flex-col gap-1 mb-1'>
          {errors.map((error) => (
            <ErrorSlot key={error.code + error.message + error.path.join('.')}>
              {error.message}
            </ErrorSlot>
          ))}
        </div>
      )}
    </InputWrapper>
  );
};

export const Checkbox: Component<'input', BaseInputProps> = ({
  id: providedId,
  className,
  unwrap,
  label,
  labelSlot: LabelSlot = FieldLabel,
  description,
  descriptionSlot: DescriptionSlot = FieldDescription,
  errors,
  errorSlot: ErrorSlot = FieldError,
  checked,
  showRequiredAsterisk,
  ...props
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <InputWrapper unwrap={unwrap}>
      <div className='flex gap-3'>
        <div
          className={cn(
            'relative w-5 h-5 flex items-center justify-center shrink-0 rounded-md transition-all duration-200',
            'border border-neutral-300 dark:border-neutral-700',
            'has-disabled:bg-neutral-100 dark:has-disabled:bg-neutral-800',
            'focus-within:outline-none focus-within:border-neutral-500 dark:focus-within:border-neutral-300',
            !!errors?.length && 'border-red-400 dark:border-red-700',
            checked && 'bg-black border-black dark:bg-white dark:border-white',
            className
          )}
        >
          <input
            checked={checked}
            className='absolute inset-0 opacity-0 cursor-pointer focus:outline-none disabled:cursor-not-allowed'
            id={id}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className='flex flex-col gap-1 mt-px'>
            {label && (
              <LabelSlot
                htmlFor={id}
                showRequiredAsterisk={showRequiredAsterisk}
              >
                {label}
              </LabelSlot>
            )}
            {description && <DescriptionSlot>{description}</DescriptionSlot>}
          </div>
        )}
      </div>
      {!!errors?.length && (
        <div className='flex flex-col gap-1 mb-1'>
          {errors.map((error) => (
            <ErrorSlot key={error.code + error.message + error.path.join('.')}>
              {error.message}
            </ErrorSlot>
          ))}
        </div>
      )}
    </InputWrapper>
  );
};
