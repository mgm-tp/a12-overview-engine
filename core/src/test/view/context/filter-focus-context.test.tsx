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

import * as React from "react";

import { act, render } from "@testing-library/react";
import { it, vi, expect, describe, beforeEach } from "vitest";

import type { UiState } from "../../../main/store/index.js";
import type { FilterFocusContext } from "../../../main/view/context/filter-focus-context.js";
import { FilterFocusProvider, useFilterFocusContext } from "../../../main/view/context/filter-focus-context.js";
import {
	OverviewEngineContext,
	type OverviewEngineContextType
} from "../../../main/view/context/overview-engine-context.js";
import { defaultEngineProps } from "../../basic.spec.js";

interface FilterFixture {
	readonly id: string;
	readonly preferFilterBar: boolean;
	readonly showInFilterBar: boolean;
}

function makeUiState(args: { selectorOpen?: boolean; filters?: FilterFixture[] } = {}): UiState {
	const filters = (args.filters ?? []).reduce<Record<string, unknown>>((acc, f) => {
		acc[f.id] = {
			model: { id: f.id, preferFilterBar: f.preferFilterBar },
			area: f.showInFilterBar ? "filterBar" : "filterSelector"
		};

		return acc;
	}, {});

	return {
		newFilter: {
			filters,
			snapshot: "",
			editingFilter: null,
			filterBarOptions: {
				joinOperator: { enabled: true, value: "and" },
				invert: { enabled: true, value: false }
			},
			filterSelectorOptions: {
				open: args.selectorOpen ?? false,
				searchBar: { enabled: true, value: false },
				invert: { enabled: true, value: false },
				joinOperator: { enabled: true, value: "and" },
				showSetFiltersOnly: { enabled: true, value: false },
				viewMode: "overlay"
			}
		} as never
	} as UiState;
}

function makeContext(uiState: UiState): OverviewEngineContextType.Paginated {
	return {
		...defaultEngineProps,
		uiState
	} as OverviewEngineContextType.Paginated;
}

interface HarnessProps {
	readonly uiState: UiState;
	readonly selectorTriggerRef: React.RefObject<HTMLElement | null>;
	readonly children?: React.ReactNode;
}

function Harness({ uiState, selectorTriggerRef, children }: HarnessProps) {
	const value = React.useMemo(() => makeContext(uiState), [uiState]);

	return (
		<OverviewEngineContext.Provider value={value}>
			<FilterFocusProvider selectorTriggerRef={selectorTriggerRef}>{children}</FilterFocusProvider>
		</OverviewEngineContext.Provider>
	);
}

interface ApiCapture {
	api: FilterFocusContext.Type | null;
}

function ApiProbe({ capture }: { capture: ApiCapture }) {
	capture.api = useFilterFocusContext((v) => v);

	return null;
}

describe("com.mgmtp.a12.overview-engine.view.context.filter-focus-context", () => {
	describe("FilterFocusProvider", () => {
		it("mounts and renders children", () => {
			const triggerRef = React.createRef<HTMLElement | null>();
			const { container } = render(
				<Harness uiState={makeUiState()} selectorTriggerRef={triggerRef}>
					<div data-testid="child">child</div>
				</Harness>
			);
			expect(container.querySelector("[data-testid='child']")).toBeInTheDocument();
		});

		it("exposes registerRef and onFocusedFilterChange via useFilterFocusContext", () => {
			const triggerRef = React.createRef<HTMLElement | null>();
			const capture: ApiCapture = { api: null };
			render(
				<Harness uiState={makeUiState()} selectorTriggerRef={triggerRef}>
					<ApiProbe capture={capture} />
				</Harness>
			);
			expect(capture.api).not.toBeNull();
			expect(typeof capture.api?.registerRef).toBe("function");
			expect(typeof capture.api?.onFocusedFilterChange).toBe("function");
		});
	});

	describe("registerRef", () => {
		it("syncs the selectorTrigger element to the parent selectorTriggerRef", () => {
			const triggerRef = React.createRef<HTMLElement | null>();
			const capture: ApiCapture = { api: null };
			render(
				<Harness uiState={makeUiState()} selectorTriggerRef={triggerRef}>
					<ApiProbe capture={capture} />
				</Harness>
			);

			const element = document.createElement("button");
			act(() => {
				capture.api?.registerRef("selectorTrigger", element);
			});
			expect(triggerRef.current).toBe(element);
		});

		it("clears the parent selectorTriggerRef when called with null", () => {
			const triggerRef = React.createRef<HTMLElement | null>();
			const capture: ApiCapture = { api: null };
			render(
				<Harness uiState={makeUiState()} selectorTriggerRef={triggerRef}>
					<ApiProbe capture={capture} />
				</Harness>
			);

			const element = document.createElement("button");
			act(() => {
				capture.api?.registerRef("selectorTrigger", element);
			});
			expect(triggerRef.current).toBe(element);

			act(() => {
				capture.api?.registerRef("selectorTrigger", null);
			});
			expect(triggerRef.current).toBeNull();
		});

		it("does not sync the selectorWrapper element to the parent selectorTriggerRef", () => {
			const triggerRef = React.createRef<HTMLElement | null>();
			const capture: ApiCapture = { api: null };
			render(
				<Harness uiState={makeUiState()} selectorTriggerRef={triggerRef}>
					<ApiProbe capture={capture} />
				</Harness>
			);

			const wrapper = document.createElement("div");
			act(() => {
				capture.api?.registerRef("selectorWrapper", wrapper);
			});
			expect(triggerRef.current).toBeNull();
		});
	});

	describe("focus routing on filter visibility transition", () => {
		let focusSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
		});

		function renderWithFilter(initial: { selectorOpen: boolean; filterBarVisible: boolean }) {
			const triggerRef = React.createRef<HTMLElement | null>();
			const capture: ApiCapture = { api: null };

			const trigger = document.createElement("button");
			const wrapper = document.createElement("div");

			function Tree({ uiState }: { uiState: UiState }) {
				return (
					<Harness uiState={uiState} selectorTriggerRef={triggerRef}>
						<ApiProbe capture={capture} />
					</Harness>
				);
			}

			const initialState = makeUiState({
				selectorOpen: initial.selectorOpen,
				filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: initial.filterBarVisible }]
			});

			const utils = render(<Tree uiState={initialState} />);

			act(() => {
				capture.api?.registerRef("selectorTrigger", trigger);
				capture.api?.registerRef("selectorWrapper", wrapper);
			});

			return { utils, capture, trigger, wrapper, triggerRef, Tree };
		}

		it("does not call focus when no filter has reported focus", () => {
			const { utils, Tree } = renderWithFilter({ selectorOpen: false, filterBarVisible: true });
			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: false,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: false }]
					})}
				/>
			);

			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("focuses selectorTrigger when the focused filter becomes hidden and selector is closed", () => {
			const { utils, capture, trigger, Tree } = renderWithFilter({
				selectorOpen: false,
				filterBarVisible: true
			});

			act(() => {
				capture.api?.onFocusedFilterChange("f1");
			});

			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: false,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: false }]
					})}
				/>
			);

			expect(focusSpy).toHaveBeenCalled();
			expect(focusSpy.mock.instances).toContain(trigger);
		});

		it("focuses selectorWrapper when the focused filter becomes hidden and selector is open", () => {
			const { utils, capture, wrapper, Tree } = renderWithFilter({
				selectorOpen: true,
				filterBarVisible: true
			});

			act(() => {
				capture.api?.onFocusedFilterChange("f1");
			});

			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: true,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: false }]
					})}
				/>
			);

			expect(focusSpy).toHaveBeenCalled();
			expect(focusSpy.mock.instances).toContain(wrapper);
		});

		it("focuses selectorTrigger when a hidden focused filter becomes visible", () => {
			const { utils, capture, trigger, Tree } = renderWithFilter({
				selectorOpen: false,
				filterBarVisible: false
			});

			act(() => {
				capture.api?.onFocusedFilterChange("f1");
			});

			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: false,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: true }]
					})}
				/>
			);

			expect(focusSpy).toHaveBeenCalled();
			expect(focusSpy.mock.instances).toContain(trigger);
		});

		it("does not focus when focused filter visibility is unchanged", () => {
			const { utils, capture, Tree } = renderWithFilter({
				selectorOpen: false,
				filterBarVisible: true
			});

			act(() => {
				capture.api?.onFocusedFilterChange("f1");
			});

			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: false,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: true }]
					})}
				/>
			);

			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("clearing the focused filter id resets fallback focus tracking", () => {
			const { utils, capture, Tree } = renderWithFilter({
				selectorOpen: false,
				filterBarVisible: true
			});

			act(() => {
				capture.api?.onFocusedFilterChange("f1");
			});
			act(() => {
				capture.api?.onFocusedFilterChange(null);
			});

			focusSpy.mockClear();

			utils.rerender(
				<Tree
					uiState={makeUiState({
						selectorOpen: false,
						filters: [{ id: "f1", preferFilterBar: true, showInFilterBar: false }]
					})}
				/>
			);

			expect(focusSpy).not.toHaveBeenCalled();
		});
	});
});
