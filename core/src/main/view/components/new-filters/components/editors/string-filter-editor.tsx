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

import { memo, type FC, useMemo, useState, useEffect, useCallback } from "react";

import { TextField, BufferedInput, HTMLInputAdapter } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { UiStateSelector, type StringFilterState } from "../../../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import {
	useMinSearchTokenSize,
	minSearchTokenSizeHint,
	useMinSearchTokenSizeValidator
} from "../../../../hooks/use-search-token-validation.js";
import { useLocalizedLabels } from "../../../filters/options-views/date-time-common-hooks.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { MultiSelectList } from "../utilities/multi-select-list.js";

import { buildVisibleOptions, mergeHiddenSelections } from "./string-filter-editor-list-utils.js";

const WrappedTextLineStateless = BufferedInput(HTMLInputAdapter(TextField));

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface StringFilterEditorProps {
	readonly state: StringFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const StringFilterEditor: FC<StringFilterEditorProps> = memo(function StringFilterEditor({ state }) {
	const { empty, viewMode } = state.options;

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	if (viewMode === "list") {
		return <ListVariant state={state} />;
	}

	return <TextFieldVariant state={state} />;
});

const TextFieldVariant: FC<StringFilterEditorProps> = memo(function TextFieldVariant({ state }) {
	const onValueChange = useDispatchFilterOptions<StringFilterState>(state.model.id);
	const { singleInputLabel } = useLocalizedLabels();

	const { exactMatch } = state.options;
	const searchBasedMatching = exactMatch.enabled ? !exactMatch.value : false;
	const getMinTokenSizeError = useMinSearchTokenSizeValidator(searchBasedMatching);

	const currentValue = useMemo(() => state.options.criteria.value ?? "", [state.options.criteria.value]);
	const minTokenSizeError = state.options.criteria.error;

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const handleValueSubmit = useCallback(
		(value?: string) => {
			const error = getMinTokenSizeError(value);

			onValueChange({
				criteria: {
					value: value || undefined,
					error: error ? localizedResource(error.key, error.args) : undefined
				}
			});
		},
		[getMinTokenSizeError, localizedResource, onValueChange]
	);

	return (
		<WrappedTextLineStateless
			id={state.model.id}
			value={currentValue}
			onValueSubmit={handleValueSubmit}
			error={!!minTokenSizeError}
			errorMessage={minTokenSizeError}
			placeholder={singleInputLabel}
		/>
	);
});

const ListVariant: FC<StringFilterEditorProps> = memo(function ListVariant({ state }) {
	const fieldPath = state.fieldPath ?? "";
	const modelId = state.model.options.subModel;
	const onOptionsChange = useDispatchFilterOptions<StringFilterState>(state.model.id);

	const onSearchEnumeratedStringField = useOverviewEngineContext(
		(context) => context.eventHandlers.onSearchEnumeratedStringField
	);
	const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
	const fieldData = enumeratedStringFilterMap?.[fieldPath];
	const candidates = useMemo(() => fieldData?.candidates ?? [], [fieldData?.candidates]);
	const keyword = fieldData?.keyword ?? "";
	const loading = fieldData?.loading ?? false;
	const fullSize = fieldData?.fullSize;
	const hasMore = fullSize !== undefined && candidates.length < fullSize;

	const minTokenSize = useMinSearchTokenSize();

	const [searchInput, setSearchInput] = useState<string>("");

	useEffect(() => {
		onSearchEnumeratedStringField?.({ fieldPath, keyword: "", modelId });
	}, [fieldPath, modelId, onSearchEnumeratedStringField]);

	const selectedValues = state.options.selectedValues;
	const appliedSelectedValues = state.appliedOptions.selectedValues;

	const hasKeyword = keyword.length > 0;

	const options = useMemo(
		() => buildVisibleOptions(candidates, appliedSelectedValues, selectedValues, hasKeyword),
		[appliedSelectedValues, candidates, hasKeyword, selectedValues]
	);

	const handleValuesChange = useCallback(
		(values: string[]) =>
			onOptionsChange({ selectedValues: mergeHiddenSelections(selectedValues, candidates, values, hasKeyword) }),
		[candidates, hasKeyword, onOptionsChange, selectedValues]
	);

	const isBelowMinLength = minTokenSize !== undefined && searchInput.length > 0 && searchInput.length < minTokenSize;

	const handleSearchChange = useCallback((newKeyword: string) => setSearchInput(newKeyword), []);

	const handleSearchSubmit = useCallback(
		(newKeyword: string) => onSearchEnumeratedStringField?.({ fieldPath, keyword: newKeyword, modelId }),
		[fieldPath, modelId, onSearchEnumeratedStringField]
	);

	const handleLoadMore = useCallback(
		() => onSearchEnumeratedStringField?.({ fieldPath, keyword, nextPage: true, modelId }),
		[fieldPath, keyword, modelId, onSearchEnumeratedStringField]
	);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const searchButtonBaseTitle = useMemo(
		() => localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.searchButtonTitle),
		[localizedResource]
	);
	const searchButtonTitle = useMemo(() => {
		if (isBelowMinLength && minTokenSize !== undefined) {
			const hint = minSearchTokenSizeHint(minTokenSize);

			return localizedResource(hint.key, hint.args);
		}

		return searchButtonBaseTitle;
	}, [isBelowMinLength, localizedResource, minTokenSize, searchButtonBaseTitle]);

	return (
		<MultiSelectList
			id={state.model.id}
			options={options}
			onValuesChange={handleValuesChange}
			searchKeyword={searchInput}
			onSearchChange={handleSearchChange}
			onSearchSubmit={handleSearchSubmit}
			searchButtonDisabled={isBelowMinLength}
			searchButtonTitle={searchButtonTitle}
			loading={loading}
			hasMore={hasMore}
			onLoadMore={handleLoadMore}
		/>
	);
});
