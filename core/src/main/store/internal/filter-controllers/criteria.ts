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

import { Lens } from "monocle-ts/lib/index.js";

import type { OverviewModel, RangeOptionCriteria } from "../../../overview-model.js";

/**
 * Segment within a range filter: `"from"`, `"to"`, or `"exact"`.
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export type SegmentOption = "from" | "to" | "exact";

/**
 * Boundary segments only — excludes `"exact"`.
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export type BoundarySegment = Exclude<SegmentOption, "exact">;

/**
 * Discriminated map of 4 range modes with typed values per segment.
 * All slots are optional: only the ranges configured by the model are allocated at runtime
 * (see {@link RangeCriteria.create}). Consumers must gate access by `selectedRange`
 * or use optional chaining.
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export type RangeCriteria<T> = Partial<RangeOptionCriteria<T>>;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace RangeCriteria {
	const ALL_RANGES = [
		"fromTo",
		"fromOnly",
		"toOnly",
		"exact"
	] as const satisfies readonly OverviewModel.NewFilter.RangeOption[];

	export function create<T>(
		defaultValue: T,
		creator?: (params: { range: OverviewModel.NewFilter.RangeOption; segment: SegmentOption }) => T | undefined,
		availableRanges: readonly OverviewModel.NewFilter.RangeOption[] = ALL_RANGES
	): Partial<RangeOptionCriteria<T>> {
		const result: Partial<RangeOptionCriteria<T>> = {};

		if (availableRanges.includes("fromTo")) {
			result.fromTo = {
				from: creator?.({ range: "fromTo", segment: "from" }) ?? defaultValue,
				to: creator?.({ range: "fromTo", segment: "to" }) ?? defaultValue
			};
		}

		if (availableRanges.includes("fromOnly")) {
			result.fromOnly = { from: creator?.({ range: "fromOnly", segment: "from" }) ?? defaultValue };
		}

		if (availableRanges.includes("toOnly")) {
			result.toOnly = { to: creator?.({ range: "toOnly", segment: "to" }) ?? defaultValue };
		}

		if (availableRanges.includes("exact")) {
			result.exact = { exact: creator?.({ range: "exact", segment: "exact" }) ?? defaultValue };
		}

		return result;
	}

	export function requireSlot<
		C extends RangeCriteria<unknown>,
		R extends keyof C & OverviewModel.NewFilter.RangeOption
	>(criteria: C, range: R): NonNullable<C[R]> {
		const slot = criteria[range];

		if (slot === undefined) {
			throw new Error(`RangeCriteria has no slot for range "${range}"`);
		}

		return slot as NonNullable<C[R]>;
	}

	export function selectCurrentCriteria<C extends Partial<RangeOptionCriteria<unknown>>>(options: {
		readonly selectedRange: OverviewModel.NewFilter.RangeOption;
		readonly criteria: C;
	}): NonNullable<C[OverviewModel.NewFilter.RangeOption]> {
		return requireSlot(options.criteria, options.selectedRange) as NonNullable<C[OverviewModel.NewFilter.RangeOption]>;
	}

	export interface ResolvedEntry<T> {
		readonly segment: BoundarySegment;
		readonly value: T | undefined;
	}

	export interface ResolveResult<T> {
		asValues(): [T | undefined, T | undefined];
		asMap(): readonly [ResolvedEntry<T>, ResolvedEntry<T>];
	}

	export function resolve<T>(criteria: RangeCriteria<T>, range: OverviewModel.NewFilter.RangeOption): ResolveResult<T> {
		const from = getValue<T>(criteria, range, "from") ?? getValue<T>(criteria, range, "exact");
		const to = getValue<T>(criteria, range, "to") ?? getValue<T>(criteria, range, "exact");

		return {
			asValues: () => [from, to],
			asMap: () => [
				{ segment: "from", value: from },
				{ segment: "to", value: to }
			]
		};
	}

	export function getValue<T>(
		criteria: RangeCriteria<T>,
		range: OverviewModel.NewFilter.RangeOption,
		segment: SegmentOption
	): T | undefined {
		if (range === "fromTo") {
			if (segment === "from") {
				return criteria.fromTo?.from;
			}

			if (segment === "to") {
				return criteria.fromTo?.to;
			}
		}

		if (range === "fromOnly" && segment === "from") {
			return criteria.fromOnly?.from;
		}

		if (range === "toOnly" && segment === "to") {
			return criteria.toOnly?.to;
		}

		if (range === "exact" && segment === "exact") {
			return criteria.exact?.exact;
		}

		return undefined;
	}

	/** @internal */
	export function segmentLens<T>(
		range: OverviewModel.NewFilter.RangeOption,
		segment: SegmentOption
	): Lens<RangeCriteria<T>, T> {
		return Lens.fromPath<RangeCriteria<T>>()([range, segment] as never) as unknown as Lens<RangeCriteria<T>, T>;
	}
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type PeriodCriteria<P extends string, M extends Record<P, unknown>> = {
	readonly [K in P]: RangeCriteria<M[K]>;
};

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace PeriodCriteria {
	/** @internal */
	export function slotLens<P extends string, M extends Record<P, unknown>, K extends P>(
		period: K,
		range: OverviewModel.NewFilter.RangeOption,
		segment: SegmentOption
	): Lens<PeriodCriteria<P, M>, M[K]> {
		return Lens.fromProp<PeriodCriteria<P, M>>()(period).compose(
			RangeCriteria.segmentLens<M[K]>(range, segment) as unknown as Lens<PeriodCriteria<P, M>[K], M[K]>
		) as unknown as Lens<PeriodCriteria<P, M>, M[K]>;
	}

	/** @internal */
	export function rangeLens<
		Period extends string,
		Criteria extends Record<Period, unknown>,
		K extends Period,
		Range extends OverviewModel.NewFilter.RangeOption
	>(period: K, range: Range): Lens<PeriodCriteria<Period, Criteria>, RangeCriteria<Criteria[K]>[Range]> {
		return Lens.fromProp<PeriodCriteria<Period, Criteria>>()(period).compose(
			Lens.fromProp<RangeCriteria<Criteria[K]>>()(range) as unknown as Lens<
				PeriodCriteria<Period, Criteria>[K],
				RangeCriteria<Criteria[K]>[Range]
			>
		) as unknown as Lens<PeriodCriteria<Period, Criteria>, RangeCriteria<Criteria[K]>[Range]>;
	}

	export function requirePeriod<P extends string, M extends Record<P, unknown>, K extends P>(
		criteria: PeriodCriteria<P, M>,
		period: K
	): RangeCriteria<M[K]> {
		const slot = criteria[period];

		if (slot === undefined) {
			throw new Error(`PeriodCriteria has no slot for period "${String(period)}"`);
		}

		return slot;
	}

	export function requireRange<
		P extends string,
		M extends Record<P, unknown>,
		K extends P,
		R extends OverviewModel.NewFilter.RangeOption
	>(criteria: PeriodCriteria<P, M>, period: K, range: R): NonNullable<RangeCriteria<M[K]>[R]> {
		return RangeCriteria.requireSlot(requirePeriod(criteria, period), range);
	}

	export function resolve<P extends string, M extends Record<P, unknown>, K extends P>(
		criteria: PeriodCriteria<P, M>,
		period: K,
		range: OverviewModel.NewFilter.RangeOption
	): RangeCriteria.ResolveResult<M[K]> {
		return RangeCriteria.resolve(requirePeriod(criteria, period), range);
	}
}
