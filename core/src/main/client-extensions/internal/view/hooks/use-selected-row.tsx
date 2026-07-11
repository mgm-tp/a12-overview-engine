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

import { useSelector } from "react-redux";

import { ActivityMap, type Activity, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

/**
 * Determines the currently selected row by finding a sub-activity whose descriptor instance
 * matches one of the document IDs in `data`.
 *
 * When multiple rows in `data` share the same `id` (exclude-mode duplicates), this hook
 * returns the FIRST match. Hosts that need to disambiguate the visible selection should
 * override `selected`/`highlighted` via `rowStyling`.
 *
 * @internal
 */
export function useSelectedRow(params: { activityId: string; data: (Activity.Data.Document | undefined)[] }) {
	const { activityId, data } = params;
	const activityMap = useSelector(ActivitySelectors.activities());
	const subActivity = ActivityMap.toList(activityMap).find((activity) => activity.initiatingActivityId === activityId);

	if (subActivity === undefined) {
		return undefined;
	}

	return data.find((document) => subActivity.descriptor.instance === document?.id)?.id;
}
