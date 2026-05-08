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

import { Activity, type View, ViewViews, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

export interface SingleDocumentData {
	readonly document: Activity.Data.Document;
}
export namespace SingleDocumentData {
	export function isInstance(data: object | undefined): data is SingleDocumentData {
		const { document }: Partial<SingleDocumentData> = data || {};

		return Activity.Data.Document.isInstance(document);
	}
}

export interface SimpleFormActivity extends Activity {
	readonly descriptor: SimpleFormActivity.Descriptor;
}

export namespace SimpleFormActivity {
	export interface Descriptor extends Omit<Activity.Descriptor, "instance" | "model"> {
		readonly instance: string;
		readonly model: string;
	}
	export namespace Descriptor {
		export function isAssignableFrom(descriptor: Activity.Descriptor): descriptor is Descriptor {
			return typeof descriptor.instance === "string" && typeof descriptor.model === "string";
		}

		export function create(params: { instance: string; model: string }): Descriptor {
			return params;
		}
	}

	export type DataHolder = Activity.DataHolder<FormDataHolder.Data>;
	export namespace FormDataHolder {
		export function isAssignableFrom(dataHolder: Activity.DataHolder): dataHolder is DataHolder {
			return Descriptor.isAssignableFrom(dataHolder.descriptor);
		}

		export type Data = SingleDocumentData;

		export interface Descriptor extends Activity.DataHolderDescriptor, SimpleFormActivity.Descriptor {}
		export namespace Descriptor {
			export function isAssignableFrom(descriptor: Activity.DataHolderDescriptor): descriptor is Descriptor {
				return SimpleFormActivity.Descriptor.isAssignableFrom(descriptor);
			}
		}
	}
}

export function withSingleDocumentActivityContext<P extends View>(
	Component: React.ComponentType<P> | React.FunctionComponent<P>
): React.FC<P> {
	return (props) => {
		const activity = useSelector(ActivitySelectors.activityById(props.activityId));

		if (!activity) {
			return null;
		}

		const data = Activity.findDefaultDataHolder(activity)?.data;

		// Prevent rendering if data is empty
		if (!data || Object.keys(data ?? {}).length === 0 || !SingleDocumentData.isInstance(data)) {
			return null;
		}

		return (
			<ViewViews.ActivityContext.Provider value={{ activityId: props.activityId }}>
				<Component {...props} />
			</ViewViews.ActivityContext.Provider>
		);
	};
}
