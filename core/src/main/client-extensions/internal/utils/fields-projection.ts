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
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { Expression, ExpressionBuilder } from "@com.mgmtp.a12.expression/expression-core";

import { OverviewModel } from "../../../overview-model.js";
import {
	DocumentModelUtils,
	MultiSelectModelUtils,
	createDocumentModelService
} from "../../../models/internal/shared.js";

/** @experimental */
export function collectFieldsProjection(
	overviewModel: OverviewModel,
	documentModel: DocumentModel
): string[] | undefined {
	const fields: string[] = [];
	const { columns } = overviewModel.content;

	const documentModelService = createDocumentModelService(documentModel);

	for (const column of columns) {
		if (OverviewModel.ReferenceColumn.isAssignableFrom(column)) {
			const elementPath = documentModelService.getPathById(column.elementRef);
			const element = documentModelService.getByPath(elementPath);

			if (element.type === "Field") {
				fields.push(ModelPath.toString(elementPath));
			} else if (element.type === "Group") {
				if (DocumentModelUtils.isAttachment(element)) {
					fields.push(...expandAttachmentFields(elementPath).map(ModelPath.toString));
				} else if (MultiSelectModelUtils.isInstance(element)) {
					fields.push(...expandMultiselectFields(elementPath, element).map(ModelPath.toString));
				}
			}

			if (column.suffixRef) {
				const suffixElementPath = documentModelService.getPathById(column.suffixRef);
				const suffixElement = documentModelService.getByPath(suffixElementPath);

				if (suffixElement.type === "Field") {
					fields.push(ModelPath.toString(suffixElementPath));
				}
			}
		}

		if (OverviewModel.ExpressionColumn.isAssignableFrom(column)) {
			fields.push(...collectFieldsFromExpression(column.expression).map(ModelPath.toString));
		}
	}

	return Array.from(new Set(fields));
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
