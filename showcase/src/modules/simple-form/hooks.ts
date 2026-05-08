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
import { get } from "lodash-es";
import { useDispatch, useSelector } from "react-redux";

import { Activity, ViewViews, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { assert } from "../../utils.js";

import { SimpleFormActions } from "./actions.js";
import { SimpleFormActivity } from "./activity.js";

function useActivityId(): string {
	const activityId = React.useContext(ViewViews.ActivityContext)?.activityId;

	if (activityId === undefined) {
		throw new Error("Activity id not found");
	}

	return activityId;
}

export function useFormDataHolder(): SimpleFormActivity.DataHolder {
	const activityId = useActivityId();
	const activity = useSelector(ActivitySelectors.activityById(activityId));

	return React.useMemo(() => {
		assert(activity !== undefined, "Activity not found");

		const dataHolder = Activity.findDefaultDataHolder(activity);
		assert(dataHolder && SimpleFormActivity.FormDataHolder.isAssignableFrom(dataHolder), "Data holder not found");

		return dataHolder;
	}, [activity]);
}

export function useValue<Value>(path: string): [Value, (newValue: Value) => void] {
	const dispatch = useDispatch();
	const { data = {} } = useFormDataHolder();
	const activityId = useActivityId();

	return React.useMemo(() => {
		return [
			get(data, `document.${path}`) as Value,
			(newValue) => dispatch(SimpleFormActions.onValueChanged({ activityId, path, value: newValue }))
		];
	}, [activityId, data, dispatch, path]);
}
