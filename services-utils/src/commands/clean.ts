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

import type { CommandModule } from "yargs";

import { JsonRpc2Response, type QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	rpcRequest,
	BaseUrlOption,
	PresetsOption,
	listDocuments,
	type PresetMap,
	deleteDocument,
	resolvePresets
} from "../utils/index.js";

interface Options extends PresetsOption, BaseUrlOption {}

export const cleanCommand: CommandModule<unknown, Options> = {
	command: "clean [presets..]",
	describe: "Clean documents of all or specific preset(s)",
	builder: (yargs) => yargs.positional("presets", PresetsOption).option(BaseUrlOption),
	handler: handleClean
};

export async function handleClean(options: Options) {
	const listDocumentsRequests = resolvePresets({ ...options, presetMap }).map((documentModel) =>
		listDocuments(documentModel)
	);
	const listDocumentsResponses = (await rpcRequest(options, listDocumentsRequests)) as QueryJsonRpc2Response<
		QueryJsonRpc2Response.DocumentEntry[]
	>[];

	if (JsonRpc2Response.hasErrors(listDocumentsResponses)) {
		console.error(inspect(listDocumentsResponses, { depth: 10 }));
		process.exit(1);
	}

	const deleteDocumentRequests = listDocumentsResponses.flatMap((response) => {
		return response.result.entries.map(({ docRef }) => deleteDocument(getActualDocRef(docRef)));
	});

	const deleteDocumentResponses = await rpcRequest(options, deleteDocumentRequests);

	if (JsonRpc2Response.hasErrors(deleteDocumentResponses)) {
		console.error(inspect(deleteDocumentResponses, { depth: 10 }));
		process.exit(1);
	}
}

function getActualDocRef(docRef: string): string {
	const segments = docRef.split("/");

	if (segments.length === 3) {
		return segments.slice(1).join("/");
	}

	return docRef;
}

const presetMap: PresetMap<string> = {
	person: ["PersonDM", "ContractDM", "EquipmentDM", "PersonDepartmentDM"],
	bundle: ["BundleDM"],
	employee: ["EmployeeDM", "DepartmentDM"],
	product: ["ProductDM"],
	cdm: [
		"Address-document",
		"BusinessPartner-document",
		"CoInsurerAdditionalFields",
		"Contract-document",
		"NaturalPerson-document",
		"NaturalPersonCDMNoRepeatable"
	]
};
