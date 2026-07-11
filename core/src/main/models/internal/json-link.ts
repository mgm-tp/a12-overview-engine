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

import { DocumentUtils } from "./shared.js";
import type { JSONDocument } from "./json-document.js";

/** Link metadata without the resolved document. Stored as entries in {@link Links}. */
export interface JSONLinkRef {
	readonly linkId: string;
	readonly targetDocRef: string;
	readonly documentModelName: string;
}
export namespace JSONLinkRef {
	export function isInstance(object: unknown): object is JSONLinkRef {
		return (
			object !== null &&
			typeof object === "object" &&
			"linkId" in object &&
			typeof object.linkId === "string" &&
			"targetDocRef" in object &&
			typeof object.targetDocRef === "string" &&
			"documentModelName" in object &&
			typeof object.documentModelName === "string"
		);
	}
}

/** A resolved document link — link metadata combined with the target document. */
export interface JSONLink extends JSONLinkRef {
	readonly document: JSONDocument;
}
export namespace JSONLink {
	export function isInstance(object: unknown): object is JSONLink {
		return JSONLinkRef.isInstance(object) && "document" in object && DocumentUtils.isGroupInstance(object.document);
	}
}
