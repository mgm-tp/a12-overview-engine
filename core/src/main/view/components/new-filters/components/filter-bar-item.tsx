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

import { isFieldBasedFilterModelItem } from "../../../../models/filter-model-utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import type { FilterItemState } from "../../../../store/index.js";
import { useFilterFocusContext } from "../../../context/filter-focus-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";

import { useFilterLabelResolver, useFilterDisplayValueResolver } from "./filter-label-resolvers.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterBarItemProps {
	readonly filter: FilterItemState;
	readonly filterRef: (el: HTMLDivElement | null) => void;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterBarItem: FC<FilterBarItemProps> = memo(function FilterBarItem({ filter, filterRef }) {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Filter = useOverviewEngineContext((c) => c.widgetMap.Filter);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onFilterItemEditStarted = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemEditStarted);
	const onFilterItemEditCanceled = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemEditCanceled);
	const editingFilterId = useOverviewEngineState((state) => state.newFilter?.editingFilter?.filterId);
	const onFocusedFilterChange = useFilterFocusContext((c) => c.onFocusedFilterChange);

	const filterStateSelectors = useFilterSelectors();
	const resolveFilterLabel = useFilterLabelResolver();
	const resolveDisplayValue = useFilterDisplayValueResolver();

	const subDocumentModels = useOverviewEngineContext((c) => c.subDocumentModels);
	const documentModel = useOverviewEngineContext((c) => c.documentModel);
	const subModel = isFieldBasedFilterModelItem(filter.model) ? filter.model.options.subModel : undefined;
	const targetDocumentModel = subModel
		? (subDocumentModels?.find((dm) => dm.header.id === subModel) ?? documentModel)
		: documentModel;

	const filterLabel = resolveFilterLabel(filter.model);
	const displayValue = resolveDisplayValue(filter);

	const active = useMemo(
		() => !!filterStateSelectors.toOperator(filter, { documentModel: targetDocumentModel }),
		[filter, filterStateSelectors, targetDocumentModel]
	);

	return (
		<Filter
			id={filter.model.id}
			name={filterLabel}
			filterRef={filterRef}
			active={active}
			compact
			options={displayValue}
			ariaExpanded={editingFilterId === filter.model.id}
			onClick={() => {
				if (editingFilterId === filter.model.id) {
					onFilterItemEditCanceled?.({});
				} else {
					onFilterItemEditStarted?.({ filterId: filter.model.id });
				}
			}}
			nonRemovable
			disabled={disabled}
			onFocus={() => onFocusedFilterChange(filter.model.id)}
			prefix={
				filter.model.icon ? (
					<Icon iconTheme={filter.model.icon.theme}>{filter.model.icon.name}</Icon>
				) : (
					filterLabel.charAt(0)
				)
			}
		/>
	);
});
