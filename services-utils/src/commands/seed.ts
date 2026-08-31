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

import fs from "node:fs";
import FsPromise from "node:fs/promises";
import Path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";

import { set } from "lodash-es";
import type { CommandModule } from "yargs";

import { JsonRpc2Response, type JsonRpc2Request } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { AttachmentUploadV2, type AttachmentHeader } from "@com.mgmtp.a12.dataservices/dataservices-access";

import CDMRequest from "../utils/data/cdmRequests.json" with { type: "json" };
import ProductData from "../utils/data/product.json" with { type: "json" };
import {
	addRequest,
	rpcRequest,
	BaseUrlOption,
	PresetsOption,
	type PresetMap,
	resolvePresets,
	type RequestsCreator,
	createPeopleWithLinks,
	createBundlesWithLinks,
	createEmployeesWithLinks
} from "../utils/index.js";

import { handleClean } from "./clean.js";
import { handleWaitOn } from "./wait-on.js";

interface Options extends BaseUrlOption, PresetsOption {
	waitOn: boolean;
	whenDirNotFound?: string;
}

export const seedCommand: CommandModule<unknown, Options> = {
	command: "seed [presets..]",
	describe: "Seed the data to server for all or specific preset(s)",
	builder: (yargs) =>
		yargs.positional("presets", PresetsOption).option({
			...BaseUrlOption,
			waitOn: { type: "boolean", description: "Wait until the server is initialized", default: false },
			whenDirNotFound: { type: "string", description: "Only run the script when the target directory is empty" }
		}),
	handler: handleSeed
};

export async function handleSeed(options: Options) {
	if (options.whenDirNotFound) {
		if (fs.existsSync(options.whenDirNotFound)) {
			console.log(`Cancelled seeding because directory "${options.whenDirNotFound}" is already existed.`);
			process.exit(0);
		} else {
			console.log(`Directory "${options.whenDirNotFound}" is not existed. Continue seeding...`);
		}
	}

	if (options.waitOn) {
		await handleWaitOn(options);
	}

	await handleClean(options);

	await Promise.all(
		resolvePresets({ ...options, presetMap }).map(async (requestsCreator) => {
			const responses = await rpcRequest(options, await requestsCreator(options));

			if (!JsonRpc2Response.hasErrors(responses)) {
				return;
			}

			console.error(
				inspect(
					responses.filter((res) => !!res.error),
					{ depth: 10 }
				)
			);
			process.exit(1);
		})
	);

	console.log("== Seeding Finished ==");
}

const presetMap: PresetMap<RequestsCreator> = {
	product: [createProductRequestsCreator()],
	person: [createPeopleWithLinks],
	bundle: [createBundlesWithLinks],
	employee: [createEmployeesWithLinks],
	cdm: [() => CDMRequest as JsonRpc2Request[]]
};

const fileName = "my-product.png";
function createProductRequestsCreator(): RequestsCreator {
	return async (options) => {
		const __dirname = Path.dirname(fileURLToPath(import.meta.url));

		const directPath = Path.join(__dirname, "..", "..", "resources", fileName);
		const localPath = Path.join(process.cwd(), "resources", fileName);
		const fallbackPath = Path.join("/", "usr", "share", "services-utils", "resources", fileName);

		const candidatePaths = [directPath, localPath, fallbackPath];
		const targetPath = candidatePaths.find(fs.existsSync);

		if (!targetPath) {
			console.log(`No valid "${fileName}" file found. Checked paths: ${candidatePaths.join(", ")}`);
			throw new Error(`No valid "models" directory found. Checked paths: ${candidatePaths.join(", ")}`);
		}

		const file = new Blob([await FsPromise.readFile(targetPath)]);

		const { relativeUrl, customHeaders, body, ...rest } = AttachmentUploadV2.Request.build({
			fileName,
			documentModelName: "ProductDM",
			content: await file.arrayBuffer(),
			pathToField: "product/image"
		});
		const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/api${relativeUrl}`, {
			headers: {
				...customHeaders?.reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {}),
				"Content-Type": "image/png"
			},
			body: body as BodyInit,
			...rest
		});

		if (response.status !== 200) {
			throw new Error(`Failed to upload file: ${response.statusText}`);
		}

		const {
			attachmentId: attachment_id,
			filename: internal_filename,
			mimeType: mime_type,
			size
		} = (await response.json()) as AttachmentHeader;

		return Promise.all(
			ProductData.map((product: any, index: number) =>
				addRequest(
					"ProductDM",
					set(product, "product.image", {
						attachment_id,
						internal_filename,
						original_filename: fileName,
						mime_type,
						size
					}),
					index
				)
			)
		);
	};
}
