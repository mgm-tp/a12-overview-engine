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

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { noop, DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import { NewFieldBasedFiltering } from "../../../../main/client-extensions/internal/utils/new-field-based-filtering.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { Events } from "../../../../main/store/index.js";
import { DefaultFilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import { FilterBar } from "../../../../main/view/components/new-filters/components/filter-bar.js";
import { FilterSelector } from "../../../../main/view/components/new-filters/components/filter-selector.js";
import { FilterFocusContext } from "../../../../main/view/context/filter-focus-context.js";
import { OverviewContentBoxContext } from "../../../../main/view/context/overview-content-box-context.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import {
	getByDataRole,
	findByDataRole,
	baseFilterGroup,
	renderWithStore,
	queryAllByDataRole,
	baseFilterConfiguration
} from "./setup.js";

const filterFocusContextValue: FilterFocusContext.Type = {
	registerRef: noop,
	onFocusedFilterChange: noop
};

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);

const stringFilterItem: OverviewModel.NewFilter.String.Item = {
	id: "string-filter-1",
	type: "string",
	label: [{ locale: "en", text: "Name" }],
	preferFilterBar: true,
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
	preferFilterBar: true,
	options: {
		fieldId: ProductFieldIds.inStock.id,
		empty: { enabled: false }
	}
};

const numberFilterItem: OverviewModel.NewFilter.Number.Item = {
	id: "number-filter-1",
	type: "number",
	label: [{ locale: "en", text: "Price" }],
	preferFilterBar: true,
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

class FilterBarPage {
	constructor(readonly container: HTMLElement) {}

	get buttons(): HTMLButtonElement[] {
		return queryAllByDataRole<HTMLButtonElement>(this.container, DataRoles.Button);
	}

	get textInputs(): HTMLInputElement[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.TextField.Input);
	}

	get resetButton(): HTMLButtonElement | undefined {
		return this.buttons.find((btn) => queryByText(btn, "replay"));
	}

	/** Filter Selector trigger button rendered inside the bar (default `filter_list` icon). */
	get triggerButton(): HTMLButtonElement | undefined {
		return this.buttons.find((btn) => queryByText(btn, "filter_list"));
	}

	/** Bar-level options/kebab menu trigger (the removed FilterBarSetting). */
	get optionsMenuButton(): HTMLButtonElement | undefined {
		return (
			queryAllByDataRole<HTMLButtonElement>(this.container, DataRoles.Popup.TriggerElement).find((btn) =>
				queryByText(btn, "more_vert")
			) ?? this.buttons.find((btn) => queryByText(btn, "more_vert"))
		);
	}

	get filterItems(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="faceted-search-filter"]'));
	}

	get filterPrefixes(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="filter-prefix"]'));
	}

	get filterNames(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="filter-name"]'));
	}

	get filterNameTexts(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="filter-name-text"]'));
	}

	get filterOptions(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="filter-options"]'));
	}

	get filters(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll('[data-role="filter"]'));
	}

	hasFilterItem(name: string): boolean {
		const hasNameText = this.filterNameTexts.some((el) => el.textContent?.includes(name));

		if (hasNameText) {
			return true;
		}

		return this.filterNames.some((el) => el.textContent?.includes(name));
	}

	getFilterItem(name: string): HTMLElement | null {
		let nameElement = this.filterNameTexts.find((el) => el.textContent?.includes(name));

		if (!nameElement) {
			nameElement = this.filterNames.find((el) => el.textContent?.includes(name));
		}

		if (!nameElement) {
			return null;
		}

		return nameElement.closest('[data-role="filter"]');
	}

	getFilterPrefix(name: string): HTMLElement | null {
		const filterItem = this.getFilterItem(name);

		if (!filterItem) {
			return null;
		}

		return filterItem.querySelector('[data-role="filter-prefix"]');
	}

	getFilterOptions(name: string): HTMLElement | null {
		const filterItem = this.getFilterItem(name);

		if (!filterItem) {
			return null;
		}

		return filterItem.querySelector('[data-role="filter-options"]');
	}

	getFilterByPrefix(prefix: string): HTMLElement | null {
		const prefixElement = this.filterPrefixes.find((el) => el.textContent === prefix);

		if (!prefixElement) {
			return null;
		}

		return prefixElement.closest('[data-role="filter"]');
	}

	async findDropdown(): Promise<HTMLElement | null> {
		try {
			return await findByDataRole(this.container, DataRoles.AttachedPortal);
		} catch {
			return null;
		}
	}

	get isDropdownVisible(): boolean {
		return queryAllByDataRole(this.container, DataRoles.AttachedPortal).length > 0;
	}

	getDropdownResetButton(dropdown: HTMLElement): HTMLButtonElement | null {
		return getByText(dropdown, "Reset").closest("button");
	}

	getDropdownApplyButton(dropdown: HTMLElement): HTMLButtonElement | null {
		return getByText(dropdown, "Apply").closest("button");
	}

	getDropdownSettingsButton(dropdown: HTMLElement): HTMLButtonElement | undefined {
		const buttons = queryAllByDataRole<HTMLButtonElement>(dropdown, DataRoles.Button);

		return buttons.find((btn) => queryByText(btn, "build"));
	}

	async clickFilterItem(name: string): Promise<void> {
		const item = this.getFilterItem(name);
		assertCondition(!!item, `Filter item "${name}" not found`);
		await userEvent.click(item);
	}

	async clickFilterByPrefix(prefix: string): Promise<void> {
		const item = this.getFilterByPrefix(prefix);
		assertCondition(!!item, `Filter item with prefix "${prefix}" not found`);
		await userEvent.click(item);
	}

	async clickReset(): Promise<void> {
		const resetBtn = this.resetButton;
		assertCondition(!!resetBtn, "Reset button not found");
		fireEvent.click(resetBtn);
	}

	async closeDropdown(): Promise<void> {
		fireEvent.mouseDown(this.container);
		fireEvent.mouseUp(this.container);
		fireEvent.click(this.container);
		await waitFor(() => {
			expect(queryAllByDataRole(this.container, DataRoles.AttachedPortal).length).toBe(0);
		});
	}

	async fillDropdownInput(dropdown: HTMLElement, index: number, text: string): Promise<void> {
		const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
		const input = inputs[index];
		assertCondition(!!input, `Input at index ${index} not found in dropdown`);
		await userEvent.fill(input, text);
		fireEvent.blur(input);
	}
}

async function setupTest(options: {
	filterGroups: OverviewModel.NewFilter.Group[];
	filterConfiguration?: Partial<typeof baseFilterConfiguration>;
}) {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const ProductOM = await getOverviewModel("product", "ProductOM");

	const overviewModel = filterConfigurationLens.set({
		...baseFilterConfiguration,
		...options.filterConfiguration,
		filterGroups: options.filterGroups
	})(ProductOM);

	const contentBoxContextValue: OverviewContentBoxContext.Type = {
		showFilterSelector: false,
		showMobileFilterBar: false,
		showMobileSearchBar: false,
		setShowMobileSearchBar: noop,
		toggleMobileFilterBar: noop,
		onFilterSelectorVisibilityChange: noop,
		getTriggerElementRef: noop
	};

	const renderResult = await renderWithStore(
		<FilterFocusContext.Provider value={filterFocusContextValue}>
			<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
				<FilterBar />
			</OverviewContentBoxContext.Provider>
		</FilterFocusContext.Provider>,
		{ engineProps: { documentModel, overviewModel, data: [] } }
	);

	const page = new FilterBarPage(renderResult.container);

	return {
		documentModel,
		overviewModel,
		page,
		...renderResult
	};
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.filter-bar", () => {
	describe("Basic Rendering", () => {
		it("renders filter bar with filter items that have preferFilterBar: true", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, booleanFilterItem]
					}
				]
			});

			expect(page.filters.length).toBe(2);

			expect(page.filterPrefixes.length).toBe(2);
			expect(page.filterPrefixes[0]?.textContent).toBe("N");
			expect(page.filterPrefixes[1]?.textContent).toBe("A");

			expect(page.hasFilterItem("Available")).toBe(true);
		});

		it("renders no chips when no filters have preferFilterBar: true", async () => {
			const filterWithoutBarEnabled: OverviewModel.NewFilter.String.Item = {
				id: "string-filter-no-bar",
				type: "string",
				label: [{ locale: "en", text: "Description" }],
				options: {
					fieldId: ProductFieldIds.name.id,
					empty: { enabled: true, value: false },
					caseSensitive: { enabled: true, value: false },
					exactMatch: { enabled: true, value: false },
					invert: { enabled: true, value: false }
				}
			};

			const { page, container } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithoutBarEnabled]
					}
				]
			});

			expect(container.textContent).not.toContain("Description");
			expect(page.hasFilterItem("Description")).toBe(false);
		});

		it("renders reset button", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.resetButton).toBeDefined();
		});

		it("renders the filter selector trigger button by default", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.triggerButton).toBeDefined();
		});

		it("does not render the trigger button when a custom trigger is configured (trigger.enabled: false)", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				],
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, trigger: { enabled: false } }
				}
			});

			expect(page.triggerButton).toBeUndefined();
			// Reset button still renders — only the trigger is suppressed.
			expect(page.resetButton).toBeDefined();
		});

		it("renders no options/kebab menu, even when joinOperator and invert are enabled", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				],
				filterConfiguration: {
					joinOperator: { enabled: true, value: "and" },
					invert: { enabled: true, value: false }
				}
			});

			expect(page.optionsMenuButton).toBeUndefined();
		});

		it("reset button is disabled when no filters have values differ to the initial values", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.resetButton?.disabled).toBe(true);
		});
	});

	describe("Filter Bar Items Display", () => {
		it("displays filter items with their labels, respect to the locale", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [booleanFilterItem] // "Available" label in en locale
					}
				]
			});

			expect(page.hasFilterItem("Available")).toBe(true);
		});

		it("displays filter item with icon when configured", async () => {
			const filterWithIcon: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				icon: { name: "search", theme: "outlined" }
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithIcon]
					}
				]
			});

			const prefix = page.filterPrefixes[0];
			expect(prefix).toBeDefined();
			expect(prefix?.textContent).toContain("search");
		});

		it("displays filter item with first letter of label when no icon configured", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem] // "Name" label, no icon
					}
				]
			});

			const prefix = page.filterPrefixes[0];
			expect(prefix).toBeDefined();
			expect(prefix?.textContent).toBe("N");
		});

		it("shows filter name in the filter item when filter has no value", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [booleanFilterItem] // No initial value
					}
				]
			});

			expect(page.filterNames.length).toBe(1);
			expect(page.hasFilterItem("Available")).toBe(true);

			const options = page.getFilterOptions("Available");
			expect(options).toBeNull();
		});

		it("shows filter value in the filter item when filter has a value and not show the filter name, the name will be the title", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: {
					...stringFilterItem.options,
					criteria: "test search"
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithValue]
					}
				]
			});

			const options = page.filterOptions[0];
			expect(options).toBeDefined();
			expect(options?.textContent).toContain("test search");

			expect(page.filterNames.length).toBe(0);
		});

		it("marks filter item as active when it has a value", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: {
					...stringFilterItem.options,
					criteria: "active filter"
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithValue]
					}
				]
			});

			const filterItem = page.filters[0];
			expect(filterItem).toBeDefined();

			expect(filterItem?.classList.contains("filter--active")).toBe(true);
		});
	});

	describe("Filter Dropdown Interaction", () => {
		it("opens dropdown when filter item is clicked", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.isDropdownVisible).toBe(false);

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			expect(dropdown).not.toBeNull();
		});

		it("displays filter label as dropdown title", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem] // Label is "Name"
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			expect(dropdown.textContent).toContain("Name");
		});

		it("displays filter editor in dropdown", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs.length).toBeGreaterThan(0);
		});

		it("closes dropdown when clicking outside", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			expect(dropdown).not.toBeNull();

			await page.closeDropdown();

			expect(page.isDropdownVisible).toBe(false);
		});

		it("closes dropdown when pressing Escape", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			expect(dropdown).not.toBeNull();

			await userEvent.keyboard("{Escape}");

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});
		});

		it("does not persist changes when dropdown is closed without applying", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "unsaved changes");

			await page.closeDropdown();

			await page.clickFilterByPrefix("N");

			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs[0]?.value).toBe("");
		});
	});

	describe("Dropdown Footer Actions", () => {
		it("shows Reset and Apply buttons in dropdown footer", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			expect(dropdown).not.toBeNull();
			assertCondition(!!dropdown);

			const resetButton = page.getDropdownResetButton(dropdown);
			const applyButton = page.getDropdownApplyButton(dropdown);

			expect(resetButton).not.toBeNull();
			expect(applyButton).not.toBeNull();
		});

		it("Reset button is disabled when filter value is not different from initial value (the initial value can be not empty)", async () => {
			const filterWithInitialValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: {
					...stringFilterItem.options,
					criteria: "initial value"
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithInitialValue]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const resetButton = page.getDropdownResetButton(dropdown);
			expect(resetButton?.disabled).toBe(true);
		});

		it("Reset button resets filter value to initial value when clicked", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem] // No initial value
					}
				]
			});

			await page.clickFilterByPrefix("N");

			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "changed value");

			let resetButton = page.getDropdownResetButton(dropdown);
			expect(resetButton?.disabled).toBe(false);
			assertCondition(!!resetButton);

			await userEvent.click(resetButton);

			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);
			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs[0]?.value).toBe("");

			resetButton = page.getDropdownResetButton(dropdown);
			expect(resetButton?.disabled).toBe(true);
		});

		it("Apply button is disabled when no changes made compare to the last time applied", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const applyButton = page.getDropdownApplyButton(dropdown);
			expect(applyButton?.disabled).toBe(true);
		});

		it("Apply button becomes enabled when filter value changes", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			let applyButton = page.getDropdownApplyButton(dropdown);
			expect(applyButton?.disabled).toBe(true);

			await page.fillDropdownInput(dropdown, 0, "new value");

			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);
			applyButton = page.getDropdownApplyButton(dropdown);
			expect(applyButton?.disabled).toBe(false);
		});

		it("disables Apply buttons when number filter has 'from' value larger than 'to' value", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [numberFilterItem] // Label is "Price"
					}
				]
			});

			await page.clickFilterByPrefix("P");

			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "100"); // from input
			await page.fillDropdownInput(dropdown, 1, "50"); // to input

			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const resetButton = page.getDropdownResetButton(dropdown);
			const applyButton = page.getDropdownApplyButton(dropdown);

			expect(resetButton?.disabled).toBe(false);
			expect(applyButton?.disabled).toBe(true);

			const errorText = getByDataRole(dropdown, DataRoles.Error.Text);
			expect(errorText.textContent).toMatchInlineSnapshot(`"The start value must not be bigger than the end value."`);
		});

		it("disables Apply button when number filter has invalid number input", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [numberFilterItem] // Label is "Price"
					}
				]
			});

			await page.clickFilterByPrefix("P");

			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "abc"); // invalid number

			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const resetButton = page.getDropdownResetButton(dropdown);
			const applyButton = page.getDropdownApplyButton(dropdown);

			expect(resetButton?.disabled).toBe(false);
			expect(applyButton?.disabled).toBe(true);

			const errorText = getByDataRole(dropdown, DataRoles.Error.Text);
			expect(errorText.textContent).toMatchInlineSnapshot(`"Only numbers are allowed."`);
		});
	});

	describe("Filter Settings in Dropdown", () => {
		it("shows settings button when filter has available settings", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const settingsButton = page.getDropdownSettingsButton(dropdown);
			expect(settingsButton).toBeDefined();
		});

		it("does not show settings button when filter has no settings", async () => {
			const stringWithoutSettings: OverviewModel.NewFilter.String.Item = {
				id: "string-no-settings",
				type: "string",
				label: [{ locale: "en", text: "Simple" }],
				preferFilterBar: true,
				options: {
					empty: { enabled: false },
					fieldId: ProductFieldIds.name.id,
					caseSensitive: { enabled: false },
					exactMatch: { enabled: false },
					invert: { enabled: false }
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringWithoutSettings]
					}
				]
			});

			await page.clickFilterByPrefix("S");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const settingsButton = page.getDropdownSettingsButton(dropdown);
			expect(settingsButton).toBeUndefined();
		});

		it("transitions to config view when settings button is clicked", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");

			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputsBefore = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputsBefore.length).toBeGreaterThan(0);

			const settingsButton = page.getDropdownSettingsButton(dropdown);
			assertCondition(!!settingsButton);
			await userEvent.click(settingsButton);

			await waitFor(() => {
				const backButton = queryAllByDataRole<HTMLButtonElement>(dropdown, DataRoles.Button).find((btn) =>
					queryByText(btn, "chevron_left")
				);
				expect(backButton).toBeDefined();
			});

			const backButton = queryAllByDataRole<HTMLButtonElement>(dropdown, DataRoles.Button).find((btn) =>
				queryByText(btn, "chevron_left")
			);
			assertCondition(!!backButton, "Back button not found");
			await userEvent.click(backButton);

			await waitFor(() => {
				const settingsBtn = page.getDropdownSettingsButton(dropdown);
				expect(settingsBtn).toBeDefined();
			});
		});
	});

	describe("Reset All Functionality", () => {
		it("reset button becomes enabled when a filter has a value different from initial", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.resetButton?.disabled).toBe(true);

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.resetButton?.disabled).toBe(false);
		});

		it("reset button resets all filter bar filters when clicked", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterOptions[0]?.textContent).toContain("test value");

			await page.clickReset();

			await waitFor(() => {
				expect(page.filterOptions.length).toBe(0);
			});
		});

		it("reset button becomes disabled after resetting all filters", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.resetButton?.disabled).toBe(false);

			await page.clickReset();

			await waitFor(() => {
				expect(page.resetButton?.disabled).toBe(true);
			});
		});
	});

	describe("Filter State Synchronization", () => {
		it("filter bar reflects changes made in filter dropdown after apply", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.filterNames.length).toBe(1);

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "applied value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterOptions[0]?.textContent).toContain("applied value");

			expect(page.filters[0]?.classList.contains("filter--active")).toBe(true);
		});

		it("changes in dropdown are discarded when closed without applying", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "unsaved value");

			await userEvent.keyboard("{Escape}");

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterNames.length).toBe(1);
			expect(page.filterOptions.length).toBe(0);

			await page.clickFilterByPrefix("N");
			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs[0]?.value).toBe("");
		});

		it("filter order in bar remains stable after setting a value", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, booleanFilterItem, numberFilterItem]
					}
				]
			});

			expect(page.filterPrefixes[0]?.textContent).toBe("N");
			expect(page.filterPrefixes[1]?.textContent).toBe("A");
			expect(page.filterPrefixes[2]?.textContent).toBe("P");

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterPrefixes[0]?.textContent).toBe("N");
			expect(page.filterPrefixes[1]?.textContent).toBe("A");
			expect(page.filterPrefixes[2]?.textContent).toBe("P");
		});

		it("filter dropdown reflects initial filter values from model", async () => {
			const filterWithInitialValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: {
					...stringFilterItem.options,
					criteria: "initial value"
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithInitialValue]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs[0]?.value).toBe("initial value");
		});
	});

	describe("No Badges on Bar Filters", () => {
		it("filter bar items do not render badges (no error or info badge)", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, booleanFilterItem]
					}
				]
			});

			const badges = page.container.querySelectorAll('[data-role="badge"]');
			expect(badges.length).toBe(0);
		});

		it("filter bar items do not show badges even when filter has a value", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: {
					...stringFilterItem.options,
					criteria: "some value"
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [filterWithValue]
					}
				]
			});

			const badges = page.container.querySelectorAll('[data-role="badge"]');
			expect(badges.length).toBe(0);
		});
	});

	describe("Reset All in Bar", () => {
		it("reset all applies the change immediately (filter state is updated)", async () => {
			const { page, store } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, numberFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterOptions.length).toBeGreaterThan(0);

			await page.clickReset();

			await waitFor(() => {
				const state = store.getState();
				const filters = Object.values(state.newFilter?.filters ?? {});
				const barFilters = filters.filter((f) => f.model.preferFilterBar);

				for (const filter of barFilters) {
					if (filter.model.type === "string") {
						expect((filter.options as { criteria?: { value?: string } }).criteria?.value).toBeFalsy();
					}
				}
			});
		});

		it("reset button is visible only when at least one bar filter differs from initial value", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			expect(page.resetButton?.disabled).toBe(true);

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.resetButton?.disabled).toBe(false);
		});
	});

	describe("Drop-Down Closes on Apply", () => {
		it("clicking Apply in bar drop-down closes the drop-down", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "test");
			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});
		});

		it("filter value is applied before closing", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "applied text");
			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			expect(page.filterOptions[0]?.textContent).toContain("applied text");
		});
	});

	describe("Drop-Down Toggle on Filter Click", () => {
		it("clicking same filter item again closes the drop-down", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			expect(page.isDropdownVisible).toBe(true);

			await page.clickFilterByPrefix("N");
			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});
		});

		it("clicking different filter item switches the drop-down", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [stringFilterItem, booleanFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("N");
			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			expect(inputs.length).toBeGreaterThan(0);

			await page.clickFilterByPrefix("A");
			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			expect(dropdown.textContent).toContain("Available");
		});
	});

	describe("Combination — No Duplicate Filters", () => {
		const barFilter: OverviewModel.NewFilter.String.Item = {
			...stringFilterItem,
			id: "bar-only-filter",
			label: [{ locale: "en", text: "BarOnly" }],
			preferFilterBar: true
		};

		const selectorFilter: OverviewModel.NewFilter.String.Item = {
			id: "selector-only-filter",
			type: "string",
			label: [{ locale: "en", text: "SelectorOnly" }],
			options: {
				fieldId: ProductFieldIds.name.id,
				empty: { enabled: false },
				caseSensitive: { enabled: false },
				exactMatch: { enabled: false },
				invert: { enabled: false }
			}
		};

		async function setupCombinedTest(filterGroups: OverviewModel.NewFilter.Group[]) {
			const documentModel = await getDocumentModel("product", "ProductDM");
			const productOM = await getOverviewModel("product", "ProductOM");
			const overviewModel = filterConfigurationLens.set({
				...baseFilterConfiguration,
				filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" },
				filterGroups
			})(productOM);

			const contentBoxContextValue: OverviewContentBoxContext.Type = {
				showFilterSelector: false,
				showMobileFilterBar: false,
				showMobileSearchBar: false,
				setShowMobileSearchBar: noop,
				toggleMobileFilterBar: noop,
				onFilterSelectorVisibilityChange: noop,
				getTriggerElementRef: noop
			};

			const renderResult = await renderWithStore(
				<FilterFocusContext.Provider value={filterFocusContextValue}>
					<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
						<FilterBar />
						<FilterSelector />
					</OverviewContentBoxContext.Provider>
				</FilterFocusContext.Provider>,
				{ engineProps: { documentModel, overviewModel, data: [] } }
			);

			const page = new FilterBarPage(renderResult.container);

			return { page, ...renderResult };
		}

		it("bar filter shown in bar does not appear in selector normal groups", async () => {
			const { container, store } = await setupCombinedTest([
				{
					...baseFilterGroup,
					filterItems: [barFilter, selectorFilter]
				}
			]);

			store.dispatch(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

			await waitFor(() => {
				const headlines = queryAllByDataRole(container, "typography-headline");
				const headlineTexts = headlines.map((el) => el.textContent);

				expect(headlineTexts.some((t) => t?.includes("SelectorOnly"))).toBe(true);

				expect(headlineTexts.some((t) => t?.includes("BarOnly"))).toBe(false);
			});
		});

		it("selector filter does not appear in the filter bar", async () => {
			const { page } = await setupCombinedTest([
				{
					...baseFilterGroup,
					filterItems: [barFilter, selectorFilter]
				}
			]);

			expect(page.hasFilterItem("BarOnly")).toBe(true);
			expect(page.hasFilterItem("SelectorOnly")).toBe(false);
		});
	});

	describe("Combination — Apply Scope", () => {
		const barStringFilter: OverviewModel.NewFilter.String.Item = {
			...stringFilterItem,
			id: "bar-string",
			label: [{ locale: "en", text: "BarString" }],
			preferFilterBar: true
		};

		const selectorStringFilter: OverviewModel.NewFilter.String.Item = {
			id: "selector-string",
			type: "string",
			label: [{ locale: "en", text: "SelectorString" }],
			options: {
				fieldId: ProductFieldIds.name.id,
				empty: { enabled: false },
				caseSensitive: { enabled: false },
				exactMatch: { enabled: false },
				invert: { enabled: false }
			}
		};

		it("bar drop-down apply affects only that single filter", async () => {
			const documentModel = await getDocumentModel("product", "ProductDM");
			const productOM = await getOverviewModel("product", "ProductOM");
			const overviewModel = filterConfigurationLens.set({
				...baseFilterConfiguration,
				filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" },
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [barStringFilter, selectorStringFilter]
					}
				]
			})(productOM);

			const contentBoxContextValue: OverviewContentBoxContext.Type = {
				showFilterSelector: false,
				showMobileFilterBar: false,
				showMobileSearchBar: false,
				setShowMobileSearchBar: noop,
				toggleMobileFilterBar: noop,
				onFilterSelectorVisibilityChange: noop,
				getTriggerElementRef: noop
			};

			const { container, store } = await renderWithStore(
				<FilterFocusContext.Provider value={filterFocusContextValue}>
					<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
						<FilterBar />
						<FilterSelector />
					</OverviewContentBoxContext.Provider>
				</FilterFocusContext.Provider>,
				{ engineProps: { documentModel, overviewModel, data: [] } }
			);

			const page = new FilterBarPage(container);

			await page.clickFilterByPrefix("B");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "bar value");

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			const state = store.getState();
			const barFilterOpts = state.newFilter?.filters["bar-string"]?.options;
			const selectorFilterOpts = state.newFilter?.filters["selector-string"]?.options;

			expect((barFilterOpts as { criteria?: { value?: string } })?.criteria?.value).toBe("bar value");
			expect((selectorFilterOpts as { criteria?: { value?: string } })?.criteria?.value).toBeFalsy();
		});
	});

	describe("Combination — Reset Scope", () => {
		it("bar reset does not reset selector filters", async () => {
			const barStringFilter: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				id: "bar-str",
				label: [{ locale: "en", text: "BarStr" }],
				preferFilterBar: true
			};

			const selectorStringFilter: OverviewModel.NewFilter.String.Item = {
				id: "sel-str",
				type: "string",
				label: [{ locale: "en", text: "SelStr" }],
				options: {
					fieldId: ProductFieldIds.name.id,
					empty: { enabled: false },
					caseSensitive: { enabled: false },
					exactMatch: { enabled: false },
					invert: { enabled: false },
					criteria: "selector initial"
				}
			};

			const documentModel = await getDocumentModel("product", "ProductDM");
			const productOM = await getOverviewModel("product", "ProductOM");
			const overviewModel = filterConfigurationLens.set({
				...baseFilterConfiguration,
				filterSelector: { ...baseFilterConfiguration.filterSelector, initialVisibility: "show" },
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [barStringFilter, selectorStringFilter]
					}
				]
			})(productOM);

			const contentBoxContextValue: OverviewContentBoxContext.Type = {
				showFilterSelector: false,
				showMobileFilterBar: false,
				showMobileSearchBar: false,
				setShowMobileSearchBar: noop,
				toggleMobileFilterBar: noop,
				onFilterSelectorVisibilityChange: noop,
				getTriggerElementRef: noop
			};

			const { container, store } = await renderWithStore(
				<FilterFocusContext.Provider value={filterFocusContextValue}>
					<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
						<FilterBar />
						<FilterSelector />
					</OverviewContentBoxContext.Provider>
				</FilterFocusContext.Provider>,
				{ engineProps: { documentModel, overviewModel, data: [] } }
			);

			const page = new FilterBarPage(container);

			await page.clickFilterByPrefix("B");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "bar value");
			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			await page.clickReset();

			await waitFor(() => {
				const state = store.getState();
				const barFilterOpts = state.newFilter?.filters["bar-str"]?.options;
				expect((barFilterOpts as { criteria?: { value?: string } })?.criteria?.value).toBeFalsy();
			});

			const state = store.getState();
			const selFilterOpts = state.newFilter?.filters["sel-str"]?.options;
			expect((selFilterOpts as { criteria?: { value?: string } })?.criteria?.value).toBe("selector initial");
		});

		it("bar drop-down reset resets only that single filter", async () => {
			const { page, store } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [
							{ ...stringFilterItem, id: "str-1", label: [{ locale: "en", text: "First" }] },
							{
								...stringFilterItem,
								id: "str-2",
								label: [{ locale: "en", text: "Second" }],
								options: { ...stringFilterItem.options, criteria: "initial-2" }
							}
						]
					}
				]
			});

			await page.clickFilterByPrefix("F");
			let dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "value-1");
			let applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			await page.clickFilterByPrefix("S");
			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			await page.fillDropdownInput(dropdown, 0, "value-2");
			applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			await page.clickFilterByPrefix("F");
			dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const resetButton = page.getDropdownResetButton(dropdown);
			assertCondition(!!resetButton);
			await userEvent.click(resetButton);

			applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			const state = store.getState();
			const opts1 = state.newFilter?.filters["str-1"]?.options;
			const opts2 = state.newFilter?.filters["str-2"]?.options;
			expect((opts1 as { criteria?: { value?: string } })?.criteria?.value).toBeFalsy();
			expect((opts2 as { criteria?: { value?: string } })?.criteria?.value).toBe("value-2");
		});
	});

	describe("Display Value Formatting", () => {
		it("number range displays with proper spacing", async () => {
			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [numberFilterItem]
					}
				]
			});

			await page.clickFilterByPrefix("P");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			assertCondition(inputs.length >= 2, "Expected at least 2 inputs for range");

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 2) above
			await userEvent.fill(inputs[0]!, "35");
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 2) above
			fireEvent.blur(inputs[0]!);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 2) above
			await userEvent.fill(inputs[1]!, "160");
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 2) above
			fireEvent.blur(inputs[1]!);

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			const displayValue = page.filterOptions[0]?.textContent;
			expect(displayValue).toContain("35 - 160");
		});

		it("number from-only displays with proper spacing", async () => {
			const fromOnlyNumberFilter: OverviewModel.NewFilter.Number.Item = {
				...numberFilterItem,
				options: {
					...numberFilterItem.options,
					ranges: [
						{ option: "fromOnly", default: true, enabled: true },
						{ option: "fromTo", enabled: true },
						{ option: "toOnly", enabled: true },
						{ option: "exact", enabled: true }
					]
				}
			};

			const { page } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [fromOnlyNumberFilter]
					}
				]
			});

			await page.clickFilterByPrefix("P");
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);

			const inputs = queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input);
			assertCondition(inputs.length >= 1, "Expected at least 1 input");

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 1) above
			await userEvent.fill(inputs[0]!, "150");
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertCondition(inputs.length >= 1) above
			fireEvent.blur(inputs[0]!);

			const applyButton = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyButton);
			await userEvent.click(applyButton);

			await waitFor(() => {
				expect(page.isDropdownVisible).toBe(false);
			});

			const displayValue = page.filterOptions[0]?.textContent;
			expect(displayValue).toContain("≥");
			expect(displayValue).toContain("150");
		});
	});

	describe("Shared global invert / joinOperator (applied to all filters)", () => {
		async function applyFilterValue(page: FilterBarPage, name: string, value: string): Promise<void> {
			await page.clickFilterItem(name);
			const dropdown = await page.findDropdown();
			assertCondition(!!dropdown);
			await page.fillDropdownInput(dropdown, 0, value);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- fillDropdownInput above guarantees input exists
			fireEvent.blur(queryAllByDataRole<HTMLInputElement>(dropdown, DataRoles.TextField.Input)[0]!);
			const applyBtn = page.getDropdownApplyButton(dropdown);
			assertCondition(!!applyBtn);
			await userEvent.click(applyBtn);
			await waitFor(() => expect(page.isDropdownVisible).toBe(false));
		}

		function getQueryOperators(result: Awaited<ReturnType<typeof setupTest>>): Query.Operator[] {
			const filterState = result.store.getState().newFilter;
			assertCondition(!!filterState);

			const operator = NewFieldBasedFiltering.toOperator(
				filterState,
				{ documentModel: result.documentModel, overviewModel: result.overviewModel },
				DefaultFilterStateSelectors
			);

			return operator ? [operator] : [];
		}

		it("joins filters with AND in the query payload by default", async () => {
			const result = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem, numberFilterItem] }],
				filterConfiguration: { joinOperator: { enabled: true, value: "and" } }
			});

			await applyFilterValue(result.page, "Name", "hello");
			await applyFilterValue(result.page, "Price", "100");

			const operators = getQueryOperators(result);
			expect(operators).toHaveLength(1);
			expect(operators[0].operator).toBe(Query.OPERATORS.AND_OPERATOR);
			expect((operators[0] as Query.AndOperator).operands).toHaveLength(2);
		});

		it("joins filters with OR in the query payload when joinOperator is OR", async () => {
			const result = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem, numberFilterItem] }],
				filterConfiguration: { joinOperator: { enabled: true, value: "or" } }
			});

			await applyFilterValue(result.page, "Name", "hello");
			await applyFilterValue(result.page, "Price", "100");

			const operators = getQueryOperators(result);
			expect(operators).toHaveLength(1);
			expect(operators[0].operator).toBe(Query.OPERATORS.OR_OPERATOR);
			expect((operators[0] as Query.OrOperator).operands).toHaveLength(2);
		});

		it("wraps the combined result with NOT when invert is active", async () => {
			const result = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [stringFilterItem] }],
				filterConfiguration: { invert: { enabled: true, value: true } }
			});

			await applyFilterValue(result.page, "Name", "hello");

			const operators = getQueryOperators(result);
			expect(operators).toHaveLength(1);
			expect(operators[0].operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});
	});
});
