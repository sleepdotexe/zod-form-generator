import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ClassValue } from 'clsx';
import type * as z from 'zod/v4/core';
import type { DeepNullable, DeepPartial } from './types';

export const boolAttribute = (bool: boolean) => (bool ? '' : undefined);

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const mergeDeep = <T extends object>(
  source: DeepNullable<T>,
  ...objects: DeepPartial<DeepNullable<T>>[]
): DeepNullable<T> => {
  const isObject = (obj: unknown) => obj && typeof obj === 'object';

  const output = objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key as keyof typeof prev] as DeepNullable<T>;
      const oVal = obj[key as keyof typeof obj] as DeepNullable<T>;

      if (isObject(pVal) && isObject(oVal)) {
        prev[key as keyof typeof prev] = mergeDeep(
          pVal,
          oVal
        ) as (typeof prev)[keyof typeof prev];
      } else {
        prev[key as keyof typeof prev] = oVal as (typeof prev)[keyof typeof prev];
      }
    });

    return prev;
  }, source);

  return output as DeepNullable<T>;
};

export const getNestedValueByPath = (object: object, pathKeys: string[]): unknown => {
  let current = object;

  for (const key of pathKeys) {
    if (current === null || current === undefined || !Object.hasOwn(current, key)) {
      return undefined;
    }

    current = current[key as keyof typeof current];
  }

  return current;
};

export const setNestedValueByPath = <T extends object>(
  object: T,
  pathKeys: string[],
  value: unknown
): T => {
  if (pathKeys.length === 0) {
    return object;
  }

  const [first, ...rest] = pathKeys;
  if (!first) {
    return object;
  }

  if (rest.length === 0) {
    return {
      ...object,
      [first]: value,
    };
  }

  return {
    ...object,
    [first]: setNestedValueByPath(
      object[first as keyof typeof object] ?? {},
      rest,
      value
    ),
  };
};

export const coerceAnyOfToSingleInput = (
  schema: z.JSONSchema.JSONSchema
): z.JSONSchema.JSONSchema => {
  const { anyOf, ...metadata } = schema;

  if (!anyOf) {
    return schema;
  }

  const flattenedTypes = anyOf.flatMap((e) => (e.anyOf ? e.anyOf : [e]));
  const nonNullTypes = flattenedTypes.filter((e) => e.type !== 'null');
  metadata.nullable = flattenedTypes.some((e) => e.type === 'null');

  if (nonNullTypes.length === 1 && nonNullTypes[0]) {
    return {
      ...metadata,
      ...nonNullTypes[0],
    };
  }

  if (nonNullTypes.every((e) => e.type === 'string')) {
    const hasMixedFormats = nonNullTypes.some(
      (e) => e.format !== nonNullTypes[0]?.format
    );

    const hasEnumsAndNonEnums =
      nonNullTypes.some((e) => e.enum) && !nonNullTypes.every((e) => e.enum);

    if (hasMixedFormats || hasEnumsAndNonEnums) {
      throw new Error(
        'Cannot automatically generate an input for a schema with mixed formats. Please check your union types do not have mixed formats (eg. email and strings, enums and non-enums, etc).'
      );
    }

    const format = nonNullTypes[0]?.format;

    if (nonNullTypes.every((e) => e.enum)) {
      return {
        ...metadata,
        type: 'string',
        format,
        enum: nonNullTypes.flatMap((e) => e.enum ?? []),
      };
    }

    return {
      ...metadata,
      type: 'string',
      format,
      minLength: nonNullTypes.sort((a, b) => (a.minLength ?? 0) - (b.minLength ?? 0))[0]
        ?.minLength,
      maxLength: nonNullTypes.sort(
        (a, b) => (b.maxLength ?? Infinity) - (a.maxLength ?? Infinity)
      )[0]?.maxLength,
    };
  }

  if (nonNullTypes.every((e) => e.type === 'number' || e.type === 'integer')) {
    return {
      ...metadata,
      type: 'number',
      minimum: nonNullTypes.sort((a, b) => (a.minimum ?? 0) - (b.minimum ?? 0))[0]
        ?.minimum,
      maximum: nonNullTypes.sort(
        (a, b) => (b.maximum ?? Infinity) - (a.maximum ?? Infinity)
      )[0]?.maximum,
    };
  }

  throw new Error(
    'Unsupported anyOf schema detected. Cannot automatically generate an input for the provided schema.'
  );
};
