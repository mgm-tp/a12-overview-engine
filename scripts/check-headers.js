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

import Fs from "node:fs/promises";
import Path from "node:path";

const SPDX_MARKER = ["SPDX-License", "Identifier: EUPL-1.2 OR LicenseRef-commercial"].join("-");

const ADOC_TEMPLATE_PATH = "license_header.adoc";
const ADOC_DIR = "documentation/src";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".java"];
const IGNORE_DIRS = new Set([
	"lib",
	"dist",
	"build",
	"target",
	"coverage",
	"resources",
	"generated",
	"node_modules",
	"playwright-report",
	".gradle",
	".npm",
	".git",
	".claude",
	"worktrees"
]);

const IGNORE_FILES = new Set([
	"migration-tool/src/internal/steps/index.ts" // auto-generated file
]);

const errors = [];

// --- Find files recursively ---

async function findFiles(dir, extensions) {
	let entries;

	try {
		entries = await Fs.readdir(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	const files = [];

	for (const entry of entries) {
		if (IGNORE_DIRS.has(entry.name)) {
			continue;
		}

		const fullPath = Path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await findFiles(fullPath, extensions)));
		} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
			files.push(fullPath);
		}
	}

	return files;
}

// --- Check adoc headers (missing / wrong) ---

let adocFiles;

try {
	await Fs.access(ADOC_TEMPLATE_PATH);
	const adocTemplate = (await Fs.readFile(ADOC_TEMPLATE_PATH, "utf-8"))
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");

	adocFiles = await findFiles(ADOC_DIR, [".adoc"]);

	for (const file of adocFiles) {
		const content = await Fs.readFile(file, "utf-8");
		const fileHeader = content
			.slice(0, adocTemplate.length + 100)
			.split("\n")
			.map((line) => line.trimEnd())
			.join("\n");

		if (!fileHeader.startsWith(adocTemplate)) {
			errors.push({ file, error: `wrong license header (expected template: ${ADOC_TEMPLATE_PATH})` });
		}
	}
} catch {
	// No adoc template — fall back to marker check
	adocFiles = await findFiles(ADOC_DIR, [".adoc"]);

	for (const file of adocFiles) {
		const content = await Fs.readFile(file, "utf-8");
		const head = content.slice(0, 500);

		if (!head.includes(SPDX_MARKER)) {
			errors.push({ file, error: "missing license header" });
		}
	}
}

// --- Check source files for missing / duplicate headers ---

const sourceFiles = await findFiles(".", SOURCE_EXTENSIONS);

for (const file of sourceFiles) {
	const normalized = file.startsWith("./") ? file.slice(2) : file;

	if (IGNORE_FILES.has(normalized)) {
		continue;
	}

	const content = await Fs.readFile(file, "utf-8");
	const count = content.split(SPDX_MARKER).length - 1;

	if (count === 0) {
		errors.push({ file, error: "missing license header" });
	} else if (count > 1) {
		errors.push({ file, error: `duplicate license header (found ${count} times)` });
	}
}

// --- Report ---

if (errors.length > 0) {
	console.error(`License header issues found in ${errors.length} file(s):\n`);

	for (const { file, error } of errors) {
		console.error(`  ${file}: ${error}`);
	}

	process.exit(1);
}

const total = adocFiles.length + sourceFiles.length;
console.log(`All ${total} file(s) have correct license headers.`);
