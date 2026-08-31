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

import { waitFor, fireEvent, getByText, queryByText } from "@testing-library/react";
import { Lens } from "monocle-ts";
import { it, expect, describe } from "vitest";
import { userEvent } from "vitest/browser";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { Events } from "../../../../main/store/index.js";
import { FilterSelector } from "../../../../main/view/components/new-filters/components/filter-selector.js";
import { deLocale } from "../../../basic.spec.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import {
	findByDataRole,
	baseFilterGroup,
	renderWithStore,
	withFilterSection,
	queryAllByDataRole,
	baseFilterConfiguration
} from "./setup.js";

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);

const stringFilterItem: OverviewModel.NewFilter.String.Item = {
	id: "string-filter-1",
	type: "string",
	label: [{ locale: "en", text: "Name" }],
	options: {
		fieldId: ProductFieldIds.name.id,
		empty: { enabled: true, value: false },
		caseSensitive: { enabled: true, value: false },
		exactMatch: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

const booleanFilterItem: OverviewModel.NewFilter.Boolean.Item = {
	id: "boolean-filter-1",
	type: "boolean",
	label: [{ locale: "en", text: "Available" }],
	options: {
		fieldId: ProductFieldIds.inStock.id,
		empty: { enabled: false }
	}
};

const numberFilterItem: OverviewModel.NewFilter.Number.Item = {
	id: "number-filter-1",
	type: "number",
	label: [{ locale: "en", text: "Price" }],
	options: {
		fieldId: ProductFieldIds.number.id,
		ranges: [
			{ option: "fromTo", default: true, enabled: true },
			{ option: "fromOnly", enabled: true },
			{ option: "toOnly", enabled: true },
			{ option: "exact", enabled: true }
		],
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

const enumerationFilterItem: OverviewModel.NewFilter.Enumeration.Item = {
	id: "enum-filter-1",
	type: "enumeration",
	label: [{ locale: "en", text: "Category" }],
	options: {
		fieldId: ProductFieldIds.targetGroup.id,
		viewMode: "list",
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

class FilterSelectorPage {
	constructor(private readonly container: HTMLElement) {}

	get buttons(): HTMLButtonElement[] {
		return queryAllByDataRole<HTMLButtonElement>(this.container, DataRoles.Button);
	}

	get textInputs(): HTMLInputElement[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.TextField.Input);
	}

	get headlineLabels(): HTMLElement[] {
		return queryAllByDataRole(this.container, DataRoles.Typography.Headline.Label);
	}

	get badges(): HTMLElement[] {
		return queryAllByDataRole(this.container, DataRoles.Badge);
	}

	get title(): HTMLElement {
		return getByText(this.container, "Filter");
	}

	get closeButton(): HTMLButtonElement | undefined {
		return this.buttons.find((btn) => queryByText(btn, "close"));
	}

	get settingsButton(): HTMLButtonElement | undefined {
		return (
			queryAllByDataRole<HTMLButtonElement>(this.container, DataRoles.Popup.TriggerElement).find((btn) =>
				queryByText(btn, "more_vert")
			) ?? this.buttons.find((btn) => queryByText(btn, "more_vert"))
		);
	}

	get resetAllButton(): HTMLButtonElement | null {
		return getByText(this.container, "Reset All").closest("button");
	}

	get applyAllButton(): HTMLButtonElement | null {
		return getByText(this.container, "Apply All").closest("button");
	}

	get resetButtons(): HTMLButtonElement[] {
		return this.buttons.filter((btn) => queryByText(btn, "replay"));
	}

	get filterSettingsButtons(): HTMLButtonElement[] {
		return this.buttons.filter((btn) => queryByText(btn, "build"));
	}

	get searchInput(): HTMLInputElement | undefined {
		return this.textInputs.find((input) => input.placeholder?.toLowerCase().includes("search"));
	}

	findFilterHeadline(labelText: string): HTMLElement | undefined {
		return this.headlineLabels.find((el) => el.textContent?.includes(labelText));
	}

	findGroupHeadline(labelText: string): HTMLElement | undefined {
		return this.headlineLabels.find((el) => el.textContent?.includes(labelText));
	}

	hasFilterLabel(labelPattern: RegExp | string): boolean {
		try {
			getByText(this.container, labelPattern);

			return true;
		} catch {
			return false;
		}
	}

	getFilterLabel(labelPattern: RegExp | string): HTMLElement {
		return getByText(this.container, labelPattern);
	}

	queryFilterLabel(labelPattern: RegExp | string): HTMLElement | null {
		return queryByText(this.container, labelPattern);
	}

	async openSettingsMenu(): Promise<HTMLElement> {
		const settingsButton = this.settingsButton;
		assertCondition(!!settingsButton, "Settings button not found");
		fireEvent.click(settingsButton);
		const attachedPortal = await findByDataRole(this.container, DataRoles.AttachedPortal);

		return attachedPortal;
	}

	async closeSettingsMenu(): Promise<void> {
		fireEvent.mouseDown(this.container);
		fireEvent.mouseUp(this.container);
		fireEvent.click(this.container);
		await waitFor(() => {
			expect(queryAllByDataRole(this.container, DataRoles.AttachedPortal).length).toBe(0);
		});
	}

	findMenuItem(portal: HTMLElement, text: string): HTMLElement | null {
		return getByText(portal, text).closest("li");
	}

	hasCheckMark(item: HTMLElement | null): boolean {
		if (!item) {
			return false;
		}

		return item.textContent?.includes("check") ?? false;
	}

	toggleSwitch(listItem: HTMLElement): void {
		const switchInput = queryAllByDataRole<HTMLInputElement>(listItem, DataRoles.Switch.Input)[0];
		assertCondition(!!switchInput, "Switch input not found in list item");
		fireEvent.click(switchInput);
	}

	async clickFilterHeadline(labelText: string): Promise<void> {
		const headline = this.findFilterHeadline(labelText);
		assertCondition(!!headline, `Filter headline "${labelText}" not found`);
		await userEvent.click(headline);
	}

	async search(text: string): Promise<void> {
		const searchInput = this.searchInput;
		assertCondition(!!searchInput, "Search input not found");
		await userEvent.fill(searchInput, text);
	}

	async clearSearch(): Promise<void> {
		const searchInput = this.searchInput;
		assertCondition(!!searchInput, "Search input not found");
		await userEvent.clear(searchInput);
	}

	async fillFilterInput(index: number, text: string): Promise<void> {
		const input = this.textInputs[index];
		assertCondition(!!input, `Filter input at index ${index} not found`);
		await userEvent.fill(input, text);
		fireEvent.blur(input);
	}

	async toggleShowSearch(): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = this.findMenuItem(portal, "Show Search");
		assertCondition(!!item, "Show Search menu item not found");
		this.toggleSwitch(item);
		await this.closeSettingsMenu();
	}

	async expandAllFilters(): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = getByText(portal, "Expand All Filters");
		fireEvent.click(item);
		await this.closeSettingsMenu();
	}

	async collapseAllFilters(): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = getByText(portal, "Collapse All Filters");
		fireEvent.click(item);
		await this.closeSettingsMenu();
	}

	async toggleShowSetFiltersOnly(): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = this.findMenuItem(portal, "Show Set Filters Only");
		assertCondition(!!item, "Show Set Filters Only menu item not found");
		this.toggleSwitch(item);
		await this.closeSettingsMenu();
	}

	async selectJoinOperator(operator: "Any" | "All"): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = this.findMenuItem(portal, operator);
		assertCondition(!!item, `Join operator "${operator}" menu item not found`);
		await userEvent.click(item);
		await this.closeSettingsMenu();
	}

	async toggleInvert(): Promise<void> {
		const portal = await this.openSettingsMenu();
		const item = this.findMenuItem(portal, "Invert");
		assertCondition(!!item, "Invert menu item not found");
		await userEvent.click(item);
		await this.closeSettingsMenu();
	}

	async getSelectedJoinOperator(): Promise<"Any" | "All" | null> {
		const portal = await this.openSettingsMenu();
		const anyItem = this.findMenuItem(portal, "Any");
		const allItem = this.findMenuItem(portal, "All");

		let selected: "Any" | "All" | null = null;

		if (this.hasCheckMark(anyItem)) {
			selected = "Any";
		}

		if (this.hasCheckMark(allItem)) {
			selected = "All";
		}

		await this.closeSettingsMenu();

		return selected;
	}

	async isInvertEnabled(): Promise<boolean> {
		const portal = await this.openSettingsMenu();
		const item = this.findMenuItem(portal, "Invert");
		const hasCheck = this.hasCheckMark(item);
		await this.closeSettingsMenu();

		return hasCheck;
	}
}

async function setupTest(options: {
	filterConfiguration?: Partial<OverviewModel.NewFilterConfiguration>;
	filterGroups?: OverviewModel.NewFilter.Group[];
	locale?: Locale;
}) {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");

	const filterGroups = options.filterGroups ?? [
		{
			...baseFilterGroup,
			filterItems: [stringFilterItem, booleanFilterItem, numberFilterItem, enumerationFilterItem]
		}
	];

	const overviewModel = filterConfigurationLens.set({
		...baseFilterConfiguration,
		...options.filterConfiguration,
		filterGroups
	})(productOM);

	const renderResult = await renderWithStore(<FilterSelector />, {
		engineProps: { documentModel, overviewModel, data: [] },
		locale: options.locale
	});

	const page = new FilterSelectorPage(renderResult.container);

	return {
		documentModel,
		overviewModel,
		page,
		...renderResult
	};
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.filter-selector", () => {
	describe("Basic Rendering", () => {
		it("renders the filter selector with correct title", async () => {
			const { page } = await setupTest({});

			expect(page.title).toBeInTheDocument();
		});

		it("renders close button that triggers visibility change", async () => {
			const { page } = await setupTest({});

			expect(page.closeButton).toBeDefined();
			assertCondition(!!page.closeButton);

			await userEvent.click(page.closeButton);
			expect(page.title).toBeInTheDocument();
		});

		it("renders settings button in the header", async () => {
			const { page } = await setupTest({});

			expect(page.settingsButton).toBeInTheDocument();
		});

		it("renders footer with Reset All and Apply All buttons", async () => {
			const { page } = await setupTest({});

			expect(page.resetAllButton).toBeInTheDocument();
			expect(page.applyAllButton).toBeInTheDocument();
		});

		it("renders footer buttons with correct initial disabled states", async () => {
			const { page } = await setupTest({});

			expect(page.resetAllButton).toHaveAttribute("disabled");
		});

		it("does not render filter groups when filterGroups is empty", async () => {
			const { page } = await setupTest({
				filterGroups: []
			});

			expect(page.title).toBeInTheDocument();

			expect(page.headlineLabels.length).toBe(0);
		});

		it("renders header subtitle when headerSubtitle is configured", async () => {
			const { page, container } = await setupTest({
				filterConfiguration: {
					filterSelector: {
						...baseFilterConfiguration.filterSelector,
						headerSubtitle: [{ locale: "en", text: "Active products" }]
					}
				}
			});

			expect(page.title).toBeInTheDocument();
			expect(getByText(container, "Active products")).toBeInTheDocument();
		});

		it("does not render any header subtitle when headerSubtitle is omitted", async () => {
			const { page, container } = await setupTest({});

			expect(page.title).toBeInTheDocument();
			expect(queryByText(container, "Active products")).toBeNull();
		});

		it("does not show filter in selector when preferFilterBar is true", async () => {
			const preferFilterBarItem: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				preferFilterBar: true
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [preferFilterBarItem]
					}
				]
			});

			expect(page.hasFilterLabel("Name")).toBe(false);

			expect(page.hasFilterLabel("Test Group")).toBe(false);
		});
	});

	describe("Filter Groups Display", () => {
		it("renders filter groups with their labels", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						id: "group-1",
						name: "group-1",
						label: [{ locale: "en", text: "Basic Filters" }],
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.getFilterLabel("Basic Filters")).toBeInTheDocument();
		});

		it("renders filter items within their respective groups", async () => {
			const { page, container } = await setupTest({
				filterGroups: [
					{
						id: "group-1",
						name: "group-1",
						label: [{ locale: "en", text: "Text Filters" }],
						filterItems: [stringFilterItem]
					},
					{
						id: "group-2",
						name: "group-2",
						label: [{ locale: "en", text: "Number Filters" }],
						filterItems: [numberFilterItem]
					}
				]
			});

			await withFilterSection(container, "Text Filters", ({ body }) => {
				expect(body).toBeDefined();
				assertCondition(!!body);
				expect(page.hasFilterLabel(/Name/)).toBe(true);
			});

			await withFilterSection(container, "Number Filters", ({ body }) => {
				expect(body).toBeDefined();
				assertCondition(!!body);
				expect(page.hasFilterLabel(/Price/)).toBe(true);
			});
		});

		it("does not render empty filter groups", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						id: "group-empty",
						name: "group-empty",
						label: [{ locale: "en", text: "Empty Group" }],
						filterItems: []
					},
					{
						id: "group-with-filters",
						name: "group-with-filters",
						label: [{ locale: "en", text: "Active Group" }],
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel("Empty Group")).toBe(false);

			expect(page.hasFilterLabel("Active Group")).toBe(true);
		});

		it("renders items of a label-less group without a group headline", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						id: "group-no-label",
						name: "group-no-label",
						label: [],
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.findGroupHeadline("group-no-label")).toBeUndefined();
			expect(page.hasFilterLabel("Name")).toBe(true);
		});

		it("renders two label-less groups without empty headings", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{ id: "no-label-1", name: "no-label-1", label: [], filterItems: [stringFilterItem] },
					{ id: "no-label-2", name: "no-label-2", label: [], filterItems: [booleanFilterItem] }
				]
			});

			expect(page.headlineLabels.every((el) => el.textContent?.trim() !== "")).toBe(true);
			expect(page.hasFilterLabel("Name")).toBe(true);
			expect(page.hasFilterLabel("Available")).toBe(true);
		});

		it("renders multiple filter groups and filter items in correct order", async () => {
			const stringFilterItem2: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "string-filter-2",
				label: [{ locale: "en", text: "Description" }]
			};

			const numberFilterItem2: OverviewModel.NewFilter.Number.Item = {
				...numberFilterItem,
				id: "number-filter-2",
				label: [{ locale: "en", text: "Quantity" }]
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						id: "group-first",
						name: "group-first",
						label: [{ locale: "en", text: "First Group" }],
						filterItems: [stringFilterItem, stringFilterItem2]
					},
					{
						id: "group-second",
						name: "group-second",
						label: [{ locale: "en", text: "Second Group" }],
						filterItems: [numberFilterItem, numberFilterItem2, booleanFilterItem]
					}
				]
			});

			const allHeadlines = page.headlineLabels;

			expect(allHeadlines.length).toBe(7);
			expect(allHeadlines[0].textContent).toContain("First Group");
			expect(allHeadlines[1].textContent).toContain("Name");
			expect(allHeadlines[2].textContent).toContain("Description");
			expect(allHeadlines[3].textContent).toContain("Second Group");
			expect(allHeadlines[4].textContent).toContain("Price");
			expect(allHeadlines[5].textContent).toContain("Quantity");
			expect(allHeadlines[6].textContent).toContain("Available");
		});
	});

	describe("Filter Sections", () => {
		it("displays filter label for each section", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);
			expect(page.hasFilterLabel(/Available/)).toBe(true);
		});

		it("allows collapsing and expanding filter sections", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.textInputs.length).toBe(1);

			await page.clickFilterHeadline("Name");

			expect(page.textInputs.length).toBe(0);

			await page.clickFilterHeadline("Name");

			expect(page.textInputs.length).toBe(1);
		});

		it("respects initial collapsed state from filter model", async () => {
			const collapsedFilterItem: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				collapsed: true
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [collapsedFilterItem]
					}
				]
			});

			expect(page.textInputs.length).toBe(0);

			await page.clickFilterHeadline("Name");

			expect(page.textInputs.length).toBe(1);
		});

		it("shows badge on collapsed section when filter has value changed", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.fillFilterInput(0, "test value");

			await page.clickFilterHeadline("Name");

			expect(page.badges.length).toBe(1);
			expect(page.badges[0]?.getAttribute("title")).toBe("Filter is applied");
		});

		it("shows the German badge title on a collapsed section for the de locale", async () => {
			const localizedStringFilterItem: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				label: [
					{ locale: "en", text: "Name" },
					{ locale: "de", text: "Bezeichnung" }
				]
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [localizedStringFilterItem]
					}
				],
				locale: deLocale
			});

			await page.fillFilterInput(0, "test value");

			await page.clickFilterHeadline("Bezeichnung");

			expect(page.badges[0]?.getAttribute("title")).toBe("Filter ist angewendet");
		});

		it("shows reset button when filter has a value and resets filter on click", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			const filterResetButton = page.resetButtons.find((btn) => btn !== page.resetAllButton);
			assertCondition(!!filterResetButton);

			expect(filterResetButton.disabled).toBe(true);

			await page.fillFilterInput(0, "test value");
			expect(page.textInputs[0]?.value).toBe("test value");

			expect(filterResetButton.disabled).toBe(false);

			await userEvent.click(filterResetButton);

			expect(page.textInputs[0]?.value).toBe("");

			expect(filterResetButton.disabled).toBe(true);
		});

		it("shows settings button when filter has available settings", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.filterSettingsButtons.length).toBe(1);
		});
	});

	describe("Search Functionality", () => {
		it("hides search bar when searchBar option is disabled", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: false } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.searchInput).toBeUndefined();
		});

		it("shows search bar when searchBar option is enabled and active", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.searchInput).toBeDefined();
		});

		it("shows search bar when enabled via filter selector settings menu", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: false } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.searchInput).toBeUndefined();

			await page.toggleShowSearch();

			expect(page.searchInput).toBeDefined();
		});

		it("filters displayed filters based on search text", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);
			expect(page.hasFilterLabel(/Available/)).toBe(true);

			await page.search("Name");

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);
			expect(page.hasFilterLabel(/Available/)).toBe(false);
		});

		it("performs case-insensitive search", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			await page.search("name");

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);

			await page.clearSearch();
			await page.search("NAME");

			expect(page.hasFilterLabel(/Name/)).toBe(true);
		});

		it("shows all filters when search is cleared", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			await page.search("Name");

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);

			await page.clearSearch();

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);
			expect(page.hasFilterLabel(/Available/)).toBe(true);
		});
	});

	describe("Settings Menu", () => {
		describe("View Options", () => {
			it("toggles search bar visibility via settings", async () => {
				const { page } = await setupTest({
					filterConfiguration: {
						filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: false } }
					},
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				expect(page.searchInput).toBeUndefined();

				await page.toggleShowSearch();

				expect(page.searchInput).toBeDefined();

				await page.toggleShowSearch();

				expect(page.searchInput).toBeUndefined();
			});

			it("expands all filter sections when clicking Expand All", async () => {
				const collapsedFilter1: OverviewModel.NewFilter.String.Item = { ...stringFilterItem, collapsed: true };
				const collapsedFilter2: OverviewModel.NewFilter.Number.Item = { ...numberFilterItem, collapsed: true };

				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [collapsedFilter1, collapsedFilter2]
						}
					]
				});

				expect(page.textInputs.length).toBe(0);

				await page.expandAllFilters();

				expect(page.textInputs.length).toBeGreaterThan(0);
			});

			it("collapses all filter sections when clicking Collapse All", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem, numberFilterItem]
						}
					]
				});

				expect(page.textInputs.length).toBeGreaterThan(0);

				await page.collapseAllFilters();

				expect(page.textInputs.length).toBe(0);
			});

			it("shows only filters with values when Show Set Filters Only is enabled", async () => {
				const filterWithValue: OverviewModel.NewFilter.String.Item = {
					...stringFilterItem,
					options: { ...stringFilterItem.options, criteria: "test value" }
				};

				const { page } = await setupTest({
					filterConfiguration: {
						filterSelector: {
							...baseFilterConfiguration.filterSelector,
							showSetFiltersOnly: { enabled: true, value: false }
						}
					},
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [filterWithValue, numberFilterItem]
						}
					]
				});

				expect(page.hasFilterLabel(/Name/)).toBe(true);
				expect(page.hasFilterLabel(/Price/)).toBe(true);

				await page.toggleShowSetFiltersOnly();

				expect(page.hasFilterLabel(/Name/)).toBe(true);
				expect(page.hasFilterLabel(/Price/)).toBe(false);
			});
		});

		describe("Match Options", () => {
			it("toggles between AND and OR filter matching", async () => {
				const { page } = await setupTest({
					filterConfiguration: {
						joinOperator: { enabled: true, value: "and" }
					},
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				expect(await page.getSelectedJoinOperator()).toBe("All");

				await page.selectJoinOperator("Any");

				expect(await page.getSelectedJoinOperator()).toBe("Any");

				await page.selectJoinOperator("All");

				expect(await page.getSelectedJoinOperator()).toBe("All");
			});

			it("inverts the overall filter result when invert is enabled", async () => {
				const { page } = await setupTest({
					filterConfiguration: {
						invert: { enabled: true, value: false }
					},
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				expect(await page.isInvertEnabled()).toBe(false);

				await page.toggleInvert();

				expect(await page.isInvertEnabled()).toBe(true);

				await page.toggleInvert();

				expect(await page.isInvertEnabled()).toBe(false);
			});
		});
	});

	describe("Footer Actions", () => {
		describe("Reset All Button", () => {
			it("disables Reset All when no filters have been modified", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem, numberFilterItem]
						}
					]
				});

				expect(page.resetAllButton).toBeDefined();
				expect(page.resetAllButton?.disabled).toBe(true);
			});

			it("enables Reset All when a filter has been modified", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				expect(page.resetAllButton?.disabled).toBe(true);

				await page.fillFilterInput(0, "modified value");

				expect(page.resetAllButton?.disabled).toBe(false);
			});

			it("clears all filter values when Reset All is clicked", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				await page.fillFilterInput(0, "test value");

				expect(page.textInputs[0]?.value).toBe("test value");
				expect(page.resetAllButton?.disabled).toBe(false);

				const resetAllButton = page.resetAllButton;
				assertCondition(!!resetAllButton);
				await userEvent.click(resetAllButton);

				expect(page.textInputs[0]?.value).toBe("");

				expect(page.resetAllButton?.disabled).toBe(true);
			});
		});

		describe("Apply All Button", () => {
			it("enables Apply All when filters have been modified", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				await page.fillFilterInput(0, "new value");

				expect(page.applyAllButton?.disabled).toBe(false);
			});

			it("applies all pending filter changes when Apply All is clicked", async () => {
				const { page } = await setupTest({
					filterGroups: [
						{
							...baseFilterGroup,
							filterItems: [stringFilterItem]
						}
					]
				});

				await page.fillFilterInput(0, "applied value");

				expect(page.applyAllButton?.disabled).toBe(false);

				const applyAllButton = page.applyAllButton;
				assertCondition(!!applyAllButton);
				await userEvent.click(applyAllButton);

				expect(page.textInputs[0]?.value).toBe("applied value");
			});
		});
	});

	describe("Show Set Filters Only Mode", () => {
		it("shows only filters with values when mode is active", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test value" }
			};

			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: {
						...baseFilterConfiguration.filterSelector,
						showSetFiltersOnly: { enabled: true, value: false }
					}
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithValue, numberFilterItem, booleanFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);
			expect(page.hasFilterLabel(/Available/)).toBe(true);

			await page.toggleShowSetFiltersOnly();

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);
			expect(page.hasFilterLabel(/Available/)).toBe(false);
		});

		it("hides filters without values when mode is active", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: {
						...baseFilterConfiguration.filterSelector,
						showSetFiltersOnly: { enabled: true, value: true }
					}
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(false);
			expect(page.hasFilterLabel(/Price/)).toBe(false);
		});

		it("shows all filters when mode is disabled in configuration", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test value" }
			};

			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, showSetFiltersOnly: { enabled: false } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithValue, numberFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);

			const portal = await page.openSettingsMenu();
			expect(queryByText(portal, "Show Set Filters Only")).not.toBeInTheDocument();
			await page.closeSettingsMenu();
		});
	});

	describe("Filter Bar Overflow Sorting", () => {
		it('shows overflow filters at the top without group header when area is "filterSelector"', async () => {
			const filterBarFilter1: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "bar-filter-1",
				label: [{ locale: "en", text: "Bar Filter 1" }],
				preferFilterBar: true
			};

			const filterBarFilter2: OverviewModel.NewFilter.Number.Item = {
				...numberFilterItem,
				id: "bar-filter-2",
				label: [{ locale: "en", text: "Bar Filter 2" }],
				preferFilterBar: true
			};

			const regularFilter: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "regular-filter",
				label: [{ locale: "en", text: "Regular Filter" }]
			};

			const { page, store } = await setupTest({
				filterGroups: [
					{
						id: "group-1",
						name: "group-1",
						label: [{ locale: "en", text: "First Group" }],
						filterItems: [filterBarFilter1, regularFilter]
					},
					{
						id: "group-2",
						name: "group-2",
						label: [{ locale: "en", text: "Second Group" }],
						filterItems: [filterBarFilter2]
					}
				]
			});

			expect(page.hasFilterLabel(/Bar Filter 1/)).toBe(false);
			expect(page.hasFilterLabel(/Bar Filter 2/)).toBe(false);
			expect(page.hasFilterLabel(/Regular Filter/)).toBe(true);

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["bar-filter-1", "bar-filter-2"] }));

			await waitFor(() => {
				expect(page.hasFilterLabel(/Bar Filter 1/)).toBe(true);
			});

			expect(page.hasFilterLabel(/Bar Filter 1/)).toBe(true);
			expect(page.hasFilterLabel(/Bar Filter 2/)).toBe(true);
			expect(page.hasFilterLabel(/Regular Filter/)).toBe(true);

			const allHeadlines = page.headlineLabels;

			expect(allHeadlines[0].textContent).toContain("Bar Filter 1");
			expect(allHeadlines[1].textContent).toContain("Bar Filter 2");
			expect(allHeadlines[2].textContent).toContain("First Group");
			expect(allHeadlines[3].textContent).toContain("Regular Filter");

			expect(page.hasFilterLabel(/Second Group/)).toBe(false);
		});

		it("does not show overflow section when all preferFilterBar filters are shown in bar", async () => {
			const filterBarFilter: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "bar-filter",
				label: [{ locale: "en", text: "Bar Filter" }],
				preferFilterBar: true
			};

			const regularFilter: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "regular-filter",
				label: [{ locale: "en", text: "Regular Filter" }]
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						id: "group-1",
						name: "group-1",
						label: [{ locale: "en", text: "Test Group" }],
						filterItems: [filterBarFilter, regularFilter]
					}
				]
			});

			expect(page.hasFilterLabel(/Bar Filter/)).toBe(false);
			expect(page.hasFilterLabel(/Regular Filter/)).toBe(true);

			expect(page.hasFilterLabel(/Test Group/)).toBe(true);
		});
	});

	describe("Preset Filters in FS", () => {
		const barFilter: OverviewModel.NewFilter.String.Item = {
			...stringFilterItem,
			id: "bar-filter",
			label: [{ locale: "en", text: "Bar Filter" }],
			preferFilterBar: true,
			collapsed: true
		};

		const regularFilter: OverviewModel.NewFilter.Number.Item = {
			...numberFilterItem,
			id: "regular-filter",
			label: [{ locale: "en", text: "Regular Filter" }]
		};

		it("overflow filters are expanded even when model says collapsed", async () => {
			const { page, store } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [barFilter, regularFilter]
					}
				]
			});

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["bar-filter"] }));

			await waitFor(() => {
				expect(page.hasFilterLabel(/Bar Filter/)).toBe(true);
			});

			expect(page.textInputs.length).toBeGreaterThanOrEqual(1);
		});

		it("renders overflow filter alongside normal filters when bar overflows", async () => {
			const { page, store } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [barFilter, regularFilter]
					}
				]
			});

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["bar-filter"] }));

			await waitFor(() => {
				expect(page.hasFilterLabel(/Bar Filter/)).toBe(true);
			});

			expect(page.hasFilterLabel(/Regular Filter/)).toBe(true);
		});

		it("overflow filters are subject to search when search is active", async () => {
			const { page, store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [barFilter, regularFilter]
					}
				]
			});

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["bar-filter"] }));

			await waitFor(() => {
				expect(page.hasFilterLabel(/Bar Filter/)).toBe(true);
			});

			await page.search("Regular");

			expect(page.hasFilterLabel(/Bar Filter/)).toBe(false);
			expect(page.hasFilterLabel(/Regular Filter/)).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("displays error indicator for filters with validation errors", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [numberFilterItem]
					}
				]
			});

			const errorBadgesBefore = page.badges.filter((badge) => badge.classList.contains("error"));
			expect(errorBadgesBefore.length).toBe(0);

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];

			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await page.clickFilterHeadline("Price");

			const errorBadgesAfter = page.badges;
			expect(errorBadgesAfter.length).toBeGreaterThan(0);
			expect(errorBadgesAfter[0]?.getAttribute("title")).toBe("Filter has errors");
		});

		it("shows the German error badge title for the de locale", async () => {
			const localizedNumberFilterItem: OverviewModel.NewFilter.Number.Item = {
				...numberFilterItem,
				label: [
					{ locale: "en", text: "Price" },
					{ locale: "de", text: "Preis" }
				]
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [localizedNumberFilterItem]
					}
				],
				locale: deLocale
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];

			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await page.clickFilterHeadline("Preis");

			expect(page.badges[0]?.getAttribute("title")).toBe("Filter enthält Fehler");
		});

		it("blocks Apply All when any filter has validation errors", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [numberFilterItem]
					}
				]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];

			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			expect(page.applyAllButton?.disabled).toBe(true);
		});
	});

	describe("Initial Visibility Config", () => {
		it("respects initialVisibility 'show' config (renders with open: true)", async () => {
			const { store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);
		});

		it("respects initialVisibility 'hide' config (renders with open: false)", async () => {
			const { store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "hide" }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(false);
		});

		it("defaults to open: false when initialVisibility is not set", async () => {
			const { store } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(false);
		});
	});

	describe("Close via API", () => {
		it("programmatic close via newFilter.onFilterSelectorVisibilityChanged sets selectorOpen to false", async () => {
			const { store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(false);
		});
	});

	describe("Unapplied Data Reverts on Close", () => {
		it("reverts unapplied filter value when FS is closed without applying", async () => {
			const { page, store } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			await page.fillFilterInput(0, "unapplied value");
			expect(page.textInputs[0]?.value).toBe("unapplied value");

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			await waitFor(() => {
				expect(page.textInputs[0]?.value).toBe("");
			});
		});

		it("preserves applied filter value when FS is closed after applying", async () => {
			const { page, store } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			await page.fillFilterInput(0, "applied value");
			const applyAllButton = page.applyAllButton;
			assertCondition(!!applyAllButton);
			await userEvent.click(applyAllButton);

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			await waitFor(() => {
				expect(page.textInputs[0]?.value).toBe("applied value");
			});
		});
	});

	describe("Applied Data Persists Across Close/Reopen", () => {
		it("applied values are present after close and reopen", async () => {
			const { page, store } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			await page.fillFilterInput(0, "persistent value");
			const applyAllButton = page.applyAllButton;
			assertCondition(!!applyAllButton);
			await userEvent.click(applyAllButton);

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));
			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			await waitFor(() => {
				expect(page.textInputs[0]?.value).toBe("persistent value");
			});
		});
	});

	describe("Apply Does NOT Close the FS", () => {
		it("clicking Apply All keeps FS open", async () => {
			const { page, store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);

			await page.fillFilterInput(0, "test value");
			const applyAllButton = page.applyAllButton;
			assertCondition(!!applyAllButton);
			await userEvent.click(applyAllButton);

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);

			expect(page.applyAllButton).toBeInTheDocument();
			expect(page.resetAllButton).toBeInTheDocument();
		});
	});

	describe("Reset Applies Immediately", () => {
		it("clicking Reset All clears values and updates store immediately", async () => {
			const { page } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			await page.fillFilterInput(0, "to be reset");
			const applyAllButton = page.applyAllButton;
			assertCondition(!!applyAllButton);
			await userEvent.click(applyAllButton);

			const resetAllButton = page.resetAllButton;
			assertCondition(!!resetAllButton);
			await userEvent.click(resetAllButton);

			expect(page.textInputs[0]?.value).toBe("");

			expect(page.resetAllButton?.disabled).toBe(true);
		});
	});

	describe("Reset Does NOT Close the FS", () => {
		it("clicking Reset All keeps FS open", async () => {
			const { page, store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);

			await page.fillFilterInput(0, "test value");

			const resetAllButton = page.resetAllButton;
			assertCondition(!!resetAllButton);
			await userEvent.click(resetAllButton);

			expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);

			expect(page.applyAllButton).toBeInTheDocument();
			expect(page.resetAllButton).toBeInTheDocument();
		});
	});

	describe("User Preferences Persist Across Close/Reopen", () => {
		it("search bar visibility persists across close/reopen", async () => {
			const { page, store } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: false } }
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }]
			});

			expect(page.searchInput).toBeUndefined();

			await page.toggleShowSearch();
			expect(page.searchInput).toBeDefined();

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));
			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			expect(page.searchInput).toBeDefined();
		});

		it("Show Set Filters Only persists across close/reopen", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test" }
			};

			const { page, store } = await setupTest({
				filterConfiguration: {
					filterSelector: {
						...baseFilterConfiguration.filterSelector,
						showSetFiltersOnly: { enabled: true, value: false }
					}
				},
				filterGroups: [{ ...baseFilterGroup, filterItems: [filterWithValue, numberFilterItem] }]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);

			await page.toggleShowSetFiltersOnly();
			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);

			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));
			store.dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(false);
		});
	});

	describe("Search Text Resets on Close", () => {
		it("search text is cleared when FS is closed and reopened", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			await page.search("Name");
			expect(page.hasFilterLabel(/Price/)).toBe(false);

			await page.clearSearch();
			expect(page.hasFilterLabel(/Price/)).toBe(true);
		});
	});

	describe("Error Notification Banner", () => {
		it("shows error banner when validation errors exist", async () => {
			const { page, container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [numberFilterItem] }]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];
			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).toBeInTheDocument();
			});
		});
	});

	describe("Error Banner Disappears When Errors Corrected", () => {
		it("error banner disappears when validation errors are fixed", async () => {
			const { page, container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [numberFilterItem] }]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];
			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).toBeInTheDocument();
			});

			await userEvent.fill(fromInput, "5");
			fireEvent.blur(fromInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).not.toBeInTheDocument();
			});
		});
	});

	describe("Error Banner Closeable via X", () => {
		function findBannerCloseButton(container: HTMLElement): HTMLButtonElement | undefined {
			const bannerText = queryByText(container, "Some errors occur");

			if (!bannerText) {
				return undefined;
			}

			let ancestor: HTMLElement | null = bannerText.parentElement;

			while (ancestor && ancestor !== container) {
				const buttons = queryAllByDataRole<HTMLButtonElement>(ancestor, DataRoles.Button);
				const closeBtn = buttons.find((btn) => btn.textContent?.includes("close"));

				if (closeBtn) {
					return closeBtn;
				}

				ancestor = ancestor.parentElement;
			}

			return undefined;
		}

		it("error banner can be dismissed via close button", async () => {
			const { page, container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [numberFilterItem] }]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];
			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).toBeInTheDocument();
			});

			const bannerCloseButton = findBannerCloseButton(container);
			assertCondition(!!bannerCloseButton, "Banner close button not found");

			await userEvent.click(bannerCloseButton);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).not.toBeInTheDocument();
			});
		});

		it("error banner reappears when new error occurs after dismissal", async () => {
			const { page, container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [numberFilterItem] }]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];
			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).toBeInTheDocument();
			});

			const bannerCloseButton = findBannerCloseButton(container);
			assertCondition(!!bannerCloseButton);
			await userEvent.click(bannerCloseButton);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).not.toBeInTheDocument();
			});

			await userEvent.fill(fromInput, "5");
			fireEvent.blur(fromInput);

			await userEvent.fill(fromInput, "100");
			fireEvent.blur(fromInput);

			await waitFor(() => {
				expect(queryByText(container, "Some errors occur")).toBeInTheDocument();
			});
		});
	});

	describe("Apply Re-enables When Errors Corrected", () => {
		it("Apply All is disabled with errors and re-enables when errors are fixed", async () => {
			const { page } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [numberFilterItem] }]
			});

			const fromInput = page.textInputs[0];
			const toInput = page.textInputs[1];
			await userEvent.fill(fromInput, "20");
			fireEvent.blur(fromInput);
			await userEvent.fill(toInput, "10");
			fireEvent.blur(toInput);

			expect(page.applyAllButton?.disabled).toBe(true);

			await userEvent.fill(fromInput, "5");
			fireEvent.blur(fromInput);

			await waitFor(() => {
				expect(page.applyAllButton?.disabled).toBe(false);
			});
		});
	});

	describe("Empty Sections Hidden Including Headline", () => {
		it("group headline is hidden when all filters in group are preferFilterBar", async () => {
			const filterBarOnly: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "bar-only-filter",
				label: [{ locale: "en", text: "Bar Only" }],
				preferFilterBar: true
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						id: "hidden-group",
						name: "hidden-group",
						label: [{ locale: "en", text: "Hidden Group" }],
						filterItems: [filterBarOnly]
					},
					{
						id: "visible-group",
						name: "visible-group",
						label: [{ locale: "en", text: "Visible Group" }],
						filterItems: [booleanFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel("Hidden Group")).toBe(false);
			expect(page.hasFilterLabel("Bar Only")).toBe(false);

			expect(page.hasFilterLabel("Visible Group")).toBe(true);
			expect(page.hasFilterLabel(/Available/)).toBe(true);
		});

		it("group headline is hidden when search filters out all items in a group", async () => {
			const { page } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						id: "group-a",
						name: "group-a",
						label: [{ locale: "en", text: "Group A" }],
						filterItems: [stringFilterItem]
					},
					{
						id: "group-b",
						name: "group-b",
						label: [{ locale: "en", text: "Group B" }],
						filterItems: [numberFilterItem]
					}
				]
			});

			await page.search("Name");

			expect(page.hasFilterLabel("Group A")).toBe(true);
			expect(page.hasFilterLabel(/Name/)).toBe(true);

			expect(page.hasFilterLabel("Group B")).toBe(false);
			expect(page.hasFilterLabel(/Price/)).toBe(false);
		});
	});

	describe("Filter Order Stable After Setting Value", () => {
		it("filter order does not change after setting a filter value", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			const initialHeadlines = page.headlineLabels.map((el) => el.textContent);

			await page.fillFilterInput(0, "test value");

			const afterSetHeadlines = page.headlineLabels.map((el) => el.textContent);
			expect(afterSetHeadlines).toEqual(initialHeadlines);
		});

		it("filter order does not change after applying filter values", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem, booleanFilterItem]
					}
				]
			});

			const initialHeadlines = page.headlineLabels.map((el) => el.textContent);

			await page.fillFilterInput(0, "test value");
			const applyAllButton = page.applyAllButton;
			assertCondition(!!applyAllButton);
			await userEvent.click(applyAllButton);

			const afterApplyHeadlines = page.headlineLabels.map((el) => el.textContent);
			expect(afterApplyHeadlines).toEqual(initialHeadlines);
		});
	});

	describe("No Set Filters Message", () => {
		it("shows 'There are no set filters.' when Show Set Filters Only is active with no values", async () => {
			const { page, container } = await setupTest({
				filterConfiguration: {
					filterSelector: {
						...baseFilterConfiguration.filterSelector,
						showSetFiltersOnly: { enabled: true, value: false }
					}
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			await page.toggleShowSetFiltersOnly();

			expect(queryByText(container, "There are no set filters.")).toBeInTheDocument();
		});
	});

	describe("No Search Results Message", () => {
		it("shows 'No search results' message when search matches nothing", async () => {
			const { page, container } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, searchBar: { enabled: true, value: true } }
				},
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			await page.search("zzz_nonexistent_filter_zzz");

			expect(queryByText(container, "No search results. Try again with another query.")).toBeInTheDocument();
		});
	});

	describe("Filter Name as Group Label — A11y", () => {
		it("renders filter labels as collapsible headings", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
			expect(page.hasFilterLabel(/Price/)).toBe(true);
		});

		it("renders the filter name text in the heading", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.hasFilterLabel(/Name/)).toBe(true);
		});
	});
});
