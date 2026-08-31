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

import { styled } from "styled-components";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import type { FilterItemState } from "../../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";

import { useFilterLabelResolver } from "./filter-label-resolvers.js";
import { SlidingDropdown } from "./sliding-dropdown.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.barItemDropdown;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterBarItemDropdownProps {
	readonly filterState: FilterItemState;
	readonly referenceElement?: HTMLDivElement;
}

/** @internal */
export const FilterBarItemDropdown: FC<FilterBarItemDropdownProps> = memo(function FilterBarItemOptions({
	referenceElement,
	filterState
}) {
	const FilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterEditor);
	const FilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSetting);
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const ButtonGroup = useOverviewEngineContext((c) => c.widgetMap.ButtonGroup);
	const AttachedPortal = useOverviewEngineContext((c) => c.widgetMap.AttachedPortal);
	const onCancel = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemEditCanceled);
	const onApply = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemEditApplied);
	const onReset = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemReset);

	const filterStateSelectors = useFilterSelectors();
	const resettable = useMemo(() => filterStateSelectors.isResettable(filterState), [filterStateSelectors, filterState]);
	const applicable = useOverviewEngineState(UiStateSelector.NewFilter.isEditingFilterApplicable(filterStateSelectors));
	const resolveFilterLabel = useFilterLabelResolver();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const isConfigurable = useOverviewEngineState(
		UiStateSelector.NewFilter.isConfigurable(filterState.model.id, filterStateSelectors)
	);

	return (
		<AttachedPortal
			referenceElement={referenceElement}
			closeOnOutsideClick
			closeOnEsc
			focusOnReferenceElementAfterClose
			onVisibilityChange={(visible) => {
				if (!visible) {
					onCancel?.({});
				}
			}}>
			<StyledFocusWrapper tabIndex={-1}>
				<SlidingDropdown
					primaryPanel={{
						label: resolveFilterLabel(filterState.model),
						content: <FilterEditor filterState={filterState} />
					}}
					secondaryPanel={
						isConfigurable
							? { label: localizedResource(t.settingsTitle), content: <FilterSetting filterState={filterState} /> }
							: undefined
					}
					footerContent={
						<ButtonGroup alignment="right">
							<Button
								label={localizedResource(t.resetLabel)}
								disabled={!resettable}
								secondary
								icon={<Icon>replay</Icon>}
								onClick={() => onReset?.({ filterId: filterState.model.id })}
							/>
							<Button
								label={localizedResource(t.applyLabel)}
								primary
								disabled={!applicable}
								onClick={() => onApply?.()}
							/>
						</ButtonGroup>
					}
				/>
			</StyledFocusWrapper>
		</AttachedPortal>
	);
});

const StyledFocusWrapper = styled.div`
	outline: none;
`;
