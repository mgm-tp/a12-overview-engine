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

import { styled } from "styled-components";
import { memo, type FC, useMemo, useState, useCallback, type ChangeEvent, type KeyboardEvent } from "react";

import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";

import { Divider } from "./divider.js";
import type { FilterListOption } from "./use-organized-values.js";

export interface MultiSelectListProps {
	readonly id: string;
	readonly options: FilterListOption[];
	readonly onValuesChange: (values: string[]) => void;

	readonly searchKeyword?: string;
	readonly onSearchChange?: (keyword: string) => void;
	readonly onSearchSubmit?: (keyword: string) => void;
	readonly searchButtonDisabled?: boolean;
	readonly searchButtonTitle?: string;
	readonly loading?: boolean;
	readonly hasMore?: boolean;
	readonly onLoadMore?: () => void;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const MultiSelectList: FC<MultiSelectListProps> = memo(function MultiSelectList(props) {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const CheckboxIndeterminate = useOverviewEngineContext((c) => c.widgetMap.CheckboxIndeterminate);
	const CheckboxGroup = useOverviewEngineContext((c) => c.widgetMap.CheckboxGroup);
	const CheckboxGroupItem = useOverviewEngineContext((c) => c.widgetMap.CheckboxGroupItem);
	const FilterSelectorTemplateSearchInput = useOverviewEngineContext(
		(c) => c.widgetMap.FilterSelectorTemplateSearchInput
	);

	const {
		onValuesChange,
		options,
		searchKeyword,
		onSearchChange,
		onSearchSubmit,
		searchButtonDisabled,
		searchButtonTitle,
		loading,
		hasMore,
		onLoadMore
	} = props;
	const showSearchInput = !!onSearchChange;
	const handleSearchInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => onSearchChange?.(event.target.value),
		[onSearchChange]
	);
	const handleSearchClear = useCallback(() => {
		onSearchChange?.("");
		onSearchSubmit?.("");
	}, [onSearchChange, onSearchSubmit]);
	const handleSearchSubmit = useCallback(() => {
		if (!searchButtonDisabled) {
			onSearchSubmit?.(searchKeyword ?? "");
		}
	}, [onSearchSubmit, searchKeyword, searchButtonDisabled]);
	const handleSearchKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleSearchSubmit();
			}
		},
		[handleSearchSubmit]
	);

	const searchButtonNode = useMemo(
		() =>
			onSearchSubmit ? (
				<Button
					id={`${props.id}-search-button`}
					icon={<Icon>search</Icon>}
					onClick={handleSearchSubmit}
					disabled={searchButtonDisabled}
					title={searchButtonTitle}
					secondary
				/>
			) : undefined,
		[Button, Icon, handleSearchSubmit, onSearchSubmit, props.id, searchButtonDisabled, searchButtonTitle]
	);

	const [expanded, setExpanded] = useState(false);
	const { visibleValues, shouldShowMore } = useVisibleValues(options, expanded);

	const handleToggleOption = useCallback(
		(value: string) => {
			onValuesChange(
				options.flatMap((e) => {
					const selected = e.value === value ? !e.selected : e.selected;

					return selected ? [e.value] : [];
				})
			);
		},
		[onValuesChange, options]
	);

	const handleSelectAll = useCallback(
		(selectAll: boolean) => {
			if (selectAll) {
				onValuesChange(options.map((v) => v.value));
			} else {
				onValuesChange([]);
			}
		},
		[onValuesChange, options]
	);

	const handleToggleExpanded = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	const selectAllState = useMemo<boolean | "mixed">(() => {
		const checkedCount = options.filter((v) => v.selected).length;

		if (checkedCount === 0) {
			return false;
		}

		if (checkedCount === options.length) {
			return true;
		}

		return "mixed";
	}, [options]);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<Container>
			{showSearchInput && (
				<FilterSelectorTemplateSearchInput
					id={`${props.id}-search`}
					value={searchKeyword ?? ""}
					onChange={handleSearchInputChange}
					onClearButtonClick={handleSearchClear}
					onKeyDown={handleSearchKeyDown}
					searchButton={searchButtonNode}
				/>
			)}
			<CheckboxIndeterminate
				id={`${props.id}-select-all`}
				checked={selectAllState}
				onChange={handleSelectAll}
				label={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel)}
			/>
			<Divider />

			<CheckboxGroup onValueChanged={handleToggleOption}>
				{visibleValues.map((option) => {
					return <CheckboxGroupItem {...option} key={option.value} />;
				})}
			</CheckboxGroup>

			{shouldShowMore && (
				<>
					<Divider />
					<Button
						label={
							expanded
								? localizedResource(RESOURCE_KEYS.overviewEngine.enumerationFilterOptionView.showLess)
								: localizedResource(RESOURCE_KEYS.overviewEngine.enumerationFilterOptionView.showMore)
						}
						secondary
						onClick={handleToggleExpanded}
						icon={<Icon>visibility</Icon>}
					/>
				</>
			)}

			{onLoadMore && hasMore && (
				<>
					<Divider />
					<Button
						label={localizedResource(RESOURCE_KEYS.overviewEngine.enumeratedStringFilterOptionView.loadMore)}
						secondary
						loading={loading}
						onClick={onLoadMore}
					/>
				</>
			)}
		</Container>
	);
});

const SHOW_MORE_THRESHOLD = 4;

function useVisibleValues(
	options: FilterListOption[],
	isExpanded: boolean
): { visibleValues: FilterListOption[]; shouldShowMore: boolean } {
	return useMemo(() => {
		if (options.length <= SHOW_MORE_THRESHOLD) {
			return { visibleValues: options, shouldShowMore: false };
		}

		const pinnedValues = options.filter((opt) => opt.pinned);

		if (pinnedValues.length > 0) {
			return { visibleValues: isExpanded ? options : pinnedValues, shouldShowMore: true };
		}

		return { visibleValues: isExpanded ? options : options.slice(0, SHOW_MORE_THRESHOLD), shouldShowMore: true };
	}, [options, isExpanded]);
}

/** @deprecated Redundant styled-component — simple flex column with gap. */
const Container = styled.div`
	display: flex;
	gap: ${({ theme }) => theme.spacing.spacing.spacing2xs}px;
	flex-direction: column;
`;
