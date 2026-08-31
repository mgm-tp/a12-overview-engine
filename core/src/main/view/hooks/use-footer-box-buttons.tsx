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

import React from "react";

import type { OverviewModel } from "../../overview-model.js";
import { OverviewModelKeys } from "../../services/index.js";
import type { ButtonPanel } from "../components/index.js";
import { useOverviewEngineContext } from "../context/index.js";

/** @internal */
export function useFooterBoxButtons(): ButtonPanel.ButtonType[] {
	const footerBox = useOverviewEngineContext((context) => context.overviewModel.content.footerBox);
	const OverviewButton = useOverviewEngineContext((context) => context.componentMap.OverviewButton);

	const mapOverviewButton = React.useCallback(
		(buttonElement: OverviewModel.ButtonElement, index: number, rank: "left" | "right" = "left") => ({
			element: <OverviewButton key={index} componentKey={OverviewModelKeys.FOOTER_BOX} buttonModel={buttonElement} />,
			rank
		}),
		[OverviewButton]
	);

	const leftButtons: ButtonPanel.ButtonType[] = React.useMemo(
		() => footerBox?.leftSlot?.map((buttonModel, index) => mapOverviewButton(buttonModel, index)) ?? [],
		[footerBox?.leftSlot, mapOverviewButton]
	);

	const rightButtons: ButtonPanel.ButtonType[] = React.useMemo(
		() => footerBox?.rightSlot?.map((buttonModel, index) => mapOverviewButton(buttonModel, index, "right")) ?? [],
		[footerBox?.rightSlot, mapOverviewButton]
	);

	return [...leftButtons, ...rightButtons];
}
