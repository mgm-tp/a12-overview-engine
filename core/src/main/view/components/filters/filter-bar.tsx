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
import { Key } from "ts-keycode-enum";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { addPrefix, getAllFocusableElements } from "@com.mgmtp.a12.widgets/widgets-core";

import { type OverviewEngineApi } from "../../api.js";
import { UiStateSelector } from "../../../store/index.js";
import { FilterContext, useFilterContext } from "../../context/filter-context.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../services/localization/index.js";
import { useOverviewEngineInternalContext } from "../../context/overview-engine-internal-context.js";
import { useClearMultiSelectionDialogVisible } from "../multi-selection/clear-multi-selection-dialog.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { FilterOptionsViewRouter } from "./filter-options-view-router.js";
import { FilterSelectorApplyFooter } from "./filter-selector-apply-footer.js";
import { type Filter, type FilterOptionsView } from "./filter-options-view.js";
import { toFilterMap, useSuffixFilterDataGetter, useFilterOptionsTextBuilder } from "./utils.js";

export namespace FilterBar {
	export interface Props extends Filter.PropsType, Filter.FilterListPropType {
		activeFilters: Filter.FilterData[];
		onEditClick?(): void;
		onClickFilter?(filter: Filter.FilterData): void;
	}
}

/** @internal */
export const FilterBar: React.FC<FilterBar.Props> = React.memo(function FilterBar(props) {
	if (props.activeFilters.length === 0) {
		return null;
	}

	return <VisibleFilterBar {...props} />;
});

const VisibleFilterBar: React.FC<FilterBar.Props> = React.memo(function VisibleFilterBar(props) {
	const { activeFilters, onFilterChange } = props;
	const storeActiveFilters = useOverviewEngineState(UiStateSelector.activeFilters());
	const [openFilters, setOpenFilters] = React.useState<Filter.FilterData[] | undefined>(undefined);
	const [openDialog, setOpenDialog] = React.useState<boolean>(false);
	const [removedFilterID, setRemovedFilterID] = React.useState<string | undefined>(undefined);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);

	const filters = useFilterContext();
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);

	const shouldShowClearMultiSelectionDialog = useClearMultiSelectionDialogVisible();

	const handleRemoveFilter = React.useCallback(
		(removedFilterId: string): void => {
			if (!openDialog && shouldShowClearMultiSelectionDialog) {
				setOpenDialog(true);
				setRemovedFilterID(removedFilterId);

				return;
			}

			onMultiSelectionClear?.();
			setOpenFilters(undefined);
			setRemovedFilterID(undefined);

			const removedFilterData = activeFilters.find((filter) => filter.id === removedFilterId);

			if (!removedFilterData) {
				throw new Error(`Could not find removed filter data with id ${removedFilterId}`);
			}

			const referenceColumn =
				referenceColumns?.[documentModelService.getByPath(removedFilterData.path, removedFilterData.modelId).id];
			let suffixFilterId: string | undefined;

			if (referenceColumn?.suffixRef) {
				const suffixRef = referenceColumn.suffixRef;
				suffixFilterId = filters.find((filter) =>
					ModelPath.equal(filter.path, documentModelService.getPathById(suffixRef, removedFilterData.modelId))
				)?.id;
			}

			const remainFilters = Object.fromEntries(
				Object.entries(storeActiveFilters ?? {}).filter(
					([filterId]) => filterId !== removedFilterId && filterId !== suffixFilterId
				)
			);

			onFilterChange(remainFilters);
		},
		[
			activeFilters,
			documentModelService,
			filters,
			onFilterChange,
			onMultiSelectionClear,
			openDialog,
			referenceColumns,
			shouldShowClearMultiSelectionDialog,
			storeActiveFilters
		]
	);

	if (smallView) {
		return <FilterBarMobileWrapper filterBarProps={props} filters={filters} handleRemoveFilter={handleRemoveFilter} />;
	}

	const filterBarWrapperProps: FilterBarWrapper.Props = {
		filterBarProps: props,
		handleRemoveFilter,
		setOpenFilters,
		setRemovedFilterID,
		openDialog,
		setOpenDialog,
		openFilters,
		filters,
		removedFilterID
	};

	return <FilterBarWrapper {...filterBarWrapperProps} />;
});

namespace FilterBarWrapper {
	export interface Props {
		filterBarProps: FilterBar.Props;
		handleRemoveFilter: (id: string) => void;
		setOpenFilters: React.Dispatch<React.SetStateAction<Filter.FilterData[] | undefined>>;
		setRemovedFilterID: (filterId?: string) => void;
		openDialog: boolean;
		setOpenDialog: (openDialog: boolean) => void;
		openFilters?: Filter.FilterData[];
		filters: Filter.FilterData[];
		removedFilterID?: string;
	}
}

const FilterBarWrapper: React.FC<FilterBarWrapper.Props> = React.memo(function FilterBarWrapper(props) {
	const { filterBarProps, handleRemoveFilter, setOpenFilters, setOpenDialog, openDialog, openFilters, filters } = props;
	const { activeFilters, onFilterChange } = filterBarProps;
	const filterPopupElement = React.useRef<HTMLElement | null | undefined>(null);
	const filterElements = React.useRef<{ [fieldPath: string]: HTMLDivElement | null }>({});

	const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);

	const getFirstFocusableElement = React.useCallback((): HTMLElement | null => {
		if (filterPopupElement.current) {
			const allFocusableElements = getAllFocusableElements(filterPopupElement.current);

			return allFocusableElements.item(0);
		}

		return null;
	}, []);

	const focusFirstElement = React.useCallback((): void => {
		getFirstFocusableElement()?.focus();
	}, [getFirstFocusableElement]);

	const handleFilterViewClose = React.useCallback(
		(isVisible: boolean) => {
			if (!isVisible && openFilters) {
				const filterRef = filterElements.current[getOpenFilter(openFilters).id];

				if (filterRef) {
					const currentFilterContent = filterRef.getElementsByClassName(addPrefix("filter__content"))[0];

					if (currentFilterContent instanceof HTMLElement) {
						currentFilterContent.focus();
					}
				}

				setOpenFilters(undefined);
			}
		},
		[filterElements, openFilters, setOpenFilters]
	);

	const shouldShowClearMultiSelectionDialog = useClearMultiSelectionDialogVisible();

	const onApplyFilter = React.useCallback(() => {
		if (!openFilters || !getOpenFilter(openFilters).filterOptions || getOpenFilter(openFilters).filterOptions?.error) {
			return;
		}

		if (!openDialog && shouldShowClearMultiSelectionDialog) {
			setOpenDialog(true);

			return;
		}

		onMultiSelectionClear?.();

		const newFilters = filters
			.map((filter) => {
				const found = openFilters.find((f) => f.id === filter.id);

				return found ?? filter;
			})
			.filter((f) => f.active);

		onFilterChange(toFilterMap(newFilters));
		handleFilterViewClose(false);
	}, [
		filters,
		handleFilterViewClose,
		onFilterChange,
		onMultiSelectionClear,
		openDialog,
		openFilters,
		setOpenDialog,
		shouldShowClearMultiSelectionDialog
	]);

	const FilterBarWidget = useOverviewEngineContext((context) => context.widgetMap.FilterBar);

	return (
		<>
			<FilterBarWidget>
				{activeFilters.map((filter) => (
					<FilterItem
						key={filter.id}
						filter={filter}
						filters={filters}
						filterElements={filterElements}
						handleRemoveFilter={handleRemoveFilter}
						setOpenFilters={setOpenFilters}
						focusFirstElement={focusFirstElement}
					/>
				))}
			</FilterBarWidget>
			<FilterOptionViewPortal
				filterBarWrapperProps={props}
				focusFirstElement={focusFirstElement}
				getFirstFocusableElement={getFirstFocusableElement}
				onApplyFilter={onApplyFilter}
				handleFilterViewClose={handleFilterViewClose}
				filterPopupElement={filterPopupElement}
				filterElements={filterElements}
			/>
			<FilterBarClearMultiSelectionDialog filterBarWrapperProps={props} onApplyFilter={onApplyFilter} />
		</>
	);
});

namespace FilterBarClearMultiSelectionDialog {
	export interface Props {
		filterBarWrapperProps: FilterBarWrapper.Props;
		onApplyFilter: () => void;
	}
}
const FilterBarClearMultiSelectionDialog: React.FC<FilterBarClearMultiSelectionDialog.Props> = React.memo(
	function FilterBarClearMultiSelectionDialog(props) {
		const { onApplyFilter, filterBarWrapperProps } = props;
		const { openDialog, setOpenDialog, removedFilterID, setRemovedFilterID, handleRemoveFilter } =
			filterBarWrapperProps;

		const ClearMultiSelectionDialog = useOverviewEngineContext(
			(context) => context.componentMap.ClearMultiSelectionDialog
		);
		const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);

		if (!openDialog) {
			return null;
		}

		return (
			<ClearMultiSelectionDialog
				onConfirm={() => {
					onMultiSelectionClear?.();
					setOpenDialog(false);

					if (removedFilterID !== undefined) {
						handleRemoveFilter(removedFilterID);
					} else {
						onApplyFilter();
					}
				}}
				onCancel={() => {
					setOpenDialog(false);
					setRemovedFilterID(undefined);
				}}
			/>
		);
	}
);

namespace FilterOptionViewPortal {
	export interface Props {
		filterBarWrapperProps: FilterBarWrapper.Props;
		focusFirstElement: () => void;
		getFirstFocusableElement: () => HTMLElement | null;
		onApplyFilter: () => void;
		handleFilterViewClose: (isVisible: boolean) => void;
		filterPopupElement: React.MutableRefObject<HTMLElement | null | undefined>;
		filterElements: React.MutableRefObject<{ [fieldPath: string]: HTMLDivElement | null }>;
	}
}
const FilterOptionViewPortal: React.FC<FilterOptionViewPortal.Props> = React.memo(
	function FilterOptionViewPortal(props) {
		const {
			onApplyFilter,
			filterElements,
			handleFilterViewClose,
			filterPopupElement,
			getFirstFocusableElement,
			focusFirstElement,
			filterBarWrapperProps
		} = props;
		const { setOpenFilters, openFilters, filterBarProps } = filterBarWrapperProps;
		const applyButtonElement = React.useRef<HTMLButtonElement | null | undefined>(null);

		const AttachedPortal = useOverviewEngineContext((context) => context.widgetMap.AttachedPortal);
		const FilterSelectorTemplate = useOverviewEngineContext((context) => context.widgetMap.FilterSelectorTemplate);

		const handleKeyDown = React.useCallback(
			(event: React.KeyboardEvent<HTMLElement>) => {
				if (event.target === applyButtonElement.current && event.keyCode === Key.Tab && !event.shiftKey) {
					event.preventDefault();
					focusFirstElement();
				} else if (event.target === getFirstFocusableElement() && event.keyCode === Key.Tab && event.shiftKey) {
					if (applyButtonElement.current) {
						event.preventDefault();
						applyButtonElement.current?.focus();
					}
				}
			},
			[focusFirstElement, getFirstFocusableElement]
		);

		const onSetFilterState = React.useCallback(
			(id: string, filterOptions: OverviewEngineApi.Filter.Options, uiValue?: FilterOptionsView.UiValueType): void => {
				setOpenFilters((openFilters) => {
					if (!openFilters) {
						return undefined;
					}

					return openFilters.map((filter) => {
						if (filter.id === id) {
							return { ...filter, filterOptions, uiValue, active: true };
						}

						return filter;
					});
				});
			},
			[setOpenFilters]
		);

		const localizedResource = LocalizerHooks.useLocalizedResource();

		if (!openFilters) {
			return null;
		}

		return (
			<AttachedPortal
				key="picker"
				referenceElement={filterElements.current[getOpenFilter(openFilters).id] ?? undefined}
				closeOnOutsideClick
				closeOnEsc
				onVisibilityChange={handleFilterViewClose}>
				<FilterSelectorTemplate
					wrapperRef={(element) => {
						filterPopupElement.current = element;
					}}
					secondaryContent={
						<FilterContext.Provider value={{ filters: openFilters }}>
							<FilterOptionsViewRouter
								{...filterBarProps}
								id={getOpenFilter(openFilters).id}
								filterData={getOpenFilter(openFilters)}
								onSetFilterState={onSetFilterState}
							/>
						</FilterContext.Provider>
					}
					footerContent={
						<FilterSelectorApplyFooter
							onApply={onApplyFilter}
							applyLabel={localizedResource(RESOURCE_KEYS.overviewEngine.searchFooter.filterLabel)}
							applyButtonRef={(element) => {
								applyButtonElement.current = element;
							}}
						/>
					}
					onKeyDown={handleKeyDown}
				/>
			</AttachedPortal>
		);
	}
);

namespace FilterItem {
	export interface Props {
		filter: Filter.FilterData;
		filters: Filter.FilterData[];
		filterElements: React.MutableRefObject<{ [fieldPath: string]: HTMLDivElement | null }>;
		handleRemoveFilter: (id: string) => void;
		setOpenFilters: (filterData?: Filter.FilterData[]) => void;
		focusFirstElement: () => void;
	}
}
const FilterItem: React.FC<FilterItem.Props> = React.memo(function FilterItem(props) {
	const { filter, filters, filterElements, setOpenFilters, handleRemoveFilter, focusFirstElement } = props;
	const FilterWidget = useOverviewEngineContext((context) => context.widgetMap.Filter);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const buildFilterOptionsText = useFilterOptionsTextBuilder(filters);

	const getSuffixFilterData = useSuffixFilterDataGetter(filters);
	const [suffixFilterData] = React.useMemo(
		() => getSuffixFilterData(filter.path, filter.modelId),
		[filter.modelId, filter.path, getSuffixFilterData]
	);

	const onClick = React.useCallback(() => {
		const nextOpenFilters = suffixFilterData ? [filter, suffixFilterData] : [filter];

		setOpenFilters(nextOpenFilters);
		setTimeout(focusFirstElement);
	}, [filter, focusFirstElement, setOpenFilters, suffixFilterData]);

	return (
		<FilterWidget
			id={filter.id}
			key={filter.id}
			name={filter.label}
			filterRef={(element) => {
				filterElements.current[filter.id] = element;
			}}
			active={
				!!filter.filterOptions?.criteria ||
				!!suffixFilterData?.filterOptions?.criteria ||
				!!filter.filterOptions?.undefinedMatch
			}
			options={filter.active ? buildFilterOptionsText(filter) : ""}
			onClose={() => handleRemoveFilter(filter.id)}
			onClick={onClick}
			nonRemovable={filter.nonRemovable}
			disabled={disabled}
		/>
	);
});

namespace FilterBarMobileWrapper {
	export interface Props {
		readonly filterBarProps: FilterBar.Props;
		readonly filters: Filter.FilterData[];
		readonly handleRemoveFilter: (id: string) => void;
	}
}
const FilterBarMobileWrapper: React.FC<FilterBarMobileWrapper.Props> = React.memo(function FilterBarMobileWrapper(
	props: FilterBarMobileWrapper.Props
) {
	const { filterBarProps, filters, handleRemoveFilter } = props;
	const { onEditClick, activeFilters, onClickFilter } = filterBarProps;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
	const Counter = useOverviewEngineContext((context) => context.widgetMap.Counter);
	const FilterWidget = useOverviewEngineContext((context) => context.widgetMap.Filter);
	const FilterBarMobileWidget = useOverviewEngineContext((context) => context.widgetMap.FilterBarMobile);

	const buildFilterOptionsText = useFilterOptionsTextBuilder(filters);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<FilterBarMobileWidget
			actions={
				<Button
					secondary
					label={localizedResource(RESOURCE_KEYS.overviewEngine.filterBar.edit)}
					onClick={onEditClick}
					disabled={disabled}
				/>
			}>
			{activeFilters.slice(0, 2).map((filter) => (
				<FilterWidget
					id={filter.id}
					active={!!filter.filterOptions?.criteria || !!filter.filterOptions?.undefinedMatch}
					name={filter.label}
					options={filter.active ? buildFilterOptionsText(filter) : ""}
					key={filter.id}
					onClose={() => handleRemoveFilter(filter.id)}
					onClick={() => {
						onClickFilter?.(filter);
					}}
					nonRemovable={filter.nonRemovable}
					disabled={disabled}
				/>
			))}
			{activeFilters.length > 2 && <Counter value={activeFilters.length - 2} overflowCount={9} />}
		</FilterBarMobileWidget>
	);
});

function getOpenFilter(filters: Filter.FilterData | Filter.FilterData[]): Filter.FilterData {
	return filters instanceof Array ? filters[0] : filters;
}
