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

import { memo, type FC, useCallback } from "react";

import { UiStateSelector } from "../../../../store/index.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.footer;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorFooterProps {}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelectorFooter: FC<FilterSelectorFooterProps> = memo(function FilterSelectorFooter() {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Footer = useOverviewEngineContext((c) => c.widgetMap.Footer);
	const ButtonGroupContainer = useOverviewEngineContext((c) => c.widgetMap.ButtonGroupContainer);

	const onApply = useOverviewEngineContext((context) => context.eventHandlers.newFilter?.onFilterSelectorAllApplied);
	const onReset = useOverviewEngineContext((context) => context.eventHandlers.newFilter?.onFilterSelectorReset);
	const onSelectorVisibilityChange = useOverviewEngineContext(
		(context) => context.eventHandlers.newFilter?.onFilterSelectorVisibilityChanged
	);
	const configViewMode = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterSelector.viewMode
	);
	const isModalVariant = configViewMode === "modal";

	const filterStateSelectors = useFilterSelectors();
	const resettable = useOverviewEngineState(UiStateSelector.NewFilter.isFilterSelectorResettable(filterStateSelectors));
	const applicable = useOverviewEngineState(UiStateSelector.NewFilter.isApplicable(filterStateSelectors));
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const handleApply = useCallback(() => {
		onApply?.();

		if (isModalVariant) {
			onSelectorVisibilityChange?.({ visible: false });
		}
	}, [isModalVariant, onApply, onSelectorVisibilityChange]);

	return (
		<Footer>
			<ButtonGroupContainer
				rightSlotButtons={[
					{
						label: localizedResource(t.resetAllLabel),
						disabled: !resettable,
						icon: <Icon>replay</Icon>,
						onClick: onReset
					},
					{
						label: localizedResource(t.applyAllLabel),
						disabled: !applicable,
						primary: true,
						onClick: handleApply
					}
				]}
			/>
		</Footer>
	);
});
