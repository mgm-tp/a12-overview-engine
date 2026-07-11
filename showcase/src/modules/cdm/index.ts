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

import type { Dispatch } from "redux";

import {
	ActivityActions,
	ActivitySelectors,
	ApplicationActions,
	type DynamicConfiguration
} from "@com.mgmtp.a12.client/client-core";

import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";

const DESCRIPTOR = { showcase: "cdm" };

function onClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR }),
			descriptor: {}
		})
	);
}

export const CDMModule: DynamicConfiguration = {
	id: "CDM",
	menus: (state) => {
		const activity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR)(state).at(0);

		return [
			{
				id: "menu.cdm",
				label: { key: "application.menu.cdm" },
				selected: activity !== undefined,
				action: onClick
			}
		];
	},
	flows: [
		{
			name: "OverviewFlow",
			scenes: [
				{
					name: "NaturalPersonCDM-overview",
					matches: (d) => d.showcase === DESCRIPTOR.showcase && !d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ShowcaseOverview,
								models: [{ modelType: "overview", name: "NaturalPersonCDMNoRepeatable-overview" }]
							}
						]
					}
				}
			]
		}
	]
};
