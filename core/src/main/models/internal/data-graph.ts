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

import { Links } from "./links.js";
import type { JSONLinkRef } from "./json-link.js";
import type { JSONDocument } from "./json-document.js";

/**
 * Combined data-graph shape used by OE data holders:
 * `documents` are the root entries shown in the pane, while `links` is the
 * pre-indexed tree of links and child-documents reachable from those roots.
 * @experimental
 */
export interface DataGraph {
	readonly documents: (JSONDocument | undefined)[];
	readonly links?: Links;
}

/** @experimental */
export namespace DataGraph {
	/**
	 * Identifies a link by its source and target entity roles and docRefs,
	 * plus the relationship that connects them.
	 * @experimental
	 */
	export interface EntityPair {
		readonly relationship: string;
		readonly source: { readonly role: string; readonly docRef: string };
		readonly target: { readonly role: string; readonly docRef: string };
	}

	/**
	 * Looks up a single link entry by entity pair, trying both sides as the index
	 * key and matching regardless of source/target order in the stored entry.
	 * Iterates all entries in the slot's `childEntries` and `linkEntries` buckets
	 * to find one whose `targetDocRef` matches the other side of the pair.
	 *
	 * @returns the matched entry + its resolved document (if present), or `undefined`.
	 * @experimental
	 */
	export function findEntryByEntities(
		pair: EntityPair
	): (
		dataGraph: DataGraph
	) => { readonly entry: JSONLinkRef; readonly targetRole: string; readonly document?: JSONDocument } | undefined {
		return (dataGraph) => {
			const { relationship, source, target } = pair;

			for (const [indexDocRef, otherDocRef] of [
				[source.docRef, target.docRef],
				[target.docRef, source.docRef]
			] as const) {
				const roles = dataGraph.links?.linksBySourceId[indexDocRef]?.[relationship];

				if (!roles) {
					continue;
				}

				for (const [role, slot] of Object.entries(roles)) {
					for (const entry of Object.values(slot?.childEntries ?? {})) {
						if (entry && entry.targetDocRef === otherDocRef) {
							const document = dataGraph.links?.documentsById[entry.targetDocRef];

							return { entry, targetRole: role, document };
						}
					}

					for (const entry of Object.values(slot?.linkEntries ?? {})) {
						if (entry && entry.targetDocRef === otherDocRef) {
							const document = dataGraph.links?.documentsById[entry.targetDocRef];

							return { entry, targetRole: role, document };
						}
					}
				}
			}

			return undefined;
		};
	}

	/**
	 * Upserts root-row entries in `dataGraph.documents`. For each provided document,
	 * replaces the existing row with the same `id`, or prepends it if no such row
	 * exists. Returns ref-equal dataGraph when every provided document is already
	 * strictly equal to its current slot.
	 * @experimental
	 */
	export function patchDocuments(documents: readonly JSONDocument[]): (dataGraph: DataGraph) => DataGraph {
		return (dataGraph) => {
			let changed = false;
			const result = dataGraph.documents.map((existing) => {
				const incoming = documents.find((d) => d.id === existing?.id && d.linkId === existing?.linkId);

				if (incoming !== undefined && incoming !== existing) {
					changed = true;

					return incoming;
				}

				return existing;
			});
			const prepended = documents.filter(
				(d) => !dataGraph.documents.some((e) => e?.id === d.id && e?.linkId === d.linkId)
			);

			if (prepended.length > 0) {
				changed = true;
				result.unshift(...prepended);
			}

			return changed ? { ...dataGraph, documents: result } : dataGraph;
		};
	}

	/**
	 * Upserts entries in `links.documentsById`. For each `{docRef, document}`,
	 * replaces the existing entry under `docRef`, or inserts it if absent. Returns
	 * ref-equal dataGraph when every entry is already strictly equal to its current slot.
	 * @experimental
	 */
	export function patchLinkDocuments(
		entries: readonly { readonly docRef: string; readonly document: JSONDocument }[]
	): (dataGraph: DataGraph) => DataGraph {
		return (dataGraph) => {
			let links = dataGraph.links;

			for (const { docRef, document } of entries) {
				if (links && links.documentsById[docRef] !== document) {
					links = Links.setDocument(docRef, document)(links);
				}
			}

			return links === dataGraph.links ? dataGraph : { ...dataGraph, links };
		};
	}

	/**
	 * Upserts a single link entry at the given pointer. Overwrites any existing
	 * entry with the same `linkId` in the slot's bucket; creates missing path segments.
	 * Derives the complete pointer (including `linkId`) from the entry itself.
	 * Returns ref-equal dataGraph when the stored entry is already strictly equal.
	 *
	 * Note: this function does not update `links.documentsById`. If the entry
	 * references a `targetDocRef` whose document is not yet stored, a separate
	 * {@link patchLinkDocuments} call is needed.
	 * @experimental
	 */
	export function patchLinks(pointer: Links.EntryPointer, entry: JSONLinkRef): (dataGraph: DataGraph) => DataGraph {
		return (dataGraph) => {
			const fullPointer: Links.EntryPointer = { ...pointer, linkId: entry.linkId };
			const lens = Links.entryLens(fullPointer);

			if (dataGraph.links && lens.get(dataGraph.links) === entry) {
				return dataGraph;
			}

			return { ...dataGraph, links: dataGraph.links && lens.set(entry)(dataGraph.links) };
		};
	}

	/**
	 * Returns every `JSONDocument` in the dataGraph whose document ref passes `predicate`.
	 * Searches both `dataGraph.documents` (root rows) and `dataGraph.links.documentsById`
	 * (child/link documents), de-duplicated by `docRef`. Treats root rows' `id` as
	 * their docRef.
	 * @experimental
	 */
	export function findDocuments(
		predicate: (docRef: string, document: JSONDocument) => boolean
	): (dataGraph: DataGraph) => readonly JSONDocument[] {
		return (dataGraph) => {
			const seen = new Set<string>();
			const result: JSONDocument[] = [];

			for (const doc of dataGraph.documents) {
				if (doc && !seen.has(doc.id) && predicate(doc.id, doc)) {
					seen.add(doc.id);
					result.push(doc);
				}
			}

			for (const [docRef, doc] of Object.entries(dataGraph.links?.documentsById ?? {})) {
				if (doc && !seen.has(docRef) && predicate(docRef, doc as JSONDocument)) {
					seen.add(docRef);
					result.push(doc as JSONDocument);
				}
			}

			return result;
		};
	}
}
