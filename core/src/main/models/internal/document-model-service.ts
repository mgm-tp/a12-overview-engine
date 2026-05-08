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

import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type ValueConversionConfig } from "@com.mgmtp.a12.utils/utils-localization";
import { DocumentServiceFactory, type DocumentModelSearchService } from "@com.mgmtp.a12.kernel/kernel-md-facade";

/** @internal */
export interface DocumentModelService {
	getByPath(path: ModelPath, modelId?: string): DocumentModel.Element;
	getPathById(id: string, modelId?: string): ModelPath;
	getConversionConfig(path: ModelPath, modelId?: string): ValueConversionConfig;
}

/** @internal */
export function createDocumentModelService(
	documentModel: DocumentModel,
	subDocumentModels?: DocumentModel[]
): DocumentModelService {
	const documentModels = [documentModel, ...(subDocumentModels ?? [])];
	const searchServiceMap = new Map<string, DocumentModelSearchService>();

	documentModels.forEach((model) => {
		searchServiceMap.set(model.header.id, new DocumentServiceFactory().getDocumentModelSearchService(model));
	});

	const getPathById = (id: string, modelId?: string): ModelPath => {
		const path = searchServiceMap.get(modelId ?? documentModel.header.id)?.getPathById(id);

		if (!path) {
			throw new Error(`Can not find the element with id: "${id}"`);
		}

		return path;
	};

	const getByPath = (path: ModelPath, modelId?: string): DocumentModel.Element => {
		const element = searchServiceMap.get(modelId ?? documentModel.header.id)?.getByPath(path);

		if (!element) {
			throw new Error(`Can not find the element with path: "${JSON.stringify(path)}"`);
		}

		return element;
	};

	const getConversionConfig = (path: ModelPath, modelId: string = documentModel.header.id): ValueConversionConfig => {
		const field = getByPath(path, modelId);
		const targetDocumentModel = documentModels.find((m) => m.header.id === modelId) ?? documentModel;

		if (field.type !== "Field") {
			throw new Error("Can not compute value conversion config for non-field model elements");
		}

		return {
			...DocumentModel.extractConversionConfig(
				field.fieldType,
				targetDocumentModel.content.modelConfig.timeZone,
				targetDocumentModel.content.modelInfo.baseYear
			),
			modelId: targetDocumentModel.header.id,
			modelPath: path
		};
	};

	return { getByPath, getPathById, getConversionConfig };
}
