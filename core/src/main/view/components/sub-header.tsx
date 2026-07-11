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

import { useSubHeaderElements } from "./sub-header-elements.js";

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
	const leftSlotElements = useOverviewEngineContext((context) => context.overviewModel.content.subHeaderBox?.leftSlot);
	const rightSlotElements = useOverviewEngineContext(
		(context) => context.overviewModel.content.subHeaderBox?.rightSlot
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

	const leftSlot = useSubHeaderElements({ elements: leftSlotElements, elementMapper, mobile: smallView });
	const rightSlot = useSubHeaderElements({ elements: rightSlotElements, elementMapper, mobile: smallView });

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
				<ActionBarGroupArea leftSlot={leftSlot} rightSlot={rightSlot} leftSlotProps={{ style: { flexShrink: 1 } }} />
			) : null}
			{filterBar}
		</SubHeading>
	);
});

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
