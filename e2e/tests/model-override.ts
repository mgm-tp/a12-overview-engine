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

import type { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import { updateModel } from "@com.mgmtp.a12.overviewengine/overviewengine-services-utils";

import ProductNewFilterOM from "../../showcase/resources/models/product/ProductNewFilterOM.json" with { type: "json" };

import { test } from "./commands.js";

export type PresetKey = "product";

const MODEL_MAP: Record<PresetKey, OverviewModel> = {
	product: ProductNewFilterOM as OverviewModel
};

type Transform = (model: OverviewModel) => OverviewModel;

export interface UseModelOverrideOptions {
	preset?: PresetKey;
}

export function useModelOverride(transform: Transform, options: UseModelOverrideOptions = {}): void {
	const { preset = "product" } = options;
	const original = MODEL_MAP[preset];

	// Apply the override in beforeEach (not beforeAll) so it always runs after any
	// prior describe's afterAll restore — avoids races where the restore upload lands
	// after the current describe's beforeAll override.
	test.beforeEach(async ({ baseURL }) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await updateModel({ baseUrl: baseURL!, model: transform(original) });
	});

	test.afterAll(async ({ baseURL }) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await updateModel({ baseUrl: baseURL!, model: original });
	});
}
