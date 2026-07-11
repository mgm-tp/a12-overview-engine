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
import type { QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { JSONDocument } from "../../../main/models/index.js";
import { Links, type JSONLinkRef } from "../../../main/models/index.js";

describe("Links", () => {
	function createLink(overrides: Partial<QueryJsonRpc2Response.Link> = {}): QueryJsonRpc2Response.Link {
		return {
			type: Query.DocumentTreeNodeType.LINK,
			documentModelName: "PersonDM",
			docRef: "target-doc-1",
			document: { id: "target-doc-1", modelId: "test-model", elements: { name: { value: "John" } } },
			relationshipModel: "PersonToAddress",
			linkId: "link-1",
			depth: 1,
			sourceRole: "person",
			sourceDocRef: "source-doc-1",
			targetRole: "address",
			targetDocRef: "target-doc-1",
			...overrides
		};
	}

	function pointerFromLink(link: QueryJsonRpc2Response.Link): Links.EntryPointer {
		return {
			sourceDocRef: link.sourceDocRef,
			relationship: link.relationshipModel,
			targetRole: link.targetRole,
			type: link.type,
			linkId: link.linkId
		};
	}

	function addLink(links: Links, link: QueryJsonRpc2Response.Link): Links {
		const { document, ...linkMetadata } = link;
		const pointer = pointerFromLink(link);
		const withEntry = Links.setEntry({ ...linkMetadata, ...pointer })(links);

		return Links.setDocument(linkMetadata.targetDocRef, document as JSONDocument)(withEntry);
	}

	function buildLinks(
		...entries: {
			sourceDocRef: string;
			relationship: string;
			targetRole: string;
			type: "CHILD" | "LINK";
			targetDocRef: string;
			document: JSONDocument;
			linkId?: string;
		}[]
	): Links {
		return entries.reduce((acc, { sourceDocRef, relationship, targetRole, type, targetDocRef, document, linkId }) => {
			const entry: JSONLinkRef = {
				linkId: linkId ?? "link-1",
				targetDocRef,
				documentModelName: "PersonDM"
			};

			return Links.setDocument(
				targetDocRef,
				document
			)(Links.setEntry({ ...entry, sourceDocRef, relationship, targetRole, type })(acc));
		}, Links.create());
	}

	describe("create", () => {
		it("should initialize with empty index", () => {
			expect(Links.create()).toEqual({ linksBySourceId: {}, documentsById: {} });
		});
	});

	describe("setEntry", () => {
		it("should add a LINK type entry into linkEntries[linkId]", () => {
			const link = createLink({ type: Query.DocumentTreeNodeType.LINK });
			const result = addLink(Links.create(), link);
			const entry = Links.entryLens(pointerFromLink(link)).get(result);

			expect(entry).toBeDefined();
			expect(entry).toEqual(expect.objectContaining({ targetDocRef: "target-doc-1" }));
		});

		it("should add a CHILD type entry into childEntries[linkId]", () => {
			const link = createLink({ type: Query.DocumentTreeNodeType.CHILD, targetRole: "address" });
			const result = addLink(Links.create(), link);
			const entry = Links.entryLens(pointerFromLink(link)).get(result);

			expect(entry).toBeDefined();
		});

		it("should store link metadata without document property", () => {
			const link = createLink();
			const result = addLink(Links.create(), link);
			const entry = Links.entryLens(pointerFromLink(link)).get(result);

			expect(entry).not.toHaveProperty("document");
			expect(entry).toHaveProperty("linkId", "link-1");
			expect(entry).toHaveProperty("sourceDocRef", "source-doc-1");
			expect(entry).toHaveProperty("targetDocRef", "target-doc-1");
		});

		it("should allow links with different sourceDocRefs", () => {
			const link1 = createLink({ sourceDocRef: "source-1" });
			const link2 = createLink({ sourceDocRef: "source-2" });
			const result = addLink(addLink(Links.create(), link1), link2);

			expect(result.linksBySourceId).toHaveProperty("source-1");
			expect(result.linksBySourceId).toHaveProperty("source-2");
		});

		it("should allow links with different relationships for same sourceDocRef", () => {
			const link1 = createLink({ relationshipModel: "rel-1" });
			const link2 = createLink({ relationshipModel: "rel-2" });
			const result = addLink(addLink(Links.create(), link1), link2);
			const sourceEntry = result.linksBySourceId["source-doc-1"];

			expect(sourceEntry).toHaveProperty("rel-1");
			expect(sourceEntry).toHaveProperty("rel-2");
		});

		it("should allow links with different roles for same sourceDocRef and relationship", () => {
			const link1 = createLink({ type: Query.DocumentTreeNodeType.CHILD, targetRole: "role-1" });
			const link2 = createLink({ type: Query.DocumentTreeNodeType.CHILD, targetRole: "role-2" });
			const result = addLink(addLink(Links.create(), link1), link2);
			const relEntry = result.linksBySourceId["source-doc-1"]?.["PersonToAddress"];

			expect(relEntry).toHaveProperty("role-1");
			expect(relEntry).toHaveProperty("role-2");
		});

		it("should handle multiple links via reduce", () => {
			const links = [
				createLink({ sourceDocRef: "src-1", relationshipModel: "rel-A", targetDocRef: "t1", docRef: "t1" }),
				createLink({ sourceDocRef: "src-1", relationshipModel: "rel-B", targetDocRef: "t2", docRef: "t2" }),
				createLink({ sourceDocRef: "src-2", relationshipModel: "rel-A", targetDocRef: "t3", docRef: "t3" })
			];
			const result = links.reduce(addLink, Links.create());

			expect(result.linksBySourceId["src-1"]).toHaveProperty("rel-A");
			expect(result.linksBySourceId["src-1"]).toHaveProperty("rel-B");
			expect(result.linksBySourceId["src-2"]).toHaveProperty("rel-A");
			expect(Object.keys(result.documentsById)).toHaveLength(3);
		});

		it("should return immutable results", () => {
			const before = Links.create();
			const after = addLink(before, createLink());

			expect(before).not.toBe(after);
			expect(before.linksBySourceId).toEqual({});
			expect(after.linksBySourceId).toHaveProperty("source-doc-1");
		});
	});

	describe("setDocument", () => {
		it("should store document in documentsById", () => {
			const document = { id: "target-doc-1", modelId: "test-model", elements: { name: { value: "John" } } };
			const link = createLink({ document });
			const result = addLink(Links.create(), link);

			expect(result.documentsById).toHaveProperty("target-doc-1");
		});
	});

	describe("entriesLens", () => {
		it("should return the full record of entries for a given slot", () => {
			const link1 = createLink({ linkId: "lk-1", targetDocRef: "t1", docRef: "t1" });
			const link2 = createLink({ linkId: "lk-2", targetDocRef: "t2", docRef: "t2" });
			const result = addLink(addLink(Links.create(), link1), link2);

			const bucket = Links.entriesLens({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK"
			}).get(result);

			expect(bucket).toBeDefined();
			/* eslint-disable @typescript-eslint/no-non-null-assertion */
			expect(Object.keys(bucket!)).toHaveLength(2);
			expect(bucket!["lk-1"]).toEqual(expect.objectContaining({ targetDocRef: "t1" }));
			expect(bucket!["lk-2"]).toEqual(expect.objectContaining({ targetDocRef: "t2" }));
			/* eslint-enable @typescript-eslint/no-non-null-assertion */
		});

		it("should return undefined for a non-existent slot", () => {
			const bucket = Links.entriesLens({
				sourceDocRef: "nonexistent",
				relationship: "rel",
				targetRole: "role",
				type: "LINK"
			}).get(Links.create());

			expect(bucket).toBeUndefined();
		});
	});

	describe("resolve", () => {
		it("should return the link entry for a valid combination", () => {
			const links = buildLinks({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				targetDocRef: "target-doc-1",
				document: {
					id: "target-doc-1",
					modelId: "test-model",
					elements: { name: { value: "John" } }
				}
			});

			const result = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-1"
			})(links);

			expect(result).toBeDefined();
			expect(result).toEqual(expect.objectContaining({ targetDocRef: "target-doc-1" }));
		});

		it("should include the document in the returned entry", () => {
			const document = {
				id: "target-doc-1",
				modelId: "test-model",
				elements: { name: { value: "John" } }
			};
			const links = buildLinks({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				targetDocRef: "target-doc-1",
				document
			});

			const result = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-1"
			})(links);

			expect(result?.document).toEqual(document);
		});

		it("should return undefined when sourceDocRef does not exist", () => {
			const links = buildLinks({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				targetDocRef: "target-doc-1",
				document: { id: "target-doc-1", modelId: "test-model", elements: {} }
			});

			const result = Links.resolveLink({
				sourceDocRef: "non-existent",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-1"
			})(links);

			expect(result).toBeUndefined();
		});

		it("should return undefined when link index is empty", () => {
			const result = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-1"
			})(Links.create());

			expect(result).toBeUndefined();
		});

		it("should distinguish between childEntries and linkEntries", () => {
			const links = buildLinks(
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "CHILD",
					targetDocRef: "child-target",
					document: { id: "child-target", modelId: "test-model", elements: {} },
					linkId: "child-link-1"
				},
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "link-target",
					document: { id: "link-target", modelId: "test-model", elements: {} },
					linkId: "link-link-1"
				}
			);

			const childResult = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "CHILD",
				linkId: "child-link-1"
			})(links);
			const linkResult = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-link-1"
			})(links);

			expect(childResult?.targetDocRef).toBe("child-target");
			expect(linkResult?.targetDocRef).toBe("link-target");
		});

		it("should resolve first entry in bucket when linkId is absent (fallback)", () => {
			const links = buildLinks({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				targetDocRef: "target-doc-1",
				document: { id: "target-doc-1", modelId: "test-model", elements: {} }
			});

			const result = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK"
			})(links);

			expect(result).toBeDefined();
			expect(result?.targetDocRef).toBe("target-doc-1");
		});

		it("should return undefined for first-entry fallback when bucket is empty", () => {
			const result = Links.resolveLink({
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK"
			})(Links.create());

			expect(result).toBeUndefined();
		});
	});

	describe("resolvePath", () => {
		it("should resolve through the entry matching linkId on the first hop", () => {
			const links = buildLinks(
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-A",
					document: { id: "target-A", modelId: "test-model", elements: { city: { value: "Munich" } } },
					linkId: "link-A"
				},
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-B",
					document: { id: "target-B", modelId: "test-model", elements: { city: { value: "Berlin" } } },
					linkId: "link-B"
				}
			);

			const result = Links.resolvePath(
				"source-doc-1",
				[{ relationship: "PersonToAddress", targetRole: "address", type: "LINK" }],
				"link-B"
			)(links);

			expect(result).toBeDefined();
			expect(result?.targetDocRef).toBe("target-B");
		});

		it("should fall back to first entry when linkId is absent", () => {
			const links = buildLinks(
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-A",
					document: { id: "target-A", modelId: "test-model", elements: { city: { value: "Munich" } } },
					linkId: "link-A"
				},
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-B",
					document: { id: "target-B", modelId: "test-model", elements: { city: { value: "Berlin" } } },
					linkId: "link-B"
				}
			);

			const result = Links.resolvePath("source-doc-1", [
				{ relationship: "PersonToAddress", targetRole: "address", type: "LINK" }
			])(links);

			expect(result).toBeDefined();
			// Falls back to first entry (link-A was added first)
			expect(result?.targetDocRef).toBe("target-A");
		});

		it("should fall back to first entry when linkId does not match any entry in the bucket", () => {
			const links = buildLinks(
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-A",
					document: { id: "target-A", modelId: "test-model", elements: { city: { value: "Munich" } } },
					linkId: "link-A"
				},
				{
					sourceDocRef: "source-doc-1",
					relationship: "PersonToAddress",
					targetRole: "address",
					type: "LINK",
					targetDocRef: "target-B",
					document: { id: "target-B", modelId: "test-model", elements: { city: { value: "Berlin" } } },
					linkId: "link-B"
				}
			);

			const result = Links.resolvePath(
				"source-doc-1",
				[{ relationship: "PersonToAddress", targetRole: "address", type: "LINK" }],
				"non-existent-link-id"
			)(links);

			expect(result).toBeDefined();
			// Falls back to first entry because the linkId doesn't exist in bucket
			expect(result?.targetDocRef).toBe("target-A");
		});

		it("should resolve in exclude-mode when sourceDocRef is rewritten to promoted child docRef", () => {
			// In exclude-mode the data loader rewrites link sourceDocRef to the promoted child's docRef.
			// Each row's promoted child docRef becomes the sourceDocRef for its associated LINK entries.
			const links = buildLinks(
				{
					sourceDocRef: "natural-person-doc-1",
					relationship: "CoInsurer",
					targetRole: "businessPartner",
					type: "LINK",
					targetDocRef: "additional-fields-A",
					document: {
						id: "additional-fields-A",
						modelId: "test-model",
						elements: { since: { value: "2026-05-06" } }
					},
					linkId: "link-A"
				},
				{
					sourceDocRef: "natural-person-doc-2",
					relationship: "CoInsurer",
					targetRole: "businessPartner",
					type: "LINK",
					targetDocRef: "additional-fields-B",
					document: {
						id: "additional-fields-B",
						modelId: "test-model",
						elements: { since: { value: "2026-05-14" } }
					},
					linkId: "link-B"
				}
			);

			const resultA = Links.resolvePath(
				"natural-person-doc-1",
				[{ relationship: "CoInsurer", targetRole: "businessPartner", type: "LINK" }],
				"link-A"
			)(links);

			const resultB = Links.resolvePath(
				"natural-person-doc-2",
				[{ relationship: "CoInsurer", targetRole: "businessPartner", type: "LINK" }],
				"link-B"
			)(links);

			expect(resultA).toBeDefined();
			expect(resultA?.targetDocRef).toBe("additional-fields-A");
			expect(resultB).toBeDefined();
			expect(resultB?.targetDocRef).toBe("additional-fields-B");
		});
	});

	describe("addLink", () => {
		it("should be idempotent by linkId", () => {
			const basePointer: Links.EntryPointer = {
				sourceDocRef: "source-doc-1",
				relationship: "PersonToAddress",
				targetRole: "address",
				type: "LINK",
				linkId: "link-1"
			};
			const link1 = {
				linkId: "link-1",
				targetDocRef: "target-1",
				documentModelName: "PersonDM",
				document: {
					id: "target-1",
					modelId: "test-model",
					elements: { name: { value: "First" } }
				},
				...basePointer
			};

			const afterFirst = Links.addLink(link1)(Links.create());

			const link2 = {
				linkId: "link-1",
				targetDocRef: "target-2",
				documentModelName: "PersonDM",
				document: {
					id: "target-2",
					modelId: "test-model",
					elements: { name: { value: "Second" } }
				},
				...basePointer
			};

			const afterSecond = Links.addLink(link2)(afterFirst);

			expect(afterSecond).toBe(afterFirst);
			const entry = Links.entryLens(basePointer).get(afterSecond);
			expect(entry?.targetDocRef).toBe("target-1");
		});

		it("should allow multiple entries per slot with different linkIds", () => {
			const pointer1: Links.EntryPointer = {
				sourceDocRef: "src-1",
				relationship: "rel",
				targetRole: "role",
				type: "LINK",
				linkId: "lk-A"
			};
			const pointer2: Links.EntryPointer = {
				sourceDocRef: "src-1",
				relationship: "rel",
				targetRole: "role",
				type: "LINK",
				linkId: "lk-B"
			};

			const link1 = {
				linkId: "lk-A",
				targetDocRef: "t1",
				documentModelName: "DM",
				document: { id: "t1", modelId: "test-model", elements: {} },
				...pointer1
			};
			const link2 = {
				linkId: "lk-B",
				targetDocRef: "t2",
				documentModelName: "DM",
				document: { id: "t2", modelId: "test-model", elements: {} },
				...pointer2
			};

			let links = Links.addLink(link1)(Links.create());
			links = Links.addLink(link2)(links);

			expect(Links.entryLens(pointer1).get(links)?.targetDocRef).toBe("t1");
			expect(Links.entryLens(pointer2).get(links)?.targetDocRef).toBe("t2");

			const bucket = Links.entriesLens({
				sourceDocRef: "src-1",
				relationship: "rel",
				targetRole: "role",
				type: "LINK"
			}).get(links);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(Object.keys(bucket!)).toHaveLength(2);
		});
	});

	describe("merge", () => {
		it("should merge incoming entries into existing", () => {
			const existing = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});
			const incoming = buildLinks({
				sourceDocRef: "doc2",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t2",
				document: { id: "t2", modelId: "test-model", elements: {} }
			});

			const result = Links.merge(incoming)(existing);

			expect(result.linksBySourceId).toHaveProperty("doc1");
			expect(result.linksBySourceId).toHaveProperty("doc2");
			expect(result.documentsById).toHaveProperty("t1");
			expect(result.documentsById).toHaveProperty("t2");
		});

		it("should overwrite existing entries with incoming (same linkId)", () => {
			const existing = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});
			const incoming = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t2",
				document: { id: "t2", modelId: "test-model", elements: {} }
			});

			const result = Links.merge(incoming)(existing);

			const entry = Links.resolveLink({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				linkId: "link-1"
			})(result);

			expect(entry?.targetDocRef).toBe("t2");
		});

		it("should merge relationships for same source doc ref", () => {
			const existing = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});
			const incoming = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel2",
				targetRole: "role2",
				type: "LINK",
				targetDocRef: "t2",
				document: { id: "t2", modelId: "test-model", elements: {} }
			});

			const result = Links.merge(incoming)(existing);

			expect(result.linksBySourceId["doc1"]).toHaveProperty("rel1");
			expect(result.linksBySourceId["doc1"]).toHaveProperty("rel2");
		});

		it("should preserve multiplicity when merging", () => {
			const existing = buildLinks(
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t1",
					document: { id: "t1", modelId: "test-model", elements: {} },
					linkId: "lk-A"
				},
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t2",
					document: { id: "t2", modelId: "test-model", elements: {} },
					linkId: "lk-B"
				}
			);

			const result = Links.merge(existing)(Links.create());

			const bucket = Links.entriesLens({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK"
			}).get(result);

			/* eslint-disable @typescript-eslint/no-non-null-assertion */
			expect(Object.keys(bucket!)).toHaveLength(2);
			expect(bucket!["lk-A"]?.targetDocRef).toBe("t1");
			expect(bucket!["lk-B"]?.targetDocRef).toBe("t2");
			/* eslint-enable @typescript-eslint/no-non-null-assertion */
		});
	});

	describe("retain", () => {
		it("should keep only entries reachable from activeDocRefs", () => {
			const links = buildLinks(
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t1",
					document: { id: "t1", modelId: "test-model", elements: {} }
				},
				{
					sourceDocRef: "doc2",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t2",
					document: { id: "t2", modelId: "test-model", elements: {} }
				}
			);

			const result = Links.retain(new Set(["doc1"]))(links);

			expect(result.linksBySourceId).toHaveProperty("doc1");
			expect(result.linksBySourceId).not.toHaveProperty("doc2");
			expect(result.documentsById).toHaveProperty("t1");
			expect(result.documentsById).not.toHaveProperty("t2");
		});

		it("should follow transitive links", () => {
			const links = buildLinks(
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t1",
					document: { id: "t1", modelId: "test-model", elements: {} }
				},
				{
					sourceDocRef: "t1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t2",
					document: { id: "t2", modelId: "test-model", elements: {} }
				},
				{
					sourceDocRef: "stale",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t3",
					document: { id: "t3", modelId: "test-model", elements: {} }
				}
			);

			const result = Links.retain(new Set(["doc1"]))(links);

			expect(result.linksBySourceId).toHaveProperty("doc1");
			expect(result.linksBySourceId).toHaveProperty("t1");
			expect(result.linksBySourceId).not.toHaveProperty("stale");
			expect(result.documentsById).toHaveProperty("t1");
			expect(result.documentsById).toHaveProperty("t2");
			expect(result.documentsById).not.toHaveProperty("t3");
		});

		it("should return unchanged data when all refs are active", () => {
			const links = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});

			const result = Links.retain(new Set(["doc1"]))(links);

			expect(result.linksBySourceId).toHaveProperty("doc1");
			expect(result.documentsById).toHaveProperty("t1");
		});

		it("should return empty data when no refs are active", () => {
			const links = buildLinks({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});

			const result = Links.retain(new Set(["nonexistent"]))(links);

			expect(result.linksBySourceId).not.toHaveProperty("doc1");
			expect(result.documentsById).not.toHaveProperty("t1");
		});

		it("should keep all reachable entries in multi-entry slots", () => {
			const links = buildLinks(
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t1",
					document: { id: "t1", modelId: "test-model", elements: {} },
					linkId: "lk-A"
				},
				{
					sourceDocRef: "doc1",
					relationship: "rel1",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t2",
					document: { id: "t2", modelId: "test-model", elements: {} },
					linkId: "lk-B"
				}
			);

			const result = Links.retain(new Set(["doc1"]))(links);

			const bucket = Links.entriesLens({
				sourceDocRef: "doc1",
				relationship: "rel1",
				targetRole: "role1",
				type: "LINK"
			}).get(result);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(Object.keys(bucket!)).toHaveLength(2);
			expect(result.documentsById).toHaveProperty("t1");
			expect(result.documentsById).toHaveProperty("t2");
		});
	});

	describe("getSourceDocRefsForRelationship", () => {
		it("should return sources that have the given relationship", () => {
			const links = buildLinks(
				{
					sourceDocRef: "src-1",
					relationship: "relA",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t1",
					document: { id: "t1", modelId: "test-model", elements: {} }
				},
				{
					sourceDocRef: "src-2",
					relationship: "relA",
					targetRole: "role1",
					type: "LINK",
					targetDocRef: "t2",
					document: { id: "t2", modelId: "test-model", elements: {} }
				}
			);

			const result = Links.getSourceDocRefsForRelationship("relA")(links);

			expect(result).toContain("src-1");
			expect(result).toContain("src-2");
			expect(result.size).toBe(2);
		});

		it("should not include sources that only have other relationships", () => {
			const links = buildLinks({
				sourceDocRef: "src-1",
				relationship: "relB",
				targetRole: "role1",
				type: "LINK",
				targetDocRef: "t1",
				document: { id: "t1", modelId: "test-model", elements: {} }
			});

			const result = Links.getSourceDocRefsForRelationship("relA")(links);

			expect(result.size).toBe(0);
		});

		it("should return an empty set when links are empty", () => {
			const result = Links.getSourceDocRefsForRelationship("relA")(Links.create());

			expect(result.size).toBe(0);
		});
	});
});
