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

import { OverviewModel } from "../../../overview-model.js";
import { OverviewModelKeys } from "../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../context/overview-engine-context.js";
import { useSubHeaderElements } from "../sub-header-elements.js";

import type { FilterTriggerPlacement } from "./hooks/use-filter-trigger-placement.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface SubHeaderProps {
	readonly filterTrigger?: React.ReactElement;
	readonly filterTriggerPlacement?: Extract<FilterTriggerPlacement, "search-adjacent" | "action-bar">;
	readonly multiSelectionPanel?: React.ReactNode;
	readonly filterBar?: React.ReactNode;
	readonly searchBar?: React.ReactNode;
	readonly mobileSearchBar?: React.ReactNode;
	readonly showMobileSearchBar?: boolean;
}

/**
 * New-filter local SubHeader. Mirrors the legacy `SubHeader` but synthesizes a
 * `FilterElement` per `filterTriggerPlacement` so the Filter Selector trigger
 * slots into the right position relative to other subHeaderBox elements.
 *
 * Unlike the legacy `SubHeader`, the smallView branch does not render a mobile
 * filter bar slot. The new-filter Filter Bar is not yet wired for small viewports
 * (tracked under the Filter 2.0 umbrella A12OE-1118); add the slot here when
 * mobile bar support lands.
 *
 * Auto-placement is suppressed when a `FilterElement` already exists in either
 * slot of the model's `subHeaderBox` — that lets consumers position the trigger
 * manually without engine interference.
 */
export const SubHeader: React.ComponentType<SubHeaderProps> = React.memo(function SubHeader(props) {
	const {
		filterTrigger,
		filterTriggerPlacement,
		multiSelectionPanel,
		filterBar,
		searchBar,
		mobileSearchBar,
		showMobileSearchBar
	} = props;

	const smallView = useOverviewEngineContext((c) => c.smallView);
	const SubHeading = useOverviewEngineContext((c) => c.widgetMap.SubHeading);
	const SubActionBarTpl = useOverviewEngineContext((c) => c.widgetMap.SubActionBarTpl);
	const ActionBarGroupArea = useOverviewEngineContext((c) => c.widgetMap.ActionBarGroupArea);
	const OverviewButton = useOverviewEngineContext((c) => c.componentMap.OverviewButton);

	const { leftSlot, rightSlot } = useResolvedSlots(filterTriggerPlacement);

	const elementMapper = (element: OverviewModel.Element): React.ReactNode => {
		if (OverviewModel.ButtonElement.isAssignableFrom(element)) {
			return (
				<OverviewButton componentKey={OverviewModelKeys.SUB_HEADER_BOX} buttonModel={element} key={element.event} />
			);
		} else if (OverviewModel.MultiSelectionElement.isAssignableFrom(element)) {
			return multiSelectionPanel;
		} else if (OverviewModel.SearchElement.isAssignableFrom(element)) {
			return searchBar;
		}

		return filterTrigger;
	};

	const renderedLeftSlot = useSubHeaderElements({ elements: leftSlot, elementMapper, mobile: smallView });
	const renderedRightSlot = useSubHeaderElements({ elements: rightSlot, elementMapper, mobile: smallView });

	if (smallView) {
		return (
			<SubHeading>
				<SubActionBarTpl hidden={!showMobileSearchBar}>{mobileSearchBar}</SubActionBarTpl>
			</SubHeading>
		);
	}

	return (
		<SubHeading>
			{renderedLeftSlot.length || renderedRightSlot.length ? (
				<ActionBarGroupArea
					leftSlot={renderedLeftSlot}
					rightSlot={renderedRightSlot}
					// Workaround for left-slot overflow.
					leftSlotProps={{ style: { flexShrink: 1 } }}
				/>
			) : null}
			{filterBar}
		</SubHeading>
	);
});

function useResolvedSlots(filterTriggerPlacement?: SubHeaderProps["filterTriggerPlacement"]): {
	readonly leftSlot: ReadonlyArray<OverviewModel.Element>;
	readonly rightSlot: ReadonlyArray<OverviewModel.Element>;
} {
	const leftSlotElements = useOverviewEngineContext((c) => c.overviewModel.content.subHeaderBox?.leftSlot);
	const rightSlotElements = useOverviewEngineContext((c) => c.overviewModel.content.subHeaderBox?.rightSlot);

	return React.useMemo(() => {
		const left = leftSlotElements ?? [];
		const right = rightSlotElements ?? [];

		if (!filterTriggerPlacement) {
			return { leftSlot: left, rightSlot: right };
		}

		if (hasFilterElement(left) || hasFilterElement(right)) {
			return { leftSlot: left, rightSlot: right };
		}

		const filterElement: OverviewModel.FilterElement = { type: OverviewModel.ElementType.FILTER };

		if (filterTriggerPlacement === "search-adjacent") {
			if (hasSearchElement(left)) {
				return { leftSlot: insertAfterSearch(left, filterElement), rightSlot: right };
			}

			if (hasSearchElement(right)) {
				return { leftSlot: left, rightSlot: insertAfterSearch(right, filterElement) };
			}
		}

		return { leftSlot: left, rightSlot: [...right, filterElement] };
	}, [leftSlotElements, rightSlotElements, filterTriggerPlacement]);
}

function hasSearchElement(elements: ReadonlyArray<OverviewModel.Element>): boolean {
	return elements.some(OverviewModel.SearchElement.isAssignableFrom);
}

function hasFilterElement(elements: ReadonlyArray<OverviewModel.Element>): boolean {
	return elements.some(OverviewModel.FilterElement.isAssignableFrom);
}

function insertAfterSearch(
	elements: ReadonlyArray<OverviewModel.Element>,
	insert: OverviewModel.Element
): OverviewModel.Element[] {
	return elements.flatMap((element) => {
		if (OverviewModel.SearchElement.isAssignableFrom(element)) {
			return [element, insert];
		}

		return [element];
	});
}
