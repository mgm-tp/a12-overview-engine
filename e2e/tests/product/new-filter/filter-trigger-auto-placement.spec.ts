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

import type { Page } from "@playwright/test";
import { produce } from "immer";

import { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { test, expect } from "../../commands.js";
import { useModelOverride } from "../../model-override.js";
import { Selector, Showcase, navigate } from "../../utils.js";

const SIZE = {
	LG: { width: 1280, height: 720 },
	SM: { width: 700, height: 720 }
} as const;

function disableAllPresets(model: OverviewModel): OverviewModel {
	return produce(model, (draft) => {
		for (const group of draft.content.configuration.newFilterConfiguration?.filterGroups ?? []) {
			for (const item of group.filterItems) {
				if ("preferFilterBar" in item && item.preferFilterBar) {
					delete (item as { preferFilterBar?: true }).preferFilterBar;
				}
			}
		}
	});
}

function setSubHeaderBox(model: OverviewModel, subHeaderBox: OverviewModel.SubHeaderBox | undefined): OverviewModel {
	if (subHeaderBox === undefined) {
		return produce(model, (draft) => {
			delete draft.content.subHeaderBox;
		});
	}

	return {
		...model,
		content: {
			...model.content,
			subHeaderBox
		}
	};
}

function filterTrigger(page: Page) {
	return page.getByRole("button", { name: /^(Open|Close) filter$/ });
}

function contentBoxHeader(page: Page) {
	return page.locator(Selector.CONTENT_BOX_HEADER);
}

test.describe.serial("Tier 1 — trigger next to search", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	useModelOverride((model) =>
		setSubHeaderBox(disableAllPresets(model), {
			rightSlot: [{ type: OverviewModel.ElementType.SEARCH }]
		})
	);

	test("trigger renders in the action bar adjacent to the search field", async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(filterTrigger(page)).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		const searchButton = page.locator(Selector.BUTTON_SEARCH).first();
		await expect(searchButton).toBeVisible();

		const searchBox = await searchButton.boundingBox();
		const triggerBox = await filterTrigger(page).boundingBox();
		expect(searchBox).not.toBeNull();
		expect(triggerBox).not.toBeNull();

		// Same row, filter on the right of search, within ~120px (one widget plus spacing).
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(Math.abs(triggerBox!.y - searchBox!.y)).toBeLessThan(8);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const gap = triggerBox!.x - (searchBox!.x + searchBox!.width);
		expect(gap).toBeGreaterThanOrEqual(0);
		expect(gap).toBeLessThan(120);

		// Trigger must NOT be in the Content Box Header (heading suffix) when in action bar.
		await expect(contentBoxHeader(page).getByRole("button", { name: /^Open filter$/ })).toHaveCount(0);
	});
});

test.describe.serial("Tier 2 — trigger in action bar (no search)", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	useModelOverride((model) =>
		setSubHeaderBox(disableAllPresets(model), {
			rightSlot: [{ type: OverviewModel.ElementType.BUTTON, event: "noop" }]
		})
	);

	test("trigger renders in the action bar at the rightSlot end", async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(filterTrigger(page)).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		// Scope to the action-bar group area: the docked filter-selector panel and other
		// places in the page can render their own search inputs; we only care that no
		// SearchElement-driven Search button rendered inside the subheader action bar.
		const actionBarArea = page.locator(Selector.MULTI_SELECT_BUTTON_GROUP);

		await expect(actionBarArea.locator(Selector.BUTTON_SEARCH)).toHaveCount(0);

		// Trigger sits inside the action bar group area (subheader), not the heading.
		await expect(contentBoxHeader(page).getByRole("button", { name: /^Open filter$/ })).toHaveCount(0);
	});
});

test.describe.serial("Tier 3 — trigger in Content Box Header suffix", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	useModelOverride((model) => setSubHeaderBox(disableAllPresets(model), undefined));

	test("trigger renders outside the subheader action bar when subHeaderBox is absent", async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(filterTrigger(page)).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		// Trigger must NOT live in the subheader action bar group area (search-adjacent / action-bar placements).
		const actionBarArea = page.locator(Selector.MULTI_SELECT_BUTTON_GROUP);
		await expect(actionBarArea.getByRole("button", { name: /^Open filter$/ })).toHaveCount(0);

		// Trigger sits above the table content (in the Content Box heading area).
		const trigger = filterTrigger(page);
		const headingBox = page.getByRole("heading", { name: /List of all products/ }).first();
		const triggerBox = await trigger.boundingBox();
		const titleBox = await headingBox.boundingBox();
		expect(triggerBox).not.toBeNull();
		expect(titleBox).not.toBeNull();
		// Same row as the title (header-suffix placement).
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(Math.abs(triggerBox!.y - titleBox!.y)).toBeLessThan(40);
	});
});

test.describe.serial("Custom trigger — engine renders no trigger", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	useModelOverride((model) =>
		produce(disableAllPresets(model), (draft) => {
			const config = draft.content.configuration.newFilterConfiguration;

			if (!config) {
				return;
			}

			config.filterSelector = { ...config.filterSelector, trigger: { enabled: false } };
		})
	);

	test("no Open filter button is rendered", async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		// Wait for the page to settle: heading visible means engine mounted.
		await expect(page.getByRole("heading", { name: /List of all products/ })).toBeVisible();
		await expect(filterTrigger(page)).toHaveCount(0);
	});
});

test.describe.serial("Responsive — sm viewport forces header-suffix placement", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.afterEach(async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
	});

	useModelOverride((model) =>
		setSubHeaderBox(disableAllPresets(model), {
			rightSlot: [{ type: OverviewModel.ElementType.SEARCH }]
		})
	);

	test("trigger moves to heading area on sm viewport", async ({ page }) => {
		await page.setViewportSize(SIZE.SM);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(filterTrigger(page)).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		// Trigger sits on the title row, not below in a subheader.
		const triggerBox = await filterTrigger(page).boundingBox();
		const titleBox = await page
			.getByRole("heading", { name: /List of all products/ })
			.first()
			.boundingBox();
		expect(triggerBox).not.toBeNull();
		expect(titleBox).not.toBeNull();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(Math.abs(triggerBox!.y - titleBox!.y)).toBeLessThan(40);
	});
});
