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

import { testRecipe } from "@com.mgmtp.a12.devtools/codemod";

import { preferTopLevelImportsRecipe } from "../recipes/prefer-top-level-imports.js";

describe("preferTopLevelImports", () => {
	it("should convert named imports from overview-model to OverviewModel namespace", async () => {
		await expect(
			testRecipe(
				preferTopLevelImportsRecipe,
				`import { Button } from "@com.mgmtp.a12.overviewengine/overviewengine-core/lib/main/overview-model.js";

const myButton: Button = {
	label: [],
	event: "myButtonClicked"
};
`
			)
		).resolves.toMatchInlineSnapshot(`
			"import { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

			const myButton: OverviewModel.Button = {
				label: [],
				event: "myButtonClicked"
			};
			"
		`);
	});

	it("should convert named imports from overview-model to OverviewModel namespace 2", async () => {
		await expect(
			testRecipe(
				preferTopLevelImportsRecipe,
				`

import React, { Component, useContext } from "react";

import {
type Button,
type Column,
type OverviewModel,
ReferenceColumn
} from "@com.mgmtp.a12.overviewengine/overviewengine-core/lib/main/overview-model.js";
import { Button as WidgetsButton } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";

const myButton: Button = {
	label: [],
	event: "myButtonClicked"
};
`
			)
		).resolves.toMatchInlineSnapshot(`
			"import { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
			import React, { Component, useContext } from "react";
			import { Button as WidgetsButton } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";

			const myButton: OverviewModel.Button = {
				label: [],
				event: "myButtonClicked"
			};
			"
		`);
	});
});
