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

import { InfiniteScrollingOverview } from "./infinite-scrolling-overview.js";

const DESCRIPTOR_DEFAULT = { showcase: "bundle" };
const DESCRIPTOR_WITH_LINK = { showcase: "bundle", feature: "with-link" };

function onDefaultClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_DEFAULT }),
			descriptor: {}
		})
	);
}

function onWithLinkClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_WITH_LINK }),
			descriptor: {}
		})
	);
}

export const BundleModule: DynamicConfiguration = {
	id: "Bundle",
	menus: (state) => {
		const defaultActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_DEFAULT)(state).at(0);
		const withLinkActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_WITH_LINK)(state).at(0);

		return [
			{
				id: "menu.Bundle",
				label: { key: "application.menu.bundle.label" },
				children: [
					{
						id: "menu.Bundle.Default",
						label: { key: "application.menu.bundle.default" },
						selected: defaultActivity !== undefined,
						action: onDefaultClick
					},
					{
						id: "menu.Bundle.WithLink",
						label: { key: "application.menu.bundle.withLink" },
						selected: withLinkActivity !== undefined,
						action: onWithLinkClick
					}
				]
			}
		];
	},
	flows: [
		{
			name: "OverviewFlow",
			scenes: [
				{
					name: "Infinite-Bundle-overview",
					matches: (d) => d.showcase === DESCRIPTOR_DEFAULT.showcase && !d.feature && !d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: InfiniteScrollingOverview,
								models: [{ modelType: "overview", name: "BundleOM" }]
							}
						]
					}
				},
				{
					name: "BundleWithLinkOverview",
					matches: (d) =>
						d.showcase === DESCRIPTOR_WITH_LINK.showcase && d.feature === DESCRIPTOR_WITH_LINK.feature && !d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: InfiniteScrollingOverview,
								constraints: { type: "MasterDetail" },
								models: [{ modelType: "overview", name: "BundleWithLinkOM" }]
							}
						]
					}
				}
			]
		}
	]
};
