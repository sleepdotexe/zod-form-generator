import React from "react";
import type { ZodForm } from "../core/types";
import {
  boolAttribute,
  coerceAnyOfToSingleInput,
  getNestedValueByPath,
  setNestedValueByPath,
} from "../core/util";
import { AsYouType, type CountryCode } from "libphonenumber-js";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import * as z from "zod/v4/core";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Fieldset,
  FormError,
  type Form,
  type FormLegend,
  type Button,
  type ButtonContainer,
} from "./components/Structure";
import { Input } from "./components/Fields";
import { FormGeneratorOptions } from ".";

export type CustomFormElements = Partial<{
  form: typeof Form;
  fieldset: typeof Fieldset;
  legend: typeof FormLegend;
  label: typeof FieldLabel;
  description: typeof FieldDescription;
  input: typeof Input;
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
  defaultCountry?: CountryCode;
  customElements?: CustomFormElements;
} & Pick<
  FormGeneratorOptions,
  "showFieldErrors" | "showFieldErrorWhen" | "showRequiredAsterisk"
>;

export const generateFields = <Schema extends z.$ZodObject>(
  props: GenerateFieldsProps<Schema>
) => {
  const { schema, ...restProps } = props;
  const initalJsonSchema = z.toJSONSchema(schema, { io: "input" });

  return _generateFields<typeof schema>({
    schema,
    jsonSchema: initalJsonSchema,
    ...restProps,
  });
};

export type ShowErrorWhenFunction = (options: {
  formIsTouched: boolean;
  formIsDirty: boolean;
  formHasError: boolean;
  fieldValue: unknown;
  fieldIsTouched: boolean;
  fieldIsDirty: boolean;
  fieldHasError: boolean;
  submissionAttempted: boolean;
}) => boolean;

const showErrorWhenDefault: ShowErrorWhenFunction = ({
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
    defaultCountry = "US",
    customElements = {},
    showRequiredAsterisk,
    showFieldErrors = "all",
    showFieldErrorWhen = showErrorWhenDefault,
  } = props;
  if (typeof jsonSchema === "boolean") {
    return null;
  }

  const { properties, required } = jsonSchema;

  if (!properties) {
    return null;
  }

  const {
    formError: FormErrorSlot = FormError,
    input: InputSlot = Input,
    fieldset: FieldsetSlot = Fieldset,
    label: LabelSlot = FieldLabel,
    description: DescriptionSlot = FieldDescription,
    fieldError: FieldErrorSlot = FieldError,
  } = customElements;

  return Object.entries(properties).map(([key, value]) => {
    if (typeof value === "boolean") {
      return null;
    }

    const input: z.JSONSchema.JSONSchema = coerceAnyOfToSingleInput(value);
    const dotPathToKey = [...pathToKey, key].join(".");

    if (input.type === "object" && input.properties) {
      const { title } = input;

      const fieldsetErrors = formState.errors
        ?.filter((issue) => issue.path.join(".") === dotPathToKey)
        .slice(0, showFieldErrors === "first" ? 1 : undefined);

      return (
        <FieldsetSlot key={key} legend={title}>
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
        </FieldsetSlot>
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
    } = input;

    const fieldIsTouched = formState.touchedFields.has(dotPathToKey);
    const fieldIsDirty = formState.dirtyFields.has(dotPathToKey);
    const fieldIsRequired = required?.includes(key) && !nullable;

    const fallbackValue = nullable ? null : "";

    const possibleValue = getNestedValueByPath(formState.data, [
      ...pathToKey,
      key,
    ]);
    const valueAtKey =
      typeof possibleValue === "string" || Array.isArray(possibleValue)
        ? possibleValue
        : fallbackValue;

    const thisFieldErrors = formState.errors
      ?.filter((issue) => issue.path.join(".") === dotPathToKey)
      .slice(0, showFieldErrors === "first" ? 1 : undefined);

    const showErrors = showFieldErrorWhen({
      formIsTouched: formState.isTouched,
      formIsDirty: formState.isDirty,
      formHasError: !!formState.errors?.length,
      fieldValue: valueAtKey,
      fieldIsTouched,
      fieldIsDirty,
      fieldHasError: !!thisFieldErrors?.length,
      submissionAttempted: formState.hasAttemptedSubmit,
    });

    const thisFieldFlattenedErrors = thisFieldErrors?.flatMap((issue) =>
      issue.code === "invalid_union" ? issue.errors.flat() : [issue]
    );

    const sharedProps: Partial<ComponentProps<typeof Input>> = {
      labelSlot: LabelSlot,
      descriptionSlot: DescriptionSlot,
      errorSlot: FieldErrorSlot,
      value: undefined,
      label: title ?? key,
      placeholder: placeholder as z.GlobalMeta["placeholder"],
      description,
      autoComplete: autoComplete as z.GlobalMeta["autoComplete"],
      inputMode: inputMode as z.GlobalMeta["inputMode"],
      required: fieldIsRequired,
      errors: showErrors ? thisFieldFlattenedErrors : undefined,
      disabled: formDisabled,
      showRequiredAsterisk,
      onChange: (e) =>
        setFormState((prev) => {
          const newData: typeof prev.data = setNestedValueByPath(
            prev.data,
            [...pathToKey, key],
            e.target.value.length > 0 ? e.target.value : fallbackValue
          );
          return {
            ...prev,
            data: newData,
            errors: z.safeParse(schema, newData).error?.issues ?? null,
            dirtyFields: prev.dirtyFields.add(dotPathToKey),
            isDirty: true,
          };
        }),
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
      "aria-required": fieldIsRequired,
      "aria-invalid": showErrors && !!thisFieldFlattenedErrors?.length,
      "data-dirty": boolAttribute(fieldIsDirty),
      "data-error": boolAttribute(!!thisFieldFlattenedErrors?.length),
      "data-touched": boolAttribute(fieldIsTouched),
    };

    if (type === "string") {
      if (input.enum) {
        const { enumLabels, inputType } = input;

        if (inputType === "radio") {
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

        return null;

        //   return (
        //     <Select
        //       {...(sharedProps as Partial<ComponentProps<typeof Select>>)}
        //       key={key}
        //       options={input.enum.map((enumValue) => ({
        //         value: String(enumValue),
        //         label:
        //           (enumLabels as z.GlobalMeta["enumLabels"])?.[
        //             String(enumValue)
        //           ] ?? String(enumValue),
        //       }))}
        //     />
        //   );
      }

      const { format, inputType, pattern, minLength, maxLength } = input;

      if (inputType === "tel") {
        return (
          <InputSlot
            {...sharedProps}
            key={key}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            onChange={(e) => {
              let formattedValue = e.target.value;

              // fixes a bug when trying to backspace numbers formatted with brackets/dashes
              // if you backspace a value like "(03)", the new value is "(03"
              // which then gets formatted back to "(03)" again, making it impossible to delete
              // this removes both brackets if there isn't an opening and closing bracket present
              if (
                e.target.value.includes("(") &&
                !e.target.value.includes(")")
              ) {
                formattedValue = e.target.value;
              } else {
                formattedValue = new AsYouType(defaultCountry).input(
                  e.target.value
                );
              }

              e.target.value = formattedValue;
              sharedProps.onChange?.(e);
            }}
          />
        );
      }

      if (inputType === "date") {
        return <InputSlot {...sharedProps} key={key} type="date" />;
      }

      return (
        <InputSlot
          {...sharedProps}
          inputMode={
            sharedProps.inputMode ??
            (format === "email" ? "email" : format === "uri" ? "url" : "text")
          }
          key={key}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          type={
            inputType === "password" || inputType === "password-with-strength"
              ? "password"
              : format === "email"
              ? "email"
              : "text"
          }
        />
      );
    }

    if (type === "number" || type === "integer") {
      const { minimum, maximum } = input;

      return (
        <InputSlot
          {...sharedProps}
          inputMode={sharedProps.inputMode ?? "numeric"}
          key={key}
          max={maximum}
          min={minimum}
          type="number"
        />
      );
    }

    throw new Error(
      `Unsupported input type detected (${type} with custom format ${input.inputType}). Cannot automatically generate an input for the provided schema.`
    );
  });
};
