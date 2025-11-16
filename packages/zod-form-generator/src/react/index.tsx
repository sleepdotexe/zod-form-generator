'use client';

export * from '../core/customs';

import { useEffect, useState, useTransition } from 'react';
import * as z from 'zod/v4/core';

import { cn, mergeDeep } from '../core/util';
import { generateEmptyObjectFromSchema } from '../core/zod-helpers';
import { Button, ButtonContainer, Form, FormError } from './components/Structure';
import { generateFields } from './generate-fields';

import type React from 'react';
import type { ComponentProps } from 'react';
import type { DeepPartial, ZodForm } from '../core/types';
import type { CustomFormElements, ShowErrorWhenFunction } from './generate-fields';

export type FormSubmitHandler<Schema extends z.$ZodObject> = (
  data: z.infer<Schema>,
  addErrors: (issue: Pick<z.$ZodIssue, 'path' | 'message'>[]) => void
) => Promise<unknown>;

export type FormGeneratorOptions = Partial<{
  formErrorPosition: 'top' | 'above_buttons' | 'bottom';
  showFieldErrors: 'all' | 'first';
  showFieldErrorWhen: ShowErrorWhenFunction;
  showRequiredAsterisk: boolean;
  preventLeavingWhenDirty: boolean;
}>;

export type FormGeneratorButton = {
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

type FormGeneratorButtons = {
  submit: FormGeneratorButton;
  [key: string]: FormGeneratorButton;
};

export type FormGeneratorProps<Schema extends z.$ZodObject> = {
  schema: Schema;
  onSubmit: FormSubmitHandler<Schema>;
  initialData?: DeepPartial<z.output<Schema>>;
  disabled?: boolean;
  buttons?: FormGeneratorButtons;
  customElements?: CustomFormElements;
  options?: FormGeneratorOptions;
};

export const FormGenerator = <Schema extends z.$ZodObject>({
  schema,
  onSubmit,
  initialData: providedData,
  disabled = false,
  buttons,
  customElements = {},
  options = {},
  children,
  ...props
}: Omit<ComponentProps<'form'>, 'onSubmit'> & FormGeneratorProps<Schema>) => {
  const initialData = mergeDeep(
    generateEmptyObjectFromSchema(schema),
    providedData ?? {}
  );

  const [isLoading, startTransition] = useTransition();

  const [formState, setFormState] = useState<ZodForm<Schema>>({
    data: initialData,
    errors: z.safeParse(schema, initialData).error?.issues ?? null,
    isDirty: false,
    isTouched: false,
    dirtyFields: new Set(),
    touchedFields: new Set(),
    hasAttemptedSubmit: false,
  });

  const {
    form: FormSlot = Form,
    formError: FormErrorSlot = FormError,
    buttonContainer: ButtonContainerSlot = ButtonContainer,
    button,
  } = customElements;

  const {
    formErrorPosition = 'above_buttons',
    preventLeavingWhenDirty = false,
    showRequiredAsterisk = true,
    showFieldErrors,
    showFieldErrorWhen,
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled || isLoading) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      hasAttemptedSubmit: true,
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

    startTransition(() => {
      onSubmit(data, addErrors);
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

  const formErrors = formState.errors?.filter((issue) => issue.path.length === 0);

  return (
    <FormSlot
      {...props}
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
        showRequiredAsterisk,
        showFieldErrors,
        showFieldErrorWhen,
      })}

      {children}

      <ButtonContainerSlot className='order-11'>
        <Buttons
          buttonSlot={button}
          buttons={buttons}
          disabled={disabled}
          isLoading={isLoading}
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
}: ButtonsProps<Schema>) => {
  const { submit, ...otherButtons } = buttons;

  return (
    <>
      <ButtonSlot
        disabled={disabled || isLoading}
        onClick={(e) => {
          submit.onClick?.(e);
          setFormState((prev) => ({
            ...prev,
            hasAttemptedSubmit: true,
          }));
        }}
        type='submit'
      >
        {isLoading ? 'Submitting...' : submit.label}
      </ButtonSlot>

      {Object.entries(otherButtons).map(([key, button]) => (
        <ButtonSlot
          key={key}
          onClick={button.onClick}
          type='button'
          variant='outline'
        >
          {button.label}
        </ButtonSlot>
      ))}
    </>
  );
};
