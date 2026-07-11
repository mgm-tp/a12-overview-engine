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

import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { FilterLabelContext } from "../filter-controller.js";
import type { OverviewModel } from "../../../../overview-model.js";
import type { RangeCriteria, BoundarySegment } from "../criteria.js";
import { isDefined } from "../../../../services/filter-format-utils.js";

/**
 * Encapsulates one input shape: validation projection, label rendering, optional
 * query-value conversion. Multi-mode filters dispatch on `accept(key)`; single-mode
 * filters use one resolver directly.
 */
export interface Resolver<TInput, TKey extends string = string, TQueryValue = never> {
	/** Returns true if this resolver handles the given dispatch key (period name, etc.). */
	accept(key: TKey): boolean;

	/**
	 * Project a populated input to a comparable number. Used to detect invalid
	 * ranges via simple `from > to` comparison. Returns `null` for empty inputs
	 * (treated as "not comparable" — never invalid).
	 */
	toComparable(input: TInput): number | null;

	/** Render a filter-bar / chip label for the active range. */
	toLabel(
		criteria: RangeCriteria<TInput>,
		range: OverviewModel.NewFilter.RangeOption,
		context: ResolverLabelContext
	): string | null;

	/** Convert one populated input to its query-ready primitive (`TQueryValue`). */
	toQueryValue?(input: TInput, segment: BoundarySegment, ctx: ResolverQueryContext): TQueryValue | undefined;
}

export interface ResolverQueryContext {
	readonly documentModel: DocumentModel;
	readonly fieldPath: string;
}

/**
 * Full label-rendering services available to resolvers. Mirrors `FilterLabelContext`
 * from filter-controller.ts plus the per-filter `fieldPath` and `subModel` —
 * allows resolvers (e.g. DateFragment monthDay) that need `formatValue` to render
 * via the host's value-conversion config.
 */
export interface ResolverLabelContext extends FilterLabelContext {
	readonly subModel?: string;
}

/** Find the resolver in `resolvers` that accepts `key`. Throws if none matches. */
export function selectResolver<TInput, TKey extends string, TQueryValue>(
	resolvers: readonly Resolver<TInput, TKey, TQueryValue>[],
	key: TKey
): Resolver<TInput, TKey, TQueryValue> {
	const resolver = resolvers.find((r) => r.accept(key));

	if (!resolver) {
		throw new Error(`No resolver accepts key "${key}"`);
	}

	return resolver;
}

/**
 * Returns true when both inputs project to a comparable number AND `from > to`.
 * Empty inputs (null projection) yield `false` — incomplete ranges are never
 * "invalid" in this sense; per-input errors are surfaced separately.
 */
export function isInvalidRange<TInput>(
	resolver: Pick<Resolver<TInput>, "toComparable">,
	from: TInput,
	to: TInput
): boolean {
	const f = resolver.toComparable(from);
	const t = resolver.toComparable(to);

	return isDefined(f) && isDefined(t) && f > t;
}
