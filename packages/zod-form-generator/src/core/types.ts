import type { CountryCode } from 'libphonenumber-js';
import type React from 'react';
import type * as z from 'zod/v4/core';

declare module 'react' {
  // biome-ignore lint/correctness/noUnusedVariables: Extending existing interface
  interface HTMLAttributes<T> {
    [key: `data-${string}`]: string | number | undefined;
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type DeepNullable<T> = {
  [K in keyof T]: T[K] extends Array<unknown>
    ? T[K] | null
    : T[K] extends object
      ? T[K] extends Date
        ? T[K] | null
        : T[K] extends (...args: never[]) => unknown
          ? T[K] | null
          : DeepNullable<T[K]>
      : T[K] | null;
};

export type Component<
  Type extends keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<unknown>,
  CustomProps = object,
  OmitProps extends keyof (React.ComponentProps<Type> & CustomProps) = never,
> = React.FC<Omit<React.ComponentProps<Type>, OmitProps> & CustomProps>;

export type ZodForm<Schema extends z.$ZodObject> = {
  data: DeepNullable<z.infer<Schema>>;
  errors: z.$ZodIssue[] | null;
  isDirty: boolean;
  dirtyFields: Set<string>;
  isTouched: boolean;
  touchedFields: Set<string>;
  hasAttemptedSubmit: boolean;
};

type ShowErrorWhenFunction = (options: {
  formIsTouched: boolean;
  formIsDirty: boolean;
  formHasError: boolean;
  fieldValue: unknown;
  fieldIsTouched: boolean;
  fieldIsDirty: boolean;
  fieldHasError: boolean;
  submissionAttempted: boolean;
}) => boolean;

type PhoneFieldsOptions<T extends readonly CountryCode[] | undefined = undefined> =
  T extends readonly CountryCode[]
    ? {
        allowedCountries: T;
        defaultCountry: T[number];
        commonCountries?: T[number][];
      }
    : {
        allowedCountries?: CountryCode[];
        defaultCountry?: CountryCode;
        commonCountries?: CountryCode[];
      };

export type FormGeneratorOptions<
  AllowedCountries extends readonly CountryCode[] | undefined = undefined,
> = Partial<{
  formErrorPosition: 'top' | 'above_buttons' | 'bottom';
  showFieldErrors: 'all' | 'first';
  showFieldErrorWhen: ShowErrorWhenFunction;
  showRequiredAsterisk: boolean;
  preventLeavingWhenDirty: boolean;
  resetFormAfterSubmission: boolean;
  debug: boolean;
  phoneFields: PhoneFieldsOptions<AllowedCountries>;
}>;

declare module 'zod/v4/core' {
  interface GlobalMeta {
    inputType?: 'tel' | 'password' | 'date' | 'radio';
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    placeholder?: string;
    autoComplete?: React.HTMLInputAutoCompleteAttribute;
    unwrap?: boolean;
    enumLabels?: Record<string, string>;
  }
}
