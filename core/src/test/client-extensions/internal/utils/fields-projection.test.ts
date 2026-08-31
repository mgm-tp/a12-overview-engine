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

import {
	getProjectedLinks,
	getProjectedFields
} from "../../../../main/client-extensions/internal/utils/fields-projection.js";
import {
	createField,
	createGroup,
	createColumn,
	createQueryLink,
	createQueryModel,
	createLinkedColumn,
	createDocumentModel,
	createOverviewModel,
	createExpressionColumn,
	createRelationshipModel
} from "../../../utils.js";

const personDM = createDocumentModel(
	[
		createField("StringType", "firstName"),
		createField("StringType", "lastName"),
		createGroup({
			id: "photo",
			repeatability: 1,
			usageType: "attachment",
			elements: [
				createField("StringType", "original_filename"),
				createField("StringType", "internal_filename"),
				createField("StringType", "attachment_id"),
				createField("StringType", "mime_type"),
				createField("StringType", "description")
			]
		})
	],
	"PersonDM"
);

const addressDM = createDocumentModel([createField("StringType", "street")], "AddressDM");
const deptDM = createDocumentModel([createField("StringType", "deptName")], "DeptDM");

const personAddrRM = createRelationshipModel("PersonAddrRM", "address", "AddressDM");
const personDeptRM = createRelationshipModel("PersonDeptRM", "dept", "DeptDM");
const deptParentRM = createRelationshipModel("DeptParentRM", "parent", "DeptDM");

describe("fields-projection", () => {
	it("should collect root fields (reference, attachment) and skip linked columns", () => {
		const om = createOverviewModel([
			createColumn("firstName", false, "firstName"),
			createExpressionColumn("greeting", 'kontext(root) { [firstName] ". " [lastName] }'),
			createColumn("photo", false, "photo"),
			createLinkedColumn("street", [{ relationship: "PersonAddrRM", targetRole: "address", type: "CHILD" as const }])
		]);

		const result = getProjectedFields(om, personDM, undefined);

		expect(result).toContain("/root/firstName");
		expect(result).toContain("/root/lastName");
		expect(result).toContain("/root/photo/original_filename");
		expect(result).toContain("/root/photo/mime_type");
		expect(result?.every((f) => !f.includes("street"))).toBe(true);
	});

	it("should return undefined for root fields in exclude mode", () => {
		const om = createOverviewModel([createColumn("firstName", false, "firstName")]);

		expect(getProjectedFields(om, personDM, createQueryModel({ exclude: true }))).toBeUndefined();
	});

	it("should share projected fields when multiple links target the same document model", () => {
		const om = createOverviewModel([
			createLinkedColumn("deptName", [{ relationship: "PersonDeptRM", targetRole: "dept", type: "CHILD" as const }]),
			createLinkedColumn("deptName", [{ relationship: "DeptParentRM", targetRole: "parent", type: "CHILD" as const }])
		]);

		const result = getProjectedLinks(
			om,
			personDM,
			[deptDM],
			[personDeptRM, deptParentRM],
			createQueryModel({
				links: [createQueryLink("PersonDeptRM", "dept", { links: [createQueryLink("DeptParentRM", "parent")] })]
			})
		);

		const deptLink = result?.[0];
		const parentLink = deptLink?.links?.[0];

		expect(deptLink?.fields).toContain("/root/deptName");
		expect(parentLink?.fields).toContain("/root/deptName");
		// Same DM -> identical projected field set
		expect(deptLink?.fields).toEqual(parentLink?.fields);
	});

	it("should project root columns onto exclude link and NOT leak them in non-exclude", () => {
		const om = createOverviewModel([
			createColumn("firstName", false, "firstName"),
			createLinkedColumn("street", [{ relationship: "PersonAddrRM", targetRole: "address", type: "CHILD" as const }])
		]);

		// Non-exclude: root columns must NOT appear on the address link
		const nonExcludeResult = getProjectedLinks(
			om,
			personDM,
			[addressDM],
			[personAddrRM],
			createQueryModel({ links: [createQueryLink("PersonAddrRM", "address")] })
		);

		expect(nonExcludeResult?.[0].fields).toContain("/root/street");
		expect(nonExcludeResult?.[0].fields).not.toContain("/root/firstName");

		// Exclude: root columns projected onto the exclude link's target
		const teamRM = createRelationshipModel("TeamRM", "team", personDM.header.id);

		const excludeResult = getProjectedLinks(
			om,
			personDM,
			undefined,
			[teamRM],
			createQueryModel({ exclude: true, links: [createQueryLink("TeamRM", "team")] })
		);

		expect(excludeResult).toHaveLength(1);
		expect(excludeResult?.[0].fields).toContain("/root/firstName");
	});
});
