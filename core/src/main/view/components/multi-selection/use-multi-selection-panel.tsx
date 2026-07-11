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
import { useOverviewEngineContext } from "../../context/overview-engine-context.js";

/**
 * Returns the rendered MultiSelectionPanel node (or null when the model's
 * multiSelection config is missing/empty, or required event handlers are not wired).
 *
 * @internal
 */
export function useMultiSelectionPanel(): React.ReactNode {
	const MultiSelectionPanel = useOverviewEngineContext((c) => c.componentMap.MultiSelectionPanel);
	const multiSelection = useOverviewEngineContext((c) => c.overviewModel.content.configuration.multiSelection);
	const onRowsSelect = useOverviewEngineContext((c) => c.eventHandlers.onRowsSelect);
	const onMultiSelectionClear = useOverviewEngineContext((c) => c.eventHandlers.onMultiSelectionClear);
	const onOverallMultiSelectionButtonClick = useOverviewEngineContext(
		(c) => c.eventHandlers.onOverallMultiSelectionButtonClick
	);

	return React.useMemo(() => {
		if (multiSelection === undefined) {
			return null;
		}

		const { buttons, collapseOption, counterOption } = multiSelection;

		const isEmpty =
			collapseOption === OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE &&
			counterOption === OverviewModel.MultiSelection.CounterOption.NONE &&
			(buttons === undefined || buttons.length === 0);

		return !isEmpty && onOverallMultiSelectionButtonClick && onMultiSelectionClear && onRowsSelect ? (
			<MultiSelectionPanel key="multiSelectionPanel" />
		) : null;
	}, [MultiSelectionPanel, multiSelection, onMultiSelectionClear, onOverallMultiSelectionButtonClick, onRowsSelect]);
}
