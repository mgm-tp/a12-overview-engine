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

import type { OverviewModel } from "../overview-model.js";

/**
 * Helpers for reading defaults and available options from a {@link RangeOptionConfiguration}.
 *
 * @internal
 */
export namespace ListOptionConfigurationUtils {
	/**
	 * Default range option. Skips entries with `enabled === false`. Falls back to the first
	 * enabled option when no entry is marked `default: true`, ensuring the chosen value is
	 * always present and active in `config`.
	 */
	export function getDefaultOption<Option>(
		config: ReadonlyArray<{ readonly option: Option; readonly default?: boolean; readonly enabled: boolean }>
	): Option {
		const enabledOptions = config.filter((option) => option.enabled);
		const defaultOption = enabledOptions.find((option) => option.default);

		return defaultOption?.option ?? enabledOptions[0]?.option;
	}

	/** All available options (entries with `enabled === false` are excluded). */
	export function getAvailableOptions<Option>(
		config: ReadonlyArray<{ readonly option: Option; readonly enabled: boolean }>
	): Option[] {
		return config.flatMap((option) => (option.enabled ? option.option : []));
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isBooleanFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Boolean.Item {
	return item.type === "boolean";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isConfirmFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Confirm.Item {
	return item.type === "confirm";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isEnumerationFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Enumeration.Item {
	return item.type === "enumeration";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isMultiSelectFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.MultiSelect.Item {
	return item.type === "multi-select";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isStringFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.String.Item {
	return item.type === "string";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isNumberFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Number.Item {
	return item.type === "number";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isDateFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Date.Item {
	return item.type === "date";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isTimeFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Time.Item {
	return item.type === "time";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isDateTimeFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.DateTime.Item {
	return item.type === "dateTime";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isDateFragmentFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.DateFragment.Item {
	return item.type === "dateFragment";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isDateRangeFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.DateRange.Item {
	return item.type === "dateRange";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isCustomFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Custom.Item {
	return item.type === "custom";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function isQueryFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is OverviewModel.NewFilter.Query.Item {
	return item.type === "query";
}

/**
 * True for any field-based filter (i.e. not a Query filter).
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export function isFieldBasedFilterModelItem(
	item: OverviewModel.NewFilter.BaseItem
): item is Exclude<OverviewModel.NewFilter.Item, OverviewModel.NewFilter.Query.Item> {
	return !isQueryFilterModelItem(item);
}
