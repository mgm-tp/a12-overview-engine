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

import "@testing-library/jest-dom/vitest";

import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @ts-expect-error To suppress warning about act(...) being called in a non-async way
global.IS_REACT_ACT_ENVIRONMENT = true;
// @ts-expect-error To suppress warning about react-test-renderer is deprecated
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

let randomCounter = 1;

vi.spyOn(Math, "random").mockImplementation(() => {
	return (randomCounter++ % 1000) / 1000;
});

vi.mock("react", async () => {
	const originalReact = await vi.importActual("react");

	return {
		...originalReact,
		default: {
			// @ts-expect-error Unknown error
			...originalReact.default,
			// @ts-expect-error Unknown error
			memo: (comp) => comp
		},
		memo: (component: unknown) => component
	};
});

function shouldSuppress(args: unknown[]): boolean {
	const first = args[0];

	if (typeof first !== "string") {
		return false;
	}

	if (first.includes("not wrapped in act(")) {
		return true;
	}

	if (first.includes("returned the root state when called")) {
		return true;
	}

	return false;
}

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
	if (shouldSuppress(args)) {
		return;
	}

	originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
	if (shouldSuppress(args)) {
		return;
	}

	originalConsoleWarn(...args);
};

afterEach(() => {
	cleanup();
	randomCounter = 1;
});
