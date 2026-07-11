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

import { fireEvent } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import {
	renderFilter,
	getByDataRole,
	queryByDataRole,
	queryAllByDataRole,
	type FilterRenderResult,
	type DocumentModelModifier
} from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class EnumerationFilterPage extends FilterPage {
	private static readonly SELECT_ALL_LABEL = "De/Select all";

	get selectAllCheckbox(): HTMLButtonElement {
		const checkboxContainer = queryAllByDataRole(this.container, DataRoles.Checkbox.Control).find((container) => {
			return getByDataRole(container, DataRoles.Checkbox.Label).textContent === EnumerationFilterPage.SELECT_ALL_LABEL;
		});

		if (!checkboxContainer) {
			throw new Error("Select All checkbox not found");
		}

		return getByDataRole<HTMLButtonElement>(checkboxContainer, "checkbox-input");
	}

	get checkboxes(): { input: HTMLInputElement; label: string }[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.Checkbox.Control).flatMap((container) => {
			const label = getByDataRole(container, DataRoles.Checkbox.Label);

			if (label.textContent === EnumerationFilterPage.SELECT_ALL_LABEL) {
				return [];
			}

			const input = getByDataRole<HTMLInputElement>(container, DataRoles.Checkbox.Input);

			return [{ input, label: label.textContent?.trim() ?? "" }];
		});
	}

	getCheckboxByLabel(label: string): HTMLInputElement | undefined {
		return this.checkboxes.find((cb) => cb.label === label)?.input;
	}

	get checkboxLabels(): string[] {
		return this.checkboxes.map((cb) => cb.label);
	}

	get selectedLabels(): string[] {
		return this.checkboxes.flatMap((checkbox) => {
			if (checkbox.input.checked) {
				return [checkbox.label];
			}

			return [];
		});
	}

	isChecked(label: string): boolean {
		const checkbox = this.getCheckboxByLabel(label);

		return checkbox?.checked ?? false;
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	get showMoreButton(): HTMLButtonElement | undefined {
		return this.buttons.find((button) => button.textContent?.includes("Show more"));
	}

	get showLessButton(): HTMLButtonElement | undefined {
		return this.buttons.find((button) => button.textContent?.includes("Show less"));
	}

	get selectAllState(): boolean | "mixed" {
		const checkbox = this.selectAllCheckbox;

		const ariaCheck = checkbox.getAttribute("aria-checked");

		if (ariaCheck === "true") {
			return true;
		}

		if (ariaCheck === "false") {
			return false;
		}

		if (ariaCheck === "mixed") {
			return "mixed";
		}

		throw new Error("Select All checkbox state is invalid");
	}

	get isCompactMode(): boolean {
		return this.multiselectInput !== undefined;
	}

	get multiselectInput(): HTMLInputElement | undefined {
		return queryByDataRole(this.container, DataRoles.TextField.Input) as HTMLInputElement | undefined;
	}

	get multiselectDropdown(): HTMLElement | undefined {
		return queryByDataRole(this.container, DataRoles.Dropdown) ?? undefined;
	}

	get dropdownItems(): { element: HTMLElement; label: string; checkbox: HTMLInputElement }[] {
		const dropdown = this.multiselectDropdown;

		if (!dropdown) {
			return [];
		}

		return queryAllByDataRole<HTMLElement>(dropdown, DataRoles.Dropdown.Item).map((item) => {
			const checkbox = getByDataRole<HTMLInputElement>(item, DataRoles.Checkbox.Input);
			const labelElement = queryByDataRole(item, DataRoles.Checkbox.Label);
			const label = labelElement?.textContent?.trim() ?? "";

			return { element: item, label, checkbox };
		});
	}

	get dropdownItemLabels(): string[] {
		return this.dropdownItems.map((item) => item.label);
	}

	get selectedDropdownLabels(): string[] {
		return this.dropdownItems.filter((item) => item.checkbox.checked).map((item) => item.label);
	}

	get multiselectValue(): string {
		return this.multiselectInput?.value ?? "";
	}

	async clickCheckbox(label: string): Promise<void> {
		const checkbox = this.getCheckboxByLabel(label);
		assertCondition(!!checkbox, `Checkbox with label "${label}" not found`);
		fireEvent.click(checkbox);
	}

	async showMore(): Promise<void> {
		const button = this.showMoreButton;
		assertCondition(!!button, "Show more button not found");
		fireEvent.click(button);
	}

	async showLess(): Promise<void> {
		const button = this.showLessButton;
		assertCondition(!!button, "Show less button not found");
		fireEvent.click(button);
	}

	async clickSelectAll(): Promise<void> {
		const checkbox = this.selectAllCheckbox;
		assertCondition(!!checkbox, "Select All checkbox not found");
		fireEvent.click(checkbox);
	}

	async openMultiselect(): Promise<void> {
		const input = this.multiselectInput;
		assertCondition(!!input, "Multiselect input not found");
		fireEvent.click(input);
	}

	async closeMultiselect(): Promise<void> {
		fireEvent.mouseDown(this.container);
		fireEvent.mouseUp(this.container);
		fireEvent.click(this.container);
	}

	async clickDropdownItem(label: string): Promise<void> {
		const item = this.dropdownItems.find((i) => i.label === label);
		assertCondition(!!item, `Dropdown item with label "${label}" not found`);
		fireEvent.click(item.checkbox);
	}

	async clickMultiselectSelectAll(): Promise<void> {
		const items = this.dropdownItems;
		assertCondition(items.length > 0, "No dropdown items found");
		fireEvent.click(items[0].checkbox);
	}

	async searchMultiselect(text: string): Promise<void> {
		const input = this.multiselectInput;
		assertCondition(!!input, "Multiselect input not found");
		fireEvent.change(input, { target: { value: text } });
	}
}

export async function renderEnumerationFilter(options: {
	filterItem: OverviewModel.NewFilter.Enumeration.Item;
	documentModelModifier?: DocumentModelModifier;
}): Promise<{ page: EnumerationFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new EnumerationFilterPage(result), ...result };
}
