import { cva } from 'class-variance-authority';
import { Fragment, useId } from 'react';

import { cn } from '../../core/util';
import { CheckIcon, ChevronIcon } from './Icons';
import { FieldDescription, FieldError, FieldLabel } from './Structure';

import type { VariantProps } from 'class-variance-authority';
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

const inputStyles = cva(
  'rounded-md border border-neutral-300 dark:border-neutral-700 duration-200 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-300 appearance-none',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-400 dark:border-red-700',
      },
      inputType: {
        field:
          'px-4 py-2.5 text-sm transition-colors disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed',
        checkbox:
          'relative w-5 h-5 flex items-center justify-center shrink-0 transition-all has-disabled:bg-neutral-100 has-disabled:dark:bg-neutral-800 has-disabled:cursor-not-allowed',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputType: 'field',
    },
  }
);

export const Input: Component<'input', BaseInputProps> = ({
  id: providedId,
  className,
  children: _,
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

  const variant: VariantProps<typeof inputStyles>['variant'] = errors?.length
    ? 'error'
    : 'default';

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
          inputStyles({
            inputType: 'field',
            variant,
          }),
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

export const Select: Component<
  'select',
  BaseInputProps & {
    showUnselectableDefault?: boolean;
    unselectableOptionLabel?: string;
  }
> = ({
  id: providedId,
  className,
  children,
  unwrap,
  label,
  labelSlot: LabelSlot = FieldLabel,
  description,
  descriptionSlot: DescriptionSlot = FieldDescription,
  errors,
  errorSlot: ErrorSlot = FieldError,
  showRequiredAsterisk,
  showUnselectableDefault = true,
  unselectableOptionLabel = 'Select an option...',
  ...props
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const defaultValue = showUnselectableDefault ? (
    <option
      disabled={props.required}
      hidden={props.required}
      value=''
    >
      {unselectableOptionLabel}
    </option>
  ) : null;

  const variant: VariantProps<typeof inputStyles>['variant'] = errors?.length
    ? 'error'
    : 'default';

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

      <div className='relative'>
        <select
          className={cn(
            inputStyles({
              inputType: 'field',
              variant,
            }),
            'w-full',
            className
          )}
          id={id}
          {...props}
        >
          {defaultValue}
          {children}
        </select>
        <span className='inline-block w-4 h-auto absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none select-none'>
          <ChevronIcon className='w-full' />
        </span>
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

export const Checkbox: Component<'input', BaseInputProps> = ({
  id: providedId,
  className,
  children: _,
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

  const variant: VariantProps<typeof inputStyles>['variant'] = errors?.length
    ? 'error'
    : 'default';

  return (
    <InputWrapper unwrap={unwrap}>
      <div className='flex gap-3'>
        <div
          className={cn(
            inputStyles({
              inputType: 'checkbox',
              variant,
            }),
            checked && 'bg-black border-black dark:bg-white dark:border-white',
            className
          )}
        >
          <CheckIcon className='absolute w-3 h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white dark:text-black' />
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
