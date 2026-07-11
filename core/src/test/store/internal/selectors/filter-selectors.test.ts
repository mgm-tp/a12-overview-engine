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

import { it, vi, expect, describe, beforeEach } from "vitest";

import type { OverviewModel } from "../../../../main/overview-model.js";
import type { FilterItemState } from "../../../../main/store/internal/filter-state.js";
import { createFilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import type { ControllerResolver } from "../../../../main/store/internal/filter-controllers/controller-map.js";

function makeFilterState(overrides: Partial<FilterItemState> = {}): FilterItemState {
	const model: OverviewModel.NewFilter.Item =
		overrides.model ??
		({
			id: "f1",
			type: "boolean",
			options: { fieldId: "x", empty: { enabled: false } }
		} as OverviewModel.NewFilter.Item);

	return {
		groupId: "g1",
		model,
		element: undefined,
		fieldPath: "",
		options: { foo: "bar" },
		initialOptions: { foo: "bar" },
		appliedOptions: { foo: "bar" },
		area: model.preferFilterBar ? "filterBar" : "filterSelector",
		collapsed: false,
		resetCounter: 0,
		...overrides
	};
}

function makeMockController(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		accept: vi.fn().mockReturnValue(true),
		toResetOptions: vi.fn().mockReturnValue({ resetMarker: true }),
		hasErrors: vi.fn().mockReturnValue(false),
		toEffectiveOptions: vi.fn().mockImplementation((opts: object) => opts),
		toOperator: vi.fn().mockReturnValue({ operator: "EXACT_MATCH_OPERATOR", field: "x" }),
		createInitialOptions: vi.fn().mockReturnValue({ initial: true }),
		toLabel: vi.fn().mockReturnValue("display-label"),
		isConfigurable: vi.fn().mockReturnValue(true),
		...overrides
	};
}

function makeResolver(controller: ReturnType<typeof makeMockController> | undefined) {
	return {
		resolve: vi.fn().mockReturnValue(controller)
	} as ControllerResolver & { resolve: ReturnType<typeof vi.fn> };
}

describe("createFilterStateSelectors", () => {
	let mockController: ReturnType<typeof makeMockController>;
	let resolver: ReturnType<typeof makeResolver>;
	let selectors: ReturnType<typeof createFilterStateSelectors>;

	beforeEach(() => {
		mockController = makeMockController();
		resolver = makeResolver(mockController);
		selectors = createFilterStateSelectors(resolver);
	});

	describe("getController (via delegating method)", () => {
		it("throws when resolver returns undefined", () => {
			const emptyResolver = makeResolver(undefined);
			const sels = createFilterStateSelectors(emptyResolver);
			const state = makeFilterState({
				model: { id: "f1", type: "unknown-type", options: {} } as unknown as OverviewModel.NewFilter.Item
			});

			expect(() => sels.hasErrors(state)).toThrow(/No controller defined for filter type "unknown-type"/);
		});

		it("error message includes filter id", () => {
			const emptyResolver = makeResolver(undefined);
			const sels = createFilterStateSelectors(emptyResolver);
			const state = makeFilterState({
				model: { id: "myFilter", type: "weird", options: {} } as unknown as OverviewModel.NewFilter.Item
			});

			expect(() => sels.hasErrors(state)).toThrow(/id: myFilter/);
		});
	});

	describe("hasErrors", () => {
		it("delegates to controller.hasErrors with model and current options", () => {
			mockController.hasErrors.mockReturnValue(true);
			const state = makeFilterState({ options: { someInput: "broken" } });

			expect(selectors.hasErrors(state)).toBe(true);
			expect(mockController.hasErrors).toHaveBeenCalledWith(state.model, { someInput: "broken" });
		});

		it("returns false when controller reports no errors", () => {
			mockController.hasErrors.mockReturnValue(false);
			expect(selectors.hasErrors(makeFilterState())).toBe(false);
		});
	});

	describe("toOperator", () => {
		it("delegates to controller.toOperator with model, options, and context", () => {
			const documentModel = { id: "dm" } as never;
			const state = makeFilterState({ options: { x: 1 } });
			const expected = { operator: "OR_OPERATOR" } as never;
			mockController.toOperator.mockReturnValue(expected);

			const result = selectors.toOperator(state, { documentModel });

			expect(result).toBe(expected);
			expect(mockController.toOperator).toHaveBeenCalledWith(state.model, { x: 1 }, { documentModel, fieldPath: "" });
		});

		it("returns undefined when controller returns undefined", () => {
			mockController.toOperator.mockReturnValue(undefined);

			expect(selectors.toOperator(makeFilterState(), { documentModel: {} as never })).toBeUndefined();
		});
	});

	describe("isResettable", () => {
		it("returns true when effective options differ from initialOptions", () => {
			mockController.toEffectiveOptions.mockReturnValue({ value: "current" });
			const state = makeFilterState({
				options: { raw: "current" },
				initialOptions: { value: "initial" }
			});

			expect(selectors.isResettable(state)).toBe(true);
		});

		it("returns false when effective options equal initialOptions", () => {
			mockController.toEffectiveOptions.mockReturnValue({ value: "same" });
			const state = makeFilterState({
				options: { raw: "anything" },
				initialOptions: { value: "same" }
			});

			expect(selectors.isResettable(state)).toBe(false);
		});
	});

	describe("createInitialOptions", () => {
		it("delegates to controller.createInitialOptions with model and element", () => {
			const model = { id: "f", type: "boolean", options: {} } as unknown as OverviewModel.NewFilter.Item;
			const element = { id: "elem" } as never;
			mockController.createInitialOptions.mockReturnValue({ default: true });

			const result = selectors.createInitialOptions(model, element);

			expect(result).toEqual({ default: true });
			expect(mockController.createInitialOptions).toHaveBeenCalledWith(model, element);
		});

		it("passes undefined element through", () => {
			const model = { id: "f", type: "boolean", options: {} } as unknown as OverviewModel.NewFilter.Item;

			selectors.createInitialOptions(model, undefined);

			expect(mockController.createInitialOptions).toHaveBeenCalledWith(model, undefined);
		});
	});

	describe("toEffectiveOptions", () => {
		it("delegates to controller.toEffectiveOptions with model and provided options", () => {
			const model = { id: "f", type: "boolean", options: {} } as unknown as OverviewModel.NewFilter.Item;
			mockController.toEffectiveOptions.mockReturnValue({ effective: true });

			const result = selectors.toEffectiveOptions(model, { raw: "x" });

			expect(result).toEqual({ effective: true });
			expect(mockController.toEffectiveOptions).toHaveBeenCalledWith(model, { raw: "x" });
		});
	});

	describe("toResetOptions", () => {
		it("delegates to controller.reset with model, current and default options", () => {
			const state = makeFilterState({
				options: { raw: "current" },
				initialOptions: { value: "initial" }
			});
			mockController.toResetOptions.mockReturnValue({ resetTo: "initial" });

			const result = selectors.toResetOptions(state);

			expect(result).toEqual({ resetTo: "initial" });
			expect(mockController.toResetOptions).toHaveBeenCalledWith(state.model, { raw: "current" }, { value: "initial" });
		});
	});

	describe("displayValue", () => {
		it("delegates to controller.toLabel with model, options, and context (with fieldPath spread in)", () => {
			const ctx = {
				documentModel: {} as never,
				locale: {} as never,
				fieldPath: "",
				getDateTimeFormat: () => "YYYY",
				formatValue: ({ value }: { value: unknown }) => String(value),
				localizeValue: ({ value }: { value: unknown }) => String(value),
				localizeResource: ({ key }: { key: string }) => key,
				getElementByPath: () => undefined
			};
			const state = makeFilterState({ options: { raw: "abc" } });
			mockController.toLabel.mockReturnValue("abc-label");

			const result = selectors.toLabel(state, ctx);

			expect(result).toBe("abc-label");
			expect(mockController.toLabel).toHaveBeenCalledWith(
				state.model,
				{ raw: "abc" },
				{
					...ctx,
					fieldPath: state.fieldPath
				}
			);
		});

		it("returns null when controller returns null", () => {
			mockController.toLabel.mockReturnValue(null);
			const ctx = {
				documentModel: {} as never,
				locale: {} as never,
				fieldPath: "",
				getDateTimeFormat: () => "",
				formatValue: () => "",
				localizeValue: () => "",
				localizeResource: () => "",
				getElementByPath: () => undefined
			};

			expect(selectors.toLabel(makeFilterState(), ctx)).toBeNull();
		});
	});

	describe("hasAnySetFilter", () => {
		const context = { documentModel: {} as never, locale: "en" as never };

		it("returns true when a filterSelector-area filter has an operator", () => {
			const fsModel = {
				id: "fs",
				type: "boolean",
				preferFilterBar: false,
				options: {}
			} as unknown as OverviewModel.NewFilter.Item;
			const filters = {
				fs: makeFilterState({ model: fsModel })
			};
			mockController.toOperator.mockReturnValue({ operator: "EXACT_MATCH_OPERATOR" } as never);

			expect(selectors.hasAnySetFilter(filters, context)).toBe(true);
		});

		it("returns false when filterSelector filters have no operator", () => {
			const fsModel = {
				id: "fs",
				type: "boolean",
				preferFilterBar: false,
				options: {}
			} as unknown as OverviewModel.NewFilter.Item;
			const filters = {
				fs: makeFilterState({ model: fsModel })
			};
			mockController.toOperator.mockReturnValue(undefined);

			expect(selectors.hasAnySetFilter(filters, context)).toBe(false);
		});

		it("ignores filterBar-area filters even when they have operators", () => {
			const fbModel = {
				id: "fb",
				type: "boolean",
				preferFilterBar: true,
				options: {}
			} as unknown as OverviewModel.NewFilter.Item;
			const filters = {
				fb: makeFilterState({ model: fbModel, area: "filterBar" })
			};
			mockController.toOperator.mockReturnValue({ operator: "EXACT_MATCH_OPERATOR" } as never);

			expect(selectors.hasAnySetFilter(filters, context)).toBe(false);
		});

		it("counts overflowed FB filters as filterSelector area", () => {
			const overflowedModel = {
				id: "ov",
				type: "boolean",
				preferFilterBar: true,
				options: {}
			} as unknown as OverviewModel.NewFilter.Item;
			const filters = {
				ov: makeFilterState({ model: overflowedModel, area: "filterSelector" })
			};
			mockController.toOperator.mockReturnValue({ operator: "EXACT_MATCH_OPERATOR" } as never);

			expect(selectors.hasAnySetFilter(filters, context)).toBe(true);
		});

		it("returns false for empty filter map", () => {
			expect(selectors.hasAnySetFilter({}, context)).toBe(false);
		});
	});

	describe("isConfigurable", () => {
		it("delegates to controller.isConfigurable with the model", () => {
			mockController.isConfigurable.mockReturnValue(true);
			const state = makeFilterState();

			expect(selectors.isConfigurable(state)).toBe(true);
			expect(mockController.isConfigurable).toHaveBeenCalledWith(state.model);
		});

		it("returns false when controller reports no settings", () => {
			mockController.isConfigurable.mockReturnValue(false);

			expect(selectors.isConfigurable(makeFilterState())).toBe(false);
		});
	});
});
