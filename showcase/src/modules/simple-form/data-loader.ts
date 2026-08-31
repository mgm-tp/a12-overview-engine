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

import { Activity, type DataLoader, NEW_INSTANCE_IDENTIFIER } from "@com.mgmtp.a12.client/client-core";
import {
	Dispatcher,
	AddDocumentJsonRpc2Response,
	GetDocumentJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DocumentModel, DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { assert } from "../../utils.js";

const documentService = new DocumentServiceFactory().getDocumentService();

const language = "en";

interface SingleDocumentData {
	readonly document: Activity.Data.Document;
}

namespace SingleDocumentData {
	export function isInstance(data: object | undefined): data is SingleDocumentData {
		const { document }: Partial<SingleDocumentData> = data || {};

		return Activity.Data.Document.isInstance(document);
	}
}

type Data = SingleDocumentData;

export class SimpleFormDataLoader implements DataLoader<Data> {
	readonly name = "SimpleFormDataLoader";

	readonly parallelModelAndDataLoading = true;
	private operationCounter = 0;

	canHandle(ad: Activity.Descriptor): boolean {
		return !!ad.instance;
	}
	useActivityDescriptorModel() {
		return true;
	}

	async load(activity: Activity, getModels: Promise<DataLoader.Models>): Promise<Data> {
		if (!activity.descriptor.instance) {
			return Promise.reject("Instance must be set to load a document!");
		}

		if (activity.descriptor.instance === NEW_INSTANCE_IDENTIFIER) {
			if (!activity.descriptor.model) {
				return Promise.reject("Model must be set to create a document!");
			}

			return {
				document: {
					id: NEW_INSTANCE_IDENTIFIER,
					modelId: activity.descriptor.model
				}
			};
		}

		const [getDocumentResponse] = await Dispatcher.rpc(language, [
			{
				jsonrpc: "2.0",
				method: "GET_DOCUMENT",
				id: `${this.name}-${this.operationCounter++}`,
				params: { docRef: activity.descriptor.instance }
			}
		]);
		assert(GetDocumentJsonRpc2Response.isInstance(getDocumentResponse), "GET_DOCUMENT response is invalid!");
		const { document, docRef: id, documentModelName: modelId } = getDocumentResponse.result;

		const { documentModel: documentModelFromModelsPromise } = await getModels;

		if (!documentModelFromModelsPromise) {
			return Promise.reject("No suitable document model was provided!");
		}

		return {
			document: {
				...documentService.parseDates(document, documentModelFromModelsPromise),
				id,
				modelId
			}
		};
	}

	async save(
		activityDescriptor: Activity.Descriptor,
		data: Data,
		documentModel: DocumentModel | undefined
	): Promise<Data> {
		if (!activityDescriptor.instance) {
			return Promise.reject("Instance must be set to load a document!");
		}

		if (!SingleDocumentData.isInstance(data)) {
			return Promise.reject("Activity does not contain suitable data!");
		}

		if (documentModel === undefined) {
			return Promise.reject("No suitable document model was provided!");
		}

		if (activityDescriptor.instance === NEW_INSTANCE_IDENTIFIER) {
			return this.add(documentModel, data);
		} else {
			return this.modify(documentModel, data);
		}
	}

	private async add(documentModel: DocumentModel, data: Data): Promise<Data> {
		const { modelId, id, ...documentWithoutModelAndDocumentId } = data.document;
		const [addDocumentResponse] = await Dispatcher.rpc(language, [
			{
				jsonrpc: "2.0",
				method: "ADD_DOCUMENT",
				id: `${this.name}-${this.operationCounter++}`,
				params: {
					documentModelName: modelId,
					document: documentService.formatDates(documentWithoutModelAndDocumentId, documentModel),
					locale: language
				}
			}
		]);
		assert(AddDocumentJsonRpc2Response.isInstance(addDocumentResponse), "ADD_DOCUMENT response is invalid!");

		return { document: { ...data.document, id: addDocumentResponse.result.docRef } };
	}

	private async modify(documentModel: DocumentModel, data: Data): Promise<Data> {
		const { modelId, id, ...documentWithoutModelAndDocumentId } = data.document;

		await Dispatcher.rpc(language, [
			{
				jsonrpc: "2.0",
				method: "MODIFY_DOCUMENT",
				id: `${this.name}-${this.operationCounter++}`,
				params: {
					docRef: data.document.id,
					document: documentService.formatDates(documentWithoutModelAndDocumentId, documentModel),
					locale: language
				}
			}
		]);

		return data;
	}

	delete(): Promise<void> {
		return Promise.reject("Delete operation is not supported.");
	}
}
