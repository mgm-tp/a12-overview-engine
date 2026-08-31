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

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	buildRelationshipField,
	relationshipFieldEquals,
	toQueryRelationshipOrder
} from "../../../../main/client-extensions/internal/utils/relationship-sort-utils.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import type { RelationshipField } from "../../../../main/store/index.js";
import { createField, createLinkedColumn, createDocumentModel, createRelationshipModel } from "../../../utils.js";

const personDM = createDocumentModel([], "PersonDM");
const contractDM = createDocumentModel([createField("StringType", "myField")], "ContractDM");
const deptDM = createDocumentModel([createField("StringType", "deptName")], "DeptDM");

const contractRM = createRelationshipModel("PersonContractRM", "contract", "ContractDM");
const personDeptRM = createRelationshipModel("PersonDeptRM", "department", "DeptDM");
const deptParentRM = createRelationshipModel("DeptParentRM", "parent", "DeptDM");

const contractColumn = createLinkedColumn("myField", [
	{ relationship: "PersonContractRM", targetRole: "contract", type: "CHILD" }
]) as OverviewModel.LinkColumn.Reference;

describe("com.mgmtp.a12.overview-engine.client-extensions.utils.relationship-sort-utils", () => {
	describe("buildRelationshipField", () => {
		it("returns undefined when linkReferences is empty", () => {
			const column = {
				id: "c",
				width: 1,
				linkReferences: [],
				elementRef: "myField"
			} as OverviewModel.LinkColumn.Reference;
			expect(buildRelationshipField(column, personDM, [contractRM], [contractDM])).toBeUndefined();
		});

		it("returns undefined when relationshipModels is undefined", () => {
			expect(buildRelationshipField(contractColumn, personDM, undefined, [contractDM])).toBeUndefined();
		});

		it("builds a flat RelationshipField for a single CHILD link", () => {
			expect(buildRelationshipField(contractColumn, personDM, [contractRM], [contractDM])).toEqual({
				relationshipModel: "PersonContractRM",
				targetRole: "contract",
				sortBy: "/root/myField"
			});
		});

		it("builds a 2-level nested RelationshipField", () => {
			const column = createLinkedColumn("deptName", [
				{ relationship: "PersonDeptRM", targetRole: "department", type: "CHILD" },
				{ relationship: "DeptParentRM", targetRole: "parent", type: "CHILD" }
			]) as OverviewModel.LinkColumn.Reference;

			expect(buildRelationshipField(column, personDM, [personDeptRM, deptParentRM], [deptDM])).toEqual({
				relationshipModel: "PersonDeptRM",
				targetRole: "department",
				sortBy: {
					relationshipModel: "DeptParentRM",
					targetRole: "parent",
					sortBy: "/root/deptName"
				}
			});
		});

		it("throws when target document model is not found in main DM or subDocumentModels", () => {
			expect(() => buildRelationshipField(contractColumn, personDM, [contractRM], [deptDM])).toThrow(
				/Could not find target document model/
			);
		});
	});

	describe("toQueryRelationshipOrder", () => {
		const fieldOrder = {
			direction: Query.Direction.ASC,
			nullHandling: Query.NullHandling.NULLS_LAST,
			ignoreCase: false
		};

		it("maps a flat RelationshipField to Query.RelationshipOrder", () => {
			const rf: RelationshipField = {
				relationshipModel: "PersonContractRM",
				targetRole: "contract",
				sortBy: "/root/myField"
			};

			expect(toQueryRelationshipOrder(rf, fieldOrder)).toEqual({
				relationshipModel: "PersonContractRM",
				targetRole: "contract",
				sortBy: { field: "/root/myField", ...fieldOrder }
			});
		});

		it("maps a 2-level nested RelationshipField recursively", () => {
			const rf: RelationshipField = {
				relationshipModel: "PersonDeptRM",
				targetRole: "department",
				sortBy: {
					relationshipModel: "DeptParentRM",
					targetRole: "parent",
					sortBy: "/root/deptName"
				}
			};

			expect(toQueryRelationshipOrder(rf, fieldOrder)).toEqual({
				relationshipModel: "PersonDeptRM",
				targetRole: "department",
				sortBy: {
					relationshipModel: "DeptParentRM",
					targetRole: "parent",
					sortBy: { field: "/root/deptName", ...fieldOrder }
				}
			});
		});
	});

	describe("relationshipFieldEquals", () => {
		const flat: RelationshipField = {
			relationshipModel: "PersonContractRM",
			targetRole: "contract",
			sortBy: "/root/myField"
		};

		const nested: RelationshipField = {
			relationshipModel: "PersonDeptRM",
			targetRole: "department",
			sortBy: { relationshipModel: "DeptParentRM", targetRole: "parent", sortBy: "/root/deptName" }
		};

		it("returns true for identical flat fields", () => {
			expect(relationshipFieldEquals(flat, { ...flat })).toBe(true);
		});

		it("returns false when relationshipModel differs", () => {
			expect(relationshipFieldEquals(flat, { ...flat, relationshipModel: "OtherRM" })).toBe(false);
		});

		it("returns false when targetRole differs", () => {
			expect(relationshipFieldEquals(flat, { ...flat, targetRole: "otherRole" })).toBe(false);
		});

		it("returns false when sortBy string differs", () => {
			expect(relationshipFieldEquals(flat, { ...flat, sortBy: "/root/otherField" })).toBe(false);
		});

		it("returns false when sortBy types are mixed (string vs nested)", () => {
			expect(
				relationshipFieldEquals(
					{ relationshipModel: "R", targetRole: "r", sortBy: "/root/f" },
					{
						relationshipModel: "R",
						targetRole: "r",
						sortBy: { relationshipModel: "R2", targetRole: "r2", sortBy: "/root/f" }
					}
				)
			).toBe(false);
		});

		it("returns true for identical nested fields", () => {
			expect(
				relationshipFieldEquals(nested, {
					...nested,
					sortBy: { ...(nested.sortBy as RelationshipField) }
				})
			).toBe(true);
		});
	});
});
