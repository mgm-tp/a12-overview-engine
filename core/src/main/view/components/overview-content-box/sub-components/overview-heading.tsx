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

import { useShouldAllowSearch } from "../../../utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import { useHeadingMetadata } from "../../../hooks/use-heading-metadata.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

export interface OverviewHeadingProps {
	readonly headingAriaLevel: number;
}

/** @internal */
export const OverviewHeading: React.FC<OverviewHeadingProps> = React.memo(function OverviewHeading(props) {
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
	const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
	const Heading = useOverviewEngineContext((c) => c.componentMap.Heading);
	const OverviewSearchButton = useOverviewEngineContext((c) => c.componentMap.OverviewSearchButton);
	const OverviewFilterButton = useOverviewEngineContext((c) => c.componentMap.OverviewFilterButton);
	const enableFilter = useOverviewEngineContext((c) => c.overviewModel.content.configuration.enableFilter);
	const shouldAllowSearch = useShouldAllowSearch();
	const shouldDisplayInSmallView = useOverviewEngineContext((c) => !!c.smallView);

	const { title, hiddenText, subtitle, buttons, labelHidden } = useHeadingMetadata();

	return (
		<Heading
			title={title}
			hiddenText={hiddenText}
			subtitle={subtitle}
			ariaLevel={props.headingAriaLevel}
			buttons={buttons}
			filterSelector={
				enableFilter &&
				(activeFilters || enumeratedStringFilterMap) &&
				shouldDisplayInSmallView && <OverviewFilterButton key="HeadingFilterButton" />
			}
			searchButton={shouldAllowSearch && shouldDisplayInSmallView && <OverviewSearchButton />}
			labelHidden={labelHidden}
		/>
	);
});
