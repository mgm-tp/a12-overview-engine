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

import { Query, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { type QueryModel, QueryIntrospection } from "../src/index.js";

const createField = (id: string, name: string): DocumentModel.Field =>
	({ type: "Field", id, name }) as unknown as DocumentModel.Field;

const createGroup = (id: string, name: string, elements: DocumentModel.Element[]): DocumentModel.Group =>
	({ type: "Group", id, name, elements }) as unknown as DocumentModel.Group;

const createDocumentModel = (id: string, modelRoot: DocumentModel.Group): DocumentModel =>
	({ header: { id }, content: { modelRoot } }) as unknown as DocumentModel;

const createRelationshipModel = (
	id: string,
	targetRole: string,
	targetDocumentModelId: string,
	linkDocumentModelId?: string
): RelationshipModel =>
	({
		header: { id },
		content: {
			entityCharacteristics: [{ role: targetRole, documentModel: targetDocumentModelId }],
			linkDocumentModel: linkDocumentModelId ?? null
		}
	}) as unknown as RelationshipModel;

const createQueryModel = (overrides: Partial<Query.QueryRoot> = {}): QueryModel => ({
	header: { modelType: "query", name: "TestQM", modelReferences: [] } as unknown as QueryModel.Header,
	content: {
		targetDocumentModel: "TestDM",
		projectionName: "document",
		paging: { size: 10 },
		...overrides
	} as Query.QueryRoot
});

const createQueryRoot = (overrides: Partial<Query.QueryRoot> = {}): Query.QueryRoot =>
	({
		targetDocumentModel: "TestDM",
		projectionName: "document",
		paging: { size: 10 },
		...overrides
	}) as Query.QueryRoot;

const OPS = Query.OPERATORS;

const exactMatch = (f: string, value: string | number): Query.ExactMatchOperator => ({
	operator: OPS.EXACT_MATCH_OPERATOR,
	field: f,
	value
});

const replaceConstraintVariables = (
	constraint: Query.Operator,
	variables: Record<string, string | number>
): Query.Operator | undefined => replaceVariables(createQueryRoot({ constraint }), variables).constraint;

describe("QueryIntrospection.getTargetDocumentModelName", () => {
	it("returns the targetDocumentModel from the query model content", () => {
		expect(QueryIntrospection.getTargetDocumentModelName(createQueryModel())).toBe("TestDM");
	});

	it("reflects the exact value set on the model", () => {
		const qm = createQueryModel({ targetDocumentModel: "AnotherDM" });
		expect(QueryIntrospection.getTargetDocumentModelName(qm)).toBe("AnotherDM");
	});
});

describe("QueryIntrospection.getPaging", () => {
	it("returns the paging configuration from the query model", () => {
		const paging = { pageNumber: 0, pageSize: 25 } as Query.Paging;
		const qm = createQueryModel({ paging });
		expect(QueryIntrospection.getPaging(qm)).toBe(paging);
	});
});

describe("QueryIntrospection.getSorting", () => {
	it("returns an empty array when no sorting is defined", () => {
		const qm = createQueryModel();
		expect(QueryIntrospection.getSorting(qm)).toEqual([]);
	});

	it("returns the sorting configuration when defined", () => {
		const sort: Query.Order[] = [
			{ field: "/lastName", direction: "ASC" } as Query.DirectFieldOrder,
			{ field: "/firstName", direction: "DESC", ignoreCase: true } as Query.DirectFieldOrder
		];
		const qm = createQueryModel({ sort });
		expect(QueryIntrospection.getSorting(qm)).toBe(sort);
	});

	it("returns relationship-based sort orders", () => {
		const sort: Query.Order[] = [
			{
				relationshipModel: "RM1",
				targetRole: "child",
				sortBy: { field: "/name", direction: "ASC" } as Query.DirectFieldOrder
			} as Query.RelationshipOrder
		];
		const qm = createQueryModel({ sort });
		expect(QueryIntrospection.getSorting(qm)).toBe(sort);
	});
});

describe("QueryIntrospection.collectModelReferences", () => {
	it("returns only a document model reference when there are no links", () => {
		const result = QueryIntrospection.collectModelReferences(createQueryModel());

		expect(result).toEqual([
			{ modelType: "document", alias: "DM", purpose: "document-model-for-query", reference: "TestDM" }
		]);
	});

	it("includes a relationship model reference for each direct link", () => {
		const qm = createQueryModel({
			links: [
				{ relationshipModel: "RM1", targetRole: "child" } as Query.QueryLink,
				{ relationshipModel: "RM2", targetRole: "child" } as Query.QueryLink
			]
		});

		const result = QueryIntrospection.collectModelReferences(qm);

		expect(result).toEqual([
			{ modelType: "document", alias: "DM", purpose: "document-model-for-query", reference: "TestDM" },
			{ modelType: "relationship", alias: "RM", purpose: "relationship-model-for-query", reference: "RM1" },
			{ modelType: "relationship", alias: "RM", purpose: "relationship-model-for-query", reference: "RM2" }
		]);
	});

	it("recursively collects relationship model references from nested links", () => {
		const qm = createQueryModel({
			links: [
				{
					relationshipModel: "RM1",
					targetRole: "child",
					links: [{ relationshipModel: "RM1_1", targetRole: "grandchild" }]
				}
			]
		});

		const result = QueryIntrospection.collectModelReferences(qm);

		expect(result).toEqual([
			{ modelType: "document", alias: "DM", purpose: "document-model-for-query", reference: "TestDM" },
			{ modelType: "relationship", alias: "RM", purpose: "relationship-model-for-query", reference: "RM1" },
			{ modelType: "relationship", alias: "RM", purpose: "relationship-model-for-query", reference: "RM1_1" }
		]);
	});

	it("handles undefined links gracefully", () => {
		const qm = createQueryModel({ links: undefined });
		const result = QueryIntrospection.collectModelReferences(qm);

		expect(result).toHaveLength(1);
		expect(result[0].modelType).toBe("document");
	});
});

describe("QueryIntrospection.collectProjectedFieldPaths", () => {
	it("returns empty set when fields is an empty array", () => {
		const dm = createDocumentModel("DM", createGroup("root", "root", [createField("f1", "name")]));
		expect(QueryIntrospection.collectProjectedFieldPaths(createQueryModel({ fields: [] }), dm)).toEqual(new Set());
	});

	it("returns empty set when exclude is true", () => {
		const dm = createDocumentModel("DM", createGroup("root", "root", [createField("f1", "name")]));
		expect(QueryIntrospection.collectProjectedFieldPaths(createQueryModel({ exclude: true }), dm)).toEqual(new Set());
	});

	it("returns all field paths when no projection is set", () => {
		const dm = createDocumentModel(
			"DM",
			createGroup("root", "root", [createField("f1", "firstName"), createField("f2", "lastName")])
		);

		expect(QueryIntrospection.collectProjectedFieldPaths(createQueryModel(), dm)).toEqual(
			new Set(["/firstName", "/lastName"])
		);
	});

	it("returns only the projected field paths when fields is specified", () => {
		const dm = createDocumentModel(
			"DM",
			createGroup("root", "root", [
				createField("f1", "firstName"),
				createField("f2", "lastName"),
				createField("f3", "age")
			])
		);

		expect(
			QueryIntrospection.collectProjectedFieldPaths(createQueryModel({ fields: ["/firstName", "/age"] }), dm)
		).toEqual(new Set(["/firstName", "/age"]));
	});

	it("traverses nested groups and returns fully-qualified paths", () => {
		const dm = createDocumentModel(
			"DM",
			createGroup("root", "root", [
				createField("f1", "name"),
				createGroup("g1", "address", [createField("f2", "city"), createField("f3", "zip")])
			])
		);

		expect(QueryIntrospection.collectProjectedFieldPaths(createQueryModel(), dm)).toEqual(
			new Set(["/name", "/address/city", "/address/zip"])
		);
	});

	it("does not include groups themselves, only leaf fields", () => {
		const dm = createDocumentModel(
			"DM",
			createGroup("root", "root", [createGroup("g1", "address", [createField("f1", "city")])])
		);

		expect(QueryIntrospection.collectProjectedFieldPaths(createQueryModel(), dm)).toEqual(new Set(["/address/city"]));
	});

	it("does not include paths that do not exist in the document model", () => {
		const dm = createDocumentModel("DM", createGroup("root", "root", [createField("f1", "name")]));
		const paths = QueryIntrospection.collectProjectedFieldPaths(createQueryModel(), dm);

		expect(paths.has("/nonExistent")).toBe(false);
	});
});

const { replaceVariables } = QueryIntrospection;

describe("QueryIntrospection.replaceVariables", () => {
	describe("AND_OPERATOR", () => {
		it("recursively replaces variables in all operands", () => {
			const constraint: Query.Operator = {
				operator: OPS.AND_OPERATOR,
				operands: [exactMatch("field1", "${MockDM, [/from]}"), exactMatch("field2", "${MockDM, [/to]}")]
			};

			const result = replaceConstraintVariables(constraint, { "MockDM/from": "alice", "MockDM/to": "bob" });

			expect(result).toEqual({
				operator: OPS.AND_OPERATOR,
				operands: [exactMatch("field1", "alice"), exactMatch("field2", "bob")]
			});
		});
	});

	describe("OR_OPERATOR", () => {
		it("recursively replaces variables in all operands", () => {
			const constraint: Query.Operator = {
				operator: OPS.OR_OPERATOR,
				operands: [exactMatch("status", "${MockDM, [/status]}"), exactMatch("type", "fixed")]
			};

			const result = replaceConstraintVariables(constraint, { "MockDM/status": "active" });

			expect(result).toEqual({
				operator: OPS.OR_OPERATOR,
				operands: [exactMatch("status", "active"), exactMatch("type", "fixed")]
			});
		});
	});

	describe("NOT_OPERATOR", () => {
		it("recursively replaces variable in the nested operand", () => {
			const constraint: Query.Operator = {
				operator: OPS.NOT_OPERATOR,
				operand: exactMatch("field", "${MockDM, [/val]}")
			};

			const result = replaceConstraintVariables(constraint, { "MockDM/val": "excluded" });

			expect(result).toEqual({ operator: OPS.NOT_OPERATOR, operand: exactMatch("field", "excluded") });
		});
	});

	describe("HAS_OPERATOR", () => {
		const baseHas = { operator: OPS.HAS_OPERATOR, relationshipModel: "rm", targetRole: "child" } as const;

		it("replaces variables in constraint", () => {
			const constraint: Query.Operator = { ...baseHas, constraint: exactMatch("name", "${MockDM, [/childName]}") };
			expect(replaceConstraintVariables(constraint, { "MockDM/childName": "foo" })).toEqual({
				...baseHas,
				constraint: exactMatch("name", "foo")
			});
		});

		it("replaces variables in linkDocumentConstraint", () => {
			const constraint: Query.Operator = {
				...baseHas,
				linkDocumentConstraint: exactMatch("linkField", "${MockDM, [/linkVal]}")
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/linkVal": "bar" })).toEqual({
				...baseHas,
				linkDocumentConstraint: exactMatch("linkField", "bar")
			});
		});

		it("replaces variables in both constraint and linkDocumentConstraint", () => {
			const constraint: Query.Operator = {
				...baseHas,
				constraint: exactMatch("name", "${MockDM, [/child]}"),
				linkDocumentConstraint: exactMatch("linkField", "${MockDM, [/link]}")
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/child": "a", "MockDM/link": "b" })).toEqual({
				...baseHas,
				constraint: exactMatch("name", "a"),
				linkDocumentConstraint: exactMatch("linkField", "b")
			});
		});

		it("leaves HAS_OPERATOR unchanged when constraint has no variable match", () => {
			const constraint: Query.Operator = { ...baseHas, constraint: exactMatch("name", "literal") };
			expect(replaceConstraintVariables(constraint, { "MockDM/other": "ignored" })).toEqual({
				...baseHas,
				constraint: exactMatch("name", "literal")
			});
		});
	});

	describe("EXACT_MATCH_OPERATOR", () => {
		it("replaces a string variable placeholder with a string value", () => {
			expect(
				replaceConstraintVariables(exactMatch("status", "${MockDM, [/statusVar]}"), {
					"MockDM/statusVar": "active"
				})
			).toEqual(exactMatch("status", "active"));
		});

		it("replaces a string variable placeholder with a number value", () => {
			expect(replaceConstraintVariables(exactMatch("age", "${MockDM, [/ageVar]}"), { "MockDM/ageVar": 42 })).toEqual(
				exactMatch("age", 42)
			);
		});

		it("leaves value unchanged when variable is not in the map", () => {
			expect(replaceConstraintVariables(exactMatch("field", "${MockDM, [/missing]}"), { "MockDM/other": "x" })).toEqual(
				exactMatch("field", "${MockDM, [/missing]}")
			);
		});

		it("leaves value unchanged when it is already a number (not a placeholder)", () => {
			expect(replaceConstraintVariables(exactMatch("count", 5), { "MockDM/count": 99 })).toEqual(
				exactMatch("count", 5)
			);
		});
	});

	describe("DOUBLE_RANGE_OPERATOR", () => {
		it("replaces both from and to with number values", () => {
			const constraint: Query.Operator = {
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "price",
				from: "${MockDM, [/minPrice]}" as unknown as number,
				to: "${MockDM, [/maxPrice]}" as unknown as number
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/minPrice": 10, "MockDM/maxPrice": 100 })).toEqual({
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "price",
				from: 10,
				to: 100
			});
		});

		it("converts string variable values to numbers", () => {
			const constraint: Query.Operator = {
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "rating",
				from: "${MockDM, [/min]}" as unknown as number,
				to: "${MockDM, [/max]}" as unknown as number
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/min": "1", "MockDM/max": "5" })).toEqual({
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "rating",
				from: 1,
				to: 5
			});
		});

		it("replaces only from when to is undefined", () => {
			const constraint: Query.Operator = {
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "score",
				from: "${MockDM, [/minScore]}" as unknown as number
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/minScore": 3 })).toEqual({
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "score",
				from: 3,
				to: undefined
			});
		});

		it("returns undefined for from/to when placeholder variable is not in the map", () => {
			const constraint: Query.Operator = {
				operator: OPS.DOUBLE_RANGE_OPERATOR,
				field: "amount",
				from: "${MockDM, [/notHere]}" as unknown as number,
				to: "${MockDM, [/alsoMissing]}" as unknown as number
			};
			const result = replaceConstraintVariables(constraint, { "MockDM/other": 99 }) as Query.DoubleRangeOperator;

			expect(result.from).toBeUndefined();
			expect(result.to).toBeUndefined();
		});
	});

	describe("DATE_RANGE_OPERATOR", () => {
		it("replaces both from and to with string date values", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "createdAt",
				from: "${MockDM, [/startDate]}",
				to: "${MockDM, [/endDate]}"
			};
			expect(
				replaceConstraintVariables(constraint, { "MockDM/startDate": "2024-01-01", "MockDM/endDate": "2024-12-31" })
			).toEqual({
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "createdAt",
				from: "2024-01-01",
				to: "2024-12-31"
			});
		});

		it("replaces only from when to is undefined", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "startedAt",
				from: "${MockDM, [/from]}"
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/from": "2024-06-01" })).toEqual({
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "startedAt",
				from: "2024-06-01",
				to: undefined
			});
		});

		it("converts number variable value to string", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "date",
				from: "${MockDM, [/ts]}"
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/ts": 1704067200 })).toEqual({
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "date",
				from: "1704067200",
				to: undefined
			});
		});

		it("leaves from and to unchanged when variables are not in the map", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "date",
				from: "${MockDM, [/missing]}",
				to: "${MockDM, [/alsoMissing]}"
			};
			const result = replaceConstraintVariables(constraint, { "MockDM/other": "x" }) as Query.DateRangeOperator;

			expect(result.from).toBe("${MockDM, [/missing]}");
			expect(result.to).toBe("${MockDM, [/alsoMissing]}");
		});

		it("does not mutate the original operator", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_RANGE_OPERATOR,
				field: "date",
				from: "${MockDM, [/start]}",
				to: "${MockDM, [/end]}"
			};
			replaceConstraintVariables(constraint, { "MockDM/start": "2024-01-01", "MockDM/end": "2024-12-31" });

			expect((constraint as Query.DateRangeOperator).from).toBe("${MockDM, [/start]}");
		});
	});

	describe("DATE_FRAGMENT_RANGE_OPERATOR", () => {
		it("replaces both from and to", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: "year",
				from: "${MockDM, [/yearFrom]}",
				to: "${MockDM, [/yearTo]}"
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/yearFrom": "2020", "MockDM/yearTo": "2024" })).toEqual({
				operator: OPS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: "year",
				from: "2020",
				to: "2024"
			});
		});

		it("leaves values unchanged when variables are not in the map", () => {
			const constraint: Query.Operator = {
				operator: OPS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: "month",
				from: "${MockDM, [/monthFrom]}",
				to: "${MockDM, [/monthTo]}"
			};
			const result = replaceConstraintVariables(constraint, {}) as Query.DateFragmentRangeOperator;

			expect(result.from).toBe("${MockDM, [/monthFrom]}");
			expect(result.to).toBe("${MockDM, [/monthTo]}");
		});
	});

	describe("unhandled operators", () => {
		it("returns UNDEFINED_MATCH_OPERATOR unchanged", () => {
			const constraint: Query.Operator = { operator: OPS.UNDEFINED_MATCH_OPERATOR, field: "someField" };
			expect(replaceConstraintVariables(constraint, { "MockDM/someField": "x" })).toBe(constraint);
		});

		it("returns SIMPLE_SEARCH_OPERATOR unchanged", () => {
			const constraint: Query.Operator = {
				operator: OPS.SIMPLE_SEARCH_OPERATOR,
				fields: ["name", "description"],
				value: "${MockDM, [/q]}"
			};
			expect(replaceConstraintVariables(constraint, { "MockDM/q": "hello" })).toBe(constraint);
		});
	});

	describe("nested structures", () => {
		it("replaces variables at any depth in a complex tree", () => {
			const constraint: Query.Operator = {
				operator: OPS.AND_OPERATOR,
				operands: [
					exactMatch("status", "${MockDM, [/status]}"),
					{
						operator: OPS.OR_OPERATOR,
						operands: [
							exactMatch("type", "${MockDM, [/type]}"),
							{ operator: OPS.NOT_OPERATOR, operand: exactMatch("archived", "${MockDM, [/archived]}") }
						]
					}
				]
			};

			expect(
				replaceConstraintVariables(constraint, {
					"MockDM/status": "active",
					"MockDM/type": "user",
					"MockDM/archived": "true"
				})
			).toEqual({
				operator: OPS.AND_OPERATOR,
				operands: [
					exactMatch("status", "active"),
					{
						operator: OPS.OR_OPERATOR,
						operands: [
							exactMatch("type", "user"),
							{ operator: OPS.NOT_OPERATOR, operand: exactMatch("archived", "true") }
						]
					}
				]
			});
		});
	});

	describe("query root integration", () => {
		it("replaces variables in root constraint and nested links", () => {
			const result = replaceVariables(
				createQueryRoot({
					constraint: exactMatch("status", "${MockDM, [/status]}"),
					links: [
						{
							relationshipModel: "RM1",
							targetRole: "child",
							constraint: exactMatch("name", "${MockDM, [/childName]}"),
							linkDocumentConstraint: exactMatch("kind", "${MockDM, [/kind]}")
						}
					]
				}),
				{ "MockDM/status": "active", "MockDM/childName": "Ada", "MockDM/kind": "primary" }
			);

			expect(result.constraint).toEqual(exactMatch("status", "active"));
			expect(result.links).toEqual([
				{
					relationshipModel: "RM1",
					targetRole: "child",
					constraint: exactMatch("name", "Ada"),
					linkDocumentConstraint: exactMatch("kind", "primary"),
					links: undefined
				}
			]);
		});
	});
});

const createQueryLink = (
	overrides: Partial<Query.QueryLink> & Pick<Query.QueryLink, "relationshipModel" | "targetRole">
): Query.QueryLink => overrides as Query.QueryLink;

describe("QueryIntrospection.collectLinkProjection", () => {
	const targetDM = createDocumentModel(
		"TargetDM",
		createGroup("root", "root", [createField("f1", "firstName"), createField("f2", "lastName")])
	);
	const linkDM = createDocumentModel(
		"LinkDM",
		createGroup("root", "root", [createField("l1", "since"), createField("l2", "kind")])
	);
	const rm1 = createRelationshipModel("RM1", "child", "TargetDM", "LinkDM");

	const graph: QueryIntrospection.ModelGraph = {
		targetDocumentModelName: "TargetDM",
		documentModels: [targetDM, linkDM],
		relationshipModels: [rm1]
	};

	it("returns undefined for an empty path", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		expect(QueryIntrospection.collectLinkProjection(qm, [], graph)).toBeUndefined();
	});

	it("returns undefined when the first step does not match any link", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		expect(
			QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM_UNKNOWN", targetRole: "child" }], graph)
		).toBeUndefined();
	});

	it("returns undefined when the targetRole does not match", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		expect(
			QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "other" }], graph)
		).toBeUndefined();
	});

	it("returns undefined when nested path partially matches but second step is missing", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		expect(
			QueryIntrospection.collectLinkProjection(
				qm,
				[
					{ relationship: "RM1", targetRole: "child" },
					{ relationship: "RM2", targetRole: "grandchild" }
				],
				graph
			)
		).toBeUndefined();
	});

	it("mirrors relationship, targetRole, and maxDepth from matched QueryLink", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child", maxDepth: 3 })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result).not.toBeUndefined();
		expect(result?.relationshipModel).toBe("RM1");
		expect(result?.targetRole).toBe("child");
		expect(result?.maxDepth).toBe(3);
	});

	it("omits maxDepth from result when not set on QueryLink", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result).not.toBeUndefined();
		expect(result?.maxDepth).toBeUndefined();
	});

	it("returns all target DM field paths when QueryLink.fields is undefined", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedFieldPaths).toEqual(new Set(["/firstName", "/lastName"]));
	});

	it("returns empty set for target fields when QueryLink.fields is empty array", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child", fields: [] })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedFieldPaths).toEqual(new Set());
	});

	it("returns intersection of QueryLink.fields with target DM paths", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child", fields: ["/firstName"] })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedFieldPaths).toEqual(new Set(["/firstName"]));
	});

	it("returns all link DM field paths when QueryLink.linkDocumentFields is undefined", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedLinkDocumentFieldPaths).toEqual(new Set(["/since", "/kind"]));
	});

	it("returns empty set for link doc fields when QueryLink.linkDocumentFields is empty array", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child", linkDocumentFields: [] })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedLinkDocumentFieldPaths).toEqual(new Set());
	});

	it("returns intersection of QueryLink.linkDocumentFields with link DM paths", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child", linkDocumentFields: ["/kind"] })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.projectedLinkDocumentFieldPaths).toEqual(new Set(["/kind"]));
	});

	it("returns empty projection sets when relationship model is not in the graph", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM_MISSING", targetRole: "child" })]
		});
		const graphWithoutRM: QueryIntrospection.ModelGraph = {
			targetDocumentModelName: "TargetDM",
			documentModels: [targetDM, linkDM],
			relationshipModels: []
		};

		const result = QueryIntrospection.collectLinkProjection(
			qm,
			[{ relationship: "RM_MISSING", targetRole: "child" }],
			graphWithoutRM
		);

		expect(result).not.toBeUndefined();
		expect(result?.projectedFieldPaths).toEqual(new Set());
		expect(result?.projectedLinkDocumentFieldPaths).toEqual(new Set());
	});

	it("returns empty projection sets when document model is not in the graph", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});
		const graphWithoutDMs: QueryIntrospection.ModelGraph = {
			targetDocumentModelName: "TargetDM",
			documentModels: [],
			relationshipModels: [rm1]
		};

		const result = QueryIntrospection.collectLinkProjection(
			qm,
			[{ relationship: "RM1", targetRole: "child" }],
			graphWithoutDMs
		);

		expect(result).not.toBeUndefined();
		expect(result?.projectedFieldPaths).toEqual(new Set());
		expect(result?.projectedLinkDocumentFieldPaths).toEqual(new Set());
	});

	it("returns constraint and linkDocumentConstraint as-is from matched QueryLink", () => {
		const constraint = exactMatch("/firstName", "Alice");
		const linkConstraint = exactMatch("/kind", "primary");
		const qm = createQueryModel({
			links: [
				createQueryLink({
					relationshipModel: "RM1",
					targetRole: "child",
					constraint,
					linkDocumentConstraint: linkConstraint
				})
			]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.constraint).toBe(constraint);
		expect(result?.linkDocumentConstraint).toBe(linkConstraint);
	});

	it("returns undefined constraint and linkDocumentConstraint when not set on QueryLink", () => {
		const qm = createQueryModel({
			links: [createQueryLink({ relationshipModel: "RM1", targetRole: "child" })]
		});

		const result = QueryIntrospection.collectLinkProjection(qm, [{ relationship: "RM1", targetRole: "child" }], graph);

		expect(result?.constraint).toBeUndefined();
		expect(result?.linkDocumentConstraint).toBeUndefined();
	});

	it("resolves a depth-2 nested path and returns info from the leaf link", () => {
		const nestedConstraint = exactMatch("/firstName", "Bob");
		const rm2 = createRelationshipModel("RM2", "grandchild", "TargetDM", "LinkDM");
		const deepGraph: QueryIntrospection.ModelGraph = {
			targetDocumentModelName: "TargetDM",
			documentModels: [targetDM, linkDM],
			relationshipModels: [rm1, rm2]
		};
		const qm = createQueryModel({
			links: [
				createQueryLink({
					relationshipModel: "RM1",
					targetRole: "child",
					links: [
						createQueryLink({
							relationshipModel: "RM2",
							targetRole: "grandchild",
							fields: ["/firstName"],
							constraint: nestedConstraint,
							maxDepth: 2
						})
					]
				})
			]
		});

		const result = QueryIntrospection.collectLinkProjection(
			qm,
			[
				{ relationship: "RM1", targetRole: "child" },
				{ relationship: "RM2", targetRole: "grandchild" }
			],
			deepGraph
		);

		expect(result).not.toBeUndefined();
		expect(result?.relationshipModel).toBe("RM2");
		expect(result?.targetRole).toBe("grandchild");
		expect(result?.maxDepth).toBe(2);
		expect(result?.projectedFieldPaths).toEqual(new Set(["/firstName"]));
		expect(result?.constraint).toBe(nestedConstraint);
	});
});
