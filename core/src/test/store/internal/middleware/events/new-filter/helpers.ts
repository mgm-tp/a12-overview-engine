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

import { vi } from "vitest";
import type { Middleware } from "redux";

import type { FilterState } from "../../../../../../main/index.js";
import { Commands } from "../../../../../../main/store/internal/actions.js";
import type { UiState } from "../../../../../../main/store/internal/store.js";
import type { FilterItemState } from "../../../../../../main/store/internal/filter-state.js";
import type { FilterStateSelectors } from "../../../../../../main/store/internal/selectors/filter-selectors.js";

type MockStore = {
	readonly getState: ReturnType<typeof vi.fn<() => UiState>>;
	readonly dispatch: ReturnType<typeof vi.fn<(action: unknown) => number>>;
};

type MiddlewareFn = (store: MockStore) => (next: (action: unknown) => unknown) => (action: unknown) => unknown;

export function createMiddlewareTest(middleware: Middleware) {
	const dispatched: unknown[] = [];
	const store: MockStore = {
		getState: vi.fn<() => UiState>(),
		dispatch: vi.fn((action: unknown) => dispatched.push(action))
	};
	const next = vi.fn((action: unknown) => action);
	const invoke = (middleware as unknown as MiddlewareFn)(store)(next);

	return { store, next, invoke, dispatched };
}

export function makeFilterItemState(overrides: Partial<FilterItemState> & { filterId?: string } = {}): FilterItemState {
	const { filterId = "filter1", ...rest } = overrides;

	return {
		groupId: "group1",
		model: { id: filterId, type: "string", preferFilterBar: false } as unknown as FilterItemState["model"],
		element: undefined,
		fieldPath: "",
		options: { criteria: "" },
		initialOptions: { criteria: "" },
		appliedOptions: { criteria: "" },
		area: "filterSelector",
		collapsed: false,
		resetCounter: 0,
		...rest
	};
}

const defaultFilterState: FilterState = {
	filters: {},
	snapshot: "",
	editingFilter: null,
	editingFilterSettingsId: null,
	queryOptions: {
		invert: {
			default: { enabled: true, value: false },
			current: { enabled: true, value: false },
			applied: { enabled: true, value: false }
		},
		joinOperator: {
			default: { enabled: true, value: "and" },
			current: { enabled: true, value: "and" },
			applied: { enabled: true, value: "and" }
		}
	},
	filterSelectorOptions: {
		open: false,
		searchBar: { enabled: true, value: false },
		showSetFiltersOnly: { enabled: true, value: false },
		viewMode: "overlay"
	}
};

export function makeFilterState(overrides: Partial<FilterState> = {}): FilterState {
	return {
		...defaultFilterState,
		...overrides
	};
}

export function makeUiState(newFilter?: FilterState): UiState {
	return {
		newFilter
	} as UiState;
}

export function getDispatchedFilterStates(dispatched: unknown[]): FilterState[] {
	return dispatched
		.filter((action) => Commands.setFilterState.match(action as Parameters<typeof Commands.setFilterState.match>[0]))
		.map((action) => (action as ReturnType<typeof Commands.setFilterState>).payload.state);
}

export function getDispatchedFilterOptions(dispatched: unknown[]): { filterId: string; options: object }[] {
	return dispatched
		.filter((action) =>
			Commands.setFilterOptions.match(action as Parameters<typeof Commands.setFilterOptions.match>[0])
		)
		.map((action) => (action as ReturnType<typeof Commands.setFilterOptions>).payload);
}

export function getDispatchedQueryParameters(dispatched: unknown[]) {
	return dispatched.filter((action) =>
		Commands.setQueryParameters.match(action as Parameters<typeof Commands.setQueryParameters.match>[0])
	);
}

export function createMockFilterStateSelectors(overrides: Partial<FilterStateSelectors> = {}): FilterStateSelectors {
	return {
		hasErrors: vi.fn(() => false),
		isEffectivelyEqual: vi.fn(() => false),
		toOperator: vi.fn(() => undefined),
		isResettable: vi.fn(() => false),
		createInitialOptions: vi.fn(() => ({})),
		toEffectiveOptions: vi.fn((_model, opts) => opts),
		toResetOptions: vi.fn(() => ({})),
		toLabel: vi.fn(() => null),
		hasAnySetFilter: vi.fn(() => false),
		isConfigurable: vi.fn(() => false),
		...overrides
	} as FilterStateSelectors;
}
