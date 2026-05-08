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

import { it, expect, describe } from "vitest";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import {
	type GroupInstance,
	type EntityInstancePath,
	type FieldInstanceValue
} from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentUtils } from "../../../main/models/internal/shared.js";

describe("com.mgmtp.a12.overview-engine.models.utils.document-utils", () => {
	const basicJSONObject: GroupInstance = {
		id: "0",
		root: {
			array: [{ value: 1 }, { value: null }],

			nestedObject: {
				nestedNumber: 3,
				nestedString: "ABC"
			},

			string: "XYZ",
			number: 4,
			boolean: true,
			date: new Date(2020, 0, 1),
			null: null,
			undefined: undefined
		}
	};

	function toDocumentPath(path: string | EntityInstancePath): EntityInstancePath {
		return typeof path === "string"
			? ModelPath.fromString(path).map(({ elementName }) => ({ elementName, index: 1 }))
			: path;
	}

	describe("DocumentUtils", () => {
		describe("getValue", () => {
			const testCases: [string | EntityInstancePath, FieldInstanceValue | object][] = [
				["id", "0"],
				["/root/boolean", true],
				["/root/string", "XYZ"],
				["/root/number", 4],
				["/root/date", new Date(2020, 0, 1)],
				["/root/null", null],
				["/root/undefined", null],

				[
					"/root/nestedObject",
					{
						nestedNumber: 3,
						nestedString: "ABC"
					}
				],
				["/root/nestedObject/nestedNumber", 3],
				["/root/nestedObject/nestedString", "ABC"],

				[
					[
						{ elementName: "root", index: 1 },
						{ elementName: "array", index: 0 }
					],
					[{ value: 1 }, { value: null }]
				],
				[
					[
						{ elementName: "root", index: 1 },
						{ elementName: "array", index: 1 }
					],
					{ value: 1 }
				],
				[
					[
						{ elementName: "root", index: 1 },
						{ elementName: "array", index: 2 }
					],
					{ value: null }
				]
			];

			it("should work properly", () => {
				testCases.forEach(([path, expected]) => {
					const result = DocumentUtils.getValue(basicJSONObject, toDocumentPath(path));

					expect(result).toEqual(expected);
				});
			});
		});
	});
});
