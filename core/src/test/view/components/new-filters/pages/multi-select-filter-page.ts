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

import { expect } from "vitest";
import { fireEvent } from "@testing-library/react";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import { renderFilter, type FilterRenderResult, type DocumentModelModifier } from "../setup.js";

import { EnumerationFilterPage } from "./enumeration-filter-page.js";

export class MultiSelectFilterPage extends EnumerationFilterPage {
	get matchOperatorValue(): "and" | "or" | undefined {
		const operator = this.operator;

		if (!operator || operator.length === 0) {
			return undefined;
		}

		const firstOp = operator[0];

		if ("operator" in firstOp) {
			if (firstOp.operator === "and") {
				return "and";
			}

			if (firstOp.operator === "or") {
				return "or";
			}
		}

		return undefined;
	}

	async setMatchOperator(value: "Any" | "All"): Promise<void> {
		await this.withSettings(async (settings) => {
			const matchSetting = settings.toggleSection("Match");
			expect(matchSetting).toBeDefined();
			assertCondition(!!matchSetting, "Match toggle not found in settings portal");

			fireEvent.click(matchSetting.item(value));
		});
	}
}

export async function renderMultiSelectFilter(options: {
	filterItem: OverviewModel.NewFilter.MultiSelect.Item;
	documentModelModifier?: DocumentModelModifier;
}): Promise<{ page: MultiSelectFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new MultiSelectFilterPage(result), ...result };
}
