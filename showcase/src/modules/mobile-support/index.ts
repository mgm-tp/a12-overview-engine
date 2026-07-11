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

import { MobileSupportCardView, MobileSupportExpression } from "./views.js";

const DESCRIPTOR_EXPRESSION = { showcase: "mobile", feature: "expression" };
const DESCRIPTOR_CARD_VIEW = { showcase: "mobile", feature: "card-view" };

function onExpressionClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_EXPRESSION }),
			descriptor: {}
		})
	);
}

function onCardViewClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_CARD_VIEW }),
			descriptor: {}
		})
	);
}

export const MobileSupportModule: DynamicConfiguration = {
	id: "MobileSupport",
	menus: (state) => {
		const expressionActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_EXPRESSION)(state).at(0);
		const cardViewActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_CARD_VIEW)(state).at(0);

		return [
			{
				id: "menu.MobileSupport",
				label: { key: "application.menu.mobileSupport.label" },
				children: [
					{
						id: "menu.Expression",
						label: { key: "application.menu.mobileSupport.expression" },
						selected: expressionActivity !== undefined,
						action: onExpressionClick
					},
					{
						id: "menu.CardView",
						label: { key: "application.menu.mobileSupport.cardView" },
						selected: cardViewActivity !== undefined,
						action: onCardViewClick
					}
				]
			}
		];
	},
	flows: [
		{
			name: "mobileSupportFlow",
			scenes: [
				{
					name: "MobileExpression",
					matches: (d) => d.showcase === DESCRIPTOR_EXPRESSION.showcase && d.feature === DESCRIPTOR_EXPRESSION.feature,
					sceneChange: {
						onEnter: [
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: MobileSupportExpression,
								models: [{ modelType: "overview", name: "ProductMobileOM" }]
							}
						]
					}
				},
				{
					name: "MobileCardView",
					matches: (d) => d.showcase === DESCRIPTOR_CARD_VIEW.showcase && d.feature === DESCRIPTOR_CARD_VIEW.feature,
					sceneChange: {
						onEnter: [
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: MobileSupportCardView,
								models: [{ modelType: "overview", name: "ProductCardViewOM" }]
							}
						]
					}
				}
			]
		}
	]
};
