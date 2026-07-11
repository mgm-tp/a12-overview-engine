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

import type { Lens, Modifier } from "@com.mgmtp.a12.client/client-core";

import { atKey, compose } from "../../shared/lens-utils.js";

import type { JSONDocument } from "./json-document.js";
import type { JSONLink, JSONLinkRef } from "./json-link.js";

/**
 * A pre-indexed lookup table of resolved document links,
 * organized by source document → relationship → role.
 */
export interface Links {
	readonly linksBySourceId: {
		readonly [sourceDocRef: string]: Links.ByRelationship | undefined;
	};
	readonly documentsById: Partial<Record<string, JSONDocument>>;
}

/** @experimental */
export namespace Links {
	export interface ByRelationship {
		readonly [relationship: string]: ByTargetRole | undefined;
	}

	export interface ByTargetRole {
		readonly [targetRole: string]: BySlot | undefined;
	}

	export interface BySlot {
		readonly childEntries?: ByEntries;
		readonly linkEntries?: ByEntries;
	}

	export interface ByEntries {
		readonly [linkId: string]: JSONLinkRef | undefined;
	}

	/**
	 * Identifies a single link entry within {@link Links} by its
	 * source document, relationship, target role, and link type.
	 * When `linkId` is present, addresses a specific entry; when absent,
	 * addresses the bucket as a whole.
	 * @experimental
	 */
	export interface EntryPointer {
		readonly sourceDocRef: string;
		readonly relationship: string;
		readonly targetRole: string;
		readonly type: "CHILD" | "LINK";
		readonly linkId?: string;
	}

	/** Creates an empty {@link Links} instance. */
	export function create(): Links {
		return { linksBySourceId: {}, documentsById: {} };
	}

	const linksBySourceIdLens: Lens<Links, Links["linksBySourceId"]> = {
		get: (links) => links.linksBySourceId,
		set: (linksBySourceId) => (links) => ({ ...links, linksBySourceId })
	};

	const documentsByIdLens: Lens<Links, Links["documentsById"]> = {
		get: (links) => links.documentsById,
		set: (documentsById) => (links) => ({ ...links, documentsById })
	};

	/**
	 * Returns a lens focusing on a single link entry identified by the given {@link EntryPointer}.
	 * The pointer MUST carry a `linkId`; an error is thrown otherwise (internal invariant).
	 * @internal
	 */
	export function entryLens(pointer: EntryPointer): Lens<Links, JSONLinkRef | undefined> {
		const { sourceDocRef, relationship, targetRole, type, linkId } = pointer;

		if (!linkId) {
			throw new Error("[Links.entryLens] pointer.linkId is required but was not provided.");
		}

		return compose(
			linksBySourceIdLens,
			atKey(sourceDocRef, {}),
			atKey(relationship, {}),
			atKey(targetRole, {}),
			atKey(type === "CHILD" ? "childEntries" : "linkEntries", {}),
			atKey(linkId, undefined)
		);
	}

	/**
	 * Returns a lens focusing on the entries record (keyed by `linkId`) for the given pointer's
	 * type (`childEntries` or `linkEntries`). The pointer must NOT carry a `linkId`.
	 * @internal
	 */
	export function entriesLens(pointer: Omit<EntryPointer, "linkId">): Lens<Links, ByEntries | undefined> {
		const { sourceDocRef, relationship, targetRole, type } = pointer;

		return compose(
			linksBySourceIdLens,
			atKey(sourceDocRef, {}),
			atKey(relationship, {}),
			atKey(targetRole, {}),
			atKey(type === "CHILD" ? "childEntries" : "linkEntries", undefined)
		);
	}

	/**
	 * Returns a lens focusing on a single document by its document ref.
	 * @internal
	 */
	export function documentLens(docRef: string) {
		return compose(documentsByIdLens, atKey<JSONDocument | undefined>(docRef, undefined));
	}

	/**
	 * Returns a modifier that sets a link entry, overwriting any existing value.
	 * Derives `linkId` from the entry's own `linkId` property.
	 * @internal
	 */
	export function setEntry(entry: JSONLinkRef & EntryPointer): Modifier<Links> {
		const pointer: EntryPointer = { ...entry, linkId: entry.linkId };

		return entryLens(pointer).set(entry);
	}

	/**
	 * Returns a modifier that sets a document by its document ref, overwriting any existing value.
	 * @internal
	 */
	export function setDocument(docRef: string, document: JSONDocument): Modifier<Links> {
		return documentLens(docRef).set(document);
	}

	/**
	 * Returns a modifier that merges all entries and documents from `incoming` into the target.
	 * @internal
	 */
	export function merge(incomingLinks: Links): Modifier<Links> {
		return (existingLinks) => {
			let result = existingLinks;

			for (const [sourceDocRef, relationships] of Object.entries(incomingLinks.linksBySourceId)) {
				for (const [relationship, roles] of Object.entries(relationships ?? {})) {
					for (const [targetRole, slot] of Object.entries(roles ?? {})) {
						for (const [linkId, entry] of Object.entries(slot?.childEntries ?? {})) {
							if (entry) {
								result = setEntry({
									...entry,
									sourceDocRef,
									relationship,
									targetRole,
									type: "CHILD",
									linkId
								})(result);
							}
						}

						for (const [linkId, entry] of Object.entries(slot?.linkEntries ?? {})) {
							if (entry) {
								result = setEntry({
									...entry,
									sourceDocRef,
									relationship,
									targetRole,
									type: "LINK",
									linkId
								})(result);
							}
						}
					}
				}
			}

			for (const [docRef, document] of Object.entries(incomingLinks.documentsById)) {
				if (document) {
					result = setDocument(docRef, document)(result);
				}
			}

			return result;
		};
	}

	/**
	 * Returns a modifier that removes entries not reachable from the given active document refs.
	 * Performs a BFS traversal following link chains to determine reachability.
	 * @internal
	 */
	export function retain(activeDocRefs: ReadonlySet<string>): Modifier<Links> {
		return (links) => {
			const sourceKeys = new Set(Object.keys(links.linksBySourceId));
			const reachableSources = new Set<string>();
			let reachableTargets = new Set<string>();
			const queue = [...activeDocRefs];

			while (queue.length) {
				const sourceDocRef = queue.pop();

				if (!sourceDocRef || reachableSources.has(sourceDocRef) || !sourceKeys.has(sourceDocRef)) {
					continue;
				}

				reachableSources.add(sourceDocRef);

				const targets = new Set(
					Object.values(links.linksBySourceId[sourceDocRef] ?? {})
						.flatMap((roles) => Object.values(roles ?? {}))
						.flatMap((slot) => Object.values(slot?.childEntries ?? {}).concat(Object.values(slot?.linkEntries ?? {})))
						.flatMap((entry) => entry?.targetDocRef ?? [])
				);

				reachableTargets = reachableTargets.union(targets);
				queue.push(...targets.intersection(sourceKeys));
			}

			const removedSources = sourceKeys.difference(reachableSources);
			const removedDocs = new Set(Object.keys(links.documentsById)).difference(reachableTargets);

			let result = links;

			for (const key of removedSources) {
				const { [key]: _, ...rest } = result.linksBySourceId;
				result = { ...result, linksBySourceId: rest };
			}

			for (const key of removedDocs) {
				const { [key]: _, ...rest } = result.documentsById;
				result = { ...result, documentsById: rest };
			}

			return result;
		};
	}

	/**
	 * Returns a modifier that adds a link entry and its target document,
	 * but only if an entry with the same `linkId` does not already exist.
	 * If the entry exists, the modifier is a no-op (first-wins idempotency).
	 * @internal
	 */
	export function addLink(link: JSONLink & EntryPointer): Modifier<Links> {
		const pointer: EntryPointer = { ...link, linkId: link.linkId };
		const lens = entryLens(pointer);

		return (links) => {
			if (lens.get(links)) {
				return links;
			}

			const { document, ...entry } = link;
			const docLens = documentLens(entry.targetDocRef);
			const withEntryLinks = lens.set(entry)(links);

			return docLens.get(links) ? withEntryLinks : docLens.set(document)(withEntryLinks);
		};
	}

	/**
	 * Resolves a single link entry with its target document, returning a {@link JSONLink} or `undefined`.
	 *
	 * If `pointer.linkId` is present, resolves that exact entry.
	 * If `pointer.linkId` is absent, returns the first entry in the bucket
	 * (preserves single-entry semantics for non-exclude callers).
	 * @internal
	 */
	export function resolveLink(pointer: EntryPointer) {
		return (links: Links): JSONLink | undefined => {
			let entry: JSONLinkRef | undefined;

			if (pointer.linkId) {
				entry = entryLens(pointer).get(links);
			} else {
				const bucket = entriesLens(pointer).get(links);
				entry = firstEntry(bucket);
			}

			if (!entry) {
				return undefined;
			}

			const document = documentLens(entry.targetDocRef).get(links);

			if (!document) {
				return undefined;
			}

			return { ...entry, document };
		};
	}

	/**
	 * Resolves a chain of link references starting from `sourceDocRef`,
	 * following each hop's `targetDocRef` as the next source. Returns the final
	 * resolved {@link JSONLink} or `undefined` if any hop fails.
	 *
	 * When `linkId` is provided, the first hop is anchored to that specific entry.
	 * If the entry is not found under `sourceDocRef` (exclude-mode: the row's docRef
	 * differs from the link's actual source), all sources are scanned for a match.
	 * Subsequent hops always use first-entry fallback.
	 * @internal
	 */
	export function resolvePath(
		sourceDocRef: string,
		linkReferences: readonly Omit<EntryPointer, "sourceDocRef">[],
		linkId?: string
	) {
		return (links: Links): JSONLink | undefined => {
			let currentSourceDocRef = sourceDocRef;
			let resolvedLink: JSONLink | undefined;

			for (let i = 0; i < linkReferences.length; i++) {
				const linkReference = linkReferences[i];
				let link: JSONLink | undefined;

				if (i === 0 && linkId) {
					const pointer: EntryPointer = {
						sourceDocRef: currentSourceDocRef,
						...linkReference,
						linkId
					};
					link = resolveLink(pointer)(links);

					if (!link) {
						link = resolveLink({ sourceDocRef: currentSourceDocRef, ...linkReference })(links);
					}
				} else {
					link = resolveLink({ sourceDocRef: currentSourceDocRef, ...linkReference })(links);
				}

				if (!link) {
					return undefined;
				}

				resolvedLink = link;
				currentSourceDocRef = link.targetDocRef;
			}

			return resolvedLink;
		};
	}

	/**
	 * Returns the set of `sourceDocRef` keys in `links` that have any entry for
	 * the given relationship. Purely structural; no role filtering.
	 * @experimental
	 */
	export function getSourceDocRefsForRelationship(relationship: string): (links: Links) => ReadonlySet<string> {
		return (links) => {
			const result = new Set<string>();

			for (const [sourceDocRef, relationships] of Object.entries(links.linksBySourceId)) {
				if (relationships?.[relationship]) {
					result.add(sourceDocRef);
				}
			}

			return result;
		};
	}

	/** Returns the first defined entry from a bucket, or undefined if the bucket is empty/undefined. */
	function firstEntry(bucket: ByEntries | undefined): JSONLinkRef | undefined {
		if (!bucket) {
			return undefined;
		}

		for (const entry of Object.values(bucket)) {
			if (entry) {
				return entry;
			}
		}

		return undefined;
	}
}
