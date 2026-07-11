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

import type { OverviewModel } from "../../../../main/overview-model.js";
import { removeLinkReferencesForExcludeMode } from "../../../../main/client-extensions/internal/utils/link-column-utils.js";

import { createColumn, createLinkedColumn, createOverviewModel } from "../../../utils.js";

const RELATIONSHIP = "PersonAddressRM";
const TARGET_ROLE = "address";

const displayDocumentLink = { relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "CHILD" as const };

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.utils.link-column-utils", () => {
	describe("removeLinkReferencesForExcludeMode", () => {
		it("should return non-linked columns unchanged", () => {
			const column = createColumn("firstName", false, "firstName");
			const model = createOverviewModel([column]);

			const result = removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			expect(result.content.columns).toHaveLength(1);
			expect(result.content.columns[0]).toEqual(column);
			expect("linkReferences" in result.content.columns[0]).toBe(false);
		});

		it("should remove linkReferences from a column matching the exclude relationship with a non-LINK targetRole", () => {
			const column = createLinkedColumn("street", [
				{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "CHILD" as const }
			]);
			const model = createOverviewModel([column]);

			const result = removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			expect(result.content.columns).toHaveLength(1);
			expect("linkReferences" in result.content.columns[0]).toBe(false);
			expect(result.content.columns[0]).toMatchObject({
				id: "link-street",
				elementRef: "street",
				width: 1
			});
		});

		it("should NOT remove linkReferences when type is LINK", () => {
			const column = createLinkedColumn("street", [
				{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "LINK" }
			]);
			const model = createOverviewModel([column]);

			const result = removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			expect(result.content.columns).toHaveLength(1);
			expect("linkReferences" in result.content.columns[0]).toBe(true);
			expect((result.content.columns[0] as OverviewModel.BaseLinkedColumn).linkReferences).toEqual([
				{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "LINK" }
			]);
		});

		it("should NOT remove linkReferences when the relationship does not match", () => {
			const column = createLinkedColumn("street", [
				{ relationship: "OtherRelationship", targetRole: TARGET_ROLE, type: "CHILD" as const }
			]);
			const model = createOverviewModel([column]);

			const result = removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			expect(result.content.columns).toHaveLength(1);
			expect("linkReferences" in result.content.columns[0]).toBe(true);
		});

		it("should NOT remove linkReferences when the linkReferences has more than one entry", () => {
			const column = createLinkedColumn("city", [
				{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "CHILD" as const },
				{ relationship: "AddressCityRM", targetRole: "city", type: "CHILD" as const }
			]);
			const model = createOverviewModel([column]);

			const result = removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			expect(result.content.columns).toHaveLength(1);
			expect("linkReferences" in result.content.columns[0]).toBe(true);
			expect((result.content.columns[0] as OverviewModel.BaseLinkedColumn).linkReferences).toHaveLength(2);
		});

		it("should not mutate the original overview model", () => {
			const column = createLinkedColumn("street", [
				{ relationship: RELATIONSHIP, targetRole: TARGET_ROLE, type: "CHILD" as const }
			]);
			const model = createOverviewModel([column]);

			const originalColumns = [...model.content.columns];

			removeLinkReferencesForExcludeMode(model, displayDocumentLink);

			// Original model columns should still have linkReferences
			expect(model.content.columns).toEqual(originalColumns);
			expect("linkReferences" in model.content.columns[0]).toBe(true);
		});
	});
});
