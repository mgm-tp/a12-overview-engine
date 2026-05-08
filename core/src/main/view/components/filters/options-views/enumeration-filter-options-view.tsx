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

import { type OverviewEngineApi } from "../../../api.js";
import { UiStateSelector } from "../../../../store/index.js";
import { type FilterOptionsView } from "../filter-options-view.js";
import { DocumentModelUtils } from "../../../../models/internal/shared.js";
import { useIdGenerator, nullFistComparator, toConditionalArray } from "../../../utils.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { EmptyLabel } from "./empty-label.js";
import { useHeadingElements, useLocalizedLabels } from "./date-time-common-hooks.js";

export namespace EnumerationFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly enumerationOptions: EnumerationOption[];
		readonly uiValue?: EnumerationUiValueType;
	}

	export type EnumerationUiValueType = FilterOptionsView.UiValueType;

	/** @internal */
	export type InternalEnumerationOption = EnumerationOption | UndefinedMatchEnumerationOption;

	export interface EnumerationOption {
		readonly label: string;
		readonly value: string;
		readonly checked: boolean;
		readonly active?: boolean;
	}

	/** @internal */
	export interface UndefinedMatchEnumerationOption {
		readonly label: string;
		readonly value: null;
		readonly checked: boolean;
		readonly active?: boolean;
	}
}

/** @internal */
export const EnumerationFilterOptionsView: React.FC<EnumerationFilterOptionsView.Props> = React.memo(
	function EnumerationFilterOptionsView(props) {
		const {
			onChange,
			path,
			viewName,
			ariaLevel,
			enumerationOptions: enumProps,
			uiValue,
			modelId,
			hideEmptyValueOption
		} = props;

		const [searchParam, setSearchParam] = React.useState<string>("");
		const searchInputRef = React.useRef<HTMLElement | null>(null);

		const isEmptyActiveRef = React.useRef<boolean>(uiValue?.undefinedMatch || false);
		const emptyLabel = LocalizerHooks.useLocalizedResource()(RESOURCE_KEYS.overviewEngine.filterOptionView.null);
		const emptyOption: EnumerationFilterOptionsView.UndefinedMatchEnumerationOption = React.useMemo(
			() => ({ label: emptyLabel, value: null, checked: !!uiValue?.undefinedMatch, active: uiValue?.undefinedMatch }),
			[emptyLabel, uiValue?.undefinedMatch]
		);

		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const subDocumentModel = useOverviewEngineContext((context) =>
			context.subDocumentModels?.find((dm) => dm.header.id === modelId)
		);
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const FilterSelectorTemplateList = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateList
		);

		const sortByLocale = LocalizerHooks.useLocaleSorter();
		const sortedOptions = React.useMemo<EnumerationFilterOptionsView.InternalEnumerationOption[]>(() => {
			const filteredOptions = searchParam
				? enumProps.filter((option) => option.label.toLowerCase().includes(searchParam.toLowerCase()))
				: enumProps;

			const sortedFilterOptions = DocumentModelUtils.isAlphabeticalSortedField(subDocumentModel || documentModel, path)
				? sortByLocale(filteredOptions, ({ label }) => label)
				: filteredOptions;

			const activeOptions = sortedFilterOptions.filter((option) => option.active);
			const inactiveOptions = sortedFilterOptions.filter((option) => !option.active);

			const isEmptyInSearchResults = searchParam
				? emptyOption.label.toLowerCase().includes(searchParam.toLowerCase())
				: true;

			return [
				...toConditionalArray(!hideEmptyValueOption && isEmptyInSearchResults && isEmptyActiveRef.current, emptyOption),
				...activeOptions.sort((a, b) => nullFistComparator(a.value, b.value)),
				...toConditionalArray(
					!hideEmptyValueOption && isEmptyInSearchResults && !isEmptyActiveRef.current,
					emptyOption
				),
				...inactiveOptions.sort((a, b) => nullFistComparator(a.value, b.value))
			];
		}, [
			searchParam,
			enumProps,
			subDocumentModel,
			documentModel,
			path,
			sortByLocale,
			emptyOption,
			hideEmptyValueOption
		]);

		const triggerOnChange = React.useCallback(
			(options: EnumerationFilterOptionsView.InternalEnumerationOption[]) => {
				const selectedValues = options
					.filter((option) => option.checked && option.value !== null)
					.flatMap((option) => (option.value ? option.value : []));

				const newValues: OverviewEngineApi.Filter.EnumerationOptions = {
					filterType: "Enumeration",
					criteria: selectedValues.length > 0 ? { selectedValues } : undefined,
					modelId,
					undefinedMatch:
						!hideEmptyValueOption && options.find((option) => option.value === null)?.checked ? true : false
				};
				onChange?.(newValues, undefined);
			},
			[hideEmptyValueOption, modelId, onChange]
		);

		const onOptionValueChange = React.useCallback(
			(changedOption: EnumerationFilterOptionsView.InternalEnumerationOption) => {
				triggerOnChange(sortedOptions.map((option) => (changedOption.value === option.value ? changedOption : option)));
			},
			[sortedOptions, triggerOnChange]
		);

		return (
			<FilterSelectorTemplateContent
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useFilterSubActionBar(
					triggerOnChange,
					sortedOptions,
					searchParam,
					setSearchParam,
					searchInputRef.current
				)}
				padding={false}>
				<FilterSelectorTemplateList>
					{useFilterSelectorItems(sortedOptions, onOptionValueChange)}
				</FilterSelectorTemplateList>
			</FilterSelectorTemplateContent>
		);
	}
);

/** @internal */
type FilterSearchBehavior = {
	onSearch?(value?: string): void;
	searchButtonDisabled?: boolean;
	searchButtonTitle?: string;
};
/** @internal */
export function useFilterSubActionBar(
	triggerOnChange: (options: EnumerationFilterOptionsView.InternalEnumerationOption[]) => void,
	enumerationOptions: EnumerationFilterOptionsView.InternalEnumerationOption[],
	searchParam: string,
	setSearchParam: (searchParam: string) => void,
	searchInputRef: HTMLElement | null,
	searchBehavior?: FilterSearchBehavior
) {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorTemplateActionBar = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateActionBar
	);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const searchInput = useSearchInput(searchParam, setSearchParam, searchInputRef, undefined, searchBehavior);
	const selectAllToggleCheckbox = useSelectAllToggleCheckbox(triggerOnChange, enumerationOptions, searchParam);

	return React.useMemo(
		() =>
			!smallView ? (
				<SubActionBar>
					<FilterSelectorContentHeader actionBarElements={searchInput} actionElement={selectAllToggleCheckbox} />
				</SubActionBar>
			) : (
				<SubActionBar>
					<FilterSelectorTemplateActionBar>{searchInput}</FilterSelectorTemplateActionBar>
					{!searchParam && <FilterSelectorTemplateActionBar>{selectAllToggleCheckbox}</FilterSelectorTemplateActionBar>}
				</SubActionBar>
			),
		[
			FilterSelectorContentHeader,
			FilterSelectorTemplateActionBar,
			SubActionBar,
			searchInput,
			searchParam,
			selectAllToggleCheckbox,
			smallView
		]
	);
}

function useSelectAllToggleCheckbox(
	triggerOnChange: (options: EnumerationFilterOptionsView.InternalEnumerationOption[]) => void,
	enumerationOptions: EnumerationFilterOptionsView.InternalEnumerationOption[],
	searchParam: string
) {
	const CheckboxIndeterminate = useOverviewEngineContext((context) => context.widgetMap.CheckboxIndeterminate);

	const handleActiveOptionsToggle = React.useCallback(
		(checked: boolean): void => {
			const options = enumerationOptions.map((option) =>
				option.checked !== checked ? { ...option, checked } : option
			);
			triggerOnChange(options);
		},
		[enumerationOptions, triggerOnChange]
	);

	const getAllOptionsCheckedState = React.useMemo<boolean | "mixed">(() => {
		const checkedOptions = enumerationOptions.filter((option) => option.checked);

		if (checkedOptions.length === enumerationOptions.length && enumerationOptions.length > 0) {
			return true;
		}

		if (checkedOptions.length > 0) {
			return "mixed";
		}

		return false;
	}, [enumerationOptions]);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() => (
			<CheckboxIndeterminate
				id="select-all-toggle-check-box"
				disabled={!!searchParam}
				label={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel)}
				checked={getAllOptionsCheckedState}
				onChange={handleActiveOptionsToggle}
			/>
		),
		[CheckboxIndeterminate, getAllOptionsCheckedState, handleActiveOptionsToggle, searchParam, localizedResource]
	);
}

/** @internal */
export function useSearchInput(
	searchParam: string,
	setSearchParam: (searchParam: string) => void,
	searchInputRef: HTMLElement | null,
	id = "filter-option-enum-search",
	searchBehavior?: FilterSearchBehavior
) {
	const FilterSelectorTemplateSearchInput = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateSearchInput
	);
	const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const { valueSearchLabel } = useLocalizedLabels();
	const onSearch = searchBehavior?.onSearch;
	const isSearchButtonDisabled = disabled || searchBehavior?.searchButtonDisabled;

	const onSearchChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			setSearchParam(event.target.value);
		},
		[setSearchParam]
	);

	const onClearButtonClick = React.useCallback(() => {
		searchInputRef?.focus();
		setSearchParam("");
		onSearch?.("");
	}, [onSearch, searchInputRef, setSearchParam]);

	const onSearchKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter" && onSearch && !isSearchButtonDisabled) {
				event.preventDefault();
				onSearch();
			}
		},
		[isSearchButtonDisabled, onSearch]
	);

	const searchButton = React.useMemo(() => {
		if (!onSearch) {
			return undefined;
		}

		return (
			<Button
				title={searchBehavior?.searchButtonTitle}
				icon={<Icon>search</Icon>}
				onClick={() => onSearch()}
				disabled={isSearchButtonDisabled}
			/>
		);
	}, [Button, Icon, isSearchButtonDisabled, onSearch, searchBehavior?.searchButtonTitle]);

	return (
		<FilterSelectorTemplateSearchInput
			id={useIdGenerator()({ id })}
			placeholder={valueSearchLabel}
			onClearButtonClick={onClearButtonClick}
			inputRef={(ref) => {
				searchInputRef = ref;
			}}
			disabled={disabled}
			searchButton={searchButton}
			onKeyDown={onSearchKeyDown}
			value={searchParam}
			onChange={onSearchChange}
		/>
	);
}

/** @internal */
export function useFilterSelectorItems(
	options: EnumerationFilterOptionsView.InternalEnumerationOption[],
	onOptionValueChange: (changedOption: EnumerationFilterOptionsView.InternalEnumerationOption) => void
) {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const FilterSelectorTemplateItem = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateItem
	);
	const Checkbox = useOverviewEngineContext((context) => context.widgetMap.Checkbox);
	const Message = useOverviewEngineContext((context) => context.widgetMap.Message);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const noOptionFoundLabel = React.useMemo(
		() => localizedResource(RESOURCE_KEYS.overviewEngine.enumerationFilterOptionView.noOptionFound),
		[localizedResource]
	);
	const onToggleOption = React.useCallback(
		(selectedOption: EnumerationFilterOptionsView.InternalEnumerationOption): void => {
			onOptionValueChange({ ...selectedOption, checked: !selectedOption.checked });
		},
		[onOptionValueChange]
	);

	const generateId = useIdGenerator();

	if (options.length === 0) {
		return <Message>{noOptionFoundLabel}</Message>;
	}

	return options.map((option) => {
		return (
			<FilterSelectorTemplateItem
				key={option.value}
				onClick={(event) => {
					event.preventDefault();
					onToggleOption(option);
				}}
				readonly>
				{option.value === null ? (
					<Checkbox
						id={generateId({ id: "filter-enum", suffix: "null" })}
						disabled={disabled}
						checked={option.checked}
						onChange={() => onToggleOption(option)}
						label={<EmptyLabel>{option.label}</EmptyLabel>}
					/>
				) : (
					<Checkbox
						id={generateId({ id: "filter-enum", suffix: option.value })}
						disabled={disabled}
						checked={option.checked}
						onChange={() => onToggleOption(option)}
						label={option.label}
					/>
				)}
			</FilterSelectorTemplateItem>
		);
	});
}
