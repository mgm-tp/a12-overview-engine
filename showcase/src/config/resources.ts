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

import { cloneDeep } from "lodash-es";

import {
	initializeKeys,
	type LocalizationTree,
	type LocalizationTreeMap
} from "@com.mgmtp.a12.utils/utils-localization";

const enResourceTree = {
	application: {
		title: "Overview Engine Showcase"
	},
	server: {
		connection: {
			failed: "Bad server connection!"
		}
	},
	warning: "Warning",

	showcase: {
		notifications: {
			event: {
				title: "Info",
				documentButtonMessage: `Performed "$eventName$" event on document $instanceId$`,
				eventButtonMessage: `Performed "$eventName$" event`,
				multiSelectionButtonMessage: `Performed "$eventName$" event on $numberOfDocuments$ document(s)`,
				searchEventMessage: `Perform search event with keyword: "$searchString$"`,
				documentClickMessage: `Performed click event on document $instanceId$`
			}
		},
		error: {
			server: {
				title: "Error",
				message: "Something went wrong!"
			}
		}
	}
};

const deResourceTree: LocalizationTree = {
	showcase: {
		error: {
			server: {
				title: "Fehler"
			}
		}
	}
};

export const SHOWCASE_RESOURCES: LocalizationTreeMap = { en: enResourceTree, de: deResourceTree };

export const SHOWCASE_RESOURCE_KEYS = cloneDeep(enResourceTree);

initializeKeys(SHOWCASE_RESOURCE_KEYS);
