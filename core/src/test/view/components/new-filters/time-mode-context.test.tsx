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

import { enUS } from "date-fns/locale";
import { it, expect, describe } from "vitest";

import type { OverviewModel } from "../../../../main/index.js";

import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderTimeFilter } from "./pages/time-filter-page.js";

const baseTimeFilterOptions: OverviewModel.NewFilter.Time.Item = {
	id: "startTime",
	type: "time",
	options: {
		fieldId: ProductFieldIds.timeField.id,
		ranges: [{ option: "fromTo", default: true, enabled: true }],
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.time-mode-context", () => {
	it("renders TimeFilterEditor wrapped in DateTimeContext.Provider with 24h mode", async () => {
		const { page } = await renderTimeFilter({
			filterItem: baseTimeFilterOptions,
			dateTimeContext: { locale: enUS, timeMode: "24h" }
		});

		expect(page.fromInput).toBeInTheDocument();
		expect(page.toInput).toBeInTheDocument();
	});

	it("opens TimePicker dialog without AM/PM toggle when context provides 24h mode", async () => {
		const { page } = await renderTimeFilter({
			filterItem: baseTimeFilterOptions,
			dateTimeContext: { locale: enUS, timeMode: "24h" }
		});

		const dialog = await page.openFromTimePicker();

		expect(dialog.isOpen).toBe(true);
		expect(dialog.isAmSelected).toBe(false);
		expect(dialog.isPmSelected).toBe(false);
	});

	it("opens TimePicker dialog with AM/PM toggle when context provides 12h mode (default)", async () => {
		const { page } = await renderTimeFilter({
			filterItem: baseTimeFilterOptions,
			dateTimeContext: { locale: enUS, timeMode: "12h" }
		});

		const dialog = await page.openFromTimePicker();

		expect(dialog.isOpen).toBe(true);
		expect(dialog.isAmSelected || dialog.isPmSelected).toBe(true);
	});
});
