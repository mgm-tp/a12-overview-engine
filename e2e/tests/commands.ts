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

import { expect, type Page, test as base } from "@playwright/test";

import { seed as seedData } from "../../services-utils/src/api.js";

import { Selector } from "./utils.js";

export async function waitUntilLoaded(page: Page, options?: { timeout?: number }, element?: string) {
	const timeout = options?.timeout ?? 20000;

	if (element) {
		await expect(page.locator(element).locator(Selector.PROGRESS_INDICATOR)).toHaveCount(0, { timeout });
	} else {
		await expect(page.locator(Selector.PROGRESS_INDICATOR)).toHaveCount(0, { timeout });
	}
}

// Playwright fixture for seed
const test = base.extend<{ seed: (preset?: string) => Promise<void> }>({
	seed: async ({ baseURL }, use) => {
		const seed = async (preset: string = "all") => {
			// Call the seed API directly with the baseURL from config
			try {
				await seedData({
					baseUrl: baseURL,
					presets: preset
				});
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Seeding failed:", e);
				throw e;
			}
		};

		// eslint-disable-next-line react-hooks/rules-of-hooks
		await use(seed);
	}
});

export { expect, test };
