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

import { Lens } from "monocle-ts";
import type { Store } from "redux";
import { it, expect, describe } from "vitest";
import { waitFor } from "@testing-library/react";

import { noop } from "@com.mgmtp.a12.widgets/widgets-core";

import type { UiState } from "../../../../main/store/index.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { Events, Commands, UiStateSelector } from "../../../../main/store/index.js";
import type { StringFilterState } from "../../../../main/store/internal/filter-state.js";
import { FilterFocusContext } from "../../../../main/view/context/filter-focus-context.js";
import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import { FilterBar } from "../../../../main/view/components/new-filters/components/filter-bar.js";
import { OverviewContentBoxContext } from "../../../../main/view/context/overview-content-box-context.js";
import { FilterSelector } from "../../../../main/view/components/new-filters/components/filter-selector.js";
import { DefaultFilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";

import { ProductFieldIds } from "../../../setup/product-field-ids.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";

import { renderWithStore, baseFilterGroup, baseFilterConfiguration } from "./setup.js";

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);

const filterFocusContextValue: FilterFocusContext.Type = {
	registerRef: noop,
	onFocusedFilterChange: noop
};

const contentBoxContextValue: OverviewContentBoxContext.Type = {
	showFilterSelector: false,
	showMobileFilterBar: false,
	showMobileSearchBar: false,
	setShowMobileSearchBar: noop,
	toggleMobileFilterBar: noop,
	onFilterSelectorVisibilityChange: noop,
	getTriggerElementRef: noop
};

const filterA: OverviewModel.NewFilter.String.Item = {
	id: "filter-a",
	type: "string",
	label: [{ locale: "en", text: "Filter A" }],
	preferFilterBar: true,
	options: {
		fieldId: ProductFieldIds.name.id,
		empty: { enabled: false },
		invert: { enabled: false },
		caseSensitive: { enabled: false },
		exactMatch: { enabled: false }
	}
};

const filterB: OverviewModel.NewFilter.String.Item = {
	id: "filter-b",
	type: "string",
	label: [{ locale: "en", text: "Filter B" }],
	preferFilterBar: true,
	options: {
		fieldId: ProductFieldIds.name.id,
		empty: { enabled: false },
		invert: { enabled: false },
		caseSensitive: { enabled: false },
		exactMatch: { enabled: false }
	}
};

async function setupTest(options?: { filterConfiguration?: Partial<typeof baseFilterConfiguration> }) {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");

	const overviewModel = filterConfigurationLens.set({
		...baseFilterConfiguration,
		...options?.filterConfiguration,
		filterGroups: [{ ...baseFilterGroup, filterItems: [filterA, filterB] }]
	})(productOM);

	const renderResult = await renderWithStore(
		<FilterFocusContext.Provider value={filterFocusContextValue}>
			<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
				<FilterBar />
				<FilterSelector />
			</OverviewContentBoxContext.Provider>
		</FilterFocusContext.Provider>,
		{ engineProps: { documentModel, overviewModel, data: [] } }
	);

	await waitFor(() => {
		const state = renderResult.store.getState();
		expect(state.newFilter).toBeDefined();
		expect(state.newFilter?.filters["filter-a"]).toBeDefined();
	});

	return renderResult;
}

function simulateOverflow(store: Store<UiState>) {
	store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter-b"] }));
}

function getFilterState(store: Store<UiState>, filterId: string) {
	const state = store.getState().newFilter;
	assertCondition(state !== undefined, "Filter state not initialized");
	const filter = state.filters[filterId];
	assertCondition(filter !== undefined, `Filter ${filterId} not found`);

	return filter;
}

function getCriteria(store: Store<UiState>, filterId: string): string | undefined {
	const filter = getFilterState(store, filterId);

	return (filter.options as StringFilterState.Options).criteria.value;
}

function getAppliedCriteria(store: Store<UiState>, filterId: string): string | undefined {
	const filter = getFilterState(store, filterId);

	return (filter.appliedOptions as StringFilterState.Options | undefined)?.criteria.value;
}

function setFilterValue(store: Store<UiState>, filterId: string, value: string) {
	const state = store.getState().newFilter;
	assertCondition(state !== undefined, "Filter state not initialized");
	const filter = state.filters[filterId];
	assertCondition(filter !== undefined, `Filter ${filterId} not found`);

	store.dispatch(
		Commands.setFilterState({
			state: {
				...state,
				filters: {
					...state.filters,
					[filterId]: {
						...filter,
						options: { ...filter.options, criteria: { value } }
					}
				}
			}
		})
	);
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.filter-overflow", () => {
	describe("Issue 1: FS Reset All scope includes overflowed FB filters", () => {
		it("FS Reset All resets overflowed FB filters and non-overflowed FB filters", async () => {
			const { store } = await setupTest();

			setFilterValue(store, "filter-a", "value-a");
			setFilterValue(store, "filter-b", "value-b");

			simulateOverflow(store);

			expect(getFilterState(store, "filter-b").area).toBe("filterSelector");
			expect(getCriteria(store, "filter-b")).toBe("value-b");

			store.dispatch(Events.NewFilter.onFilterSelectorReset());

			expect(getCriteria(store, "filter-a")).toBeUndefined();
			expect(getCriteria(store, "filter-b")).toBeUndefined();
		});
	});

	describe("Issue 2: FS Apply All scope includes overflowed FB filters", () => {
		it("FS Apply All applies an overflowed FB filter's changes", async () => {
			const { store } = await setupTest();

			simulateOverflow(store);

			setFilterValue(store, "filter-b", "world");

			store.dispatch(Events.NewFilter.onFilterSelectorAllApplied());

			expect(getAppliedCriteria(store, "filter-b")).toBe("world");
		});
	});

	describe("Issue 3: Apply disabled when overflowed FB filter has error", () => {
		it("hasFilterSelectorErrors includes overflowed FB filters in its check", async () => {
			const { store } = await setupTest();

			simulateOverflow(store);

			const hasErrors = UiStateSelector.NewFilter.hasFilterSelectorErrors(DefaultFilterStateSelectors)(
				store.getState()
			);

			expect(hasErrors).toBe(false);

			const filterBState = getFilterState(store, "filter-b");
			expect(filterBState.area).toBe("filterSelector");
			expect(filterBState.model.preferFilterBar).toBe(true);
		});
	});

	describe("Issue 4: Snapshot includes overflowed FB filter changes", () => {
		it("isApplicable returns true when only an overflowed FB filter changed", async () => {
			const { store } = await setupTest();

			simulateOverflow(store);

			setFilterValue(store, "filter-b", "changed");

			const applicable = UiStateSelector.NewFilter.isApplicable(DefaultFilterStateSelectors)(store.getState());
			expect(applicable).toBe(true);
		});
	});

	describe("Issue 5: Overflow closes dropdown and discards editing state", () => {
		it("overflowing a filter that is being edited clears the editing state", async () => {
			const { store } = await setupTest();

			store.dispatch(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter-b" }));

			const beforeOverflow = store.getState().newFilter;
			assertCondition(beforeOverflow !== undefined);
			expect(beforeOverflow.editingFilter?.filterId).toBe("filter-b");

			simulateOverflow(store);

			const afterOverflow = store.getState().newFilter;
			assertCondition(afterOverflow !== undefined);
			expect(afterOverflow.editingFilter).toBeNull();
		});
	});

	describe("Issue 6: Moving filter back to bar reverts unapplied edits", () => {
		it("unapplied changes are reverted when a filter moves from FS back to bar", async () => {
			const { store } = await setupTest();

			simulateOverflow(store);

			setFilterValue(store, "filter-b", "unapplied-value");

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

			expect(getCriteria(store, "filter-b")).toBeUndefined();
		});
	});

	describe("Issue 7: FS Reset resets both surfaces, FB Reset resets visible bar only", () => {
		it("FS Reset resets all filters in both surfaces including overflowed ones", async () => {
			const { store } = await setupTest();

			setFilterValue(store, "filter-a", "value-a");
			setFilterValue(store, "filter-b", "value-b");

			simulateOverflow(store);

			store.dispatch(Events.NewFilter.onFilterSelectorReset());

			expect(getCriteria(store, "filter-a")).toBeUndefined();
			expect(getCriteria(store, "filter-b")).toBeUndefined();
		});

		it("FB Reset resets only visible bar filters, not overflowed ones", async () => {
			const { store } = await setupTest();

			setFilterValue(store, "filter-a", "value-a");
			setFilterValue(store, "filter-b", "value-b");

			simulateOverflow(store);

			store.dispatch(Events.NewFilter.onFilterBarReset());

			expect(getCriteria(store, "filter-a")).toBeUndefined();

			expect(getCriteria(store, "filter-b")).toBe("value-b");
		});
	});

	describe("Issue 8: Apply button disabled after Reset All", () => {
		it("Apply All is disabled after Apply then Reset All", async () => {
			const { store } = await setupTest();

			simulateOverflow(store);

			setFilterValue(store, "filter-b", "fs-value");

			store.dispatch(Events.NewFilter.onFilterSelectorAllApplied());
			expect(getAppliedCriteria(store, "filter-b")).toBe("fs-value");

			store.dispatch(Events.NewFilter.onFilterSelectorReset());

			expect(getCriteria(store, "filter-a")).toBeUndefined();
			expect(getCriteria(store, "filter-b")).toBeUndefined();

			const applicable = UiStateSelector.NewFilter.isApplicable(DefaultFilterStateSelectors)(store.getState());
			expect(applicable).toBe(false);
		});

		it("Apply All is disabled after Reset All without prior Apply", async () => {
			const { store } = await setupTest();

			setFilterValue(store, "filter-b", "fs-value");

			store.dispatch(Events.NewFilter.onFilterSelectorReset());

			const applicable = UiStateSelector.NewFilter.isApplicable(DefaultFilterStateSelectors)(store.getState());
			expect(applicable).toBe(false);
		});
	});
});
