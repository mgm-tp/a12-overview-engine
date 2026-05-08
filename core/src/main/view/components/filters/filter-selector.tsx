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

import * as React from "react";
import { sortBy } from "lodash-es";

import { type FilterSelectorTemplateProps } from "@com.mgmtp.a12.widgets/widgets-core";

import { useIdGenerator } from "../../utils.js";
import { type OverviewEngineApi } from "../../api.js";
import { UiStateSelector } from "../../../store/index.js";
import { FilterContext } from "../../context/filter-context.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../services/localization/index.js";
import { useClearMultiSelectionDialogVisible } from "../multi-selection/clear-multi-selection-dialog.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { Filter, type FilterOptionsView } from "./filter-options-view.js";
import { FilterOptionsViewRouter } from "./filter-options-view-router.js";
import { FilterSelectorApplyFooter } from "./filter-selector-apply-footer.js";
import { EmptyFilterOptionsView } from "./options-views/empty-filter-options-view.js";
import {
	toFilterMap,
	getFilterIds,
	getActiveFilters,
	getFiltersInList,
	toggleFilterInList,
	getFiltersNotInList,
	noFilterItemSelected,
	useExcludedFilterIds,
	hasFilterItemSelected,
	useFilterOptionsTextBuilder
} from "./utils.js";

type UiValueType = FilterOptionsView.UiValueType;

export namespace FilterSelector {
	export interface Props extends Filter.PropsType, Filter.FilterListPropType {
		open: boolean;
		currentFilterId?: string;
		filters: Filter.FilterData[];
		onVisibilityChange?(isVisible: boolean): void;
		toggleFilterBar?(isVisible?: boolean): void;
		referenceElement?: HTMLElement | null;
		sectionData?: Filter.SectionData[];
	}
}

/** @internal */
export const FilterSelector: React.FC<FilterSelector.Props> = React.memo(function FilterSelector(props) {
	const [filters, setFilters] = React.useState<Filter.FilterData[]>(props.filters);
	const [currentFilterId, setCurrentFilterId] = React.useState<string | undefined>(props.currentFilterId);
	const [searchParam, setSearchParam] = React.useState<string>("");
	const [showSearchBar, setShowSearchBar] = React.useState<boolean | undefined>(undefined);
	const [showDialog, setShowDialog] = React.useState<boolean>(false);
	const { onVisibilityChange, toggleFilterBar, onFilterChange, sectionData } = props;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const FilterSelectorWidget = useOverviewEngineContext((context) => context.widgetMap.FilterSelector);
	const FilterSelectorMobile = useOverviewEngineContext((context) => context.widgetMap.FilterSelectorMobile);
	const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);
	const ClearMultiSelectionDialog = useOverviewEngineContext(
		(context) => context.componentMap.ClearMultiSelectionDialog
	);

	const excludedFilterIds = useExcludedFilterIds();

	// Get active filter ids from props, only change activeFilters once the Apply button is triggered
	const activeFilterIds = React.useMemo(
		() => getFilterIds(getActiveFilters(props.filters, excludedFilterIds)),
		[excludedFilterIds, props.filters]
	);

	const activeFilters: Filter.FilterData[] = React.useMemo(
		() => (!sectionData?.length ? getFiltersInList(filters, activeFilterIds, excludedFilterIds) : []),
		[activeFilterIds, excludedFilterIds, filters, sectionData?.length]
	);
	const inactiveFilters = useInactiveFilters(
		filters,
		activeFilterIds,
		excludedFilterIds,
		sectionData || [],
		searchParam
	);
	const uiId = useIdGenerator()({ id: "filter-selector" });

	const handleFilterToggle = React.useCallback(
		(id: string): void => {
			setFilters(toggleFilterInList(id, filters));
			setCurrentFilterId(id);
		},
		[filters]
	);

	const handleFilterClick = React.useCallback(
		(id: string) => {
			setCurrentFilterId(currentFilterId === id ? undefined : id);
		},
		[currentFilterId]
	);

	const handleVisibilityChange = React.useCallback(
		(isVisible: boolean): void => {
			onVisibilityChange?.(isVisible);
		},
		[onVisibilityChange]
	);

	const shouldShowClearMultiSelectionDialog = useClearMultiSelectionDialogVisible();

	const handleApply = React.useCallback(() => {
		if (filters.some((f) => f.active && f.filterOptions?.error)) {
			return;
		}

		if (!showDialog && shouldShowClearMultiSelectionDialog) {
			setShowDialog(true);

			return;
		}

		onMultiSelectionClear?.();
		handleVisibilityChange(false);

		const newActiveFilters = getActiveFilters(filters);

		if (newActiveFilters.length > 0) {
			toggleFilterBar?.(true);
		}

		onFilterChange(toFilterMap(newActiveFilters));
	}, [
		filters,
		handleVisibilityChange,
		onFilterChange,
		onMultiSelectionClear,
		shouldShowClearMultiSelectionDialog,
		showDialog,
		toggleFilterBar
	]);

	const { searchFilterLabel } = useLocalizedTexts();
	const buildFilterOption = useRenderFilterOption(filters);
	const handleRenderFilterView = useRenderFilterView(filters, setFilters);
	const footer = useFooter(handleVisibilityChange, handleApply);
	const actionElement = useActionElement(filters, setFilters);
	const getShownFilters = useShownFiltersGetter(filters, searchParam);
	const primaryContentProps = usePrimaryContentProps(
		filters,
		setFilters,
		setShowSearchBar,
		getShownFilters,
		showSearchBar
	);

	if (!props.open) {
		return null;
	}

	return smallView ? (
		<FilterContext.Provider value={{ filters }}>
			<FilterSelectorMobile
				currentFilterId={currentFilterId}
				activeFilters={getShownFilters(activeFilters)}
				inactiveFilters={inactiveFilters}
				onFilterToggle={handleFilterToggle}
				onFilterClick={handleFilterClick}
				onSearchChange={setSearchParam}
				renderFilterView={currentFilterId ? handleRenderFilterView : undefined}
				primaryContentProps={primaryContentProps}
				footerContent={footer}
				inputPlaceholder={searchFilterLabel}
				hideSearchBar={!showSearchBar}
				renderFilterOptions={buildFilterOption}
				id={uiId}
			/>
		</FilterContext.Provider>
	) : (
		<FilterContext.Provider value={{ filters }}>
			{props.referenceElement && (
				<FilterSelectorWidget
					onVisibilityChange={handleVisibilityChange}
					referenceElement={props.referenceElement}
					activeFilters={getShownFilters(activeFilters)}
					inactiveFilters={inactiveFilters}
					renderFilterView={handleRenderFilterView}
					onFilterToggle={handleFilterToggle}
					onSearchChange={setSearchParam}
					primaryContentProps={primaryContentProps}
					inputPlaceholder={searchFilterLabel}
					actionElement={actionElement}
					closeOnEsc={true}
					disabled={disabled}
					footerContent={footer}
					renderFilterOptions={buildFilterOption}
					id={uiId}
				/>
			)}
			{showDialog && <ClearMultiSelectionDialog onConfirm={handleApply} onCancel={() => setShowDialog(false)} />}
		</FilterContext.Provider>
	);
});

function useInactiveFilters(
	filters: Filter.FilterData[],
	activeFilterIds: string[],
	excludedFilterIds: string[],
	sectionData: Filter.SectionData[],
	searchParam: string
): Filter.Filters {
	const otherSectionId = useIdGenerator()({ id: "filter-section-other" });
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const inactiveFilters = React.useMemo(
		() => getFiltersNotInList(filters, sectionData.length === 0 ? activeFilterIds : [], excludedFilterIds),
		[activeFilterIds, excludedFilterIds, filters, sectionData.length]
	);

	return React.useMemo(() => {
		const searchText = searchParam.trim().toLowerCase();

		// If SectionData is defined, all filters should be grouped by sections, otherwise filters would be displayed independently
		if (!sectionData.length) {
			return searchText
				? inactiveFilters.filter(({ label }) => typeof label === "string" && label.toLowerCase().includes(searchText))
				: inactiveFilters;
		}

		let inactiveSectionIds: string[] = [];
		const inactiveSection: Filter.SectionData[] = sectionData.map((section) => {
			const sectionFilters = getFiltersInList(inactiveFilters, getFilterIds(section.filters));
			inactiveSectionIds = inactiveSectionIds.concat(getFilterIds(sectionFilters));

			return {
				...section,
				filters: sortBy(sectionFilters, (filter) => !activeFilterIds.includes(filter.id))
			};
		});

		const inactiveSectionFilters: Filter.Filters = [
			...inactiveSection,
			{
				id: otherSectionId,
				label: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.section.other),
				filters: sortBy(
					getFiltersNotInList(inactiveFilters, inactiveSectionIds, excludedFilterIds),
					(filter) => !activeFilterIds.includes(filter.id)
				)
			}
		];

		if (searchText) {
			return inactiveSectionFilters.map((filter) => {
				if (Filter.SectionData.isAssignableFrom(filter)) {
					return {
						...filter,
						filters: filter.filters.filter(
							({ label }) => typeof label === "string" && label.toLowerCase().includes(searchText)
						)
					};
				}

				return filter;
			});
		}

		return inactiveSectionFilters;
	}, [
		activeFilterIds,
		excludedFilterIds,
		inactiveFilters,
		localizedResource,
		otherSectionId,
		searchParam,
		sectionData
	]);
}

function useRenderFilterOption(filters: Filter.FilterData[]) {
	const buildFilterOptionsText = useFilterOptionsTextBuilder(filters);

	return React.useCallback(
		(filterData: Filter.FilterData) => (filterData.active ? buildFilterOptionsText(filterData) : null),
		[buildFilterOptionsText]
	);
}

function useRenderFilterView(
	filters: Filter.FilterData[],
	setFilters: (callback: (filters: Filter.FilterData[]) => Filter.FilterData[]) => void
) {
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);

	const { errorIconTitle } = useLocalizedTexts();

	const setFilterState = React.useCallback(
		(id: string, filterOptions: OverviewEngineApi.Filter.Options, uiValue: UiValueType): void => {
			const mapFilterData = (filter: Filter.FilterData) => {
				if (filter.id !== id) {
					return filter;
				}

				return {
					...filter,
					active:
						filter.active ||
						filterOptions.error ||
						filterOptions.criteria !== undefined ||
						!!filterOptions.undefinedMatch,
					filterOptions,
					uiValue,
					meta: filterOptions.error && (
						<Icon variant="error" iconTheme="custom" title={errorIconTitle}>
							error
						</Icon>
					)
				};
			};

			setFilters((filters) => filters.map(mapFilterData));
		},
		[Icon, errorIconTitle, setFilters]
	);

	return React.useCallback(
		(id?: string): React.ReactNode => {
			if (id === undefined) {
				return <EmptyFilterOptionsView ariaLevel={2} />;
			}

			return (
				<FilterOptionsViewRouter
					id={id}
					onSetFilterState={setFilterState}
					filterData={filters.find((filter) => filter.id === id)}
				/>
			);
		},
		[filters, setFilterState]
	);
}

function useActionElement(
	filters: Filter.FilterData[],
	setFilters: React.Dispatch<React.SetStateAction<Filter.FilterData[]>>
): React.ReactNode {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const FilterSelectorTemplateActionElement = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateActionElement
	);
	const CheckboxIndeterminate = useOverviewEngineContext((context) => context.widgetMap.CheckboxIndeterminate);

	const { selectDeselectAllCheckboxLabel } = useLocalizedTexts();

	const handleActiveFiltersToggle = useHandleFiltersToggle(setFilters);

	return React.useMemo(
		() => (
			<FilterSelectorTemplateActionElement>
				<CheckboxIndeterminate
					label={selectDeselectAllCheckboxLabel}
					disabled={disabled}
					checked={noFilterItemSelected(filters) ? false : hasFilterItemSelected(filters) ? "mixed" : true}
					onChange={handleActiveFiltersToggle}
				/>
			</FilterSelectorTemplateActionElement>
		),
		[
			CheckboxIndeterminate,
			FilterSelectorTemplateActionElement,
			disabled,
			filters,
			handleActiveFiltersToggle,
			selectDeselectAllCheckboxLabel
		]
	);
}

function useFooter(handleVisibilityChange: (isVisible: boolean) => void, handleApply: () => void): React.ReactNode {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const { filterLabel, cancelLabel } = useLocalizedTexts();

	return React.useMemo(
		() => (
			<FilterSelectorApplyFooter
				applyLabel={filterLabel}
				closeLabel={smallView ? cancelLabel : undefined}
				onClose={smallView ? handleVisibilityChange : undefined}
				onApply={handleApply}
			/>
		),
		[cancelLabel, filterLabel, handleApply, handleVisibilityChange, smallView]
	);
}

function usePrimaryContentProps(
	filters: Filter.FilterData[],
	setFilters: React.Dispatch<React.SetStateAction<Filter.FilterData[]>>,
	setShowSearchBar: (showSearchBar?: boolean) => void,
	getShownFilters: (filters: Filter.Filters) => Filter.Filters,
	showSearchBar?: boolean
): FilterSelectorTemplateProps.ContentProps & { ariaLabelledby?: string } {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const Title = useOverviewEngineContext((context) => context.widgetMap.Title);
	const HeadingAddon = useOverviewEngineContext((context) => context.widgetMap.HeadingAddon);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
	const PopUpMenu = useOverviewEngineContext((context) => context.widgetMap.PopUpMenu);
	const Message = useOverviewEngineContext((context) => context.widgetMap.Message);
	const { filterSelectorTitle, selectAllLabel, clearAllLabel, noFilterFoundLabel } = useLocalizedTexts();

	const toggleSearchBar = React.useCallback(() => {
		setShowSearchBar(!showSearchBar);
	}, [setShowSearchBar, showSearchBar]);

	const handleActiveFiltersToggle = useHandleFiltersToggle(setFilters);

	return React.useMemo(
		() => ({
			headingElements: <Title text={filterSelectorTitle} id="header-filter-left" ariaLevel={2} />,
			ariaLabelledby: "header-filter-left",
			headingButtons: smallView && (
				<>
					<HeadingAddon>
						<Button invert active={showSearchBar} onClick={toggleSearchBar} icon={<Icon>search</Icon>} />
					</HeadingAddon>
					<HeadingAddon>
						<PopUpMenu disabled={disabled}>
							<Button
								disabled={!hasFilterItemSelected(filters)}
								onClick={() => handleActiveFiltersToggle(true)}
								label={selectAllLabel}
							/>
							<Button
								destructive
								disabled={!filters.some((filter) => filter.active)}
								onClick={() => handleActiveFiltersToggle(false)}
								label={clearAllLabel}
							/>
						</PopUpMenu>
					</HeadingAddon>
				</>
			),
			children: getShownFilters(filters).length === 0 ? <Message>{noFilterFoundLabel}</Message> : null
		}),
		[
			Button,
			HeadingAddon,
			Icon,
			Message,
			PopUpMenu,
			Title,
			clearAllLabel,
			disabled,
			filterSelectorTitle,
			filters,
			handleActiveFiltersToggle,
			getShownFilters,
			noFilterFoundLabel,
			selectAllLabel,
			showSearchBar,
			smallView,
			toggleSearchBar
		]
	);
}

function useShownFiltersGetter(filters: Filter.FilterData[], searchParam: string) {
	return React.useCallback(
		(filters: Filter.Filters): Filter.Filters => {
			return filters.filter(
				(filter) => searchParam === "" || (filter.label as string).toLowerCase().includes(searchParam.toLowerCase())
			);
		},
		[searchParam]
	);
}

function useHandleFiltersToggle(setFilters: React.Dispatch<React.SetStateAction<Filter.FilterData[]>>) {
	const mapFiltersToggle = React.useCallback(
		(filters: Filter.FilterData[], checked: boolean) =>
			filters.map((filter) =>
				filter.active !== checked ? { ...filter, active: filter.nonRemovable ? true : checked } : filter
			),
		[]
	);

	return React.useCallback(
		(checked: boolean): void => {
			setFilters((filters) => mapFiltersToggle(filters, checked));
		},
		[mapFiltersToggle, setFilters]
	);
}

function useLocalizedTexts() {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() => ({
			cancelLabel: localizedResource(RESOURCE_KEYS.overviewEngine.searchFooter.cancelLabel),
			filterLabel: localizedResource(RESOURCE_KEYS.overviewEngine.searchFooter.filterLabel),
			clearAllLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.clearAll),
			filterSelectorTitle: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.title),
			selectAllLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.selectAll),
			noFilterFoundLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.noFilterFound),
			searchFilterLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.searchFilter),
			errorIconTitle: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.errorIconTitle),
			selectDeselectAllCheckboxLabel: localizedResource(
				RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
			)
		}),
		[localizedResource]
	);
}
