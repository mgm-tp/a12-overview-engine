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

import { isEqual } from "lodash-es";
import { Lens as L } from "monocle-ts/lib/index.js";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { MultiSelectGroup } from "../../models/index.js";
import type { DocumentModelTypedField } from "../../models/index.js";
import type { Configurable, OverviewModel } from "../../overview-model.js";
import {
	type DocumentModelService,
	createDocumentModelService,
	type FormatTypedDateRangeType,
	type FormatTypedDateFragmentType
} from "../../models/internal/shared.js";
import {
	isDateFilterModelItem,
	isTimeFilterModelItem,
	isQueryFilterModelItem,
	isNumberFilterModelItem,
	isStringFilterModelItem,
	isBooleanFilterModelItem,
	isConfirmFilterModelItem,
	isDateTimeFilterModelItem,
	isDateRangeFilterModelItem,
	isFieldBasedFilterModelItem,
	isEnumerationFilterModelItem,
	isMultiSelectFilterModelItem,
	isDateFragmentFilterModelItem
} from "../../models/index.js";

import type { FilterStateSelectors } from "./selectors/index.js";
import { RangeCriteria, type PeriodCriteria } from "./filter-controllers/criteria.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface SelectedRange {
	readonly selectedRange: OverviewModel.NewFilter.RangeOption;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface SelectedPeriod<P> {
	readonly selectedPeriod: P;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type SelectedRangeCriteriaEntry<T> = {
	[K in OverviewModel.NewFilter.RangeOption]: {
		readonly selectedRange: K;
		readonly criteria: K extends "fromTo"
			? { from: T; to: T }
			: K extends "fromOnly"
				? { from: T }
				: K extends "toOnly"
					? { to: T }
					: K extends "exact"
						? { exact: T }
						: never;
	};
}[OverviewModel.NewFilter.RangeOption];

/**
 * A single global query-level option, layered like a per-filter option:
 * `default` is the modeled/reset value, `current` is the live (staged) edit,
 * `applied` is the committed value the UI reverts to when the Filter Selector
 * closes without an Apply all.
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export interface QueryOption<T> {
	readonly default: Configurable<T>;
	readonly current: Configurable<T>;
	readonly applied: Configurable<T>;
}

/** @internal */
export namespace QueryOption {
	/** Commit the staged edit: `applied` tracks `current` (Apply all). */
	export function commit<T>(option: QueryOption<T>): QueryOption<T> {
		return { ...option, applied: option.current };
	}

	/** Discard the staged edit: `current` reverts to `applied` (Filter Selector closed without applying). */
	export function revert<T>(option: QueryOption<T>): QueryOption<T> {
		return { ...option, current: option.applied };
	}

	/** Reset to the modeled default: both `current` and `applied` become `default`. */
	export function reset<T>(option: QueryOption<T>): QueryOption<T> {
		return { ...option, current: option.default, applied: option.default };
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface QueryOptions {
	/** Global invert (NOT) shared between the Filter Bar and the Filter Selector. */
	readonly invert: QueryOption<boolean>;
	/** Global join operator (AND/OR) across all filters, shared between FB and FS. */
	readonly joinOperator: QueryOption<"and" | "or">;
}

/** @internal */
export namespace QueryOptions {
	function map(queryOptions: QueryOptions, fn: <T>(option: QueryOption<T>) => QueryOption<T>): QueryOptions {
		return { invert: fn(queryOptions.invert), joinOperator: fn(queryOptions.joinOperator) };
	}

	function some(queryOptions: QueryOptions, fn: <T>(option: QueryOption<T>) => boolean): boolean {
		return fn(queryOptions.invert) || fn(queryOptions.joinOperator);
	}

	/** True when any query option's live `current` differs from its modeled `default` (i.e. is resettable). */
	export function isResettable(queryOptions: QueryOptions): boolean {
		return some(queryOptions, (option) => !isEqual(option.current, option.default));
	}

	/** Commit the staged edits on every query option (Apply all). */
	export function commit(queryOptions: QueryOptions): QueryOptions {
		return map(queryOptions, QueryOption.commit);
	}

	/** Discard the staged edits on every query option (Filter Selector closed without applying). */
	export function revert(queryOptions: QueryOptions): QueryOptions {
		return map(queryOptions, QueryOption.revert);
	}

	/** Reset every query option to its modeled default. */
	export function reset(queryOptions: QueryOptions): QueryOptions {
		return map(queryOptions, QueryOption.reset);
	}
}

/**
 * Runtime state of the (2.0) filter system.
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export interface FilterState {
	/** Every filter (both areas) keyed by model id. */
	readonly filters: Record<string, FilterItemState>;

	/** Hash of the applied filter-selector state; compared to the live state to enable "Apply all". */
	readonly snapshot: string;

	/** Panel-local Filter Selector options (open, search bar, view mode). */
	readonly filterSelectorOptions: FilterSelectorOptions;

	/** Global query-level options (invert, join operator) shared between the Filter Bar and the Filter Selector. */
	readonly queryOptions: QueryOptions;

	/** Filter currently being edited in a Filter Bar dropdown, or `null` when none is open. */
	readonly editingFilter: null | {
		readonly filterId: string;
		readonly options: object;
		readonly resetCounter: number;
	};

	/** Id of the filter whose settings panel is open in the Filter Selector, or `null`. */
	readonly editingFilterSettingsId: string | null;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type FilterArea = "filterBar" | "filterSelector";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterItemState<
	Definition extends OverviewModel.NewFilter.Item = OverviewModel.NewFilter.Item,
	Element extends DocumentModel.Element | undefined = DocumentModel.Element | undefined,
	Options = object,
	EffectiveOptions = object
> {
	readonly groupId: string;
	readonly model: Definition;
	readonly element: Element;
	readonly fieldPath: string | undefined;
	readonly options: Options;
	readonly initialOptions: EffectiveOptions;
	readonly appliedOptions: Options;
	readonly area: FilterArea;
	readonly collapsed: boolean;
	readonly resetCounter: number;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorOptions {
	readonly open: boolean;
	readonly searchBar: Configurable<boolean>;
	readonly showSetFiltersOnly: Configurable<boolean>;
	readonly viewMode: "overlay" | "docked" | "modal";
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DefaultFilterState: FilterState = {
	filters: {},
	snapshot: "",
	editingFilter: null,
	editingFilterSettingsId: null,
	queryOptions: {
		invert: {
			default: { enabled: true, value: false },
			current: { enabled: true, value: false },
			applied: { enabled: true, value: false }
		},
		joinOperator: {
			default: { enabled: true, value: "and" },
			current: { enabled: true, value: "and" },
			applied: { enabled: true, value: "and" }
		}
	},
	filterSelectorOptions: {
		open: false,
		searchBar: { enabled: true, value: false },
		showSetFiltersOnly: { enabled: true, value: false },
		viewMode: "overlay"
	}
};

/** @internal */
export namespace FilterStateLens {
	const stateProp = L.fromProp<FilterState>();
	const filterProp = L.fromProp<FilterItemState>();

	const queryOptionsProp = L.fromProp<QueryOptions>();
	const invertProp = L.fromProp<QueryOption<boolean>>();
	const joinOperatorProp = L.fromProp<QueryOption<"and" | "or">>();

	export const filterSelectorOptions = stateProp("filterSelectorOptions");
	export const queryOptions = stateProp("queryOptions");
	export const invertCurrent = queryOptions.compose(queryOptionsProp("invert")).compose(invertProp("current"));
	export const joinOperatorCurrent = queryOptions
		.compose(queryOptionsProp("joinOperator"))
		.compose(joinOperatorProp("current"));
	export const snapshot = stateProp("snapshot");
	export const editingFilter = stateProp("editingFilter");
	export const editingFilterSettingsId = stateProp("editingFilterSettingsId");

	export const filterById = (id: string): L<FilterState, FilterItemState> =>
		new L(
			(s) => s.filters[id],
			(a) => (s) => ({ ...s, filters: { ...s.filters, [id]: a } })
		);
	export const filterOptionsById = (id: string): L<FilterState, object> =>
		filterById(id).compose(filterProp("options"));
	export const filterAppliedOptionsById = (id: string): L<FilterState, object> =>
		filterById(id).compose(filterProp("appliedOptions"));
}

/** @internal */
export class FilterStateBuilder {
	private readonly config: OverviewModel.NewFilterConfiguration | undefined;
	private readonly documentModelService: DocumentModelService;

	constructor(
		overviewModel: OverviewModel,
		documentModel: DocumentModel,
		subDocumentModels: DocumentModel[],
		private readonly selectors: FilterStateSelectors
	) {
		this.config = overviewModel.content.configuration.newFilterConfiguration;
		this.documentModelService = createDocumentModelService(documentModel, subDocumentModels);
	}

	build(): FilterState | undefined {
		if (!this.config) {
			return undefined;
		}

		return {
			...DefaultFilterState,
			filters: this.buildFilters(),
			filterSelectorOptions: this.buildFilterSelectorOptions(),
			queryOptions: {
				invert: { default: this.config.invert, current: this.config.invert, applied: this.config.invert },
				joinOperator: {
					default: this.config.joinOperator,
					current: this.config.joinOperator,
					applied: this.config.joinOperator
				}
			}
		};
	}

	private buildFilters(): Record<string, FilterItemState> {
		const filters: Record<string, FilterItemState> = {};

		for (const filterGroup of this.config?.filterGroups ?? []) {
			for (const filterItem of filterGroup.filterItems) {
				filters[filterItem.id] = this.buildFilter(filterItem, filterGroup.id);
			}
		}

		return filters;
	}

	private buildFilterSelectorOptions(): FilterSelectorOptions {
		if (!this.config) {
			return DefaultFilterState.filterSelectorOptions;
		}

		const { filterSelector } = this.config;
		const initiallyOpen = filterSelector.viewMode !== "modal" && filterSelector.initialVisibility === "show";

		return {
			open: initiallyOpen,
			viewMode: filterSelector.viewMode,
			searchBar: filterSelector.searchBar,
			showSetFiltersOnly: filterSelector.showSetFiltersOnly
		};
	}

	private buildFilter(filterItem: OverviewModel.NewFilter.Item, groupId: string): FilterItemState {
		let element: DocumentModel.Element | undefined;
		let fieldPath: string | undefined;

		if (isFieldBasedFilterModelItem(filterItem)) {
			const modelPath = this.documentModelService.getPathById(filterItem.options.fieldId, filterItem.options.subModel);
			element = this.documentModelService.getByPath(modelPath, filterItem.options.subModel);
			fieldPath = ModelPath.toString(modelPath);
		}

		const options = this.selectors.createInitialOptions(filterItem, element);
		const initialOptions = this.selectors.toEffectiveOptions(filterItem, options);

		return {
			collapsed: filterItem.collapsed ?? false,
			model: filterItem,
			groupId,
			initialOptions,
			appliedOptions: options,
			options,
			element,
			fieldPath,
			area: filterItem.preferFilterBar ? "filterBar" : "filterSelector",
			resetCounter: 0
		};
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type NumberFilterState = NumberFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace NumberFilterState {
	export interface InputState {
		readonly input: string;
		readonly value: number | null;
		readonly error: string | null;
	}
	export const DefaultInputState: InputState = { input: "", value: null, error: null };

	export interface InputMap {
		readonly default: InputState;
	}

	export type Criteria = PeriodCriteria<"default", InputMap>;
	export const DefaultCriteria: Criteria = { default: RangeCriteria.create(DefaultInputState) };

	export interface Options
		extends OverviewModel.NewFilter.Options.Empty, OverviewModel.NewFilter.Options.Invert, SelectedRange {
		readonly criteria: Criteria;
	}

	export type EffectiveOptions = OverviewModel.NewFilter.Options.Empty &
		OverviewModel.NewFilter.Options.Invert &
		SelectedRangeCriteriaEntry<InputState>;

	export type State = FilterItemState<
		OverviewModel.NewFilter.Number.Item,
		DocumentModelTypedField<DocumentModel.NumberType>,
		Options,
		EffectiveOptions
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isNumberFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type StringFilterState = StringFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace StringFilterState {
	/** Text-field criteria with a transient, localized validation error, mirroring {@link NumberFilterState.InputState}. */
	export interface InputState {
		readonly value: string | undefined;
		readonly error?: string;
	}
	export const DefaultInputState: InputState = { value: undefined };

	export type Criteria = InputState;
	export const DefaultCriteria: Criteria = DefaultInputState;

	export type ViewMode = OverviewModel.NewFilter.String.ViewMode;
	export const DefaultViewMode: ViewMode = "textField";

	export interface Options extends OverviewModel.NewFilter.Options.Empty, OverviewModel.NewFilter.Options.Invert {
		readonly viewMode: ViewMode;
		readonly caseSensitive: Configurable<boolean>;
		readonly exactMatch: Configurable<boolean>;
		readonly criteria: Criteria;
		readonly selectedValues: readonly string[];
	}

	export type EffectiveOptions = Omit<Options, "criteria"> & {
		readonly criteria: string | undefined;
	};

	export type State = FilterItemState<
		OverviewModel.NewFilter.String.Item,
		DocumentModelTypedField<DocumentModel.StringType>,
		Options,
		EffectiveOptions
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isStringFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type ConfirmFilterState = ConfirmFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace ConfirmFilterState {
	export type Criteria = true | null;
	export const DefaultCriteria: Criteria = null;

	export interface Options extends OverviewModel.NewFilter.Options.Empty {
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.Confirm.Item,
		DocumentModelTypedField<DocumentModel.ConfirmType>,
		Options,
		Options
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isConfirmFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type BooleanFilterState = BooleanFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace BooleanFilterState {
	export type Criteria = Record<"true" | "false", boolean>;

	export interface Options extends OverviewModel.NewFilter.Options.Empty {
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.Boolean.Item,
		DocumentModelTypedField<DocumentModel.BooleanType>,
		Options,
		Options
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isBooleanFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type EnumerationFilterState = EnumerationFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace EnumerationFilterState {
	export type Criteria = string[];

	export interface Options extends OverviewModel.NewFilter.Options.Empty, OverviewModel.NewFilter.Options.Invert {
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.Enumeration.Item,
		DocumentModelTypedField<DocumentModel.EnumerationType>,
		Options,
		Options
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isEnumerationFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type MultiSelectFilterState = MultiSelectFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace MultiSelectFilterState {
	export type Criteria = string[];
	export type MatchOperator = "and" | "or";

	export interface Options extends OverviewModel.NewFilter.Options.Empty, OverviewModel.NewFilter.Options.Invert {
		readonly matchOperator: Configurable<MatchOperator>;
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<OverviewModel.NewFilter.MultiSelect.Item, MultiSelectGroup, Options, Options>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isMultiSelectFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type QueryFilterState = QueryFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace QueryFilterState {
	export interface Options {
		readonly enabled: Configurable<boolean>;
	}

	export type State = FilterItemState<OverviewModel.NewFilter.Query.Item, undefined, Options, Options>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isQueryFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type TimeFilterState = TimeFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace TimeFilterState {
	export interface InputState {
		readonly input: string;
		readonly value: Date | null;
		readonly error: string | null;
	}
	export const DefaultInputState: InputState = { input: "", value: null, error: null };

	export interface InputMap {
		readonly default: InputState;
	}

	export type Criteria = PeriodCriteria<"default", InputMap>;
	export const DefaultCriteria: Criteria = {
		default: {
			fromTo: { from: DefaultInputState, to: DefaultInputState },
			fromOnly: { from: DefaultInputState },
			toOnly: { to: DefaultInputState },
			exact: { exact: DefaultInputState }
		}
	};

	export interface Options
		extends OverviewModel.NewFilter.Options.Empty, OverviewModel.NewFilter.Options.Invert, SelectedRange {
		readonly criteria: Criteria;
	}

	export type EffectiveOptions = OverviewModel.NewFilter.Options.Empty &
		OverviewModel.NewFilter.Options.Invert &
		SelectedRangeCriteriaEntry<InputState>;

	export type State = FilterItemState<
		OverviewModel.NewFilter.Time.Item,
		DocumentModelTypedField<DocumentModel.TimeType>,
		Options,
		EffectiveOptions
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isTimeFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type DateFilterState = DateFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace DateFilterState {
	export interface DateViewInputState {
		readonly input: string;
		readonly value: Date | null;
		readonly error: string | null;
	}
	export const DefaultDateViewInputState: DateViewInputState = { input: "", value: null, error: null };

	export interface YearViewInputState {
		readonly value: number | null;
		readonly error: string | null;
	}
	export const DefaultYearViewInputState: YearViewInputState = { value: null, error: null };

	export interface YearMonthViewInputState {
		readonly value: { year: number | null; month: number | null };
		readonly error: string | null;
	}
	export const DefaultYearMonthViewInputState: YearMonthViewInputState = {
		value: { year: null, month: null },
		error: null
	};

	export interface MonthViewInputState {
		readonly value: number | null;
	}
	export const DefaultMonthViewInputState: MonthViewInputState = { value: null };

	export interface DatePeriodInputMap {
		readonly date: DateViewInputState;
		readonly year: YearViewInputState;
		readonly yearMonth: YearMonthViewInputState;
		readonly month: MonthViewInputState;
	}

	export type Criteria = PeriodCriteria<OverviewModel.NewFilter.Date.PeriodOption, DatePeriodInputMap>;

	export const DefaultCriteria: Criteria = {
		date: RangeCriteria.create(DefaultDateViewInputState),
		year: RangeCriteria.create(DefaultYearViewInputState),
		yearMonth: RangeCriteria.create(DefaultYearMonthViewInputState),
		month: RangeCriteria.create(DefaultMonthViewInputState)
	};

	interface BaseOptions
		extends
			OverviewModel.NewFilter.Options.Empty,
			OverviewModel.NewFilter.Options.Invert,
			SelectedRange,
			SelectedPeriod<OverviewModel.NewFilter.Date.PeriodOption> {}

	export interface Options extends BaseOptions {
		readonly criteria: Criteria;
	}

	export interface EffectiveOptions extends BaseOptions {
		readonly criteria: NonNullable<
			RangeCriteria<DatePeriodInputMap[OverviewModel.NewFilter.Date.PeriodOption]>[OverviewModel.NewFilter.RangeOption]
		>;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.Date.Item,
		DocumentModelTypedField<DocumentModel.DateType>,
		Options,
		EffectiveOptions
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isDateFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type DateTimeFilterState = DateTimeFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace DateTimeFilterState {
	export type TimeViewInputState = DateFilterState.DateViewInputState;
	export const DefaultTimeViewInputState: TimeViewInputState = DateFilterState.DefaultDateViewInputState;

	export type DateViewInputState = DateFilterState.DateViewInputState;
	export const DefaultDateViewInputState: DateViewInputState = DateFilterState.DefaultDateViewInputState;

	export type DateTimeViewInputState = DateFilterState.DateViewInputState;
	export const DefaultDateTimeViewInputState: DateTimeViewInputState = DateFilterState.DefaultDateViewInputState;

	export type YearViewInputState = DateFilterState.YearViewInputState;
	export const DefaultYearViewInputState: YearViewInputState = DateFilterState.DefaultYearViewInputState;

	export type YearMonthViewInputState = DateFilterState.YearMonthViewInputState;
	export const DefaultYearMonthViewInputState: YearMonthViewInputState = DateFilterState.DefaultYearMonthViewInputState;

	export interface PeriodInputMap {
		readonly date: DateViewInputState;
		readonly time: TimeViewInputState;
		readonly dateTime: DateTimeViewInputState;
		readonly year: YearViewInputState;
		readonly yearMonth: YearMonthViewInputState;
		readonly month: DateFilterState.MonthViewInputState;
	}

	export type Criteria = PeriodCriteria<OverviewModel.NewFilter.DateTime.PeriodOption, PeriodInputMap>;

	export const DefaultCriteria: Criteria = {
		time: RangeCriteria.create(DefaultTimeViewInputState),
		date: RangeCriteria.create(DefaultDateViewInputState),
		dateTime: RangeCriteria.create(DefaultDateTimeViewInputState),
		year: RangeCriteria.create(DefaultYearViewInputState),
		yearMonth: RangeCriteria.create(DefaultYearMonthViewInputState),
		month: RangeCriteria.create(DateFilterState.DefaultMonthViewInputState)
	};

	interface BaseOptions
		extends
			OverviewModel.NewFilter.Options.Empty,
			OverviewModel.NewFilter.Options.Invert,
			SelectedRange,
			SelectedPeriod<OverviewModel.NewFilter.DateTime.PeriodOption> {}

	export interface Options extends BaseOptions {
		readonly criteria: Criteria;
	}

	export interface EffectiveOptions extends BaseOptions {
		readonly criteria: NonNullable<
			RangeCriteria<PeriodInputMap[OverviewModel.NewFilter.DateTime.PeriodOption]>[OverviewModel.NewFilter.RangeOption]
		>;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.DateTime.Item,
		DocumentModelTypedField<DocumentModel.DateTimeType>,
		Options,
		EffectiveOptions
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isDateTimeFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type DateRangeFilterState = DateRangeFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace DateRangeFilterState {
	export type YearInputState = DateFragmentFilterState.YearInputState;
	export type MonthInputState = DateFragmentFilterState.MonthInputState;
	export type YearMonthInputState = DateFragmentFilterState.YearMonthInputState;
	export type MonthDayInputState = DateFragmentFilterState.MonthDayInputState;
	export type DateInputState = DateFilterState.DateViewInputState;

	export interface PeriodInputMap {
		readonly year: YearInputState;
		readonly month: MonthInputState;
		readonly yearMonth: YearMonthInputState;
		readonly date: DateInputState;
		readonly monthDay: MonthDayInputState;
	}

	export type Criteria = PeriodCriteria<OverviewModel.NewFilter.DateRange.PeriodOption, PeriodInputMap>;

	interface BaseOptions
		extends
			OverviewModel.NewFilter.Options.Empty,
			OverviewModel.NewFilter.Options.Invert,
			SelectedRange,
			SelectedPeriod<OverviewModel.NewFilter.DateRange.PeriodOption> {}

	export interface Options extends BaseOptions {
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.DateRange.Item,
		DocumentModelTypedField<FormatTypedDateRangeType>,
		Options,
		Options
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isDateRangeFilterModelItem(filterState.model);
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type DateFragmentFilterState = DateFragmentFilterState.State;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace DateFragmentFilterState {
	export interface YearMonthInputState {
		readonly value: { year: number | null; month: number | null };
		readonly error: string | null;
	}

	export interface YearInputState {
		readonly value: number | null;
		readonly error: string | null;
	}

	export interface MonthInputState {
		readonly value: number | null;
	}

	export interface MonthDayInputState {
		readonly value: { month: number; day: number } | null;
		readonly input: string;
		readonly error: string | null;
	}

	export interface PeriodInputMap {
		readonly yearMonth: YearMonthInputState;
		readonly year: YearInputState;
		readonly month: MonthInputState;
		readonly monthDay: MonthDayInputState;
	}

	export type Criteria = PeriodCriteria<OverviewModel.NewFilter.DateFragment.PeriodOption, PeriodInputMap>;

	interface BaseOptions
		extends
			OverviewModel.NewFilter.Options.Empty,
			OverviewModel.NewFilter.Options.Invert,
			SelectedRange,
			SelectedPeriod<OverviewModel.NewFilter.DateFragment.PeriodOption> {}

	export interface Options extends BaseOptions {
		readonly criteria: Criteria;
	}

	export type State = FilterItemState<
		OverviewModel.NewFilter.DateFragment.Item,
		DocumentModelTypedField<FormatTypedDateFragmentType>,
		Options,
		Options
	>;

	export function isInstance(filterState: FilterItemState): filterState is State {
		return isDateFragmentFilterModelItem(filterState.model);
	}
}
