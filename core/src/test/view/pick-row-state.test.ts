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

import { pickRowState } from "../../main/view/utils.js";

describe("pickRowState", () => {
	it("returns undefined when rowState is undefined", () => {
		const result = pickRowState(undefined, { id: "doc1" });
		expect(result).toBeUndefined();
	});

	it("returns rowState entry when no linkId is provided", () => {
		const rowState = { doc1: { selected: true } };
		const result = pickRowState(rowState, { id: "doc1" });
		expect(result).toEqual({ selected: true });
	});

	it("returns rowState entry when linkId is provided but no byLink exists", () => {
		const rowState = { doc1: { selected: true } };
		const result = pickRowState(rowState, { id: "doc1", linkId: "link1" });
		expect(result).toEqual({ selected: true });
	});

	it("returns byLink entry when linkId is provided and entry exists", () => {
		const rowState = { doc1: { selected: false, byLink: { link1: { selected: true } } } };
		const result = pickRowState(rowState, { id: "doc1", linkId: "link1" });
		expect(result).toEqual({ selected: true });
	});

	it("falls back to rowState entry when linkId is provided but no matching byLink entry", () => {
		const rowState = { doc1: { selected: true, byLink: { otherLink: { selected: false } } } };
		const result = pickRowState(rowState, { id: "doc1", linkId: "link1" });
		expect(result).toEqual({ selected: true, byLink: { otherLink: { selected: false } } });
	});

	it("returns undefined when no matching id in rowState", () => {
		const rowState = { otherDoc: { selected: true, byLink: { link1: { selected: true } } } };
		const result = pickRowState(rowState, { id: "doc1", linkId: "link1" });
		expect(result).toBeUndefined();
	});

	it("prefers byLink over outer entry for rows with linkId", () => {
		const rowState = {
			doc1: { selected: false, disabled: true, byLink: { link1: { selected: true, disabled: false } } }
		};
		const result = pickRowState(rowState, { id: "doc1", linkId: "link1" });
		expect(result).toEqual({ selected: true, disabled: false });
	});
});
