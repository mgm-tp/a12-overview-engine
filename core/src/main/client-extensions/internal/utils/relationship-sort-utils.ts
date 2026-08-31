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

import type { Query, RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentModelUtils } from "../../../models/internal/shared.js";
import type { OverviewModel } from "../../../overview-model.js";
import { getModelIdFromColumn } from "../../../services/relationship/index.js";
import type { RelationshipField } from "../../../store/index.js";

/**
 * Converts a linkReferences + elementRef into a nested RelationshipField
 * suitable for relationship-based sorting.
 *
 * @internal
 */
export function buildRelationshipField(
	column: OverviewModel.LinkColumn.Reference,
	documentModel: DocumentModel,
	relationshipModels?: RelationshipModel[],
	subDocumentModels?: DocumentModel[]
): RelationshipField | undefined {
	const { linkReferences, elementRef } = column;

	if (!linkReferences.length || !relationshipModels) {
		return undefined;
	}

	const targetModelId = getModelIdFromColumn(column, relationshipModels);
	const targetDocumentModel = targetModelId
		? [documentModel, ...(subDocumentModels ?? [])].find((m) => m.header.id === targetModelId)
		: undefined;

	if (!targetDocumentModel) {
		throw new Error(`Could not find target document model for relationship field with elementRef: "${elementRef}"`);
	}

	const terminalField = DocumentModelUtils.getElementPathForId(elementRef, targetDocumentModel);

	return linkReferences.reduceRight<RelationshipField | string>(
		(sortBy, link) => ({ relationshipModel: link.relationship, targetRole: link.targetRole, sortBy }),
		terminalField
	) as RelationshipField;
}

/**
 * Maps internal RelationshipField to DS Query.RelationshipOrder.
 *
 * @internal
 */
export function toQueryRelationshipOrder(
	rf: RelationshipField,
	fieldOrder: { direction: Query.Direction; nullHandling?: Query.NullHandling; ignoreCase?: boolean }
): Query.RelationshipOrder {
	const base = {
		relationshipModel: rf.relationshipModel,
		targetRole: rf.targetRole
	};

	if (typeof rf.sortBy === "string") {
		return {
			...base,
			sortBy: {
				field: rf.sortBy,
				...fieldOrder
			}
		};
	}

	return { ...base, sortBy: toQueryRelationshipOrder(rf.sortBy, fieldOrder) };
}

/**
 * Checks if two RelationshipField objects are structurally equal.
 *
 * @internal
 */
export function relationshipFieldEquals(a: RelationshipField, b: RelationshipField): boolean {
	if (a.relationshipModel !== b.relationshipModel || a.targetRole !== b.targetRole) {
		return false;
	}

	if (typeof a.sortBy === "string" && typeof b.sortBy === "string") {
		return a.sortBy === b.sortBy;
	}

	if (typeof a.sortBy !== "string" && typeof b.sortBy !== "string") {
		return relationshipFieldEquals(a.sortBy, b.sortBy);
	}

	return false;
}
