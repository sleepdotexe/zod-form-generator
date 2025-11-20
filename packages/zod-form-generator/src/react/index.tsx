'use client';

export * from '../core/customs';

import { useEffect, useState, useTransition } from 'react';
import * as z from 'zod/v4/core';

import { FORM_DATA_ATTRIBUTE_NAMES } from '../core/constants';
import { cn, mergeDeep } from '../core/util';
import { generateEmptyObjectFromSchema } from '../core/zod-helpers';
import { Button, ButtonContainer, Form, FormError } from './components/Structure';
import { generateFields } from './generate-fields';

import type { CountryCode } from 'libphonenumber-js';
import type React from 'react';
import type { ComponentProps } from 'react';
import type { DeepPartial, FormGeneratorOptions, ZodForm } from '../core/types';
import type { CustomFormElements } from './generate-fields';

type FormGeneratorButton = {
  label: string;
  props?: Omit<ComponentProps<typeof Button>, 'key' | 'children' | 'type'>;
};

type FormGeneratorButtons = {
  submit: FormGeneratorButton;
  [key: string]: FormGeneratorButton;
};

export type FormSubmitHandler<Schema extends z.$ZodObject> = (
  data: z.infer<Schema>,
  addErrors: (issue: Pick<z.$ZodIssue, 'path' | 'message'>[]) => false
  // biome-ignore lint/suspicious/noConfusingVoidType: User may implement the handler without returning a value.
) => Promise<boolean | void>;

export type FormGeneratorProps<
  Schema extends z.$ZodObject,
  AllowedCountries extends readonly CountryCode[] | undefined = undefined,
> = {
  schema: Schema;
  onSubmit: FormSubmitHandler<Schema>;
  initialData?: DeepPartial<z.output<Schema>>;
  disabled?: boolean;
  buttons?: FormGeneratorButtons;
  customElements?: CustomFormElements;
  options?: FormGeneratorOptions<AllowedCountries>;
};

const scrollToFirstError = () => {
  const firstFieldError = document.querySelector(
    `[${FORM_DATA_ATTRIBUTE_NAMES.FIELD_ERROR}]`
  );
  const firstFormError = document.querySelector(
    `[${FORM_DATA_ATTRIBUTE_NAMES.FORM_ERROR}]`
  );

  const toScrollTo = firstFieldError ?? firstFormError;
  if (!toScrollTo) {
    return;
  }

  toScrollTo.scrollIntoView({ block: 'center' });

  if (firstFieldError) {
    const nearestInput = firstFieldError
      .closest('div:has([data-error])')
      ?.querySelector('[data-error]');
    console.log(nearestInput);
    if (nearestInput) {
      (nearestInput as HTMLElement).focus();
    }
  }
};

export const FormGenerator = <
  Schema extends z.$ZodObject,
  AllowedCountries extends readonly CountryCode[] | undefined = undefined,
>({
  schema,
  onSubmit,
  initialData: providedData,
  disabled = false,
  buttons,
  customElements = {},
  options = {},
  children,
  ...props
}: Omit<ComponentProps<'form'>, 'onSubmit'> &
  FormGeneratorProps<Schema, AllowedCountries>) => {
  const initialData = mergeDeep(
    generateEmptyObjectFromSchema(schema),
    providedData ?? {}
  );

  const initialState: ZodForm<Schema> = {
    data: initialData,
    errors: z.safeParse(schema, initialData).error?.issues ?? null,
    isDirty: false,
    isTouched: false,
    dirtyFields: new Set(),
    touchedFields: new Set(),
    lastSubmissionAttemptTimestamp: null,
  };

  const [isLoading, startTransition] = useTransition();
  const [formState, setFormState] = useState<ZodForm<Schema>>(initialState);

  const {
    form: FormSlot = Form,
    formError: FormErrorSlot = FormError,
    buttonContainer: ButtonContainerSlot = ButtonContainer,
    button,
  } = customElements;

  const {
    formErrorPosition = 'above_buttons',
    preventLeavingWhenDirty = false,
    resetFormAfterSubmission = false,
    buttons: buttonsOptions,
  } = options;

  const addErrors: Parameters<FormSubmitHandler<Schema>>[1] = (issues) => {
    const mappedIssues: z.$ZodIssue[] = issues.map((issue) => ({
      ...issue,
      code: 'custom',
      input: '',
    }));

    setFormState((prev) => ({
      ...prev,
      errors: [...(prev.errors ?? []), ...mappedIssues],
    }));

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled || isLoading) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      lastSubmissionAttemptTimestamp: Date.now(),
      errors: null,
    }));

    const { error, data } = z.safeParse(schema, formState.data);

    if (error) {
      setFormState((prev) => ({
        ...prev,
        errors: error.issues,
      }));

      return;
    }

    startTransition(async () => {
      const success = await onSubmit(data, addErrors);

      setFormState((prev) => ({
        ...prev,
        lastSubmissionAttemptTimestamp: Date.now(),
      }));

      if (success !== false && resetFormAfterSubmission) {
        setFormState(initialState);
      }
    });
  };

  useEffect(() => {
    if (!formState.isDirty || !preventLeavingWhenDirty) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preventLeavingWhenDirty, formState.isDirty]);

  useEffect(() => {
    if (formState.lastSubmissionAttemptTimestamp !== null) {
      scrollToFirstError();
    }
  }, [formState.lastSubmissionAttemptTimestamp]);

  const formErrors = formState.errors?.filter((issue) => issue.path.length === 0);

  return (
    <FormSlot
      {...props}
      {...{ [FORM_DATA_ATTRIBUTE_NAMES.FORM]: '' }}
      onSubmit={handleSubmit}
    >
      {!!formErrors?.length &&
        formErrors.map((issue) => (
          <FormErrorSlot
            className={cn(
              formErrorPosition === 'above_buttons' && 'order-10',
              formErrorPosition === 'bottom' && 'order-12'
            )}
            key={issue.code + issue.message + issue.input}
          >
            {issue.message}
          </FormErrorSlot>
        ))}

      {generateFields({
        schema,
        formState,
        setFormState,
        disabled,
        customElements,
        options,
      })}

      {children}

      <ButtonContainerSlot className='order-11'>
        <Buttons
          buttonSlot={button}
          buttons={buttons}
          disabled={
            disabled ||
            (formState.lastSubmissionAttemptTimestamp !== null &&
              !!formState.errors?.filter((issue) => issue.path.length > 0).length)
          }
          isLoading={isLoading}
          options={buttonsOptions}
          setFormState={setFormState}
        />
      </ButtonContainerSlot>
    </FormSlot>
  );
};

type ButtonsProps<Schema extends z.$ZodObject> = {
  buttons?: FormGeneratorButtons;
  buttonSlot: NonNullable<FormGeneratorProps<Schema>['customElements']>['button'];
  disabled?: boolean;
  isLoading?: boolean;
  setFormState: React.Dispatch<React.SetStateAction<ZodForm<Schema>>>;
  options?: FormGeneratorOptions['buttons'];
};

const Buttons = <Schema extends z.$ZodObject>({
  buttons = {
    submit: {
      label: 'Submit',
    },
  },
  buttonSlot: ButtonSlot = Button,
  disabled,
  isLoading,
  setFormState,
  options,
}: ButtonsProps<Schema>) => {
  const {
    submit: { label: submitLabel, props: submitProps },
    ...otherButtons
  } = buttons;

  return (
    <>
      <ButtonSlot
        {...submitProps}
        disabled={disabled || isLoading}
        onClick={(e) => {
          submitProps?.onClick?.(e);
          setFormState((prev) => ({
            ...prev,
            lastSubmissionAttemptTimestamp: Date.now(),
          }));
        }}
        size={options?.size}
        type='submit'
      >
        {isLoading ? 'Submitting...' : submitLabel}
      </ButtonSlot>

      {Object.entries(otherButtons).map(([key, { label, props: buttonProps }]) => (
        <ButtonSlot
          {...buttonProps}
          key={key}
          size={options?.size}
          type='button'
          variant={buttonProps?.variant ?? 'outline'}
        >
          {label}
        </ButtonSlot>
      ))}
    </>
  );
};

export { FORM_DATA_ATTRIBUTE_NAMES };
export type { FormGeneratorOptions };
