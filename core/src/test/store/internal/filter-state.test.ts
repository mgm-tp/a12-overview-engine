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

import { it, vi, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { type FilterState, FilterStateBuilder } from "../../../main/index.js";
import type { DocumentModelService } from "../../../main/models/internal/shared.js";
import type { OverviewModel } from "../../../main/overview-model.js";
import type { FilterStateSelectors } from "../../../main/store/internal/selectors/filter-selectors.js";

const documentModelServiceMock = vi.hoisted(() => ({
	getByPath: vi.fn(),
	getPathById: vi.fn(),
	getConversionConfig: vi.fn()
}));

vi.mock("../../../main/models/internal/document-model-service.js", () => ({
	createDocumentModelService: () => documentModelServiceMock
}));

function buildState(
	config: OverviewModel.NewFilterConfiguration | undefined,
	dms: DocumentModelService,
	selectors: FilterStateSelectors
): FilterState | undefined {
	documentModelServiceMock.getByPath.mockImplementation(dms.getByPath);
	documentModelServiceMock.getPathById.mockImplementation(dms.getPathById);
	documentModelServiceMock.getConversionConfig.mockImplementation(dms.getConversionConfig);

	const overviewModel = {
		content: { configuration: { newFilterConfiguration: config } }
	} as unknown as OverviewModel;
	const documentModel = { header: { id: "test" } } as unknown as DocumentModel;

	return new FilterStateBuilder(overviewModel, documentModel, [], selectors).build();
}

const baseFilterSelector: OverviewModel.NewFilterConfiguration["filterSelector"] = {
	viewMode: "overlay",
	showSetFiltersOnly: { enabled: false },
	searchBar: { enabled: false }
};

function makeBooleanItem(
	overrides: Partial<OverviewModel.NewFilter.Boolean.Item> = {}
): OverviewModel.NewFilter.Boolean.Item {
	return {
		id: "filter1",
		type: "boolean",
		options: {
			fieldId: "isInStock",
			empty: { enabled: false }
		},
		...overrides
	};
}

function makeQueryItem(
	overrides: Partial<OverviewModel.NewFilter.Query.Item> = {}
): OverviewModel.NewFilter.Query.Item {
	return {
		id: "queryFilter",
		type: "query",
		description: [{ locale: "en", text: "Q" }],
		options: {
			operator: { operator: Query.OPERATORS.EXACT_MATCH_OPERATOR, field: "x", value: "1", caseSensitive: true },
			enabled: { enabled: false }
		},
		...overrides
	};
}

function makeBooleanField(): { type: "Field"; fieldType: { type: "BooleanType" } } {
	return { type: "Field", fieldType: { type: "BooleanType" } };
}

function makeDocumentModelService(): DocumentModelService {
	return {
		getByPath: vi.fn().mockReturnValue(makeBooleanField()),
		getPathById: vi.fn().mockReturnValue([]),
		getConversionConfig: vi.fn().mockReturnValue({})
	} as unknown as DocumentModelService;
}

function makeSelectors(overrides: Partial<FilterStateSelectors> = {}): FilterStateSelectors {
	const createInitialOptions = vi.fn((_model: OverviewModel.NewFilter.Item) => ({
		empty: { enabled: false },
		criteria: { true: false, false: false }
	}));
	const toEffectiveOptions = vi.fn((_model: OverviewModel.NewFilter.Item, options: object) => options);

	return {
		hasErrors: vi.fn(),
		isEffectivelyEqual: vi.fn(),
		toOperator: vi.fn(),
		isResettable: vi.fn(),
		createInitialOptions,
		toEffectiveOptions,
		toResetOptions: vi.fn(),
		toLabel: vi.fn(),
		hasAnySetFilter: vi.fn(),
		isConfigurable: vi.fn(),
		...overrides
	} as unknown as FilterStateSelectors;
}

function makeConfig(
	overrides: Partial<OverviewModel.NewFilterConfiguration> = {}
): OverviewModel.NewFilterConfiguration {
	return {
		filterGroups: [],
		filterSelector: baseFilterSelector,
		invert: { enabled: false },
		joinOperator: { enabled: false },
		...overrides
	};
}

describe("createFilterState() — filters", () => {
	it("returns undefined when config is undefined", () => {
		expect(buildState(undefined, makeDocumentModelService(), makeSelectors())).toBeUndefined();
	});

	it("returns empty filters record when filterGroups is empty", () => {
		const result = buildState(makeConfig(), makeDocumentModelService(), makeSelectors());
		expect(result?.filters).toEqual({});
	});

	it("creates one FilterItemState per filter, keyed by filter id", () => {
		const item = makeBooleanItem();
		const initialOpts = { empty: { enabled: false }, criteria: { true: true, false: false } };
		const selectors = makeSelectors({
			createInitialOptions: vi.fn().mockReturnValue(initialOpts),
			toEffectiveOptions: vi.fn((_m, o) => o)
		});
		const config = makeConfig({
			filterGroups: [{ id: "g1", filterItems: [item] } as OverviewModel.NewFilter.Group]
		});

		const result = buildState(config, makeDocumentModelService(), selectors);

		expect(Object.keys(result?.filters ?? {})).toEqual(["filter1"]);
		expect(result?.filters.filter1?.groupId).toBe("g1");
		expect(result?.filters.filter1?.model).toBe(item);
		expect(result?.filters.filter1?.options).toBe(initialOpts);
	});

	it("calls createInitialOptions with the item and resolved element", () => {
		const item = makeBooleanItem();
		const element = makeBooleanField();
		const dms: DocumentModelService = {
			getByPath: vi.fn().mockReturnValue(element),
			getPathById: vi.fn().mockReturnValue([]),
			getConversionConfig: vi.fn().mockReturnValue({})
		} as unknown as DocumentModelService;
		const selectors = makeSelectors();

		buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [item] } as OverviewModel.NewFilter.Group] }),
			dms,
			selectors
		);

		expect(selectors.createInitialOptions).toHaveBeenCalledOnce();
		expect(selectors.createInitialOptions).toHaveBeenCalledWith(item, element);
	});

	it('sets area to "filterBar" when preferFilterBar is true', () => {
		const item = makeBooleanItem({ preferFilterBar: true });
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [item] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filters.filter1?.area).toBe("filterBar");
	});

	it("sets collapsed to false by default when filter item has no collapsed flag", () => {
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [makeBooleanItem()] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filters.filter1?.collapsed).toBe(false);
	});

	it("propagates per-filter collapsed: true into the FilterItemState", () => {
		const item = makeBooleanItem({ collapsed: true });
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [item] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filters.filter1?.collapsed).toBe(true);
	});

	it("initializes appliedOptions identical to options at creation", () => {
		const initialOpts = { empty: { enabled: false }, criteria: { true: false, false: true } };
		const selectors = makeSelectors({
			createInitialOptions: vi.fn().mockReturnValue(initialOpts),
			toEffectiveOptions: vi.fn((_m, o) => o)
		});
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [makeBooleanItem()] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			selectors
		);
		expect(result?.filters.filter1?.appliedOptions).toBe(result?.filters.filter1?.options);
	});

	it("initializes resetCounter to 0", () => {
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [makeBooleanItem()] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filters.filter1?.resetCounter).toBe(0);
	});

	it("initializes initialOptions via toEffectiveOptions(model, options)", () => {
		const runtimeOpts = { empty: { enabled: false }, criteria: { true: true, false: false } };
		const effectiveOpts = { effective: true } as unknown as object;
		const selectors = makeSelectors({
			createInitialOptions: vi.fn().mockReturnValue(runtimeOpts),
			toEffectiveOptions: vi.fn().mockReturnValue(effectiveOpts)
		});
		const item = makeBooleanItem();
		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [item] } as OverviewModel.NewFilter.Group] }),
			makeDocumentModelService(),
			selectors
		);

		expect(selectors.toEffectiveOptions).toHaveBeenCalledWith(item, runtimeOpts);
		expect(result?.filters.filter1?.initialOptions).toBe(effectiveOpts);
	});

	it("skips element resolution for query filters (element is undefined, getByPath not called)", () => {
		const queryItem = makeQueryItem();
		const dms = makeDocumentModelService();
		const selectors = makeSelectors();

		const result = buildState(
			makeConfig({ filterGroups: [{ id: "g1", filterItems: [queryItem] } as OverviewModel.NewFilter.Group] }),
			dms,
			selectors
		);

		expect(dms.getByPath).not.toHaveBeenCalled();
		expect(result?.filters.queryFilter?.element).toBeUndefined();
		expect(selectors.createInitialOptions).toHaveBeenCalledWith(queryItem, undefined);
	});

	it("preserves declaration order across multiple groups in the filters record", () => {
		const a = makeBooleanItem({ id: "a" });
		const b = makeBooleanItem({ id: "b" });
		const c = makeBooleanItem({ id: "c" });
		const result = buildState(
			makeConfig({
				filterGroups: [
					{ id: "g1", filterItems: [a, b] } as OverviewModel.NewFilter.Group,
					{ id: "g2", filterItems: [c] } as OverviewModel.NewFilter.Group
				]
			}),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(Object.keys(result?.filters ?? {})).toEqual(["a", "b", "c"]);
		expect(result?.filters.a?.groupId).toBe("g1");
		expect(result?.filters.b?.groupId).toBe("g1");
		expect(result?.filters.c?.groupId).toBe("g2");
	});
});

describe("createFilterState() — filterSelectorOptions", () => {
	it("forwards every Configurable toggle from filterSelector config", () => {
		const config = makeConfig({
			filterSelector: {
				viewMode: "overlay",
				showSetFiltersOnly: { enabled: false },
				searchBar: { enabled: true, value: false }
			}
		});
		const result = buildState(config, makeDocumentModelService(), makeSelectors());

		expect(result?.filterSelectorOptions).toEqual({
			open: false,
			searchBar: { enabled: true, value: false },
			showSetFiltersOnly: { enabled: false },
			viewMode: "overlay"
		});
	});

	it('starts open when initialVisibility="show" and viewMode is not modal', () => {
		const result = buildState(
			makeConfig({ filterSelector: { ...baseFilterSelector, initialVisibility: "show" } }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filterSelectorOptions.open).toBe(true);
	});

	it("never starts open in modal viewMode regardless of initialVisibility", () => {
		const result = buildState(
			makeConfig({ filterSelector: { ...baseFilterSelector, viewMode: "modal", initialVisibility: "show" } }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(result?.filterSelectorOptions.open).toBe(false);
	});

	it("propagates viewMode from FilterSelectorConfiguration into runtime options", () => {
		const docked = buildState(
			makeConfig({ filterSelector: { ...baseFilterSelector, viewMode: "docked" } }),
			makeDocumentModelService(),
			makeSelectors()
		);
		const overlay = buildState(
			makeConfig({ filterSelector: { ...baseFilterSelector, viewMode: "overlay" } }),
			makeDocumentModelService(),
			makeSelectors()
		);
		expect(docked?.filterSelectorOptions.viewMode).toBe("docked");
		expect(overlay?.filterSelectorOptions.viewMode).toBe("overlay");
	});
});

describe("createFilterState() — shared invert / joinOperator", () => {
	it("forwards invert and joinOperator from the top level of NewFilterConfiguration", () => {
		const config = makeConfig({
			invert: { enabled: true, value: true },
			joinOperator: { enabled: true, value: "or" }
		});
		const result = buildState(config, makeDocumentModelService(), makeSelectors());
		expect(result?.queryOptions.invert).toEqual({
			default: { enabled: true, value: true },
			current: { enabled: true, value: true },
			applied: { enabled: true, value: true }
		});
		expect(result?.queryOptions.joinOperator).toEqual({
			default: { enabled: true, value: "or" },
			current: { enabled: true, value: "or" },
			applied: { enabled: true, value: "or" }
		});
	});

	it("propagates disabled defaults when the configurables are disabled", () => {
		const result = buildState(makeConfig(), makeDocumentModelService(), makeSelectors());
		expect(result?.queryOptions.invert.current).toEqual({ enabled: false });
		expect(result?.queryOptions.joinOperator.current).toEqual({ enabled: false });
	});
});
