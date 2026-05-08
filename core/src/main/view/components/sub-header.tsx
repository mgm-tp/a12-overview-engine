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

import { OverviewModel } from "../../overview-model.js";
import { OverviewModelKeys } from "../../services/localization/index.js";
import { useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export const SubHeader: React.ComponentType<SubHeader.PropsType> = React.memo(function SubHeader(props) {
	const {
		multiSelectionPanel,
		filterSelector,
		filterBar,
		showMobileFilterBar,
		searchBar,
		mobileSearchBar,
		showMobileSearchBar
	} = props;
	const minorElements = useOverviewEngineContext(
		(context) => context.overviewModel.content.subHeaderBox?.minorElements
	);
	const majorElements = useOverviewEngineContext(
		(context) => context.overviewModel.content.subHeaderBox?.majorElements
	);
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const SubHeading = useOverviewEngineContext((context) => context.widgetMap.SubHeading);
	const SubActionBarTpl = useOverviewEngineContext((context) => context.widgetMap.SubActionBarTpl);
	const ActionBarGroupArea = useOverviewEngineContext((context) => context.widgetMap.ActionBarGroupArea);
	const OverviewButton = useOverviewEngineContext((context) => context.componentMap.OverviewButton);

	const elementMapper = (element: OverviewModel.Element): React.ReactNode => {
		if (OverviewModel.ButtonElement.isAssignableFrom(element)) {
			return (
				<OverviewButton componentKey={OverviewModelKeys.SUB_HEADER_BOX} buttonModel={element} key={element.event} />
			);
		} else if (OverviewModel.MultiSelectionElement.isAssignableFrom(element)) {
			return multiSelectionPanel;
		} else if (OverviewModel.SearchElement.isAssignableFrom(element)) {
			return searchBar;
		} else {
			return filterSelector;
		}
	};

	const leftSlot = useSubHeaderElements({ elements: minorElements, elementMapper, mobile: smallView });
	const rightSlot = useSubHeaderElements({ elements: majorElements, elementMapper, mobile: smallView });

	if (smallView) {
		return (
			<SubHeading>
				<SubActionBarTpl hidden={!showMobileSearchBar}>{mobileSearchBar}</SubActionBarTpl>
				<SubActionBarTpl hidden={!showMobileFilterBar}>{filterBar}</SubActionBarTpl>
			</SubHeading>
		);
	}

	return (
		<SubHeading>
			{leftSlot.length || rightSlot.length ? (
				<ActionBarGroupArea
					leftSlot={leftSlot}
					rightSlot={rightSlot}
					// This is work-around. See A12OE-282
					leftSlotProps={{ style: { flexShrink: 1 } }}
				/>
			) : null}
			{filterBar}
		</SubHeading>
	);
});

function useSubHeaderElements(params: {
	elements?: ReadonlyArray<OverviewModel.Element>;
	elementMapper: (element: OverviewModel.Element) => React.ReactNode;
	mobile?: boolean;
}): React.ReactNode[] {
	const { elements, elementMapper, mobile } = params;

	const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);
	const ActionBarGroup = useOverviewEngineContext((context) => context.widgetMap.ActionBarGroup);
	const ActionBarGroupDivider = useOverviewEngineContext((context) => context.widgetMap.ActionBarGroupDivider);

	const elementSegment = React.useMemo(() => (elements ? getElementSegments(elements) : []), [elements]);

	if (mobile) {
		return [];
	}

	return elementSegment.reduce<React.ReactNode[]>((result, group, groupIndex) => {
		const nodes = group.map(elementMapper);

		if (nodes.some(Boolean)) {
			result.push(
				<React.Fragment key={groupIndex}>
					{result.length !== 0 && <ActionBarGroupDivider />}
					{OverviewModel.ButtonElement.isAssignableFrom(group[0]) ? (
						<ButtonGroup>{nodes}</ButtonGroup>
					) : (
						<ActionBarGroup>{nodes}</ActionBarGroup>
					)}
				</React.Fragment>
			);
		}

		return result;
	}, []);
}

/** @internal */
export function getElementSegments(elements: ReadonlyArray<OverviewModel.Element>): OverviewModel.Element[][] {
	return elements.reduce<OverviewModel.Element[][]>((groups, element) => {
		if (groups.length > 0) {
			const lastGroup = groups[groups.length - 1];

			// if the element have the same element type with the previous group, then push it into the group.
			if (isSameElementType(lastGroup[0], element)) {
				lastGroup.push(element);

				return groups;
			}
		}

		// otherwise, create a new group
		groups.push([element]);

		return groups;
	}, []);
}

function isSameElementType(first: OverviewModel.Element, second: OverviewModel.Element): boolean {
	return first.type === second.type || (isSearchOrFilter(first) && isSearchOrFilter(second));
}

function isSearchOrFilter(element: OverviewModel.Element): boolean {
	return element.type === OverviewModel.ElementType.SEARCH || element.type === OverviewModel.ElementType.FILTER;
}

export namespace SubHeader {
	export interface PropsType {
		readonly multiSelectionPanel?: React.ReactNode;
		readonly filterSelector?: React.ReactElement;
		readonly filterBar?: React.ReactNode;
		readonly showMobileFilterBar?: boolean;
		readonly searchBar?: React.ReactNode;
		readonly mobileSearchBar?: React.ReactNode;
		readonly showMobileSearchBar?: boolean;
		readonly mobile?: boolean;
	}
}
