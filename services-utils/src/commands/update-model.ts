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

import { inspect } from "node:util";

import JSZip from "jszip";

import type { Model } from "@com.mgmtp.a12.base/base-model-api";

import { type BaseUrlOption, applyRoleAnnotation } from "../utils/index.js";

interface UpdateModelOptions extends BaseUrlOption {
	model: Model;
}

export async function handleUpdateModel(options: UpdateModelOptions): Promise<void> {
	console.log("Updating model configuration:", options.model.header?.id || "unknown");

	try {
		await singleModelUploadRequest(options, applyRoleAnnotation(options.model));
		console.log("Model updated successfully");
	} catch (e) {
		console.error("Failed to update model:", inspect(e, { depth: 10 }));
		throw e;
	}
}

async function singleModelUploadRequest(options: BaseUrlOption, model: any): Promise<string[]> {
	const arrayBuffer = await createArrayBuffer([model]);

	try {
		const response = await fetch(`${options.baseUrl}/api/v2/models`, {
			method: "PUT",
			body: arrayBuffer,
			headers: { Accept: "*/*" }
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}, text: ${await response.text()}`);
		}

		return response.json();
	} catch (e) {
		console.error("Request failed:", inspect(e, { depth: 10 }));
		throw e;
	}
}

async function createArrayBuffer(models: any[]): Promise<ArrayBuffer> {
	const zip = new JSZip();
	models.forEach((model) => zip.file(`${model.header.id}.json`, JSON.stringify(model)));

	return zip
		.generateAsync({ type: "blob", compression: "DEFLATE" })
		.then((blob) => (blob as AugmentedBlob).arrayBuffer());
}

interface AugmentedBlob extends Blob {
	arrayBuffer(): Promise<ArrayBuffer>;
}
