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
import type { DocumentModel, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { MultiSelectModelUtils } from "../multi-select.js";
import { createDocumentModelService } from "../document-model-service.js";

/** @internal */
export namespace DocumentModelUtils {
	export function isAttachment(element: DocumentModel.Element): element is DocumentModel.Group {
		return element.type === "Group" && element.usageType === "attachment";
	}

	export function isAlphabeticalSortedField(documentModel: DocumentModel, modelPath: ModelPath): boolean {
		const element = createDocumentModelService(documentModel).getByPath(modelPath);

		return (
			element.type === "Field" &&
			element.fieldType.type === "EnumerationType" &&
			!!element.fieldType.alphabeticalSorting
		);
	}

	export function toEntityInstancePath(element: DocumentModel.Element, modelPath: ModelPath): EntityInstancePath {
		if (MultiSelectModelUtils.isInstance(element)) {
			return modelPath.map((segment, segmentIndex) => ({
				...segment,
				index: segmentIndex === modelPath.length - 1 ? 0 : 1
			}));
		}

		return modelPath.map((e) => ({ ...e, index: 1 }));
	}

	export function isLocalizableFieldType(fieldType: string): boolean {
		return ["BooleanType", "ConfirmType", "EnumerationType"].includes(fieldType);
	}

	export function isFormattableFieldType(fieldType: string): boolean {
		return [
			"NumberType",
			"DateType",
			"DateTimeType",
			"TimeType",
			"DateFragmentType",
			"DateRangeType",
			"StringType",
			"CustomFieldType"
		].includes(fieldType);
	}

	export function getElementPathForId(elementRef: string, documentModel: DocumentModel): string {
		return ModelPath.toString(getElementPath(elementRef, documentModel));
	}

	export function getElementPath(elementRef: string, documentModel: DocumentModel): ModelPath {
		return createDocumentModelService(documentModel).getPathById(elementRef);
	}

	/**
	 * Resolve a `DocumentModel.Element` from a stringified `ModelPath` (e.g. `"/product/name"`).
	 *
	 * Empty string short-circuits to `modelRoot`, so callers that pass `""` for a top-level
	 * filter still get a valid element back.
	 */
	export function findElementByPath(documentModel: DocumentModel, path: string): DocumentModel.Element {
		if (path === "") {
			return documentModel.content.modelRoot;
		}

		return createDocumentModelService(documentModel).getByPath(ModelPath.fromString(path));
	}
}
