'use client';

import { cva } from 'class-variance-authority';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import { Fragment, useId, useState } from 'react';

import { cn } from '../../core/util';
import { CheckIcon, ChevronIcon } from './Icons';
import { FieldDescription, FieldError, FieldLabel } from './Structure';

import type { VariantProps } from 'class-variance-authority';
import type { CountryCode } from 'libphonenumber-js';
import type * as z from 'zod/v4/core';
import type { Component, FormGeneratorOptions } from '../../core/types';

export type BaseInputProps = {
  unwrap?: boolean;
  label?: string;
  labelSlot?: typeof FieldLabel;
  description?: string;
  descriptionSlot?: typeof FieldDescription;
  errors?: z.$ZodError['issues'];
  errorSlot?: typeof FieldError;
  forceErrorStyles?: boolean;
  showRequiredAsterisk?: boolean;
  onChange?: (e: { target: { value?: string; checked?: boolean } }) => void;
};

const InputWrapper: Component<'div', { unwrap?: boolean }> = ({
  unwrap,
  children,
  ...props
}) => {
  const Slot = unwrap ? Fragment : 'div';
  props.className = cn('group flex flex-col gap-2', props.className);

  return <Slot {...(unwrap ? {} : props)}>{children}</Slot>;
};

const inputStyles = cva(
  'rounded-md border border-neutral-300 dark:border-neutral-700 duration-200 focus:outline-none appearance-none transition-all',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-400 dark:border-red-700',
      },
      inputType: {
        field:
          'px-4 py-2.5 text-sm disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed',
        checkbox:
          'relative w-5 h-5 flex items-center justify-center shrink-0 has-disabled:bg-neutral-100 has-disabled:dark:bg-neutral-800 has-disabled:cursor-not-allowed',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputType: 'field',
    },
  }
);

export const Input: Component<'input', BaseInputProps, 'onChange'> = ({
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
  forceErrorStyles = false,
  showRequiredAsterisk,
  ...props
}) => {
  const generatedId = useId();
  const errorsId = useId();
  const id = providedId ?? generatedId;

  const variant: VariantProps<typeof inputStyles>['variant'] =
    errors?.length || forceErrorStyles ? 'error' : 'default';

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
        aria-describedby={errors?.length ? errorsId : undefined}
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

      {children}

      {!!errors?.length && (
        <div
          className='flex flex-col gap-1 mb-1'
          id={errorsId}
        >
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

type PhoneNumber = { countryCode: CountryCode; number: string };

type PhoneInputAdditionalProps = BaseInputProps &
  FormGeneratorOptions['phoneFields'] & {
    inputSlot?: typeof Input;
    selectSlot?: typeof Select;
  };

export const PhoneInput: Component<'input', PhoneInputAdditionalProps, 'onChange'> = ({
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
  forceErrorStyles = false,
  inputSlot: InputSlot = Input,
  selectSlot: SelectSlot = Select,
  showRequiredAsterisk,
  onChange,
  allowedCountries,
  defaultCountry = 'US',
  commonCountries = [],
  ...props
}) => {
  const generatedId = useId();
  const errorsId = useId();
  const id = providedId ?? generatedId;

  const [phone, setPhone] = useState<PhoneNumber>({
    countryCode: defaultCountry,
    number: '',
  });

  const handleChange = (phoneInput: Partial<PhoneNumber>) => {
    let { countryCode, number } = {
      ...phone,
      ...phoneInput,
    };

    try {
      const {
        number: e164Number,
        nationalNumber,
        country,
      } = parsePhoneNumberWithError(number, countryCode);

      if (country && country !== countryCode) {
        countryCode = country;
        number = nationalNumber;
      }

      onChange?.({ target: { value: e164Number } });
    } catch {
      onChange?.({ target: { value: number } });
    }

    if (!(number.includes('(') && !number.includes(')'))) {
      number = new AsYouType(countryCode).input(number);
    }

    setPhone({
      countryCode,
      number,
    });
  };

  const countries = getCountries()
    .filter((c) => !allowedCountries || allowedCountries.includes(c))
    .map((c) => ({
      countryCode: c,
      name: new Intl.DisplayNames(['en'], { type: 'region' }).of(c),
      callingCode: getCountryCallingCode(c),
    }))
    .sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));

  const mapCountriesToOptions = (c: typeof countries) =>
    c.map(({ countryCode, name, callingCode }) => (
      <option
        key={countryCode}
        suppressHydrationWarning
        value={countryCode}
      >
        {name} (+{callingCode})
      </option>
    ));

  const commonCountriesGroup = commonCountries.length ? (
    <optgroup>
      {mapCountriesToOptions(
        countries.filter((c) => commonCountries.includes(c.countryCode))
      )}
    </optgroup>
  ) : null;

  const restCountriesGroup = (
    <optgroup>
      {mapCountriesToOptions(
        countries.filter((c) => !commonCountries.includes(c.countryCode))
      )}
    </optgroup>
  );

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

      <div className='flex items-stretch justify-start'>
        <SelectSlot
          aria-label='Phone country code'
          autoComplete='country'
          className='min-w-40 shrink-0 border-r-0 rounded-r-none'
          disabled={props.disabled ?? countries.length === 1}
          forceErrorStyles={forceErrorStyles || !!errors?.length}
          onChange={(e) => handleChange({ countryCode: e.target.value as CountryCode })}
          showUnselectableDefault={false}
          unwrap
          value={phone.countryCode}
        >
          {commonCountriesGroup}
          {restCountriesGroup}
        </SelectSlot>

        <InputSlot
          {...props}
          autoComplete={props.autoComplete ?? 'tel-national'}
          className={cn('w-full shrink rounded-l-none', className)}
          forceErrorStyles={forceErrorStyles || !!errors?.length}
          id={id}
          inputMode='tel'
          onChange={(e) => handleChange({ number: e.target.value })}
          type='tel'
          unwrap
          value={phone.number}
        />
      </div>

      {!!errors?.length && (
        <div
          className='flex flex-col gap-1 mb-1'
          id={errorsId}
        >
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
  },
  'onChange'
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
  forceErrorStyles = false,
  showRequiredAsterisk,
  showUnselectableDefault = true,
  unselectableOptionLabel = 'Select an option...',
  ...props
}) => {
  const generatedId = useId();
  const errorsId = useId();
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

  const variant: VariantProps<typeof inputStyles>['variant'] =
    errors?.length || forceErrorStyles ? 'error' : 'default';

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
            'w-full focus-visible:ring-2 ring-offset-2 ring-zfg-primary',
            className
          )}
          id={id}
          {...props}
        >
          {defaultValue}
          {children}
        </select>
        <span className='inline-block w-4 h-auto absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none select-none'>
          <ChevronIcon
            aria-hidden
            className='w-full'
          />
        </span>
      </div>

      {!!errors?.length && (
        <div
          className='flex flex-col gap-1 mb-1'
          id={errorsId}
        >
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

export const Checkbox: Component<'input', BaseInputProps, 'onChange'> = ({
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
  forceErrorStyles = false,
  checked,
  showRequiredAsterisk,
  ...props
}) => {
  const generatedId = useId();
  const errorsId = useId();
  const id = providedId ?? generatedId;

  const variant: VariantProps<typeof inputStyles>['variant'] =
    errors?.length || forceErrorStyles ? 'error' : 'default';

  return (
    <InputWrapper unwrap={unwrap}>
      <div className='flex gap-3'>
        <div
          className={cn(
            inputStyles({
              inputType: 'checkbox',
              variant,
            }),
            'has-focus-visible:ring-2 ring-offset-2 ring-zfg-primary',
            checked && 'bg-zfg-primary border-zfg-primary dark:border-zfg-primary',
            className
          )}
        >
          <CheckIcon
            aria-hidden
            className={cn(
              'absolute w-3 h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zfg-primary-contrast opacity-0 transition-opacity duration-200',
              checked && 'opacity-100'
            )}
          />
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

      {children}

      {!!errors?.length && (
        <div
          className='flex flex-col gap-1 mb-1'
          id={errorsId}
        >
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
