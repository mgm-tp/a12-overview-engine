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

import { DataGraph } from "../../../main/models/internal/data-graph.js";
import type { JSONDocument } from "../../../main/models/internal/json-document.js";
import { Links } from "../../../main/models/internal/links.js";

function makeDoc(id: string, extra: Record<string, unknown> = {}): JSONDocument {
	return { id, elements: {}, ...extra } as unknown as JSONDocument;
}

function makeGraph(docs: JSONDocument[] = [], links: Links = Links.create()): DataGraph {
	return { documents: docs, links };
}

function buildLinks(
	sourceDocRef: string,
	relationship: string,
	targetRole: string,
	targetDocRef: string,
	document: JSONDocument
): Links {
	const entry = { linkId: "link-1", targetDocRef, documentModelName: "DM" };

	return Links.setDocument(
		targetDocRef,
		document
	)(Links.setEntry({ ...entry, sourceDocRef, relationship, targetRole, type: "LINK" })(Links.create()));
}

describe("DataGraph", () => {
	describe("findEntryByEntities", () => {
		const pair: DataGraph.EntityPair = {
			relationship: "PersonToAddress",
			source: { role: "person", docRef: "src-1" },
			target: { role: "address", docRef: "tgt-1" }
		};

		it("should match via source key", () => {
			const doc = makeDoc("tgt-1");
			const links = buildLinks("src-1", "PersonToAddress", "address", "tgt-1", doc);
			const graph = makeGraph([], links);

			const result = DataGraph.findEntryByEntities(pair)(graph);

			expect(result).toBeDefined();
			expect(result?.entry.targetDocRef).toBe("tgt-1");
			expect(result?.targetRole).toBe("address");
			expect(result?.document).toBe(doc);
		});

		it("should match via target key (role-reversed stored entry)", () => {
			// Entry is stored with target.docRef as source key, source.docRef as targetDocRef
			const doc = makeDoc("src-1");
			const links = buildLinks("tgt-1", "PersonToAddress", "address", "src-1", doc);
			const graph = makeGraph([], links);

			const result = DataGraph.findEntryByEntities(pair)(graph);

			expect(result).toBeDefined();
			expect(result?.entry.targetDocRef).toBe("src-1");
		});

		it("should return undefined when no match", () => {
			const graph = makeGraph();

			expect(DataGraph.findEntryByEntities(pair)(graph)).toBeUndefined();
		});

		it("should find correct entry among multiple link entries in one slot", () => {
			const doc1 = makeDoc("tgt-1");
			const doc2 = makeDoc("tgt-2");
			const entry1 = { linkId: "link-1", targetDocRef: "tgt-1", documentModelName: "DM" };
			const entry2 = { linkId: "link-2", targetDocRef: "tgt-2", documentModelName: "DM" };
			const pointer1 = {
				sourceDocRef: "src-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK" as const,
				linkId: "link-1"
			};
			const pointer2 = {
				sourceDocRef: "src-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK" as const,
				linkId: "link-2"
			};

			let links = Links.create();
			links = Links.entryLens(pointer1).set(entry1)(links);
			links = Links.entryLens(pointer2).set(entry2)(links);
			links = Links.setDocument("tgt-1", doc1)(links);
			links = Links.setDocument("tgt-2", doc2)(links);

			const graph = makeGraph([], links);
			const result = DataGraph.findEntryByEntities(pair)(graph);

			expect(result).toBeDefined();
			expect(result?.entry.targetDocRef).toBe("tgt-1");
			expect(result?.entry.linkId).toBe("link-1");
			expect(result?.targetRole).toBe("address");
			expect(result?.document).toBe(doc1);
		});

		it("should return undefined when no entry matches target docRef", () => {
			const doc = makeDoc("tgt-other");
			const entry1 = { linkId: "link-1", targetDocRef: "tgt-other", documentModelName: "DM" };
			const entry2 = { linkId: "link-2", targetDocRef: "tgt-unrelated", documentModelName: "DM" };
			const pointer1 = {
				sourceDocRef: "src-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK" as const,
				linkId: "link-1"
			};
			const pointer2 = {
				sourceDocRef: "src-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK" as const,
				linkId: "link-2"
			};

			let links = Links.create();
			links = Links.entryLens(pointer1).set(entry1)(links);
			links = Links.entryLens(pointer2).set(entry2)(links);
			links = Links.setDocument("tgt-other", doc)(links);

			const graph = makeGraph([], links);
			const result = DataGraph.findEntryByEntities(pair)(graph);

			expect(result).toBeUndefined();
		});
	});

	describe("findDocuments", () => {
		it("should find documents matching predicate in root documents", () => {
			const doc = makeDoc("d1");
			const graph = makeGraph([doc]);

			const result = DataGraph.findDocuments((id) => id === "d1")(graph);

			expect(result).toHaveLength(1);
			expect(result[0]).toBe(doc);
		});

		it("should find documents matching predicate in documentsById", () => {
			const doc = makeDoc("d1");
			const links = Links.setDocument("d1", doc)(Links.create());
			const graph = makeGraph([], links);

			const result = DataGraph.findDocuments((id) => id === "d1")(graph);

			expect(result).toHaveLength(1);
			expect(result[0]).toBe(doc);
		});

		it("should deduplicate when same docRef appears in both root documents and documentsById", () => {
			const doc = makeDoc("d1");
			const links = Links.setDocument("d1", doc)(Links.create());
			const graph = makeGraph([doc], links);

			const result = DataGraph.findDocuments((id) => id === "d1")(graph);

			expect(result).toHaveLength(1);
		});

		it("should return empty array when predicate matches nothing", () => {
			const graph = makeGraph([makeDoc("d1")]);

			expect(DataGraph.findDocuments(() => false)(graph)).toHaveLength(0);
		});
	});

	describe("patchDocuments", () => {
		it("should prepend documents not already present", () => {
			const existing = makeDoc("existing");
			const incoming = makeDoc("new");
			const graph = makeGraph([existing]);

			const result = DataGraph.patchDocuments([incoming])(graph);

			expect(result.documents[0]).toBe(incoming);
			expect(result.documents).toContain(existing);
		});

		it("should replace existing document with same id", () => {
			const old = makeDoc("d1");
			const updated = makeDoc("d1");
			const graph = makeGraph([old]);

			const result = DataGraph.patchDocuments([updated])(graph);

			expect(result.documents).toHaveLength(1);
			expect(result.documents[0]).toBe(updated);
		});

		it("should return ref-equal dataGraph when all documents are already strictly equal", () => {
			const doc = makeDoc("d1");
			const graph = makeGraph([doc]);

			const result = DataGraph.patchDocuments([doc])(graph);

			expect(result).toBe(graph);
		});

		it("should prepend document with same id but different linkId (duplicate entry)", () => {
			const existing = makeDoc("d1", { linkId: "link-1" });
			const incoming = makeDoc("d1", { linkId: "link-2" });
			const graph = makeGraph([existing]);

			const result = DataGraph.patchDocuments([incoming])(graph);

			expect(result.documents).toHaveLength(2);
			expect(result.documents[0]).toBe(incoming);
			expect(result.documents[1]).toBe(existing);
		});

		it("should replace existing document with same id and same linkId", () => {
			const old = makeDoc("d1", { linkId: "link-1" });
			const updated = makeDoc("d1", { linkId: "link-1" });
			const graph = makeGraph([old]);

			const result = DataGraph.patchDocuments([updated])(graph);

			expect(result.documents).toHaveLength(1);
			expect(result.documents[0]).toBe(updated);
		});

		it("should return ref-equal when same id and same linkId and same reference", () => {
			const doc = makeDoc("d1", { linkId: "link-1" });
			const graph = makeGraph([doc]);

			const result = DataGraph.patchDocuments([doc])(graph);

			expect(result).toBe(graph);
		});
	});

	describe("patchLinkDocuments", () => {
		it("should insert a new document into documentsById", () => {
			const doc = makeDoc("d1");
			const graph = makeGraph();

			const result = DataGraph.patchLinkDocuments([{ docRef: "d1", document: doc }])(graph);

			expect(result.links?.documentsById["d1"]).toBe(doc);
		});

		it("should replace an existing document with updated version", () => {
			const old = makeDoc("d1");
			const updated = makeDoc("d1");
			const links = Links.setDocument("d1", old)(Links.create());
			const graph = makeGraph([], links);

			const result = DataGraph.patchLinkDocuments([{ docRef: "d1", document: updated }])(graph);

			expect(result.links?.documentsById["d1"]).toBe(updated);
		});

		it("should return ref-equal dataGraph when all entries are already strictly equal", () => {
			const doc = makeDoc("d1");
			const links = Links.setDocument("d1", doc)(Links.create());
			const graph = makeGraph([], links);

			const result = DataGraph.patchLinkDocuments([{ docRef: "d1", document: doc }])(graph);

			expect(result).toBe(graph);
		});
	});

	describe("patchLinks", () => {
		it("should insert a link entry at the given pointer (linkId derived from entry)", () => {
			const pointer = { sourceDocRef: "src", relationship: "rel", targetRole: "role", type: "LINK" as const };
			const entry = { linkId: "lnk-1", targetDocRef: "tgt", documentModelName: "DM" };
			const graph = makeGraph();

			const result = DataGraph.patchLinks(pointer, entry)(graph);

			const fullPointer = { ...pointer, linkId: entry.linkId };
			expect(Links.entryLens(fullPointer).get(result.links ?? Links.create())).toBe(entry);
		});

		it("should return ref-equal dataGraph when entry is already strictly equal", () => {
			const pointer = { sourceDocRef: "src", relationship: "rel", targetRole: "role", type: "LINK" as const };
			const entry = { linkId: "lnk-1", targetDocRef: "tgt", documentModelName: "DM" };
			const fullPointer = { ...pointer, linkId: entry.linkId };
			const links = Links.entryLens(fullPointer).set(entry)(Links.create());
			const graph = makeGraph([], links);

			const result = DataGraph.patchLinks(pointer, entry)(graph);

			expect(result).toBe(graph);
		});
	});
});
