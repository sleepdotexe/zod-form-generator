import { parse } from 'date-fns';
import {
  type CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import z from 'zod/v4';
import type * as zc from 'zod/v4/core';

export const DateInput = (params?: string | zc.$ZodAnyParams) =>
  z
    .string(params)
    .refine((val) => {
      if (typeof val !== 'string') return false;

      try {
        const parsedDate = parse(val, 'yyyy-MM-dd', new Date());
        return !Number.isNaN(parsedDate.getTime());
      } catch {
        return false;
      }
    }, params)
    .transform((val) => {
      return parse(val, 'yyyy-MM-dd', new Date());
    });

export const PhoneInput = (
  countryCode: CountryCode,
  params?: string | zc.$ZodAnyParams
) =>
  z
    .string(params)
    .refine(
      (val) => typeof val === 'string' && isValidPhoneNumber(val, countryCode),
      params
    )
    .transform((val) => {
      if (typeof val !== 'string') return val;
      try {
        const parsedPhone = parsePhoneNumberWithError(val, countryCode);
        return parsedPhone.number;
      } catch {
        return val;
      }
    });
