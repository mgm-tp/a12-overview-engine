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

import assert from "node:assert";
import Fs from "node:fs/promises";
import Path from "node:path";
import { test } from "node:test";

import Fse from "fs-extra";

import { Config } from "./config.js";

const RELATIVE_LINK_REGEX = /link:(?<path>[^#[]+)(?<hash>#[^[]+?)?(?<label>\[[^\]]+\])/g;
const TYPEDOC = "./assets/generated/typedoc";
const ADOC = ".adoc";

test("validate links", async () => {
	for (const asciiDocFileName of await Fs.readdir(Config.srcDir)) {
		if (!asciiDocFileName.endsWith(ADOC)) {
			continue;
		}

		const asciiDocContent = await Fs.readFile(Path.join(Config.srcDir, asciiDocFileName), "utf8");

		for (const relativeLinkMatcher of asciiDocContent.matchAll(RELATIVE_LINK_REGEX)) {
			const { path, hash } = relativeLinkMatcher.groups;

			if (!path.startsWith(TYPEDOC)) {
				continue;
			}

			const typedocFilePath = Path.resolve(Config.srcDir, path);

			if (!(await Fse.pathExists(typedocFilePath))) {
				console.log(`Can not find the typedoc file with path: ${typedocFilePath}`);
				console.log({ path, hash });
				console.log({ asciiDocFileName, relativeLinkMatcher });
			}

			assert.ok(await Fse.pathExists(typedocFilePath), `Can not find the typedoc file with path: ${typedocFilePath}`);

			const typedocContent = await Fs.readFile(typedocFilePath, "utf8");

			if (hash) {
				assert.ok(
					typedocContent.includes(`id="${hash.slice(1)}"`),
					`Can not find the section with id: ${hash} in file: ${typedocFilePath}`
				);
			}
		}
	}
});
