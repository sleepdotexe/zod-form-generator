'use client';

import { cva } from 'class-variance-authority';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import { Fragment, useId, useState } from 'react';

import { FORM_DATA_ATTRIBUTE_NAMES } from '../../core/constants';
import { cn } from '../../core/util';
import { CheckIcon, ChevronIcon } from './Icons';
import { FieldDescription, FieldError, FieldLabel } from './Structure';

import type { VariantProps } from 'class-variance-authority';
import type { CountryCode } from 'libphonenumber-js';
import type { ReactNode } from 'react';
import type * as z from 'zod/v4/core';
import type { Component, FormGeneratorOptions } from '../../core/types';

export type BaseInputProps = {
  unwrap?: boolean;
  icon?: ReactNode;
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
  'rounded-md border border-zfg-border dark:border-zfg-border-dark duration-200 focus:outline-none appearance-none transition-all',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-zfg-error/70 dark:border-zfg-error-dark/70',
      },
      inputType: {
        field:
          'w-full h-full px-4 py-2.5 text-sm disabled:bg-zfg-disabled-background disabled:text-zfg-disabled-foreground dark:disabled:bg-zfg-disabled-background-dark dark:disabled:text-zfg-disabled-foreground-dark disabled:cursor-not-allowed',
        checkbox:
          'relative w-5 h-5 flex items-center justify-center shrink-0 has-disabled:opacity-50 has-disabled:cursor-not-allowed',
      },
      icon: {
        withIcon: 'pr-7',
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
  icon,
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

      <div
        {...{ [FORM_DATA_ATTRIBUTE_NAMES.INPUT]: '' }}
        className={cn('relative', className)}
      >
        <input
          aria-describedby={errors?.length ? errorsId : undefined}
          className={inputStyles({
            inputType: 'field',
            variant,
            icon: icon ? 'withIcon' : undefined,
          })}
          id={id}
          {...props}
        />

        {icon && (
          <span className='inline-block absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none select-none'>
            {icon}
          </span>
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
  allowedCountries: allowedCountriesInput,
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
        country: parsedCountry,
      } = parsePhoneNumberWithError(number, countryCode);

      const parsedNumberIsFromAllowedCountry =
        parsedCountry && allowedCountries.includes(parsedCountry);

      if (parsedCountry && parsedCountry !== countryCode) {
        if (parsedNumberIsFromAllowedCountry) {
          countryCode = parsedCountry;
        }
        number = nationalNumber;
      }

      const valueToSetUpstream = parsedNumberIsFromAllowedCountry
        ? e164Number
        : undefined;

      onChange?.({ target: { value: valueToSetUpstream } });
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

  const allowedCountries = getCountries().filter(
    (c) => !allowedCountriesInput || allowedCountriesInput.includes(c)
  );

  const countries = allowedCountries
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

      <div
        className={cn('flex items-stretch justify-start', className)}
        {...{ [FORM_DATA_ATTRIBUTE_NAMES.INPUT_PHONE]: '' }}
      >
        <SelectSlot
          aria-label='Phone country code'
          autoComplete='country'
          className='w-44 shrink-0 [&>select]:border-r-0 [&>select]:rounded-r-none'
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
          className={'w-full shrink [&>input]:rounded-l-none'}
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
  icon,
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

      <div
        className={cn('relative', className)}
        {...{ [FORM_DATA_ATTRIBUTE_NAMES.SELECT]: '' }}
      >
        <select
          className={cn(
            inputStyles({
              inputType: 'field',
              variant,
              icon: 'withIcon',
            }),
            'focus-visible:ring-2 ring-offset-2 ring-zfg-primary dark:ring-zfg-primary-dark text-ellipsis overflow-hidden whitespace-nowrap'
          )}
          id={id}
          {...props}
        >
          {defaultValue}
          {children}
        </select>

        <span className='inline-block absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none select-none'>
          {icon ?? (
            <ChevronIcon
              aria-hidden
              className='w-4 h-auto group-has-[select:disabled]:text-zfg-disabled-foreground dark:group-has-[select:disabled]:text-zfg-disabled-foreground-dark'
            />
          )}
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
  icon: _,
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
              icon: undefined,
            }),
            'has-focus-visible:ring-2 ring-offset-2 ring-zfg-primary dark:ring-zfg-primary-dark',
            checked &&
              'bg-zfg-primary dark:bg-zfg-primary-dark border-zfg-primary dark:border-zfg-primary-dark',
            className
          )}
          {...{ [FORM_DATA_ATTRIBUTE_NAMES.CHECKBOX]: '' }}
        >
          <CheckIcon
            aria-hidden
            className={cn(
              'absolute w-3 h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zfg-primary-contrast dark:text-zfg-primary-contrast-dark opacity-0 transition-opacity duration-200',
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
          <div
            className={cn('flex flex-col gap-1 mt-px', props.disabled && 'opacity-50')}
          >
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
