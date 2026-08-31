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

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { OverviewEngineSelectors } from "../../../main/client-extensions/internal/selectors.js";
import { SLICE_NAME } from "../../../main/client-extensions/internal/state.js";
import type { UiState } from "../../../main/store/index.js";

// -- Helpers -----------------------------------------------------------------

const ACTIVITY_ID = "test-activity";
const DEFAULT_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "default" };
const EMBEDDED_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "embedded" };
const UNKNOWN_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "unknown" };

const DEFAULT_UI_STATE: UiState = {
	sorting: [{ path: "default-field", order: "asc" }]
} as unknown as UiState;

const EMBEDDED_UI_STATE: UiState = {
	sorting: [{ path: "embedded-field", order: "desc" }]
} as unknown as UiState;

function makeDataHolder(descriptor: Activity.DataHolderDescriptor, uiState?: UiState): Activity.DataHolder {
	return {
		descriptor,
		slices: uiState ? { [SLICE_NAME]: uiState } : {},
		dirty: false,
		loadingState: "loaded",
		savingState: "saved"
	} as Activity.DataHolder;
}

function makeActivity(dataHolders: Activity.DataHolder[]): Activity {
	return {
		id: ACTIVITY_ID,
		activationTimestamp: Date.now(),
		// activity.descriptor matches the default data holder so findDefaultDataHolder works
		descriptor: DEFAULT_DESCRIPTOR,
		dataHolders
	};
}

function makeState(activity: Activity): object {
	return { activities: { [ACTIVITY_ID]: activity } };
}

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.selectors.uiStateWithoutDefaults", () => {
	it("returns default holder's uiState when no descriptor given", () => {
		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR, EMBEDDED_UI_STATE)
			])
		);

		const result = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID)(state);

		expect(result).toBe(DEFAULT_UI_STATE);
	});

	it("returns embedded holder's uiState when embedded descriptor given", () => {
		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR, EMBEDDED_UI_STATE)
			])
		);

		const result = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR)(state);

		expect(result).toBe(EMBEDDED_UI_STATE);
	});

	it("does not return default holder's uiState when embedded descriptor given (regression)", () => {
		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR, EMBEDDED_UI_STATE)
			])
		);

		const result = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR)(state);

		expect(result).not.toBe(DEFAULT_UI_STATE);
		expect((result as UiState)?.sorting?.[0]?.path).toBe("embedded-field");
	});

	it("returns undefined when descriptor matches no data holder", () => {
		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR, EMBEDDED_UI_STATE)
			])
		);

		const result = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, UNKNOWN_DESCRIPTOR)(state);

		expect(result).toBeUndefined();
	});

	it("embedded descriptor reads embedded activeFilters (key field for enumeratedStringFilterMap)", () => {
		const defaultFilters = { field1: { type: "string", criteria: "default-value" } };
		const embeddedFilters = { field1: { type: "string", criteria: "embedded-value" } };

		const defaultState = { ...DEFAULT_UI_STATE, activeFilters: defaultFilters } as unknown as UiState;
		const embeddedState = { ...EMBEDDED_UI_STATE, activeFilters: embeddedFilters } as unknown as UiState;

		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, defaultState),
				makeDataHolder(EMBEDDED_DESCRIPTOR, embeddedState)
			])
		);

		const defaultResult = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID)(state);
		const embeddedResult = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR)(state);

		expect((defaultResult as UiState)?.activeFilters).toBe(defaultFilters);
		expect((embeddedResult as UiState)?.activeFilters).toBe(embeddedFilters);
	});
});

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.selectors.uiStateWithoutDefaults — multiple embedded holders", () => {
	const EMBEDDED_DESCRIPTOR_A: Activity.DataHolderDescriptor = { name: "embedded-a" };
	const EMBEDDED_DESCRIPTOR_B: Activity.DataHolderDescriptor = { name: "embedded-b" };

	const UI_STATE_A: UiState = { sorting: [{ path: "field-a", order: "asc" }] } as unknown as UiState;
	const UI_STATE_B: UiState = { sorting: [{ path: "field-b", order: "desc" }] } as unknown as UiState;

	function makeMultiEmbeddedState() {
		return makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR_A, UI_STATE_A),
				makeDataHolder(EMBEDDED_DESCRIPTOR_B, UI_STATE_B)
			])
		);
	}

	it("each descriptor selects its own holder independently", () => {
		const state = makeMultiEmbeddedState();

		const resultA = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR_A)(state);
		const resultB = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR_B)(state);

		expect(resultA).toBe(UI_STATE_A);
		expect(resultB).toBe(UI_STATE_B);
	});

	it("no descriptor still returns default, not first embedded", () => {
		const state = makeMultiEmbeddedState();

		const result = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID)(state);

		expect(result).toBe(DEFAULT_UI_STATE);
		expect(result).not.toBe(UI_STATE_A);
		expect(result).not.toBe(UI_STATE_B);
	});

	it("each embedded holder has isolated activeFilters", () => {
		const filtersA = { field1: { type: "string", criteria: "value-a" } };
		const filtersB = { field1: { type: "string", criteria: "value-b" } };

		const stateA = { ...UI_STATE_A, activeFilters: filtersA } as unknown as UiState;
		const stateB = { ...UI_STATE_B, activeFilters: filtersB } as unknown as UiState;

		const state = makeState(
			makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, DEFAULT_UI_STATE),
				makeDataHolder(EMBEDDED_DESCRIPTOR_A, stateA),
				makeDataHolder(EMBEDDED_DESCRIPTOR_B, stateB)
			])
		);

		const resultA = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR_A)(state);
		const resultB = OverviewEngineSelectors.uiStateWithoutDefaults(ACTIVITY_ID, EMBEDDED_DESCRIPTOR_B)(state);

		expect((resultA as UiState)?.activeFilters).toBe(filtersA);
		expect((resultB as UiState)?.activeFilters).toBe(filtersB);
	});
});
