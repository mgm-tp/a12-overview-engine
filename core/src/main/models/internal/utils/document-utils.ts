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

import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	type GroupInstance,
	type EntityInstancePath,
	type FieldInstanceValue
} from "@com.mgmtp.a12.kernel/kernel-md-facade";

/** @internal */
export namespace DocumentUtils {
	const documentService = new DocumentServiceFactory().getDocumentService();
	/** @internal */
	export function getValue(
		groupInstance: GroupInstance,
		instancePath: EntityInstancePath
	): GroupInstance[] | GroupInstance | FieldInstanceValue {
		return documentService.getAssignedObject(groupInstance, instancePath) ?? null;
	}

	/** @internal */
	export function isGroupInstance(element: unknown): element is GroupInstance {
		return element !== null && typeof element === "object" && !Array.isArray(element) && !(element instanceof Date);
	}

	/** @internal */
	export function isGroupInstanceArray(element: unknown): element is GroupInstance[] {
		return Array.isArray(element) && element.every(isGroupInstance);
	}

	/** @internal */
	export function isFieldInstanceValue(o: unknown): o is FieldInstanceValue {
		return (
			o === null ||
			typeof o === "string" ||
			typeof o === "number" ||
			typeof o === "boolean" ||
			o instanceof Date ||
			(Array.isArray(o) && o.every((i) => i instanceof Date))
		);
	}
}
