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
import { useSelector } from "react-redux";

import type { RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";
import { ActivityMap, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import type { JSONDocument } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

/**
 * Returns a `rowStyling` callback for the PersonEquipmentOverview that highlights the row
 * whose `linkId` matches the `linkId` stored in the child activity's descriptor.
 *
 * When there is no sub-activity or no `linkId` in the descriptor (e.g. for PersonOverview
 * and PersonWithLinkOverview), the returned callback does nothing.
 */
export function useEquipmentRowStyling(activityId: string): RowStyleGetter<JSONDocument> {
	const activityMap = useSelector(ActivitySelectors.activities());
	const subActivity = ActivityMap.toList(activityMap).find((a) => a.initiatingActivityId === activityId);
	const linkId = subActivity?.descriptor?.linkId;
	const documentId = subActivity?.descriptor.instance;

	return React.useCallback(
		({ row }) => {
			const selected = row.linkId === linkId && row.id === documentId;

			return { selected, highlighted: selected };
		},
		[linkId, documentId]
	);
}
