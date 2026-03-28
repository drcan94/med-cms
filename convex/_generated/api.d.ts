/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as audit from "../audit.js";
import type * as clinicSettings from "../clinicSettings.js";
import type * as clinicSettingsValidators from "../clinicSettingsValidators.js";
import type * as clinicalValidators from "../clinicalValidators.js";
import type * as organizations from "../organizations.js";
import type * as patientValidators from "../patientValidators.js";
import type * as patients from "../patients.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  audit: typeof audit;
  clinicSettings: typeof clinicSettings;
  clinicSettingsValidators: typeof clinicSettingsValidators;
  clinicalValidators: typeof clinicalValidators;
  organizations: typeof organizations;
  patientValidators: typeof patientValidators;
  patients: typeof patients;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
