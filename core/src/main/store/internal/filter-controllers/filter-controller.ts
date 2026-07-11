/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */

import type { Locale as DateFnsLocale } from "date-fns/locale";

import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { Localizable, LocalizableArgs } from "@com.mgmtp.a12.utils/utils-localization";
import type { DocumentModel, FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../overview-model.js";

/**
 * Date/time view kinds whose display format the engine resolves.
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export type DateTimeFormatKind = "date" | "monthYear" | "year" | "dateTime" | "time";

/**
 * Context passed to {@link FilterController.toOperator}.
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export interface FilterControllerContext {
	/** The active document model. */
	readonly documentModel: DocumentModel;

	/**
	 * Resolved document-model path of the filter's field, or `undefined` for query filters.
	 * Controllers must use this string — not `model.options.fieldId`, which is an opaque ID —
	 * when building `Query.Operator`s.
	 */
	readonly fieldPath: string;
}

/**
 * Context passed to {@link FilterController.toLabel}. Hosts pass this without `fieldPath`
 * to {@link FilterStateSelectors.toLabel}; the selector layer attaches it from the filter
 * state (empty string for query filters).
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export interface FilterLabelContext extends FilterControllerContext {
	/**
	 * Active `date-fns` locale used by resolvers that format dates via `date-fns`.
	 * Hosts wire this from the `DateTimeContext` provided by `widgets-core`.
	 */
	readonly locale: DateFnsLocale;

	/** Format a runtime value as a display string using the field's value-conversion config. */
	readonly formatValue: (params: {
		value: FieldInstanceValue | object;
		fieldPath: string;
		subModel?: string;
	}) => string;

	/** Localize a field value using the document model's labels (used by enums and multi-select). */
	readonly localizeValue: (params: {
		value: FieldInstanceValue | object;
		fieldPath: string;
		subModel?: string;
	}) => string;

	/** Localize a static resource string by key (used for built-in labels like "Enabled"). */
	readonly localizeResource: (params: { key: string; values?: LocalizableArgs }) => string;

	/** Look up an element in the document model by its path. */
	readonly getElementByPath: (params: { fieldPath: string; subModel?: string }) => DocumentModel.Element | undefined;

	/** Resolve the configured display format string for a given date/time view kind. */
	readonly getDateTimeFormat: (params: { kind: DateTimeFormatKind }) => string;
}

/**
 * Per-filter-type controller. Each filter type (string, number, enum, etc.) implements
 * this to define initialization, validation, reset, query generation, and display.
 *
 * Controllers are stateless — they receive options and return results.
 *
 * @typeParam Model - The filter model item type this controller handles (e.g. `OverviewModel.NewFilter.Boolean.Item`).
 * @typeParam RuntimeOptions - The mutable shape stored in `FilterItemState.options`, including any transient UI fields.
 * @typeParam EffectiveOptions - The stable shape used for dirty-detection and snapshot hashing. Defaults to `RuntimeOptions`.
 * @typeParam Element - The resolved `DocumentModel.Element` type (or `undefined` for query filters).
 */
/** @internal */
export interface FilterController<
	Model extends OverviewModel.NewFilter.Item,
	RuntimeOptions,
	EffectiveOptions,
	Element extends DocumentModel.Element | undefined = DocumentModel.Element | undefined
> {
	/** Returns true if this controller handles the given filter model type. */
	accept(model: OverviewModel.NewFilter.Item): boolean;

	/** Returns true if this filter type exposes user-configurable settings (empty, invert, range, …). */
	isConfigurable(model: Model): boolean;

	/** Build the initial runtime options from the model config and resolved DM element. */
	createInitialOptions(model: Model, element: Element): RuntimeOptions;

	/** Compute reset options: runtime options reverted to defaults captured at init time. */
	toResetOptions(model: Model, runtimeOptions: RuntimeOptions, defaultOptions: EffectiveOptions): RuntimeOptions;

	/** Returns true if the runtime options contain validation errors. */
	hasErrors(model: Model, runtimeOptions: RuntimeOptions): boolean;

	/**
	 * Resolve a `Localizable` for a "general" filter-level error (e.g. `start > end`) not tied
	 * to any single input segment. Returns `null` when no such error applies. Filter types
	 * without a general error category (boolean, confirm, string, enum, multi-select, query)
	 * may omit this method.
	 */
	toGeneralError?(model: Model, runtimeOptions: RuntimeOptions): Localizable | null;

	/**
	 * Strip transient/UI-only state to produce a stable shape for hash/compare.
	 * Optional — controllers without transient editor state can omit this; the selector layer
	 * falls back to the runtime options unchanged.
	 */
	toEffectiveOptions?(model: Model, runtimeOptions: RuntimeOptions): EffectiveOptions;

	/** Build a DataServices `Query.Operator`, or `undefined` when the filter has no active criteria. */
	toOperator(
		model: Model,
		runtimeOptions: RuntimeOptions,
		context: FilterControllerContext
	): Query.Operator | undefined;

	/**
	 * Build a human-readable display label for the current value.
	 * - `string` for single-value filters (e.g. `"Active"`, `"≥ 10"`).
	 * - `readonly string[]` for multi-value filters (enum/multi-select); the widget joins them.
	 * - `null` when nothing to show.
	 */
	toLabel(model: Model, runtimeOptions: RuntimeOptions, context: FilterLabelContext): string | readonly string[] | null;
}
