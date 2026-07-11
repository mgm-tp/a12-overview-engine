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

import type { Page, Locator } from "@playwright/test";

import { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { waitUntilLoaded } from "./commands.js";

export namespace Selector {
	export const BUTTON_APPLY = buttonContains("Apply");
	export const BUTTON_DELETE = "button[aria-label = 'Delete']";
	export const BUTTON_DELETE_PRODUCT = "button[title= 'Delete this product']";
	export const BUTTON_EXPAND_MULTI_SELECTION = "button[aria-label = 'Expand functions for bulk operation']";
	export const BUTTON_GO_TO_LAST_PAGE = "button[aria-label = 'Last page']";
	export const BUTTON_LABEL = dataRole("button-label");
	export const BUTTON_OPEN_FILTER = "button[aria-label = 'Open filter']";
	export const BUTTON_REPORT_BUG_PRODUCT = "button[title= 'Report']";
	export const BUTTON_RESET_SEARCH = "button[aria-label = 'Reset search']";
	export const BUTTON_SEARCH = "button[aria-label = 'Search']";

	export const CHECKBOX_INPUT = dataRole("checkbox-input");
	export const CHECKBOX_CONTROL = dataRole("checkbox-control");

	export const CONTENT_BOX_CONTENT = dataRole("contentbox-content");
	export const CONTENT_BOX_FOOTER = dataRole("contentbox-footer");
	export const CONTENT_BOX_HEADER = dataRole("contentbox-header");
	export const CONTENT_BOX_TITLE = dataRole("contentbox-title");

	export const COUNTER = dataRole("counter");
	export const COUNTER_PRESENTATION = `${COUNTER} [role=presentation]`;

	export const DIALOG = dataRole("modal-overlay");

	export const FILTER = dataRole("filter");
	export const FILTER_BAR = dataRole("filterbar");
	export const FILTER_CONTENT = dataRole("filter-content");
	export const FILTER_NAME = dataRole("filter-name");
	export const FILTER_OPTIONS = dataRole("filter-options");
	export const FILTER_SELECTOR = dataRole("filter-selector");
	export const FILTER_SELECTOR_ACTION_BAR = dataRole("filter-selector-action-bar");
	export const FILTER_SELECTOR_CONTENT_SECONDARY = dataRole("filter-selector-content-secondary");
	export const FILTER_SELECTOR_CONTENT_PRIMARY = dataRole("filter-selector-content-primary");
	export const FILTER_SELECTOR_LIST_ITEM = dataRole("filter-selector-list-item");

	export const INPUT_FILTER_VALUE = "input[placeholder = 'Filter Value']";
	export const INPUT_FULL_TEXT_SEARCH = `${CONTENT_BOX_HEADER} input[placeholder = 'Search']`;
	export const INPUT_VALUE_SEARCH = "input[placeholder = 'Value Search']";

	export const LIST_ITEM = dataRole("list-item");
	export const LIST_ITEM_CONTENT = dataRole("list-item-content");
	export const LIST_ITEM_TEXT = dataRole("list-item-text");

	export const MODAL_OVERLAY = dataRole("modal-overlay");
	export const MULTI_SELECT_BUTTON_GROUP = dataRole("contentbox-action-bar-group");

	export const PAGINATION = dataRole("pagination");
	export const PAGINATION_BUTTON_PREV = `${dataRole("pagination")} button[aria-label = 'Previous page']`;
	export const PAGINATION_BUTTON_NEXT = `${dataRole("pagination")} button[aria-label = 'Next page']`;
	export const POPUP = dataRole("popup");
	export const POPUP_MENU = dataRole("popup-menu");
	export const PORTAL = dataRole("portal");
	export const PROGRESS_INDICATOR = dataRole("progress-indicator-outer-overlay");

	export const TABLE_BODY_CELL = dataRole("table-body-cell");
	export const TABLE_BODY_ROW = dataRole("table-body-row");
	export const TABLE_INFINITE_BODY_ROW = `${TABLE_BODY_ROW}[role="row"]`;
	export const TABLE_HEADER_CELL = dataRole("table-header-cell");
	export const TABLE_HEADER_ROW = dataRole("table-header-row");
	export const TABLE_ROW = dataRole("table-body-row");
	export const TOAST_GROUP = dataRole("toast-group");

	export const MENU_ITEM = dataRole("menu-item");

	export const SELECT_INPUT = dataRole("select-input");

	export function buttonContains(text: string) {
		return `button >> text="${text}"`;
	}
}

function dataRole(role: string) {
	return `[data-role="${role}"]`;
}

export enum Showcase {
	DEFAULT = "",
	PRODUCT_PAGINATION = "#showcase:product,feature:pagination",
	PRODUCT_NEW_FILTER = "#showcase:product,feature:new-filter",
	PRODUCT_PRESET_FILTER = "#showcase:product,feature:preset-filter",
	MOBILE_EXPRESSION = "#showcase:mobile,feature:expression",
	MOBILE_CARD_VIEW = "#showcase:mobile,feature:card-view",
	BUNDLE = "#showcase:bundle",
	PERSON = "#showcase:person",
	EMPLOYEE_PRESET_FILTER = "#showcase:employee,feature:preset-filter",
	BUNDLE_WITH_LINK = "#showcase:bundle,feature:with-link",
	PERSON_WITH_LINK = "#showcase:person,feature:with-link"
}

export async function navigate(page: Page, showcase: Showcase) {
	await page.goto(showcase);
	await waitUntilLoaded(page);
}

export function inputByLabel(page: Page, label: string) {
	return page.getByRole("textbox", { name: label });
}

const LOCALE_PRESETS = [
	{ language: "en", country: "US" },
	{ language: "en", country: "GB" },
	{ language: "de", country: "DE" },
	{ language: "fr", country: "FR" }
] as const;

export async function setLocale(page: Page, country: (typeof LOCALE_PRESETS)[number]["country"]) {
	const preset = LOCALE_PRESETS.find((l) => l.country === country) || LOCALE_PRESETS[0];
	await page.addInitScript(
		({ locale }) => {
			localStorage.setItem("locale", locale);
		},
		{ locale: Locale.toString(preset) }
	);
}

export async function getColumnIndex(headerCell: Locator): Promise<number> {
	return headerCell.evaluate((el) => {
		const row = el.closest('[data-role="table-header-row"]');

		if (!row) {
			throw new Error("No table-header-row ancestor found");
		}

		const headers = Array.from(row.querySelectorAll('[data-role="table-header-cell"]'));

		const index = headers.indexOf(el);

		if (index === -1) {
			throw new Error("Could not determine column index for the given header cell");
		}

		return index;
	});
}
