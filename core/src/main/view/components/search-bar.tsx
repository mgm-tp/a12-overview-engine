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

import React from "react";

import { TextField } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../services/localization/index.js";
import { UiStateSelector } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";
import { LocalizerHooks } from "../hooks/localizer-hooks.js";
import { useMinSearchTokenSize, minSearchTokenSizeHint } from "../hooks/use-search-token-validation.js";
import { useIdGenerator } from "../utils.js";

import { useClearMultiSelectionDialogVisible } from "./multi-selection/clear-multi-selection-dialog.js";

export const SearchBar: React.ComponentType<SearchBar.PropsType> = React.memo(function SearchBar({ fitToParent }) {
	const storeSearchString = useOverviewEngineState(UiStateSelector.searchString());
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const ClearMultiSelectionDialog = useOverviewEngineContext(
		(context) => context.componentMap.ClearMultiSelectionDialog
	);
	const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const onSearch = useOverviewEngineContext((context) => context.eventHandlers.onSearch);
	const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);

	const [showDialog, setShowDialog] = React.useState(false);
	const [searchString, setSearchString] = React.useState(storeSearchString ?? "");

	React.useEffect(() => {
		setSearchString(storeSearchString ?? "");
	}, [storeSearchString]);

	const minSearchableTokenSize = useMinSearchTokenSize();
	const disabledSearch = React.useMemo(() => {
		if (minSearchableTokenSize === undefined || searchString.length === 0) {
			return false;
		}

		return searchString.length < minSearchableTokenSize;
	}, [minSearchableTokenSize, searchString]);

	const shouldShowClearMultiSelectionDialog = useClearMultiSelectionDialogVisible();

	const searchInputRef = React.useRef<HTMLElement | null>(null);

	const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchString(event.target.value);
	}, []);

	const handleSearch = React.useCallback(
		(value: string) => {
			if (!showDialog && shouldShowClearMultiSelectionDialog) {
				setSearchString(value);
				setShowDialog(true);

				return;
			}

			setSearchString(value);
			onMultiSelectionClear?.();
			onSearch?.(value);
		},
		[showDialog, shouldShowClearMultiSelectionDialog, onSearch, onMultiSelectionClear]
	);

	const onInputKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter" && !disabledSearch) {
				handleSearch(event.currentTarget.value);
			}
		},
		[handleSearch, disabledSearch]
	);

	const resetSearch = React.useCallback(() => {
		handleSearch("");
		searchInputRef.current?.focus();
	}, [handleSearch]);

	const onConfirmClearMultiSelectDialog = React.useCallback(() => {
		handleSearch(searchString);
		setShowDialog(false);
	}, [handleSearch, searchString]);

	const onCancelClearMultiSelectDialog = React.useCallback(() => {
		setShowDialog(false);
	}, []);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const [resetSearchTitle, placeholder, searchButtonTitle] = React.useMemo(
		() => [
			localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.resetSearch),
			localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.placeholder),
			localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.searchButtonTitle)
		],
		[localizedResource]
	);

	const searchButtonTitleWithRequirement = React.useMemo(() => {
		if (disabledSearch && minSearchableTokenSize !== undefined) {
			const hint = minSearchTokenSizeHint(minSearchableTokenSize);

			return localizedResource(hint.key, hint.args);
		}

		return searchButtonTitle;
	}, [disabledSearch, localizedResource, minSearchableTokenSize, searchButtonTitle]);

	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId({ id: "search-bar" }), [generateId]);

	return (
		<>
			<TextField
				id={id}
				fitToParent={!!fitToParent}
				disabled={disabled}
				suffixes={[
					searchString && (
						<Button
							title={resetSearchTitle}
							destructive={true}
							icon={<Icon>clear</Icon>}
							onClick={resetSearch}
							key="reset-search-button"
							disabled={disabled}
						/>
					),
					<Button
						title={searchButtonTitleWithRequirement}
						icon={<Icon>search</Icon>}
						onClick={() => handleSearch(searchString)}
						key="search-button"
						disabled={disabledSearch || disabled}
					/>
				]}
				value={searchString}
				onChange={handleChange}
				onKeyDown={onInputKeyDown}
				placeholder={placeholder}
				inputRef={(ref) => {
					searchInputRef.current = ref;
				}}
				role={"search"}
			/>
			{showDialog && (
				<ClearMultiSelectionDialog
					onConfirm={onConfirmClearMultiSelectDialog}
					onCancel={onCancelClearMultiSelectDialog}
				/>
			)}
		</>
	);
});

export namespace SearchBar {
	export interface PropsType {
		fitToParent?: boolean;
	}
}
