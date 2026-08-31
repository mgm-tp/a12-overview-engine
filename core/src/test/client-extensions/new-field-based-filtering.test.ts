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

import { it, vi, expect, describe, beforeAll } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { NewFieldBasedFiltering } from "../../main/client-extensions/internal/utils/new-field-based-filtering.js";
import type { FilterState, ModelsState } from "../../main/store/index.js";
import type { FilterItemState } from "../../main/store/internal/filter-state.js";
import type { FilterStateSelectors } from "../../main/store/internal/selectors/filter-selectors.js";
import { getDocumentModel } from "../setup/models.js";

function makeFilter(id: string, preferFilterBar: boolean, criteria = id): FilterItemState {
	return {
		groupId: "g1",
		model: {
			id,
			type: "string",
			preferFilterBar,
			options: { fieldId: "F1", subModel: undefined }
		} as unknown as FilterItemState["model"],
		element: undefined,
		fieldPath: "",
		options: { criteria },
		initialOptions: { criteria: "" },
		appliedOptions: { criteria: "" },
		area: preferFilterBar ? "filterBar" : "filterSelector",
		collapsed: false,
		resetCounter: 0
	};
}

interface QueryOptionsOverride {
	readonly invert?: FilterState["queryOptions"]["invert"]["current"];
	readonly joinOperator?: FilterState["queryOptions"]["joinOperator"]["current"];
}

function makeFilter20State(
	filters: FilterItemState[],
	queryOptionsOverride: QueryOptionsOverride = {},
	opts?: Partial<FilterState>
): FilterState {
	const map: Record<string, FilterItemState> = {};

	for (const f of filters) {
		map[f.model.id] = f;
	}

	const invert = queryOptionsOverride.invert ?? { enabled: true, value: false };
	const joinOperator = queryOptionsOverride.joinOperator ?? { enabled: true, value: "and" };

	return {
		filters: map,
		snapshot: "",
		editingFilter: null,
		editingFilterSettingsId: null,
		queryOptions: {
			invert: { default: invert, current: invert, applied: invert },
			joinOperator: { default: joinOperator, current: joinOperator, applied: joinOperator }
		},
		filterSelectorOptions: {
			open: false,
			searchBar: { enabled: true, value: false },
			showSetFiltersOnly: { enabled: true, value: false },
			viewMode: "overlay"
		},
		...opts
	} satisfies FilterState;
}

function makeSelectors(map: Record<string, Query.Operator | undefined>): FilterStateSelectors {
	return {
		hasErrors: vi.fn(),
		toGeneralError: vi.fn(),
		isEffectivelyEqual: vi.fn(),
		toOperator: vi.fn((f: FilterItemState) => map[f.model.id]),
		isResettable: vi.fn(),
		createInitialOptions: vi.fn(),
		toEffectiveOptions: vi.fn(),
		toResetOptions: vi.fn(),
		toLabel: vi.fn(),
		hasAnySetFilter: vi.fn(),
		isConfigurable: vi.fn()
	} as FilterStateSelectors;
}

describe("NewFieldBasedFiltering.toOperator", () => {
	let documentModel: DocumentModel;
	let modelsState: ModelsState;

	beforeAll(async () => {
		documentModel = await getDocumentModel("unit-test", "DomainTest");
		modelsState = { documentModel } as ModelsState;
	});

	const op = (field: string, value: string): Query.Operator => {
		const built = QueryBuilder.exactMatch(field, value).build();

		if (!built) {
			throw new Error(`exactMatch(${field}, ${value}) returned undefined`);
		}

		return built;
	};

	it("returns empty array when no filters", () => {
		const state = makeFilter20State([]);
		const result = NewFieldBasedFiltering.toOperator(state, modelsState, makeSelectors({}));

		expect(result).toBeUndefined();
	});

	it("returns empty array when all controllers return undefined operators", () => {
		const filters = [makeFilter("f1", true), makeFilter("f2", false)];
		const state = makeFilter20State(filters);
		const selectors = makeSelectors({ f1: undefined, f2: undefined });

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, selectors);

		expect(result).toBeUndefined();
	});

	function hasOperator(node: unknown, target: string): boolean {
		if (!node || typeof node !== "object") {
			return false;
		}

		const obj = node as { operator?: string; operands?: unknown[]; operand?: unknown };

		if (obj.operator === target) {
			return true;
		}

		if (Array.isArray(obj.operands)) {
			return obj.operands.some((c) => hasOperator(c, target));
		}

		if (obj.operand !== undefined) {
			return hasOperator(obj.operand, target);
		}

		return false;
	}

	it("ANDs bar and selector operators by default", () => {
		const barOp = op("/root/string", "bar");
		const selOp = op("/root/string", "sel");
		const filters = [makeFilter("bar1", true), makeFilter("sel1", false)];
		const state = makeFilter20State(filters);
		const selectors = makeSelectors({ bar1: barOp, sel1: selOp });

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, selectors);

		expect(hasOperator(result, Query.OPERATORS.AND_OPERATOR)).toBe(true);
		expect(JSON.stringify(result)).toContain('"value":"bar"');
		expect(JSON.stringify(result)).toContain('"value":"sel"');
	});

	it("uses OR when bar joinOperator is 'or'", () => {
		const filters = [makeFilter("a", true), makeFilter("b", true)];
		const state = makeFilter20State(filters, {
			joinOperator: { enabled: true, value: "or" },
			invert: { enabled: true, value: false }
		});
		const a = op("/root/string", "a");
		const b = op("/root/string", "b");
		const selectors = makeSelectors({ a, b });

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, selectors);

		expect(hasOperator(result, Query.OPERATORS.OR_OPERATOR)).toBe(true);
	});

	it("inverts bar branch when bar invert is enabled and true", () => {
		const filters = [makeFilter("a", true)];
		const state = makeFilter20State(filters, {
			joinOperator: { enabled: true, value: "and" },
			invert: { enabled: true, value: true }
		});
		const a = op("/root/string", "a");

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, makeSelectors({ a }));

		expect(hasOperator(result, Query.OPERATORS.NOT_OPERATOR)).toBe(true);
	});

	it("ignores invert when invert option disabled", () => {
		const filters = [makeFilter("a", true)];
		const state = makeFilter20State(filters, {
			joinOperator: { enabled: true, value: "and" },
			invert: { enabled: false }
		});
		const a = op("/root/string", "a");

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, makeSelectors({ a }));

		expect(result).toBeDefined();
		expect(hasOperator(result, Query.OPERATORS.NOT_OPERATOR)).toBe(false);
	});

	it("falls back to AND when joinOperator disabled regardless of value", () => {
		const filters = [makeFilter("a", true), makeFilter("b", true)];
		const state = makeFilter20State(filters, {
			joinOperator: { enabled: false },
			invert: { enabled: true, value: false }
		});
		const a = op("/root/string", "a");
		const b = op("/root/string", "b");

		const result = NewFieldBasedFiltering.toOperator(state, modelsState, makeSelectors({ a, b }));

		expect(hasOperator(result, Query.OPERATORS.OR_OPERATOR)).toBe(false);
	});

	it("invokes selectors.toOperator with correct documentModel context", () => {
		const filters = [makeFilter("a", true)];
		const state = makeFilter20State(filters);
		const a = op("/root/string", "a");
		const selectors = makeSelectors({ a });

		NewFieldBasedFiltering.toOperator(state, modelsState, selectors);

		expect(selectors.toOperator).toHaveBeenCalledWith(
			expect.objectContaining({ model: expect.objectContaining({ id: "a" }) }),
			{ documentModel }
		);
	});
});
