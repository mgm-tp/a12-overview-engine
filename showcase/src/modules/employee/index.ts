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

import { createPresetFilterMiddleware } from "../common/middleware.js";
import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";

import { EmployeeSagas } from "./sagas.js";

const DESCRIPTOR = { showcase: "employee", feature: "preset-filter" };

function onClick(dispatch: Dispatch) {
	dispatch(
		ApplicationActions.startMainActivityRequested({
			action: ActivityActions.create({ activityDescriptor: DESCRIPTOR }),
			descriptor: {}
		})
	);
}

export const EmployeeModule: DynamicConfiguration = {
	id: "Employee",
	sagas: () => EmployeeSagas,
	middlewares: () => [createPresetFilterMiddleware(employeePresetFilter, DESCRIPTOR)],
	menus: (state) => {
		const activity = ActivitySelectors.activitiesByDescriptor(DESCRIPTOR)(state).at(0);

		return [
			{
				id: "menu.employee",
				label: { key: "application.menu.employee" },
				selected: activity !== undefined,
				action: onClick
			}
		];
	},
	flows: [
		{
			name: "EmployeeFlow",
			scenes: [
				{
					name: "ShowcaseOverview",
					matches: (d) => d.showcase === DESCRIPTOR.showcase && d.feature === DESCRIPTOR.feature && !d.selectedEmployee,
					sceneChange: {
						onEnter: [
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ShowcaseOverview,
								models: [{ modelType: "overview", name: "EmployeeOM" }]
							}
						]
					}
				},
				{
					name: "EmployeeProjectOverview",
					matches: (d) => d.model === "EmployeeDM" && !!d.selectedEmployee,
					sceneChange: {
						onEnter: [
							{
								type: "DYNAMIC_ADD_VIEW",
								region: "/CONTENT",
								component: ShowcaseOverview,
								models: [{ modelType: "overview", name: "EmployeeProjectOM" }]
							}
						]
					}
				}
			]
		}
	]
};

const employeePresetFilter = {
	"/Group/ActualSalary": {
		filterType: "Number",
		criteria: {
			start: 20000
		}
	},
	"/Group/ActualSalaryUnit": {
		filterType: "Enumeration",
		type: "EnumeratedSuffix",
		criteria: {
			selectedValues: ["EUR"]
		}
	}
};
