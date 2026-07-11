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

import type { OverviewEngineApi } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import {
	ActivityActions,
	ActivitySelectors,
	ApplicationActions,
	type DynamicConfiguration
} from "@com.mgmtp.a12.client/client-core";

import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";
import { createPresetFilterMiddleware, createInitialUiStateMiddleware } from "../common/middleware.js";

import { ProductOverviewSagas } from "./saga.js";
import { ProductOverview } from "./product-overview.js";

const DESCRIPTOR_PAGINATION = { showcase: "product", feature: "pagination" };
const DESCRIPTOR_PRESET_FILTER = { showcase: "product", feature: "preset-filter" };
const DESCRIPTOR_NEW_FILTER = { showcase: "product", feature: "new-filter" };

function onPaginationClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_PAGINATION }),
			descriptor: {}
		})
	);
}

function onPresetClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_PRESET_FILTER }),
			descriptor: {}
		})
	);
}

function onNewFilterClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR_NEW_FILTER }),
			descriptor: {}
		})
	);
}

export const ProductModule: DynamicConfiguration = {
	id: "Product",
	sagas: () => ProductOverviewSagas,
	middlewares: () => [
		createInitialUiStateMiddleware({}, DESCRIPTOR_PAGINATION),
		createPresetFilterMiddleware(productPresetFilter, DESCRIPTOR_PRESET_FILTER)
	],
	menus: (state) => {
		const paginationActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_PAGINATION)(state).at(0);
		const presetFilterActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_PRESET_FILTER)(state).at(0);
		const newFilterActivity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR_NEW_FILTER)(state).at(0);

		return [
			{
				id: "menu.Product",
				label: { key: "application.menu.product.label" },
				children: [
					{
						id: "menu.Pagination",
						label: { key: "application.menu.product.pagination" },
						selected: paginationActivity !== undefined,
						action: onPaginationClick
					},
					{
						id: "menu.PresetFilter",
						label: { key: "application.menu.product.presetFilter" },
						selected: presetFilterActivity !== undefined,
						action: onPresetClick
					},
					{
						id: "menu.NewFilter",
						label: { key: "application.menu.product.newFilter" },
						selected: newFilterActivity !== undefined,
						action: onNewFilterClick
					}
				]
			}
		];
	},
	flows: [
		{
			name: "Flow",
			scenes: [
				{
					name: "Pagination",
					matches: (d) =>
						d.showcase === DESCRIPTOR_PAGINATION.showcase && d.feature === DESCRIPTOR_PAGINATION.feature && !d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ProductOverview,
								models: [{ modelType: "overview", name: "ProductOM" }]
							}
						]
					}
				},
				{
					name: "PresetFilter",
					matches: (d) =>
						d.showcase === DESCRIPTOR_PRESET_FILTER.showcase &&
						d.feature === DESCRIPTOR_PRESET_FILTER.feature &&
						!d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ShowcaseOverview,
								models: [{ modelType: "overview", name: "ProductPresetFilterOM" }]
							}
						]
					}
				},
				{
					name: "NewFilter",
					matches: (d) =>
						d.showcase === DESCRIPTOR_NEW_FILTER.showcase && d.feature === DESCRIPTOR_NEW_FILTER.feature && !d.instance,
					sceneChange: {
						onEnter: [
							{ type: "DYNAMIC_CLEAR_REGION", region: "/CONTENT" },
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ShowcaseOverview,
								models: [{ modelType: "overview", name: "ProductNewFilterOM" }]
							}
						]
					}
				}
			]
		}
	]
};

const productPresetFilter: OverviewEngineApi.FilterMap = {
	"/product/name": {
		filterType: "String",
		criteria: {
			value: "board"
		},
		nonRemovable: true
	},
	"/product/inStock": {
		filterType: "Boolean",
		criteria: {
			value: true
		},
		nonRemovable: true
	},
	"/product/number": {
		filterType: "Number",
		criteria: {
			start: 100
		},
		nonRemovable: true
	},
	"/product/logistics/weight/weightValue": {
		filterType: "Number",
		nonRemovable: true
	},
	"/product/logistics/weight/weightUnit": {
		filterType: "Number",
		nonRemovable: true
	},
	"/product/targetGroup": {
		filterType: "Enumeration",
		criteria: {
			selectedValues: ["women", "men"]
		},
		nonRemovable: true
	},
	"/product/dateField": {
		filterType: "Date",
		type: "Date",
		criteria: {
			end: new Date()
		},
		nonRemovable: true
	}
};
