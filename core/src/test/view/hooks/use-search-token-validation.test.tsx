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
import { Provider } from "react-redux";
import { it, expect, describe } from "vitest";
import { createStore, type Reducer } from "redux";
import { renderHook } from "@testing-library/react";

import { RESOURCE_KEYS } from "../../../main/services/localization/index.js";
import { OverviewEngineInternalConstants } from "../../../main/shared/constants.js";
import { useMinSearchTokenSizeValidator } from "../../../main/view/hooks/use-search-token-validation.js";

// -- Helpers -----------------------------------------------------------------

interface TestState {
	dataservices: { configuration: Record<string, string> };
}

// The dataservices `configurationByKey` selector only reads the slice when every required
// configuration key is present as a string, so a partial map is treated as "no configuration".
const REQUIRED_CONFIG_DEFAULTS = {
	"mgmtp.a12.dataservices.jsonRpc.maxMethodCallsPerRequest": "0",
	"mgmtp.a12.dataservices.query.maxQueryDepth": "0",
	"mgmtp.a12.dataservices.query.maxLinksSize": "0"
};

function renderValidator(enabled: boolean, minTokenSize?: string) {
	const state: TestState = {
		dataservices: {
			configuration:
				minTokenSize === undefined
					? {}
					: {
							...REQUIRED_CONFIG_DEFAULTS,
							[OverviewEngineInternalConstants.MIN_SEARCH_TOKEN_SIZE_KEY]: minTokenSize
						}
		}
	};
	const reducer: Reducer<TestState> = (s = state) => s;
	const store = createStore(reducer);

	const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;

	return renderHook(() => useMinSearchTokenSizeValidator(enabled), { wrapper });
}

const MIN_LENGTH_KEY = RESOURCE_KEYS.overviewEngine.searchBar.searchButtonMinLengthTitle;

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.view.hooks.use-search-token-validation.useMinSearchTokenSizeValidator", () => {
	describe("when disabled", () => {
		it("returns undefined even for a token below the minimum", () => {
			const { result } = renderValidator(false, "3");

			expect(result.current("te")).toBeUndefined();
		});
	});

	describe("when the minimum token size configuration is absent", () => {
		it("returns undefined for any value", () => {
			const { result } = renderValidator(true, undefined);

			expect(result.current("te")).toBeUndefined();
		});
	});

	describe("when the minimum token size configuration is not a positive number", () => {
		it("returns undefined for a non-numeric configuration value", () => {
			const { result } = renderValidator(true, "abc");

			expect(result.current("te")).toBeUndefined();
		});

		it("returns undefined for a zero configuration value", () => {
			const { result } = renderValidator(true, "0");

			expect(result.current("te")).toBeUndefined();
		});

		it("returns undefined for a negative configuration value", () => {
			const { result } = renderValidator(true, "-3");

			expect(result.current("te")).toBeUndefined();
		});
	});

	describe("when enabled with a valid minimum token size", () => {
		it("returns undefined for an empty value", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("")).toBeUndefined();
		});

		it("returns undefined for a whitespace-only value", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("   ")).toBeUndefined();
		});

		it("returns the hint for a single token below the minimum", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("te")).toEqual({
				key: MIN_LENGTH_KEY,
				args: { count: { type: "plain", value: "3" } }
			});
		});

		it("returns the hint when any whitespace-separated token is below the minimum", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("test a")).toEqual({
				key: MIN_LENGTH_KEY,
				args: { count: { type: "plain", value: "3" } }
			});
		});

		it("returns undefined when every token meets the minimum", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("test word")).toBeUndefined();
		});

		it("returns undefined for a token exactly at the minimum length", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("abc")).toBeUndefined();
		});

		it("collapses multiple whitespace between words before validating", () => {
			const { result } = renderValidator(true, "3");

			expect(result.current("test   word")).toBeUndefined();
		});
	});
});
