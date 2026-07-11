/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as config from "../config.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_outreach from "../lib/outreach.js";
import type * as lib_scout from "../lib/scout.js";
import type * as lib_strategy from "../lib/strategy.js";
import type * as observability from "../observability.js";
import type * as outreach from "../outreach.js";
import type * as payments from "../payments.js";
import type * as pipeline from "../pipeline.js";
import type * as scout from "../scout.js";
import type * as strategy from "../strategy.js";
import type * as voice from "../voice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  config: typeof config;
  http: typeof http;
  leads: typeof leads;
  "lib/openai": typeof lib_openai;
  "lib/outreach": typeof lib_outreach;
  "lib/scout": typeof lib_scout;
  "lib/strategy": typeof lib_strategy;
  observability: typeof observability;
  outreach: typeof outreach;
  payments: typeof payments;
  pipeline: typeof pipeline;
  scout: typeof scout;
  strategy: typeof strategy;
  voice: typeof voice;
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
