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

import * as Path from "path";

import _ from "lodash";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { rspack, defineConfig, type RsbuildConfig } from "@rsbuild/core";
import { pluginStyledComponents } from "@rsbuild/plugin-styled-components";

import packageJson from "./package.json" with { type: "json" };
import { collectModelVersions } from "./scripts/collect-model-versions.js";

const supportedLocales = ["en-US", "en_GB", "de", "fr"];

const PATH = {
	PUBLIC: Path.join(__dirname, "resources", "public"),
	MODELS: Path.join(__dirname, "resources", "models"),
	HTML: Path.join(__dirname, "resources", "public", "index.html"),
	NODE_MODULES: Path.join(__dirname, "node_modules"),
	SRC: Path.join(__dirname, "src"),
	CORE: Path.join(__dirname, "..", "core"),
	ENTRY: Path.join(__dirname, "src", "index.tsx"),
	COMPOSABLE_ENTRY: Path.join(__dirname, "src", "composable.appsetup.tsx"),
	OUTPUT: Path.join(__dirname, "dist")
};

const entries: Record<string, { path: string; title: string }> = {
	index: { path: PATH.ENTRY, title: "Overview Engine Showcase" },
	composable: { path: PATH.COMPOSABLE_ENTRY, title: "[Composable] Overview Engine Showcase" }
};

const config: ReturnType<typeof defineConfig> = defineConfig(({ command }) => {
	return {
		server: {
			port: 12000,
			publicDir: [{ name: PATH.PUBLIC }],
			proxy: [
				{
					context: ["/api", "/cs"],
					target: `http://localhost:12090`,
					secure: false,
					changeOrigin: true
				},
				{
					context: ["/composable/api"],
					target: `http://localhost:12090`,
					secure: false,
					changeOrigin: true,
					pathRewrite: { "^/composable/api": "/api" }
				}
			]
		},
		source: {
			entry: _.mapValues(entries, (entry) => entry.path),
			define: {
				__A12_MODEL_VERSIONS__: JSON.stringify(collectModelVersions()),
				__VERSION__: `"${packageJson.version}"`,
				SC_DISABLE_SPEEDY: false
			}
		},
		resolve: {
			dedupe: ["immutable", "clsx", "scheduler", "react-is", "react", "styled-components"],
			alias: {
				// caused by react-dnd
				"react/jsx-runtime.js": "react/jsx-runtime",
				// necessary for WhyDidYouRender to track useSelector
				"react-redux": command === "dev" ? "react-redux/lib" : "react-redux"
			}
		},
		html: {
			template: PATH.HTML,
			favicon: "./resources/public/favicon.svg",
			templateParameters: ({ entryName }) => entries[entryName as any]
		},
		plugins: _.compact([pluginReact(), pluginStyledComponents(), command === "dev" ? pluginTypeCheck() : undefined]),
		tools: {
			rspack: {
				plugins: [
					new rspack.IgnorePlugin({
						resourceRegExp: new RegExp(`^date-fns/locale/(?!${supportedLocales.join("|")}).*$`)
					})
				],
				optimization: {
					minimizer: [new rspack.SwcJsMinimizerRspackPlugin({ minimizerOptions: { mangle: { keep_fnames: true } } })]
				}
			}
		},
		output: {
			assetPrefix: "./",
			distPath: {
				root: "dist"
			},
			sourceMap: true,
			injectStyles: true
		}
	} satisfies RsbuildConfig;
});

export default config;
