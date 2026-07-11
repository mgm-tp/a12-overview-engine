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

import type { DocumentModel, DocumentService } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Query, type QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { Links } from "../../../../main/models/index.js";
import type { DataOperation } from "../../../../main/client-extensions/internal/data-loader/data-loader.js";
import {
	type BuildResultContext,
	buildListDocumentsResult
} from "../../../../main/client-extensions/internal/data-loader/default-data-loader.js";

// -- Fixtures ----------------------------------------------------------------

const SOURCE_DOC_REF = "Contract-document/a16e010d-14f8-4969-89fc-103ab5b11235";
const RELATIONSHIP = "CoInsurer";
const TARGET_ROLE = "businessPartner";

function createLink(overrides: Partial<QueryJsonRpc2Response.Link>): QueryJsonRpc2Response.Link {
	return {
		backReference: "",
		depth: 0,
		docRef: "doc/1",
		document: {},
		documentModelName: "TestDoc",
		linkId: "link-1",
		relationshipModel: RELATIONSHIP,
		sourceDocRef: SOURCE_DOC_REF,
		sourceRole: "contract",
		targetDocRef: "doc/1",
		targetRole: TARGET_ROLE,
		type: "CHILD",
		...overrides
	} as QueryJsonRpc2Response.Link;
}

function createExcludeResponse(links: QueryJsonRpc2Response.Link[]): QueryJsonRpc2Response {
	return {
		jsonrpc: "2.0",
		id: "q1-page-0",
		result: {
			entries: [],
			fullSize: links.filter((l) => l.type === "CHILD").length,
			links,
			otherResults: {},
			page: { pageNumber: 0, pageSize: 10 }
		}
	} as unknown as QueryJsonRpc2Response;
}

function createBuildResultContext(): BuildResultContext {
	const documentModel = {
		header: { id: "TestDoc", annotations: [] }
	} as unknown as DocumentModel;

	const documentService = {
		parseDates: (_doc: unknown, _model: unknown) => _doc
	} as unknown as DocumentService;

	return {
		thumbnails: undefined,
		documentService,
		documentModel,
		subDocumentModels: undefined
	};
}

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.data-loader.default-data-loader", () => {
	describe("buildListDocumentsResult — exclude mode", () => {
		const childLink1 = createLink({
			linkId: "child-link-1",
			docRef: "Person/aaa",
			targetDocRef: "Person/aaa",
			document: { name: "Alice" },
			documentModelName: "Person",
			type: Query.DocumentTreeNodeType.CHILD
		});

		const childLink2 = createLink({
			linkId: "child-link-2",
			docRef: "Person/bbb",
			targetDocRef: "Person/bbb",
			document: { name: "Bob" },
			documentModelName: "Person",
			type: Query.DocumentTreeNodeType.CHILD
		});

		const linkEntry1 = createLink({
			linkId: "child-link-1",
			docRef: "AdditionalFields/x1",
			targetDocRef: "AdditionalFields/x1",
			document: { since: "2025-01-01" },
			documentModelName: "AdditionalFields",
			type: Query.DocumentTreeNodeType.LINK
		});

		const linkEntry2 = createLink({
			linkId: "child-link-2",
			docRef: "AdditionalFields/x2",
			targetDocRef: "AdditionalFields/x2",
			document: { since: "2025-06-15" },
			documentModelName: "AdditionalFields",
			type: Query.DocumentTreeNodeType.LINK
		});

		const excludeQuery: DataOperation.ListDocuments.Query = {
			id: "q1",
			type: "LIST_DOCUMENTS",
			paging: { pageNumbers: [0], pageSize: 10 },
			exclude: true,
			links: [{ relationshipModel: RELATIONSHIP, targetRole: TARGET_ROLE }]
		} as DataOperation.ListDocuments.Query;

		it("populates documents from matching CHILD links with correct (id, linkId) pairs", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([
				["q1-page-0", createExcludeResponse([childLink1, childLink2, linkEntry1, linkEntry2])]
			]);

			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, createBuildResultContext());

			expect(result.documents).toHaveLength(2);
			expect(result.documents[0]).toMatchObject({ id: "Person/aaa", linkId: "child-link-1" });
			expect(result.documents[1]).toMatchObject({ id: "Person/bbb", linkId: "child-link-2" });
		});

		it("indexes LINK entries under promoted child docRef (sourceDocRef rewritten)", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([
				["q1-page-0", createExcludeResponse([childLink1, childLink2, linkEntry1, linkEntry2])]
			]);

			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, createBuildResultContext());
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const links = result.links!;

			// CHILD links matching the query spec are NOT added to links (they become documents)
			const originalBucket = links.linksBySourceId[SOURCE_DOC_REF]?.[RELATIONSHIP]?.[TARGET_ROLE];
			expect(originalBucket?.childEntries?.["child-link-1"]).toBeUndefined();
			expect(originalBucket?.childEntries?.["child-link-2"]).toBeUndefined();

			// LINK entries are indexed under the promoted child's docRef
			const bucket1 = links.linksBySourceId["Person/aaa"]?.[RELATIONSHIP]?.[TARGET_ROLE];
			expect(bucket1?.linkEntries?.["child-link-1"]).toBeDefined();

			const bucket2 = links.linksBySourceId["Person/bbb"]?.[RELATIONSHIP]?.[TARGET_ROLE];
			expect(bucket2?.linkEntries?.["child-link-2"]).toBeDefined();
		});

		it("stores LINK target documents in documentsById", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([
				["q1-page-0", createExcludeResponse([childLink1, childLink2, linkEntry1, linkEntry2])]
			]);

			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, createBuildResultContext());
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const links = result.links!;

			// LINK target documents should be in documentsById
			expect(links.documentsById["AdditionalFields/x1"]).toBeDefined();
			expect(links.documentsById["AdditionalFields/x2"]).toBeDefined();
		});

		it("rewrites sourceDocRef for LINK entries to the promoted child docRef", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([
				["q1-page-0", createExcludeResponse([childLink1, linkEntry1])]
			]);

			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, createBuildResultContext());
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const links = result.links!;

			// LINK entry should be indexed under the promoted child's docRef
			const bucket = links.linksBySourceId["Person/aaa"]?.[RELATIONSHIP]?.[TARGET_ROLE];
			expect(bucket?.linkEntries?.["child-link-1"]?.targetDocRef).toBe("AdditionalFields/x1");

			// The original sourceDocRef should NOT have LINK entries for this linkId
			const originalBucket = links.linksBySourceId[SOURCE_DOC_REF]?.[RELATIONSHIP]?.[TARGET_ROLE];
			expect(originalBucket?.linkEntries?.["child-link-1"]).toBeUndefined();
		});

		it("stores linked documents in documentsById and indexes under rewritten source", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([
				["q1-page-0", createExcludeResponse([childLink1, childLink2, linkEntry1, linkEntry2])]
			]);

			const ctx = createBuildResultContext();
			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, ctx);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const links = result.links!;

			// Each LINK entry is resolvable from the promoted child's docRef
			const resolved1 = Links.resolvePath(
				"Person/aaa",
				[{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "LINK" }],
				"child-link-1"
			)(links);
			expect(resolved1?.targetDocRef).toBe("AdditionalFields/x1");

			const resolved2 = Links.resolvePath(
				"Person/bbb",
				[{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "LINK" }],
				"child-link-2"
			)(links);
			expect(resolved2?.targetDocRef).toBe("AdditionalFields/x2");
		});

		it("handles empty response links gracefully", () => {
			const responsesByQueryId = new Map<string, QueryJsonRpc2Response>([["q1-page-0", createExcludeResponse([])]]);

			const result = buildListDocumentsResult(excludeQuery, responsesByQueryId, createBuildResultContext());

			expect(result.documents).toHaveLength(0);
			expect(result.links).toEqual(Links.create());
		});
	});
});
