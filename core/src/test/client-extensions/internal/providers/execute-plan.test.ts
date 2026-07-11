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

import { runSaga } from "redux-saga";
import { it, vi, expect, describe, beforeEach, type MockedFunction } from "vitest";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import { NotificationActions } from "@com.mgmtp.a12.client/client-core";
import { Dispatcher } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { executeQueryPlan } from "../../../../main/client-extensions/internal/providers/execute-plan.js";
import { RequestValidator } from "../../../../main/client-extensions/internal/utils/request-validator.js";
import type { QueryExecutionPlan } from "../../../../main/client-extensions/internal/providers/query-execution-plan.js";

vi.mock("@com.mgmtp.a12.dataservices/dataservices-access", async (importOriginal) => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const original = await importOriginal<typeof import("@com.mgmtp.a12.dataservices/dataservices-access")>();

	return {
		...original,
		Dispatcher: {
			...original.Dispatcher,
			rpc: vi.fn()
		},
		LoadThumbnailUrlsJsonRpc2: {
			...original.LoadThumbnailUrlsJsonRpc2,
			Response: {
				...original.LoadThumbnailUrlsJsonRpc2?.Response,
				isInstance: vi.fn().mockReturnValue(true)
			}
		}
	};
});

vi.mock("../../../../main/client-extensions/internal/data-loader/default-data-loader.js", () => ({
	getMaxRequests: vi.fn().mockReturnValue(undefined)
}));

vi.mock("../../../../main/client-extensions/internal/utils/request-builder.js", () => ({
	RequestBuilder: {
		loadThumbnailURLs: vi.fn().mockReturnValue({ id: "thumbnails", method: "loadThumbnailURLs" })
	}
}));

vi.mock("@com.mgmtp.a12.client/client-core/a12internal", () => ({
	convertThumbnailResponse: vi.fn().mockReturnValue({})
}));

const mockedRpc = Dispatcher.rpc as MockedFunction<typeof Dispatcher.rpc>;

const ACTIVITY_ID = "test-activity";
const LOCALE_STATE = {
	locale: { language: "en", country: "US", variant: "", displayName: "English" }
};

function makeGetState() {
	return () => LOCALE_STATE;
}

function makeExecutionPlan(
	id: string,
	dataHolder: Activity.DataHolder,
	applyResponse?: QueryExecutionPlan["applyResponse"]
): QueryExecutionPlan {
	return {
		id,
		dataHolder,
		requests: [{ id, method: "listDocuments" } as never],
		applyResponse:
			applyResponse ??
			function* () /* eslint-disable-line require-yield */ {
				return [{ descriptor: dataHolder.descriptor, data: { documents: [], totalDocumentsCount: 0 } }];
			}
	};
}

function makeDataHolder(name: string, existingData?: object): Activity.DataHolder {
	return {
		descriptor: { name } as Activity.DataHolderDescriptor,
		data: existingData
	} as Activity.DataHolder;
}

describe("com.mgmtp.a12.overview-engine.client-extensions.providers.execute-query-plan", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("produces exactly one Dispatcher.rpc call for N plans", async () => {
		const responses = Array(4).fill({ id: "r", result: {} });
		mockedRpc.mockResolvedValue(responses as never);

		const plans = [
			makeExecutionPlan("p1", makeDataHolder("h1")),
			makeExecutionPlan("p2", makeDataHolder("h2")),
			makeExecutionPlan("p3", makeDataHolder("h3"))
		];

		const dispatched: unknown[] = [];

		await runSaga(
			{ dispatch: (a) => dispatched.push(a), getState: makeGetState() },
			executeQueryPlan,
			ACTIVITY_ID,
			plans
		).toPromise();

		expect(mockedRpc).toHaveBeenCalledOnce();
		// 3 plan requests + 1 thumbnail = 4 total
		const [, requests] = mockedRpc.mock.calls[0];
		expect(requests).toHaveLength(4);
	});

	it("dispatches one notification and restores existing data when applyResponse throws", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const existingData = { documents: [{ id: "doc1" }], totalDocumentsCount: 1 };
		const h1 = makeDataHolder("h1", existingData);
		const h2 = makeDataHolder("h2");

		const responses = Array(3).fill({ id: "r", result: {} });
		mockedRpc.mockResolvedValue(responses as never);

		const failingPlan = makeExecutionPlan("p1", h1, function* () /* eslint-disable-line require-yield */ {
			throw new Error("apply failed");
		});
		const successPlan = makeExecutionPlan("p2", h2);

		const dispatched: unknown[] = [];

		const updates = await runSaga(
			{ dispatch: (a) => dispatched.push(a), getState: makeGetState() },
			executeQueryPlan,
			ACTIVITY_ID,
			[failingPlan, successPlan]
		).toPromise();

		const notifications = dispatched.filter(
			(a) => typeof a === "object" && a !== null && "type" in a && String((a as { type: string }).type).includes("add")
		);
		expect(notifications).toHaveLength(1);

		// Successful plan's update is included
		const successUpdate = (updates as { descriptor: { name: string } }[]).find((u) => u.descriptor.name === "h2");
		expect(successUpdate).toBeDefined();

		// Failed plan's existing data is restored
		const failedUpdate = (updates as { descriptor: { name: string }; data?: object }[]).find(
			(u) => u.descriptor.name === "h1"
		);
		expect(failedUpdate?.data).toEqual(existingData);

		consoleErrorSpy.mockRestore();
	});

	it("dispatches a requestLimitExceeded notification when RequestLimitExceededError is thrown", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const h1 = makeDataHolder("h1", { documents: [], totalDocumentsCount: 0 });
		const plans = [makeExecutionPlan("p1", h1)];

		mockedRpc.mockRejectedValue(new RequestValidator.RequestLimitExceededError(5));

		const dispatched: { type: string; payload?: { severity?: string } }[] = [];

		await runSaga(
			{ dispatch: (a) => dispatched.push(a as never), getState: makeGetState() },
			executeQueryPlan,
			ACTIVITY_ID,
			plans
		).toPromise();

		const notif = dispatched.find((a) => a.type === NotificationActions.add.type);
		expect(notif).toBeDefined();
		expect(notif?.payload?.severity).toBe("error");

		consoleErrorSpy.mockRestore();
	});

	it("restores existing data for all plans when RPC throws", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const existingData1 = { documents: [{ id: "d1" }], totalDocumentsCount: 1 };
		const existingData2 = { documents: [{ id: "d2" }], totalDocumentsCount: 1 };
		const h1 = makeDataHolder("h1", existingData1);
		const h2 = makeDataHolder("h2", existingData2);

		mockedRpc.mockRejectedValue(new Error("network error"));

		const plans = [makeExecutionPlan("p1", h1), makeExecutionPlan("p2", h2)];
		const dispatched: unknown[] = [];

		const updates = await runSaga(
			{ dispatch: (a) => dispatched.push(a), getState: makeGetState() },
			executeQueryPlan,
			ACTIVITY_ID,
			plans
		).toPromise();

		const result = updates as { descriptor: { name: string }; data?: object }[];

		expect(result.find((u) => u.descriptor.name === "h1")?.data).toEqual(existingData1);
		expect(result.find((u) => u.descriptor.name === "h2")?.data).toEqual(existingData2);

		// One notification for the single RPC error
		expect(dispatched).toHaveLength(1);

		consoleErrorSpy.mockRestore();
	});
});
