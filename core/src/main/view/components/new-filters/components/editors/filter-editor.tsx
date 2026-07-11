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

import { memo, type FC, useMemo } from "react";
import { css, styled } from "styled-components";

import type { Container } from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import {
	DateFilterState,
	TimeFilterState,
	QueryFilterState,
	NumberFilterState,
	StringFilterState,
	BooleanFilterState,
	ConfirmFilterState,
	DateTimeFilterState,
	type FilterItemState,
	DateRangeFilterState,
	EnumerationFilterState,
	MultiSelectFilterState,
	DateFragmentFilterState
} from "../../../../../store/index.js";

/** @internal */
export const STATEFUL_FILTER_TYPES: ReadonlySet<string> = new Set(["time", "date", "dateTime", "dateRange"]);

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterEditorProps extends Container {
	readonly filterState: FilterItemState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterEditor: FC<FilterEditorProps> = memo(function FilterEditor({ filterState }) {
	const hidden = useMemo(
		() =>
			filterState.collapsed &&
			filterState.area === "filterSelector" &&
			STATEFUL_FILTER_TYPES.has(filterState.model.type),
		[filterState.area, filterState.collapsed, filterState.model.type]
	);

	return (
		<StyledFilterEditorContainer $hidden={hidden}>
			<FilterEditorContent filterState={filterState} />
		</StyledFilterEditorContainer>
	);
});

const StyledFilterEditorContainer = styled.div<{ $hidden?: boolean }>(({ theme, $hidden }) => {
	const { spacing } = theme.spacing;

	return css`
		display: ${$hidden ? "none" : "flex"};
		flex-direction: column;
		gap: ${spacing.spacingSm}px;
		margin-top: ${spacing.spacingXs}px;
	`;
});

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterEditorContentProps {
	readonly filterState: FilterItemState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterEditorContent: FC<FilterEditorContentProps> = memo(function FilterEditorContent({ filterState }) {
	const BooleanFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.BooleanFilterEditor);
	const ConfirmFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.ConfirmFilterEditor);
	const StringFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.StringFilterEditor);
	const NumberFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.NumberFilterEditor);
	const EnumerationFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.EnumerationFilterEditor);
	const MultiSelectFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.MultiSelectFilterEditor);
	const TimeFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.TimeFilterEditor);
	const DateFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.DateFilterEditor);
	const DateTimeFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.DateTimeFilterEditor);
	const DateFragmentFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.DateFragmentFilterEditor);
	const DateRangeFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.DateRangeFilterEditor);
	const QueryFilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.QueryFilterEditor);

	if (BooleanFilterState.isInstance(filterState)) {
		return <BooleanFilterEditor state={filterState} />;
	}

	if (ConfirmFilterState.isInstance(filterState)) {
		return <ConfirmFilterEditor state={filterState} />;
	}

	if (StringFilterState.isInstance(filterState)) {
		return <StringFilterEditor state={filterState} />;
	}

	if (NumberFilterState.isInstance(filterState)) {
		return <NumberFilterEditor state={filterState} />;
	}

	if (EnumerationFilterState.isInstance(filterState)) {
		return <EnumerationFilterEditor state={filterState} />;
	}

	if (MultiSelectFilterState.isInstance(filterState)) {
		return <MultiSelectFilterEditor state={filterState} />;
	}

	if (TimeFilterState.isInstance(filterState)) {
		return <TimeFilterEditor state={filterState} />;
	}

	if (DateFilterState.isInstance(filterState)) {
		return <DateFilterEditor state={filterState} />;
	}

	if (DateTimeFilterState.isInstance(filterState)) {
		return <DateTimeFilterEditor state={filterState} />;
	}

	if (DateFragmentFilterState.isInstance(filterState)) {
		return <DateFragmentFilterEditor state={filterState} />;
	}

	if (DateRangeFilterState.isInstance(filterState)) {
		return <DateRangeFilterEditor state={filterState} />;
	}

	if (QueryFilterState.isInstance(filterState)) {
		return <QueryFilterEditor state={filterState} />;
	}

	throw new Error(`Unsupported filter state data: ${filterState.model.id}`);
});
