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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { QueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";
import { Expression, ExpressionBuilder } from "@com.mgmtp.a12.expression/expression-core";
import type { Query, Attachment, RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { OverviewModel } from "../../../overview-model.js";
import { getModelIdFromColumn, getTargetDocumentModelIdByLink } from "../../../services/relationship/index.js";
import {
	DocumentModelUtils,
	MultiSelectModelUtils,
	type DocumentModelService,
	createDocumentModelService
} from "../../../models/internal/shared.js";

/** @experimental */
export function getProjectedFields(
	overviewModel: OverviewModel,
	documentModel: DocumentModel,
	queryModel: QueryModel | undefined
): string[] | undefined {
	// Exclude mode: root document fields are not projected
	if (queryModel?.content.exclude) {
		return undefined;
	}

	const fieldSet = new Set<string>();
	const documentModelService = createDocumentModelService(documentModel);

	collectRootColumnFields(overviewModel.content.columns, documentModelService, fieldSet);

	return Array.from(fieldSet);
}

/** @experimental */
export function getProjectedLinks(
	overviewModel: OverviewModel,
	documentModel: DocumentModel,
	subDocumentModels: DocumentModel[] | undefined,
	relationshipModels: RelationshipModel[],
	queryModel: QueryModel
): Query.QueryLink[] | undefined {
	const firstLink = queryModel.content.links?.[0];
	const links = queryModel.content.exclude && firstLink ? [firstLink] : queryModel.content.links;

	if (!links?.length || !relationshipModels.length) {
		return undefined;
	}

	const { columns } = overviewModel.content;
	const documentModelService = createDocumentModelService(documentModel, subDocumentModels);
	const modelFieldsMap = new Map<string, Set<string>>();

	// Collect fields from linked columns, grouped by target document model
	collectLinkedColumnFields(columns, relationshipModels, documentModelService, modelFieldsMap);

	// Exclude mode: root columns resolve against the exclude link's target
	if (queryModel.content.exclude) {
		const fieldSet = getOrCreateFieldSet(modelFieldsMap, documentModel.header.id);
		collectRootColumnFields(columns, documentModelService, fieldSet);
	}

	return projectLinksFields(links, modelFieldsMap, relationshipModels);
}

/** Collect linked column fields, grouped by target document model. */
function collectLinkedColumnFields(
	columns: readonly OverviewModel.Column[],
	relationshipModels: RelationshipModel[],
	documentModelService: DocumentModelService,
	modelFieldsMap: Map<string, Set<string>>
) {
	for (const column of columns) {
		if (!OverviewModel.BaseLinkedColumn.isAssignableFrom(column)) {
			continue;
		}

		const modelId = getModelIdFromColumn(column, relationshipModels);

		if (!modelId) {
			continue;
		}

		const fieldSet = getOrCreateFieldSet(modelFieldsMap, modelId);

		collectColumnFields(column, documentModelService, fieldSet, modelId);
	}
}

/** Collect root (non-linked) column fields into a field set */
function collectRootColumnFields(
	columns: readonly OverviewModel.Column[],
	documentModelService: DocumentModelService,
	fieldSet: Set<string>
) {
	for (const column of columns) {
		if (OverviewModel.BaseLinkedColumn.isAssignableFrom(column)) {
			continue;
		}

		collectColumnFields(column, documentModelService, fieldSet);
	}
}

/** Resolve a column's Reference/Expression fields into a field set */
function collectColumnFields(
	column: OverviewModel.Column,
	documentModelService: DocumentModelService,
	fieldSet: Set<string>,
	modelId?: string
) {
	if (
		OverviewModel.ReferenceColumn.isAssignableFrom(column) ||
		OverviewModel.LinkColumn.Reference.isAssignableFrom(column)
	) {
		resolveElementRefFields(column.elementRef, documentModelService, modelId).forEach((f) => fieldSet.add(f));

		if (column.suffixRef) {
			resolveElementRefFields(column.suffixRef, documentModelService, modelId).forEach((f) => fieldSet.add(f));
		}
	}

	if (
		OverviewModel.ExpressionColumn.isAssignableFrom(column) ||
		OverviewModel.LinkColumn.Expression.isAssignableFrom(column)
	) {
		collectFieldsFromExpression(column.expression)
			.map(ModelPath.toString)
			.forEach((f) => fieldSet.add(f));
	}
}

function projectLinksFields(
	qmLinks: Query.QueryLink[],
	modelFieldsMap: Map<string, Set<string>>,
	relationshipModels: RelationshipModel[]
): Query.QueryLink[] {
	return qmLinks.map((link) => {
		const projectedChildren = link.links?.length
			? projectLinksFields(link.links, modelFieldsMap, relationshipModels)
			: link.links;

		const targetModelId = getTargetDocumentModelIdByLink(relationshipModels, {
			...link,
			relationship: link.relationshipModel,
			type: "CHILD"
		});

		const projectedFields = targetModelId ? modelFieldsMap.get(targetModelId) : undefined;

		const linkDocumentModelId = getTargetDocumentModelIdByLink(relationshipModels, {
			...link,
			relationship: link.relationshipModel,
			type: "LINK"
		});
		const projectedLinkDocumentFields = linkDocumentModelId ? modelFieldsMap.get(linkDocumentModelId) : undefined;

		return {
			...link,
			fields: projectedFields?.size ? Array.from(projectedFields) : link.fields,
			links: projectedChildren,
			linkDocumentFields: projectedLinkDocumentFields?.size
				? Array.from(projectedLinkDocumentFields)
				: link.linkDocumentFields
		};
	});
}

/** Resolve an element reference (Field, Attachment, MultiSelect) to field paths */
function resolveElementRefFields(
	elementRef: string,
	documentModelService: DocumentModelService,
	modelId?: string
): string[] {
	const elementPath = documentModelService.getPathById(elementRef, modelId);
	const element = documentModelService.getByPath(elementPath, modelId);

	if (element.type === "Field") {
		return [ModelPath.toString(elementPath)];
	}

	if (element.type === "Group") {
		if (DocumentModelUtils.isAttachment(element)) {
			return expandAttachmentFields(elementPath).map(ModelPath.toString);
		}

		if (MultiSelectModelUtils.isInstance(element)) {
			return expandMultiselectFields(elementPath, element).map(ModelPath.toString);
		}
	}

	return [];
}

function getOrCreateFieldSet(map: Map<string, Set<string>>, key: string): Set<string> {
	let set = map.get(key);

	if (!set) {
		set = new Set();
		map.set(key, set);
	}

	return set;
}

function collectFieldsFromExpression(expression: string): ModelPath[] {
	const fieldPaths: ModelPath[] = [];

	ExpressionBuilder.build(expression, { rootPath: [], valueParser: () => "" }).children.forEach((child) =>
		collect(child, [])
	);

	return fieldPaths;

	function collect(node: Expression.ChildNode, currentPath: ModelPath) {
		if (node.type === Expression.NodeType.FIELD) {
			fieldPaths.push([...currentPath, { elementName: node.name }]);
		}

		if (node.type === Expression.NodeType.CASE) {
			fieldPaths.push([...currentPath, { elementName: node.name }]);

			for (const child of node.children) {
				collect(child, currentPath);
			}
		}

		if (node.type === Expression.NodeType.GROUP) {
			for (const child of node.children) {
				collect(child, [...currentPath, { elementName: node.name }]);
			}
		}
	}
}

function expandAttachmentFields(modelPath: ModelPath): ModelPath[] {
	const fields = [
		"original_filename",
		"internal_filename",
		"attachment_id",
		"mime_type",
		"description"
	] satisfies (keyof Attachment)[];

	return fields.map((field) => [...modelPath, { elementName: field }]);
}

function expandMultiselectFields(modelPath: ModelPath, element: DocumentModel.Element): ModelPath[] {
	if (element.type !== "Group" || element.elements.length < 1) {
		return [];
	}

	return element.elements.map((element) => {
		return [...modelPath, { elementName: element.name }];
	});
}
