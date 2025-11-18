import { Fragment } from 'react';
import * as z from 'zod/v4/core';

import {
  boolAttribute,
  coerceAnyOfToSingleInput,
  getNestedValueByPath,
  setNestedValueByPath,
} from '../core/util';
import { determineFieldStartingValue, toJSONSchema } from '../core/zod-helpers';
import { Checkbox, Input, PhoneInput, Select } from './components/Fields';
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Fieldset,
  FormError,
} from './components/Structure';

import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import type { FormGeneratorOptions, ZodForm } from '../core/types';
import type { FormGenerator } from '.';
import type { Button, ButtonContainer, Form, FormLegend } from './components/Structure';

export type CustomFormElements = Partial<{
  form: typeof Form;
  fieldset: typeof Fieldset;
  legend: typeof FormLegend;
  label: typeof FieldLabel;
  description: typeof FieldDescription;
  input: typeof Input;
  select: typeof Select;
  checkbox: typeof Checkbox;
  fieldError: typeof FieldError;
  formError: typeof FormError;
  buttonContainer: typeof ButtonContainer;
  button: typeof Button;
}>;

type GenerateFieldsProps<Schema extends z.$ZodObject> = {
  schema: Schema;
  formState: ZodForm<Schema>;
  setFormState: Dispatch<SetStateAction<ZodForm<Schema>>>;
  disabled?: boolean;
} & Pick<ComponentProps<typeof FormGenerator>, 'customElements' | 'options'>;

export const generateFields = <Schema extends z.$ZodObject>(
  props: GenerateFieldsProps<Schema>
) => {
  const { schema, ...restProps } = props;
  const initalJsonSchema = toJSONSchema(schema);

  if (props.options?.debug) {
    console.log('Form JSON Schema:', initalJsonSchema);
  }

  return _generateFields<typeof schema>({
    schema,
    jsonSchema: initalJsonSchema,
    ...restProps,
  });
};

const showErrorWhenDefault: FormGeneratorOptions['showFieldErrorWhen'] = ({
  submissionAttempted,
  formIsDirty,
  fieldIsTouched,
}) => {
  return submissionAttempted || (formIsDirty && fieldIsTouched);
};

const _generateFields = <Schema extends z.$ZodObject>(
  props: Parameters<typeof generateFields<Schema>>[0] & {
    jsonSchema: z.JSONSchema._JSONSchema;
    pathToKey?: string[];
  }
) => {
  const {
    schema,
    jsonSchema,
    formState,
    setFormState,
    disabled: formDisabled,
    pathToKey = [],
    customElements = {},
    options,
  } = props;
  if (typeof jsonSchema === 'boolean') {
    return null;
  }

  const { properties, required } = jsonSchema;

  if (!properties) {
    return null;
  }

  const {
    fieldset: FieldsetSlot = Fieldset,
    label: LabelSlot = FieldLabel,
    description: DescriptionSlot = FieldDescription,
    input: InputSlot = Input,
    select: SelectSlot = Select,
    checkbox: CheckboxSlot = Checkbox,
    formError: FormErrorSlot = FormError,
    fieldError: FieldErrorSlot = FieldError,
  } = customElements;

  const {
    showRequiredAsterisk = true,
    showFieldErrors,
    showFieldErrorWhen = showErrorWhenDefault,
    phoneFields,
  } = options ?? {};

  return Object.entries(properties).map(([key, value]) => {
    if (typeof value === 'boolean') {
      return null;
    }

    const input: z.JSONSchema.JSONSchema & z.GlobalMeta = coerceAnyOfToSingleInput(value);
    const dotPathToKey = [...pathToKey, key].join('.');

    if (!input.type || input.type === 'null') {
      return null;
    }

    if (input.type === 'object') {
      if (!input.properties) {
        return null;
      }

      const { title, description, unwrap, readOnly } = input;

      const fieldsetErrors = formState.errors
        ?.filter((issue) => issue.path.join('.') === dotPathToKey)
        .slice(0, showFieldErrors === 'first' ? 1 : undefined);

      const Wrapper = unwrap ? Fragment : FieldsetSlot;

      return (
        <Wrapper
          description={unwrap ? undefined : description}
          disabled={unwrap ? undefined : formDisabled || readOnly}
          key={key}
          legend={unwrap ? undefined : title}
        >
          {!!fieldsetErrors?.length &&
            fieldsetErrors.map((issue) => (
              <FormErrorSlot key={issue.code + issue.message + issue.input}>
                {issue.message}
              </FormErrorSlot>
            ))}

          {_generateFields({
            ...props,
            jsonSchema: input,
            pathToKey: [...pathToKey, key],
          })}
        </Wrapper>
      );
    }

    const {
      type,
      autoComplete,
      inputMode,
      description,
      placeholder,
      title,
      nullable,
      readOnly,
      unwrap,
    } = input;

    const fieldIsTouched = formState.touchedFields.has(dotPathToKey);
    const fieldIsDirty = formState.dirtyFields.has(dotPathToKey);
    const fieldIsRequired = required?.includes(key) && !nullable;

    const valueWhenEmpty = determineFieldStartingValue(value, fieldIsRequired);
    const valueFromState = getNestedValueByPath(formState.data, [...pathToKey, key]);
    const valueFormattedForInput =
      typeof valueFromState === 'string'
        ? valueFromState
        : typeof valueFromState === 'number'
          ? valueFromState.toString()
          : Array.isArray(valueFromState)
            ? valueFromState
            : null;

    const thisFieldErrors = formState.errors
      ?.filter((issue) => issue.path.join('.') === dotPathToKey)
      .slice(0, showFieldErrors === 'first' ? 1 : undefined);

    const showErrors = showFieldErrorWhen({
      formIsTouched: formState.isTouched,
      formIsDirty: formState.isDirty,
      formHasError: !!formState.errors?.length,
      fieldValue: valueFormattedForInput,
      fieldIsTouched,
      fieldIsDirty,
      fieldHasError: !!thisFieldErrors?.length,
      submissionAttempted: formState.hasAttemptedSubmit,
    });

    const thisFieldFlattenedErrors = thisFieldErrors?.flatMap((issue) =>
      issue.code === 'invalid_union' ? issue.errors.flat() : [issue]
    );

    const setValueInState = (value: string | number | boolean | null | undefined) =>
      setFormState((prev) => {
        const newData: typeof prev.data = setNestedValueByPath(
          prev.data,
          [...pathToKey, key],
          value?.toString().length === 0 ? valueWhenEmpty : value
        );
        return {
          ...prev,
          data: newData,
          errors: z.safeParse(schema, newData).error?.issues ?? null,
          dirtyFields: prev.dirtyFields.add(dotPathToKey),
          isDirty: true,
        };
      });

    const sharedProps: Partial<ComponentProps<typeof Input | typeof Select>> = {
      labelSlot: LabelSlot,
      descriptionSlot: DescriptionSlot,
      errorSlot: FieldErrorSlot,
      value: valueFormattedForInput ?? '',
      label: title ?? key,
      placeholder,
      description,
      autoComplete,
      inputMode,
      required: fieldIsRequired,
      errors: showErrors ? thisFieldFlattenedErrors : undefined,
      disabled: formDisabled || readOnly,
      showRequiredAsterisk,
      unwrap,
      onChange: (e) => setValueInState(e.target.value),
      onBlur: () =>
        setFormState((prev) => {
          if (prev.hasAttemptedSubmit) {
            return prev;
          }

          return {
            ...prev,
            errors: z.safeParse(schema, prev.data).error?.issues ?? null,
            isTouched: true,
            touchedFields: prev.touchedFields.add(dotPathToKey),
          };
        }),
      'aria-required': fieldIsRequired,
      'aria-invalid': showErrors && !!thisFieldFlattenedErrors?.length,
      'data-dirty': boolAttribute(fieldIsDirty),
      'data-error': boolAttribute(!!thisFieldFlattenedErrors?.length),
      'data-touched': boolAttribute(fieldIsTouched),
    };

    if (type === 'string') {
      if (input.enum) {
        const { enumLabels, inputType } = input;

        if (inputType === 'radio') {
          return null;

          // return (
          //   <RadioButtons
          //     {...(sharedProps as Partial<ComponentProps<typeof Input>>)}
          //     key={key}
          //     options={input.enum.map((enumValue) => ({
          //       value: String(enumValue),
          //       label:
          //         (enumLabels as z.GlobalMeta["enumLabels"])?.[
          //           String(enumValue)
          //         ] ?? String(enumValue),
          //     }))}
          //   />
          // );
        }

        return (
          <SelectSlot
            {...(sharedProps as Partial<ComponentProps<typeof Select>>)}
            key={key}
          >
            {input.enum.map((enumValue) => (
              <option
                className='text-black bg-white dark:text-white dark:bg-black'
                key={String(enumValue)}
                value={String(enumValue)}
              >
                {(enumLabels as z.GlobalMeta['enumLabels'])?.[String(enumValue)] ??
                  String(enumValue)}
              </option>
            ))}
          </SelectSlot>
        );
      }

      const { format, inputType, pattern, minLength, maxLength } = input;

      if (inputType === 'tel') {
        return (
          <PhoneInput
            {...sharedProps}
            {...(phoneFields as FormGeneratorOptions['phoneFields'])}
            inputSlot={InputSlot}
            key={key}
            selectSlot={SelectSlot}
          />
        );
      }

      if (inputType === 'date') {
        return (
          <InputSlot
            {...sharedProps}
            key={key}
            type='date'
          />
        );
      }

      const formatProps: Pick<
        ComponentProps<typeof InputSlot>,
        'inputMode' | 'type' | 'autoComplete'
      > = {
        inputMode:
          sharedProps.inputMode ??
          (format === 'email' ? 'email' : format === 'uri' ? 'url' : 'text'),
        type:
          sharedProps.type ??
          (inputType === 'password' ? 'password' : format === 'email' ? 'email' : 'text'),
        autoComplete:
          sharedProps.autoComplete ??
          (format === 'email'
            ? 'email'
            : inputType === 'password'
              ? 'current-password'
              : undefined),
      };

      return (
        <InputSlot
          {...sharedProps}
          {...formatProps}
          key={key}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
        />
      );
    }

    if (type === 'number' || type === 'integer') {
      const { minimum, maximum } = input;

      return (
        <InputSlot
          {...sharedProps}
          inputMode={sharedProps.inputMode ?? 'numeric'}
          key={key}
          max={maximum}
          min={minimum}
          onChange={(e) => {
            const parse = type === 'integer' ? parseInt : parseFloat;
            const parsedValue = e.target.value && parse(e.target.value.toString());
            setValueInState(Number.isNaN(parsedValue) ? valueWhenEmpty : parsedValue);
          }}
          type='number'
        />
      );
    }

    if (type === 'boolean') {
      return (
        <CheckboxSlot
          {...sharedProps}
          autoComplete={undefined}
          checked={Boolean(valueFromState)}
          inputMode={undefined}
          key={key}
          onChange={(e) => setValueInState(e.target.checked)}
          placeholder={undefined}
          required={false}
          type='checkbox'
        />
      );
    }

    throw new Error(
      `Unsupported input type detected (${type} with custom format ${input.inputType}). Cannot automatically generate an input for the provided schema.`
    );
  });
};
