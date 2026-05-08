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

import { type JsonRpc2Request } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { RequestValidator } from "../../../../main/client-extensions/internal/utils/request-validator.js";

const MOCK_MAX_REQUESTS = 3;

function createMockRequest(id: string): JsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id,
		method: "test"
	} as JsonRpc2Request;
}

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.utils.request-validator", () => {
	describe("assertValidRequestCount", () => {
		it("should not throw when request count is at or below limit", () => {
			const requests = Array.from({ length: MOCK_MAX_REQUESTS }, (_, i) => createMockRequest(`${i}`));

			expect(() => RequestValidator.assertValidRequestCount(requests, MOCK_MAX_REQUESTS)).not.toThrow();
		});

		it("should throw RequestLimitExceededError when request count exceeds limit", () => {
			const requests = Array.from({ length: MOCK_MAX_REQUESTS + 1 }, (_, i) => createMockRequest(`${i}`));

			expect(() => RequestValidator.assertValidRequestCount(requests, MOCK_MAX_REQUESTS)).toThrow(
				RequestValidator.RequestLimitExceededError
			);
		});

		it("should ignore undefined values when counting requests", () => {
			const requests: (JsonRpc2Request | undefined)[] = [
				...Array.from({ length: MOCK_MAX_REQUESTS }, (_, i) => createMockRequest(`${i}`)),
				undefined
			];

			expect(() => RequestValidator.assertValidRequestCount(requests, MOCK_MAX_REQUESTS)).not.toThrow();
		});
	});
});
