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

import { memo, type FC, useMemo, useCallback, type ReactNode } from "react";

import { UiStateSelector } from "../../../../store/index.js";
import { useFilterState } from "../hooks/use-filter-state.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useFilterFocusContext } from "../../../context/filter-focus-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorTriggerButtonProps {}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelectorTriggerButton: FC<FilterSelectorTriggerButtonProps> = memo(
	function FilterSelectorTriggerButton() {
		const newFilterConfiguration = useOverviewEngineContext(
			(c) => c.overviewModel.content.configuration.newFilterConfiguration
		);
		const disabled = useOverviewEngineState(UiStateSelector.disabled());
		const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
		const Badge = useOverviewEngineContext((c) => c.widgetMap.Badge);

		const onSelectorVisibilityChange = useOverviewEngineContext(
			(c) => c.eventHandlers.newFilter?.onFilterSelectorVisibilityChanged
		);
		const selectorOpen = useOverviewEngineState((s) => !!s.newFilter?.filterSelectorOptions.open);
		const registerRef = useFilterFocusContext((c) => c.registerRef);

		const filterStateSelectors = useFilterSelectors();
		const documentModel = useOverviewEngineContext((c) => c.documentModel);
		const operatorContext = useMemo(() => ({ documentModel }), [documentModel]);
		const isAnyFilterSet = useFilterState((state) =>
			state ? filterStateSelectors.hasAnySetFilter(state.filters, operatorContext) : false
		);

		const { icon, label, title } = useTriggerDisplay();

		const handleButtonRef = useCallback(
			(ref: HTMLButtonElement | null) => registerRef("selectorTrigger", ref),
			[registerRef]
		);

		const onClick = useCallback(() => {
			onSelectorVisibilityChange?.({ visible: !selectorOpen });
		}, [onSelectorVisibilityChange, selectorOpen]);

		const ariaAttributes = useMemo(() => {
			const viewMode = newFilterConfiguration?.filterSelector.viewMode ?? "docked";
			const baseAttributes: Record<string, boolean | undefined> = {
				"aria-expanded": selectorOpen
			};

			if (viewMode === "overlay") {
				return { ...baseAttributes, ["aria-haspopup"]: true };
			}

			return baseAttributes;
		}, [newFilterConfiguration?.filterSelector.viewMode, selectorOpen]);

		return (
			<Button
				buttonRef={handleButtonRef}
				onClick={onClick}
				icon={icon}
				label={label}
				title={title}
				badge={<Badge tiny light hidden={!(!selectorOpen && isAnyFilterSet)} />}
				disabled={disabled}
				labelHidden={label === undefined}
				buttonAttributes={ariaAttributes}
			/>
		);
	}
);

function useTriggerDisplay(): { icon: ReactNode; label: string | undefined; title: string } {
	const triggerConfig = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterSelector.trigger
	);
	const triggerValue = triggerConfig?.enabled ? triggerConfig.value : undefined;

	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();

	const hasLabel = !!triggerValue?.label;

	const icon = useMemo<ReactNode>(() => {
		if (triggerValue?.icon) {
			return <Icon iconTheme={triggerValue.icon.theme}>{triggerValue.icon.name}</Icon>;
		}

		if (hasLabel) {
			return undefined;
		}

		return <Icon>filter_list</Icon>;
	}, [Icon, triggerValue?.icon, hasLabel]);

	const modeledLabel = triggerValue?.label
		? localizedOverviewElement(["filterTrigger", "label"], triggerValue.label)
		: undefined;

	const selectorOpen = useOverviewEngineState((s) => !!s.newFilter?.filterSelectorOptions.open);

	const title =
		modeledLabel ??
		localizedResource(RESOURCE_KEYS.overviewEngine.filterButton[selectorOpen ? "closeFilter" : "openFilter"]);

	const labelHidden = !hasLabel || (triggerValue?.labelHidden ?? false);

	return { icon, label: labelHidden ? undefined : title, title };
}
