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
import { useState } from "react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { Link, addPrefix, ProgressIndicator } from "@com.mgmtp.a12.widgets/widgets-core";

import { toConditionalArray } from "../../../utils.js";
import type { OverviewEngineApi } from "../../../api.js";
import type { FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useMinSearchTokenSize, minSearchTokenSizeHint } from "../../../hooks/use-search-token-validation.js";

import { useHeadingElements } from "./date-time-common-hooks.js";
import {
	useFilterSubActionBar,
	useFilterSelectorItems,
	type EnumerationFilterOptionsView
} from "./enumeration-filter-options-view.js";

export namespace EnumeratedStringFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType, Partial<OverviewEngineApi.EnumeratedStringFilter> {
		readonly selectedValues: string[];
		readonly activeValues: string[];
		readonly uiValue?: EnumeratedStringUiValueType;
	}

	export type EnumeratedStringUiValueType = FilterOptionsView.UiValueType;
}

/** @internal */
export const EnumeratedStringFilterOptionsView: React.FC<EnumeratedStringFilterOptionsView.Props> = React.memo(
	function EnumeratedStringFilterOptionsView(props) {
		const {
			viewName,
			ariaLevel,
			path,
			selectedValues,
			activeValues,
			candidates,
			keyword,
			onChange,
			loading,
			fullSize,
			uiValue,
			modelId,
			hideEmptyValueOption
		} = props;
		const undefinedActiveRef = React.useRef<boolean>(!!uiValue?.undefinedMatch);
		const undefinedSelected = React.useMemo(() => uiValue?.undefinedMatch ?? false, [uiValue?.undefinedMatch]);
		const [searchText, setSearchText] = React.useState<string>("");

		const minSearchableTokenSize = useMinSearchTokenSize();
		const shouldSearchDisabled = React.useCallback(
			(keyword: string) => {
				if (minSearchableTokenSize === undefined || keyword === undefined || keyword.length === 0) {
					return false;
				}

				return keyword.length < minSearchableTokenSize;
			},
			[minSearchableTokenSize]
		);

		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const FilterSelectorTemplateList = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateList
		);
		const onSearchEnumeratedStringField = useOverviewEngineContext(
			(context) => context.eventHandlers.onSearchEnumeratedStringField
		);

		const fieldPath = React.useMemo(() => ModelPath.toString(path), [path]);

		const triggerOnChange = React.useCallback(
			(selected: string[], emptySelected?: boolean) => {
				const filterOption: OverviewEngineApi.Filter.EnumeratedStringOptions = {
					filterType: "Enumeration",
					modelId: props.modelId,
					type: "EnumeratedString",
					criteria: selected.length > 0 ? { selectedValues: selected } : undefined,
					undefinedMatch: emptySelected ?? uiValue?.undefinedMatch
				};
				onChange?.(filterOption, undefined);
			},
			[onChange, props.modelId, uiValue?.undefinedMatch]
		);

		const onOverallCheckboxClick = React.useCallback(
			(newOptions: EnumerationFilterOptionsView.InternalEnumerationOption[]) => {
				const selectedStringOptions = newOptions.filter(({ value, checked }) => checked && value !== null);

				triggerOnChange(
					selectedStringOptions.flatMap(({ value }) => (value ? [value] : [])),
					hideEmptyValueOption ? undefined : newOptions.some(({ checked, value }) => checked && value === null)
				);
			},
			[hideEmptyValueOption, triggerOnChange]
		);

		const onOptionValueChange = React.useCallback(
			(changedOption: EnumerationFilterOptionsView.InternalEnumerationOption) => {
				if (changedOption.value === null) {
					return triggerOnChange(selectedValues, changedOption.checked);
				}

				const selectedStringOptions = changedOption.checked
					? [...selectedValues, changedOption.value]
					: selectedValues.filter((value) => value !== changedOption.value);

				triggerOnChange(selectedStringOptions);
			},
			[selectedValues, triggerOnChange]
		);

		const isChecked = React.useCallback(
			(value: string) => !!selectedValues.find((selectedValue) => selectedValue === value),
			[selectedValues]
		);

		const isActive = React.useCallback(
			(value: string) => !!activeValues.find((activeValue) => activeValue === value),
			[activeValues]
		);
		const localizedResource = LocalizerHooks.useLocalizedResource();
		const emptyLabel = localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.null);
		const isEmptyInSearchResults = React.useMemo(() => isInSearchResults(keyword, emptyLabel), [keyword, emptyLabel]);

		const [options, setOptions] = useState<EnumerationFilterOptionsView.InternalEnumerationOption[]>([
			...toConditionalArray(!hideEmptyValueOption && isEmptyInSearchResults, {
				value: null,
				label: emptyLabel,
				checked: undefinedSelected
			}),
			...selectedValues.map((value) => ({ value, label: value, checked: true }))
		]);

		const searchButtonBaseTitle = localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.searchButtonTitle);

		React.useEffect(() => {
			const newOptions =
				candidates?.flatMap((item) =>
					isInSearchResults(keyword, item) ? [{ value: item, label: item, checked: isChecked(item) }] : []
				) ?? [];

			setOptions([
				...toConditionalArray(!hideEmptyValueOption && isEmptyInSearchResults && undefinedActiveRef.current, {
					value: null,
					label: emptyLabel,
					checked: undefinedSelected
				}),
				...newOptions.filter((option) => isActive(option.value)),
				...toConditionalArray(!hideEmptyValueOption && isEmptyInSearchResults && !undefinedActiveRef.current, {
					value: null,
					label: emptyLabel,
					checked: undefinedSelected
				}),
				...newOptions.filter((option) => !isActive(option.value))
			]);
		}, [
			candidates,
			isChecked,
			isActive,
			emptyLabel,
			isEmptyInSearchResults,
			hideEmptyValueOption,
			undefinedSelected,
			keyword
		]);

		const onSearchInputChange = React.useCallback((value: string) => {
			setSearchText(value);
		}, []);

		const handleSearch = React.useCallback(
			(value?: string) => {
				const keywordValue = value ?? searchText;
				setSearchText(keywordValue);
				onSearchEnumeratedStringField?.({ fieldPath, keyword: keywordValue, modelId });
			},
			[fieldPath, modelId, onSearchEnumeratedStringField, searchText]
		);

		const isSearchButtonDisabled = React.useMemo(
			() => shouldSearchDisabled(searchText),
			[shouldSearchDisabled, searchText]
		);

		const resolvedSearchButtonTitle = React.useMemo(() => {
			if (isSearchButtonDisabled && minSearchableTokenSize !== undefined) {
				const hint = minSearchTokenSizeHint(minSearchableTokenSize);

				return localizedResource(hint.key, hint.args);
			}

			return searchButtonBaseTitle;
		}, [isSearchButtonDisabled, localizedResource, minSearchableTokenSize, searchButtonBaseTitle]);

		const searchInputBehavior = React.useMemo(
			() => ({
				onSearch: handleSearch,
				searchButtonDisabled: isSearchButtonDisabled,
				searchButtonTitle: resolvedSearchButtonTitle
			}),
			[handleSearch, isSearchButtonDisabled, resolvedSearchButtonTitle]
		);

		const onLoadMore = React.useCallback(
			() => onSearchEnumeratedStringField?.({ fieldPath, keyword, nextPage: true, modelId }),
			[fieldPath, keyword, modelId, onSearchEnumeratedStringField]
		);

		const needLoadMore = React.useMemo<boolean>(
			() => fullSize !== undefined && candidates !== undefined && candidates.length < fullSize,
			[candidates, fullSize]
		);

		const searchInputRef = React.useRef<HTMLInputElement | null>(null);

		React.useEffect(
			() => onSearchEnumeratedStringField?.({ fieldPath, keyword: "", modelId }),
			[fieldPath, modelId, onSearchEnumeratedStringField]
		);

		React.useEffect(() => {
			if (!keyword) {
				setSearchText("");
			}
		}, [keyword]);

		return (
			<FilterSelectorTemplateContent
				padding={false}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useFilterSubActionBar(
					onOverallCheckboxClick,
					options,
					searchText ?? "",
					onSearchInputChange,
					searchInputRef.current,
					searchInputBehavior
				)}>
				<FilterSelectorTemplateList>
					{useFilterSelectorItems(options, onOptionValueChange)}
					{needLoadMore && <LoadMoreButton onClick={onLoadMore} />}
				</FilterSelectorTemplateList>
				{loading && <ProgressIndicator />}
			</FilterSelectorTemplateContent>
		);
	}
);

namespace LoadMoreItem {
	export interface Props {
		onClick(): void;
	}
}

const LoadMoreButton: React.FC<LoadMoreItem.Props> = React.memo(function LoadMoreButton({ onClick }) {
	const FilterSelectorTemplateItem = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateItem
	);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<FilterSelectorTemplateItem className={addPrefix("-u-background-grey-light -u-items-center")} readonly>
			<Link className={addPrefix("-u-width-auto")} onClick={onClick}>
				{localizedResource(RESOURCE_KEYS.overviewEngine.enumeratedStringFilterOptionView.loadMore)}
			</Link>
		</FilterSelectorTemplateItem>
	);
});

function isInSearchResults(searchText: string | undefined, label: string): boolean {
	if (!searchText) {
		return true;
	}

	return label.toLocaleLowerCase().includes(searchText.toLowerCase());
}
