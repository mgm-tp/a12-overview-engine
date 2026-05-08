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

import Path from "node:path";

import Fse from "fs-extra";
import highlightJsExt from "asciidoctor-highlight.js";

import PackageJson from "../package.json" with { type: "json" };

import { Config } from "./config.js";
import { copySources } from "./copy-sources.js";
import { handleAsciidoctorErrors } from "./utils.js";

const asciidoctor = (await import("asciidoctor")).default();

const memoryLogger = asciidoctor.MemoryLogger.create();
asciidoctor.LoggerManager.setLogger(memoryLogger);

const registry = asciidoctor.Extensions.create();
highlightJsExt.register(registry);

export async function compile() {
	asciidoctor.convertFile(Path.resolve(Config.srcDir, "index.adoc"), {
		to_dir: Config.outDir,
		mkdirs: true,
		safe: 0,
		extension_registry: registry,
		attributes: {
			icons: "font",
			["source-highlighter"]: "highlightjs-ext",
			toclevels: 5,
			["toc-title"]: "Table of Contents",
			docinfo: "shared",
			docinfodir: Config.resourcesDir,
			toc: "left",
			doctype: "article",
			["source-linenums-option"]: true,
			tabsize: 2,
			sectnums: true,
			sectanchors: true,
			sectlinks: true,
			experimental: true,
			sectids: true,
			encoding: "utf-8",
			lang: "en",
			fragment: true,
			xrefstyle: "short",
			standalone: true,
			revnumber: PackageJson.version,
			author: "Overview Engine Product Team"
		}
	});

	handleAsciidoctorErrors(memoryLogger);

	Fse.copySync(Config.srcAssets, Config.outAssets);
	Fse.copySync(Config.srcHighlightStyleFile, Config.outHighlightStyleFile);
}

if (process.argv.some((arg) => arg.split(Path.sep).join("/").includes("scripts/compile"))) {
	copySources()
		.then(async () => {
			await compile();
			console.log("Documentation compiled successfully");
		})
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
