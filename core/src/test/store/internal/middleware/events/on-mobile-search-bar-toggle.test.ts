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

import { it, expect, describe } from "vitest";

import { Events, Commands } from "../../../../../main/store/internal/actions.js";
import { onMobileSearchBarToggle } from "../../../../../main/store/internal/middleware/events/on-mobile-search-bar-toggle.js";

import { createMiddlewareTest } from "./new-filter/helpers.js";

describe("onMobileSearchBarToggle", () => {
	it("passes through non-matching actions without dispatching", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onMobileSearchBarToggle);
		const action = Events.onSearched({ searchString: "test" });

		const result = invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(result).toBe(action);
		expect(dispatched).toHaveLength(0);
	});

	it("dispatches setMobileSearchBar with visible=true when toggled visible", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onMobileSearchBarToggle);
		const action = Events.onMobileSearchBarToggle({ visible: true });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(1);
		expect(Commands.setMobileSearchBar.match(dispatched[0] as never)).toBe(true);
		expect((dispatched[0] as ReturnType<typeof Commands.setMobileSearchBar>).payload).toEqual({ visible: true });
	});

	it("dispatches setMobileSearchBar with visible=false when toggled hidden", () => {
		const { invoke, dispatched } = createMiddlewareTest(onMobileSearchBarToggle);

		invoke(Events.onMobileSearchBarToggle({ visible: false }));

		expect(dispatched).toHaveLength(1);
		expect((dispatched[0] as ReturnType<typeof Commands.setMobileSearchBar>).payload).toEqual({ visible: false });
	});

	it("calls next before dispatching the command", () => {
		const order: string[] = [];
		const { store, invoke } = createMiddlewareTest(onMobileSearchBarToggle);
		const next = (action: unknown): unknown => {
			order.push("next");

			return action;
		};

		store.dispatch.mockImplementation((action: unknown) => {
			order.push("dispatch");

			return action as number;
		});

		const middlewareInvoke = (
			onMobileSearchBarToggle as unknown as (s: typeof store) => (n: typeof next) => (a: unknown) => unknown
		)(store)(next);

		middlewareInvoke(Events.onMobileSearchBarToggle({ visible: true }));

		expect(order).toEqual(["next", "dispatch"]);
		expect(invoke).toBeDefined();
	});
});
