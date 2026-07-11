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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewModel } from "../../../overview-model.js";

export function getModelIdFromColumn(
	column: OverviewModel.BaseLinkedColumn,
	relationshipModels: RelationshipModel[]
): string | undefined {
	const lastLinkReference = column.linkReferences.at(-1);

	if (!lastLinkReference) {
		throw new Error("Invalid link reference: " + JSON.stringify(column.linkReferences));
	}

	return getTargetDocumentModelIdByLink(relationshipModels, lastLinkReference);
}

export function getTargetDocumentModelIdByLink(
	relationshipModels: RelationshipModel[],
	linkReference: OverviewModel.LinkReference
): string | undefined {
	const { relationship, targetRole, type } = linkReference;
	const relationshipModel = relationshipModels.find((model) => model.header.id === relationship);

	if (!relationshipModel) {
		return undefined;
	}

	if (type === "LINK") {
		return relationshipModel.content.linkDocumentModel ?? undefined;
	}

	return relationshipModel.content.entityCharacteristics.find((char) => char.role === targetRole)?.documentModel;
}
