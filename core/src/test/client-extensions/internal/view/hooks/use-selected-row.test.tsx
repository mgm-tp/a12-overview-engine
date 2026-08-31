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

import { renderHook } from "@testing-library/react";
import { createStore, type Reducer } from "redux";
import { it, expect, describe } from "vitest";

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { useSelectedRow } from "../../../../../main/client-extensions/internal/view/hooks/use-selected-row.js";

// -- Helpers -----------------------------------------------------------------

interface TestState {
	activities: Record<string, Activity | undefined>;
}

function createActivity(overrides: Partial<Activity> & { id: string }): Activity {
	return {
		activationTimestamp: Date.now(),
		descriptor: {},
		dataHolders: [],
		...overrides
	};
}

function createDocument(id: string): Activity.Data.Document {
	return { id, modelId: "TestModel" };
}

function renderUseSelectedRow(
	params: { activityId: string; data: (Activity.Data.Document | undefined)[] },
	state: TestState
) {
	const reducer: Reducer<TestState> = (s = state) => s;
	const store = createStore(reducer);

	const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;

	return renderHook(() => useSelectedRow(params), { wrapper });
}

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.view.hooks.use-selected-row", () => {
	const PARENT_ACTIVITY_ID = "parent-activity";
	const SUB_ACTIVITY_ID = "sub-activity";
	const DOC_ID = "doc-123";

	it("returns the matched document id when a single row matches the sub-activity instance", () => {
		const state: TestState = {
			activities: {
				[SUB_ACTIVITY_ID]: createActivity({
					id: SUB_ACTIVITY_ID,
					initiatingActivityId: PARENT_ACTIVITY_ID,
					descriptor: { instance: DOC_ID }
				})
			}
		};

		const data = [createDocument("doc-000"), createDocument(DOC_ID), createDocument("doc-999")];
		const { result } = renderUseSelectedRow({ activityId: PARENT_ACTIVITY_ID, data }, state);

		expect(result.current).toBe(DOC_ID);
	});

	it("returns undefined when no sub-activity exists for the given activityId", () => {
		const state: TestState = {
			activities: {}
		};

		const data = [createDocument(DOC_ID)];
		const { result } = renderUseSelectedRow({ activityId: PARENT_ACTIVITY_ID, data }, state);

		expect(result.current).toBeUndefined();
	});

	it("returns undefined when sub-activity exists but no document matches its instance", () => {
		const state: TestState = {
			activities: {
				[SUB_ACTIVITY_ID]: createActivity({
					id: SUB_ACTIVITY_ID,
					initiatingActivityId: PARENT_ACTIVITY_ID,
					descriptor: { instance: "non-existent-doc" }
				})
			}
		};

		const data = [createDocument("doc-A"), createDocument("doc-B")];
		const { result } = renderUseSelectedRow({ activityId: PARENT_ACTIVITY_ID, data }, state);

		expect(result.current).toBeUndefined();
	});

	it("returns the first matching document id when multiple rows share the same id (duplicate rows)", () => {
		const state: TestState = {
			activities: {
				[SUB_ACTIVITY_ID]: createActivity({
					id: SUB_ACTIVITY_ID,
					initiatingActivityId: PARENT_ACTIVITY_ID,
					descriptor: { instance: DOC_ID }
				})
			}
		};

		const duplicateDoc1 = createDocument(DOC_ID);
		const duplicateDoc2 = createDocument(DOC_ID);
		const data = [createDocument("other-doc"), duplicateDoc1, duplicateDoc2];
		const { result } = renderUseSelectedRow({ activityId: PARENT_ACTIVITY_ID, data }, state);

		expect(result.current).toBe(DOC_ID);
	});
});
