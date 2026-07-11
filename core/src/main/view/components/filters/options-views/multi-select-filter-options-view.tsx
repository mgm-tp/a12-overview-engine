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

import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";
import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";

import { UiStateSelector } from "../../../../store/index.js";
import type { FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { FilterOperation, type OverviewEngineApi } from "../../../api.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useIdGenerator, nullFistComparator, toConditionalArray } from "../../../utils.js";
import { DocumentModelUtils, MultiSelectModelUtils } from "../../../../models/internal/shared.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { EmptyLabel } from "./empty-label.js";
import { useHeadingElements } from "./date-time-common-hooks.js";
import { useSearchInput } from "./enumeration-filter-options-view.js";

export namespace MultiSelectFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		uiValue: MultiSelectUiValueType;
	}

	export interface MultiSelectUiValueType extends FilterOptionsView.UiValueType {
		readonly options: MultiSelectOption[];
		readonly operation: FilterOperation;
	}

	/** @internal */
	export type InternalMultiSelectOption = MultiSelectOption | UndefinedSelectOption;

	export interface MultiSelectOption {
		readonly label: string;
		readonly value: string;
		readonly checked: boolean;
		readonly active?: boolean;
	}

	/** @internal */
	export interface UndefinedSelectOption {
		readonly label: string;
		readonly value: null;
		readonly checked: boolean;
		readonly active?: boolean;
	}
}

/** @internal */
export const MultiSelectFilterOptionsView: React.FC<MultiSelectFilterOptionsView.Props> = React.memo(
	function MultiSelectFilterOptionsView(props) {
		const { viewName, ariaLevel, path, uiValue, onChange, modelId, hideEmptyValueOption } = props;
		const searchInputRef = React.useRef<HTMLElement | null>(null);
		const [searchParam, setSearchParam] = React.useState<string>("");
		const [isOperationPopupOpen, setOperationPopup] = React.useState<boolean>(false);

		const isEmptyActiveRef = React.useRef<boolean>(!!uiValue.undefinedMatch);

		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const FilterSelectorTemplateList = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateList
		);

		const triggerOnChange = React.useCallback(
			(uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType) => {
				const selectedValues = uiValue.options.filter((option) => option.checked).map((option) => option.value);
				const newValues: OverviewEngineApi.Filter.MultiSelectOptions =
					selectedValues.length > 0 || !!uiValue.undefinedMatch
						? {
								filterType: "MultiSelect",
								modelId,
								criteria: { operation: uiValue.operation, selectedValues },
								undefinedMatch: uiValue.undefinedMatch
							}
						: { filterType: "MultiSelect", modelId, undefinedMatch: uiValue.undefinedMatch };

				onChange?.(newValues, uiValue);
			},
			[onChange, modelId]
		);

		const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
		const sortByLocale = LocalizerHooks.useLocaleSorter();
		const emptyLabel = LocalizerHooks.useLocalizedResource()(RESOURCE_KEYS.overviewEngine.filterOptionView.null);
		const emptyOption: MultiSelectFilterOptionsView.UndefinedSelectOption = React.useMemo(
			() => ({ label: emptyLabel, value: null, checked: !!uiValue.undefinedMatch, active: !!uiValue.undefinedMatch }),
			[emptyLabel, uiValue.undefinedMatch]
		);

		const options = React.useMemo<MultiSelectFilterOptionsView.InternalMultiSelectOption[]>(() => {
			const filteredOptions = searchParam
				? uiValue.options.filter((option) => option.label.toLowerCase().includes(searchParam.toLowerCase()))
				: uiValue.options;

			const group = documentModelService.getByPath(path);

			if (!MultiSelectModelUtils.isInstance(group)) {
				throw new Error(`Invalid multi-selection group ${JSON.stringify(group)}`);
			}

			const field = MultiSelectModelUtils.getField(group);
			const fieldPath: ModelPath = [...path, { elementName: field.name }];

			const sortedFilterOptions = DocumentModelUtils.isAlphabeticalSortedField(documentModel, fieldPath)
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
			uiValue.options,
			documentModelService,
			path,
			documentModel,
			sortByLocale,
			emptyOption,
			hideEmptyValueOption
		]);

		return (
			<FilterSelectorTemplateContent
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useSubActionBar(
					triggerOnChange,
					uiValue,
					searchParam,
					setSearchParam,
					searchInputRef.current,
					isOperationPopupOpen,
					setOperationPopup
				)}
				padding={false}>
				<FilterSelectorTemplateList>
					{useFilterSelectorItems(options, triggerOnChange, uiValue)}
				</FilterSelectorTemplateList>
			</FilterSelectorTemplateContent>
		);
	}
);

function useFilterSelectorItems(
	options: MultiSelectFilterOptionsView.InternalMultiSelectOption[],
	triggerOnChange: (uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType) => void,
	uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType
) {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const FilterSelectorTemplateItem = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateItem
	);
	const Checkbox = useOverviewEngineContext((context) => context.widgetMap.Checkbox);
	const Message = useOverviewEngineContext((context) => context.widgetMap.Message);

	const handleOptionToggle = React.useCallback(
		(selectedOption: MultiSelectFilterOptionsView.InternalMultiSelectOption): void => {
			const newOptions = options.map((option) => {
				if (option.value === selectedOption.value) {
					return { ...selectedOption, checked: !selectedOption.checked };
				} else {
					return option;
				}
			});

			triggerOnChange({
				...uiValue,
				options: newOptions.filter((op) => op.value !== null),
				undefinedMatch: newOptions.find((op) => op.value === null)?.checked
			});
		},
		[options, triggerOnChange, uiValue]
	);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const generateId = useIdGenerator();

	if (options.length === 0) {
		return (
			<Message>{localizedResource(RESOURCE_KEYS.overviewEngine.enumerationFilterOptionView.noOptionFound)}</Message>
		);
	}

	return options.map((option) => {
		return (
			<FilterSelectorTemplateItem
				key={option.value}
				onClick={(event) => {
					event.preventDefault();
					handleOptionToggle(option);
				}}
				readonly>
				{option.value === null ? (
					<Checkbox
						id={generateId({ id: "multi-select-option", suffix: "null" })}
						disabled={disabled}
						checked={option.checked}
						onChange={() => handleOptionToggle(option)}
						label={<EmptyLabel>{option.label}</EmptyLabel>}
					/>
				) : (
					<Checkbox
						id={generateId({ id: "multi-select-option", suffix: option.value })}
						disabled={disabled}
						checked={option.checked}
						onChange={() => handleOptionToggle(option)}
						label={option.label}
					/>
				)}
			</FilterSelectorTemplateItem>
		);
	});
}

function useFilterOperation(
	triggerOnChange: (uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType) => void,
	uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType,
	isOperationPopupOpen: boolean,
	setOperationPopup: (isOperationPopupOpen: boolean) => void
) {
	const PopUpMenu = useOverviewEngineContext((context) => context.widgetMap.PopUpMenu);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const List = useOverviewEngineContext((context) => context.widgetMap.List);
	const ListItem = useOverviewEngineContext((context) => context.widgetMap.ListItem);
	const ListSubHeader = useOverviewEngineContext((context) => context.widgetMap.ListSubHeader);

	const { operation } = uiValue;
	const { title, orLabel, andLabel } = useLocalizedTexts();
	const icon = React.useMemo(
		() => (
			<Icon iconTheme={!isOperationPopupOpen ? "custom" : undefined}>{isOperationPopupOpen ? "close" : operation}</Icon>
		),
		[Icon, isOperationPopupOpen, operation]
	);

	const onOperationSelect = React.useCallback(
		(operation: FilterOperation) => {
			triggerOnChange({ ...uiValue, operation });
		},
		[triggerOnChange, uiValue]
	);

	return React.useMemo(
		() => (
			<PopUpMenu icon={icon} triggerButtonTitle={title} onVisibilityChange={setOperationPopup}>
				<List divider>
					<ListSubHeader fill>{title}</ListSubHeader>
					<ListItem
						text={orLabel}
						graphic={<Icon iconTheme="custom">or</Icon>}
						meta={operation === FilterOperation.OR && <Icon>check</Icon>}
						selected={operation === FilterOperation.OR}
						onClick={() => onOperationSelect(FilterOperation.OR)}
					/>
					<ListItem
						text={andLabel}
						graphic={<Icon iconTheme="custom">and</Icon>}
						meta={operation === FilterOperation.AND && <Icon>check</Icon>}
						selected={operation === FilterOperation.AND}
						onClick={() => onOperationSelect(FilterOperation.AND)}
					/>
				</List>
			</PopUpMenu>
		),
		[
			Icon,
			List,
			ListItem,
			ListSubHeader,
			PopUpMenu,
			andLabel,
			icon,
			onOperationSelect,
			operation,
			orLabel,
			setOperationPopup,
			title
		]
	);
}

function useSubActionBar(
	triggerOnChange: (uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType) => void,
	uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType,
	searchParam: string,
	setSearchParam: (searchParam: string) => void,
	searchInputRef: HTMLElement | null,
	isOperationPopupOpen: boolean,
	setOperationPopup: (isOperationPopupOpen: boolean) => void
) {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorTemplateActionBar = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateActionBar
	);

	const selectAllToggleCheckbox = useSelectAllToggleCheckbox(triggerOnChange, uiValue, searchParam);
	const searchInput = useSearchInput(searchParam, setSearchParam, searchInputRef, "filter-option-multi-select-search");
	const filterOperation = useFilterOperation(triggerOnChange, uiValue, isOperationPopupOpen, setOperationPopup);

	return React.useMemo(
		() => (
			<SubActionBar>
				<FilterSelectorTemplateActionBar>{searchInput}</FilterSelectorTemplateActionBar>
				<FilterSelectorTemplateActionBar className={addPrefix("-u-justify-between")}>
					{!smallView || !searchParam ? selectAllToggleCheckbox : <div />}
					{filterOperation}
				</FilterSelectorTemplateActionBar>
			</SubActionBar>
		),
		[
			FilterSelectorTemplateActionBar,
			SubActionBar,
			filterOperation,
			searchInput,
			searchParam,
			selectAllToggleCheckbox,
			smallView
		]
	);
}

function useSelectAllToggleCheckbox(
	triggerOnChange: (uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType) => void,
	uiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType,
	searchParam: string
) {
	const CheckboxIndeterminate = useOverviewEngineContext((context) => context.widgetMap.CheckboxIndeterminate);

	const { selectDeselectAllCheckboxLabel } = useLocalizedTexts();

	const handleActiveOptionsToggle = React.useCallback(
		(checked: boolean): void => {
			const options = uiValue.options.map((option) => (option.checked !== checked ? { ...option, checked } : option));

			triggerOnChange({ ...uiValue, options, undefinedMatch: checked || undefined });
		},
		[uiValue, triggerOnChange]
	);

	const getAllOptionsCheckedState = React.useMemo<boolean | "mixed">(() => {
		const checkedOptions = uiValue.options.filter((option) => option.checked);

		if (checkedOptions.length === uiValue.options.length) {
			return true;
		}

		if (checkedOptions.length > 0) {
			return "mixed";
		}

		return false;
	}, [uiValue.options]);

	return React.useMemo(
		() => (
			<CheckboxIndeterminate
				id="select-all-toggle-check-box"
				disabled={!!searchParam}
				label={selectDeselectAllCheckboxLabel}
				checked={getAllOptionsCheckedState}
				onChange={handleActiveOptionsToggle}
			/>
		),
		[
			CheckboxIndeterminate,
			getAllOptionsCheckedState,
			handleActiveOptionsToggle,
			searchParam,
			selectDeselectAllCheckboxLabel
		]
	);
}

function useLocalizedTexts() {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() => ({
			title: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.filterOperation.title),
			orLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.filterOperation.or),
			andLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.filterOperation.and),
			selectDeselectAllCheckboxLabel: localizedResource(
				RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
			)
		}),
		[localizedResource]
	);
}
