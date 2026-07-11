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

import { defineConfig } from "vitest/config";
import pluginReact from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

export default defineConfig({
	test: {
		reporters: process.env.CI ? ["dot"] : ["dot", "json"],
		outputFile: { json: `./target/vitest/run-${runStamp}.json` },
		setupFiles: ["./src/test/setup/vitest.ts"],
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		deps: { optimizer: { client: { enabled: true } } },
		maxWorkers: process.env.CI ? 2 : "50%",
		minWorkers: process.env.CI ? 2 : "50%",
		pool: "forks",
		clearMocks: true,
		testTimeout: 20000,
		coverage: {
			reporter: ["text", "text-summary"],
			reportsDirectory: "./target/coverage"
		},
		browser: {
			screenshotFailures: false,
			provider: playwright(),
			enabled: true,
			headless: true,
			instances: [
				{
					browser: "chromium",
					viewport: { width: 1280, height: 720 },
					context: {
						userAgent:
							"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
					}
				}
			]
		}
	},
	esbuild: { tsconfigRaw: { compilerOptions: { target: "esnext" } } },
	define: {
		global: "window",
		SC_DISABLE_SPEEDY: false
	},
	plugins: [pluginReact()]
});
