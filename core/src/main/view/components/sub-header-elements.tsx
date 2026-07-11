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
import { useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export function useSubHeaderElements(params: {
	elements?: ReadonlyArray<OverviewModel.Element>;
	elementMapper: (element: OverviewModel.Element) => React.ReactNode;
	mobile?: boolean;
}): React.ReactNode[] {
	const { elements, elementMapper, mobile } = params;

	const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);
	const ActionBarGroup = useOverviewEngineContext((context) => context.widgetMap.ActionBarGroup);
	const ActionBarGroupDivider = useOverviewEngineContext((context) => context.widgetMap.ActionBarGroupDivider);

	const elementSegments = React.useMemo(() => (elements ? getElementSegments(elements) : []), [elements]);

	if (mobile) {
		return [];
	}

	return elementSegments.reduce<React.ReactNode[]>((result, segment) => {
		const nodes = segment.elements.map(elementMapper);

		if (nodes.some(Boolean)) {
			result.push(
				<React.Fragment key={segment.key}>
					{result.length !== 0 && <ActionBarGroupDivider />}
					{OverviewModel.ButtonElement.isAssignableFrom(segment.elements[0]) ? (
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
export interface ElementSegment {
	readonly key: string;
	readonly elements: OverviewModel.Element[];
}

/**
 * Splits `elements` into contiguous same-type segments and assigns each segment
 * a stable React key. The key is derived from the segment's first element so
 * insert/remove/reorder in the source list produces a stable key per surviving
 * segment (avoids the index-key reconciliation hazard).
 *
 * @internal
 */
export function getElementSegments(elements: ReadonlyArray<OverviewModel.Element>): ElementSegment[] {
	const segments = elements.reduce<OverviewModel.Element[][]>((groups, element) => {
		if (groups.length > 0) {
			const lastGroup = groups[groups.length - 1];

			if (isSameElementType(lastGroup[0], element)) {
				lastGroup.push(element);

				return groups;
			}
		}

		groups.push([element]);

		return groups;
	}, []);

	const seen = new Map<string, number>();

	return segments.map((group) => {
		const base = toSegmentKeyBase(group[0]);
		const count = seen.get(base) ?? 0;

		seen.set(base, count + 1);

		return { key: count === 0 ? base : `${base}#${count}`, elements: group };
	});
}

function toSegmentKeyBase(element: OverviewModel.Element): string {
	if (OverviewModel.ButtonElement.isAssignableFrom(element)) {
		return `button:${element.event}`;
	}

	return `type:${element.type}`;
}

function isSameElementType(first: OverviewModel.Element, second: OverviewModel.Element): boolean {
	return first.type === second.type || (isSearchOrFilter(first) && isSearchOrFilter(second));
}

function isSearchOrFilter(element: OverviewModel.Element): boolean {
	return element.type === OverviewModel.ElementType.SEARCH || element.type === OverviewModel.ElementType.FILTER;
}
