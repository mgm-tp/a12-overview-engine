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

import type { Activity } from "@com.mgmtp.a12.client/client-core";

export namespace EnumeratedStringDataHolder {
	const FEATURE = "overview";
	const TYPE = "enumeratedString";

	export interface Data {
		readonly fieldPath: string;
		readonly keyword: string;
		readonly candidates: string[];
		readonly fullSize?: number;
		readonly reload?: boolean;
		readonly modelId?: string;
	}

	/** Returns true if the given data holder holds enumerated string data. */
	export function isInstance(dataHolder: Activity.DataHolder): dataHolder is Activity.DataHolder<Data> {
		const { feature, type, fieldPath } = dataHolder.descriptor;

		return feature === FEATURE && type === TYPE && fieldPath !== undefined;
	}

	export function createDescriptor(fieldPath: string): Activity.DataHolderDescriptor {
		return { feature: FEATURE, type: TYPE, fieldPath };
	}

	/**
	 * @internal
	 * Utility function to type guard a enumerated string filter data holder and identify it by field path
	 */
	export function isInstanceByFieldPath(fieldPath: string) {
		return (dataHolder: Activity.DataHolder): dataHolder is Activity.DataHolder<Data> =>
			isInstance(dataHolder) && dataHolder.descriptor.fieldPath === fieldPath;
	}
}
