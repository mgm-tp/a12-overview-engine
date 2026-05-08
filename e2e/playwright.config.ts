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

import { devices, defineConfig } from "@playwright/test";

/**
 * This configuration file is used to run Playwright tests in a single worker on local machine, due to limitation of IntelliJ IDEA.
 * https://youtrack.jetbrains.com/issue/AQUA-818/Playwright-Config-with-Multiple-Projects-Keeps-Asking-to-Edit-testDir
 */
export default defineConfig({
	testDir: "./tests",
	timeout: 30 * 1000,
	expect: {
		timeout: 10000
	},
	fullyParallel: false,
	retries: 0,
	workers: 1,
	reporter: "html",
	use: {
		actionTimeout: 0,
		trace: "on-first-retry",
		baseURL: "http://localhost:12000",
		headless: true,
		screenshot: "only-on-failure"
	},
	projects: [
		{
			name: "all",
			use: { ...devices["Desktop Chrome"], channel: "chromium" }
		}
	]
});
