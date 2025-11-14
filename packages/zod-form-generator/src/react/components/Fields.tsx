import React from "react";
import type * as z from "zod/v4/core";
import type { Component } from "../../core/types";
import { FieldDescription, FieldError, FieldLabel } from "./Structure";
import { cn } from "../../core/util";

export type BaseInputProps = {
  label?: string;
  labelSlot?: typeof FieldLabel;
  description?: string;
  descriptionSlot?: typeof FieldDescription;
  errors?: z.$ZodError["issues"];
  errorSlot?: typeof FieldError;
  showRequiredAsterisk?: boolean;
};

export const Input: Component<"input", BaseInputProps> = ({
  id: providedId,
  className,
  label,
  labelSlot: LabelSlot = FieldLabel,
  description,
  descriptionSlot: DescriptionSlot = FieldDescription,
  errors,
  errorSlot: ErrorSlot = FieldError,
  showRequiredAsterisk,
  ...props
}) => {
  const generatedId = React.useId();
  const id = providedId ?? generatedId;

  return (
    <div className="group flex flex-col gap-2">
      {(label || description) && (
        <div>
          {label && (
            <LabelSlot htmlFor={id} showRequiredAsterisk={showRequiredAsterisk}>
              {label}
            </LabelSlot>
          )}
          {description && <DescriptionSlot>{description}</DescriptionSlot>}
        </div>
      )}
      <input
        id={id}
        className={cn(
          "border border-neutral-300 dark:border-neutral-700 rounded-md px-4 py-2.5 text-sm transition-colors duration-200",
          !!errors?.length && "border-red-400 dark:border-red-700",
          className
        )}
        {...props}
      />
      {!!errors?.length && (
        <div className="flex flex-col gap-1 mb-1">
          {errors.map((error) => (
            <ErrorSlot key={error.code + error.message + error.path.join(".")}>
              {error.message}
            </ErrorSlot>
          ))}
        </div>
      )}
    </div>
  );
};
