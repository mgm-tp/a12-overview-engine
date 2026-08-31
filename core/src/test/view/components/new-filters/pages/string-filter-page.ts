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

import { act, fireEvent } from "@testing-library/react";
import { expect } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { Events, Commands, type StringFilterState } from "../../../../../main/store/index.js";
import type { OverviewEngineApi } from "../../../../../main/view/api.js";
import {
	renderFilter,
	getByDataRole,
	queryAllByDataRole,
	type FilterRenderResult,
	type DocumentModelModifier,
	setTestEnumeratedStringFilterMap
} from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class StringFilterPage extends FilterPage {
	get criteriaInput(): HTMLInputElement | undefined {
		return this.textInputs.find((input) => input.getAttribute("value") !== "Empty");
	}

	get criteriaValue(): string {
		return this.criteriaInput?.value ?? "";
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	async setCriteriaValue(value: string): Promise<void> {
		const input = this.criteriaInput;
		assertCondition(!!input, "Criteria input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async clearCriteria(): Promise<void> {
		await this.setCriteriaValue("");
	}

	async setCaseSensitive(value: boolean): Promise<void> {
		await this.withSettings(async (portal) => {
			const matchSection = portal.match();
			expect(matchSection).toBeDefined();
			assertCondition(!!matchSection, "Match section not found in settings portal");

			const caseToggle = matchSection.case();
			expect(caseToggle).toBeDefined();
			assertCondition(!!caseToggle, "Case toggle not found in Match section");

			fireEvent.click(caseToggle.item(value ? "Yes" : "No"));
		});
	}

	async setExactMatch(value: boolean): Promise<void> {
		await this.withSettings(async (portal) => {
			const matchSection = portal.match();
			expect(matchSection).toBeDefined();
			assertCondition(!!matchSection, "Match section not found in settings portal");

			const exactToggle = matchSection.exact();
			expect(exactToggle).toBeDefined();
			assertCondition(!!exactToggle, "Exact toggle not found in Match section");

			fireEvent.click(exactToggle.item(value ? "Yes" : "No"));
		});
	}

	private static readonly SELECT_ALL_LABEL = "De/Select all";

	get checkboxes(): { input: HTMLInputElement; label: string }[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.Checkbox.Control).flatMap((container) => {
			const label = getByDataRole(container, DataRoles.Checkbox.Label);

			if (label.textContent === StringFilterPage.SELECT_ALL_LABEL) {
				return [];
			}

			const input = getByDataRole<HTMLInputElement>(container, DataRoles.Checkbox.Input);

			return [{ input, label: label.textContent?.trim() ?? "" }];
		});
	}

	get checkboxLabels(): string[] {
		return this.checkboxes.map((cb) => cb.label);
	}

	getCheckboxByLabel(label: string): HTMLInputElement | undefined {
		return this.checkboxes.find((cb) => cb.label === label)?.input;
	}

	isChecked(label: string): boolean {
		return this.getCheckboxByLabel(label)?.checked ?? false;
	}

	async clickCheckbox(label: string): Promise<void> {
		const checkbox = this.getCheckboxByLabel(label);
		assertCondition(!!checkbox, `Checkbox with label "${label}" not found`);
		fireEvent.click(checkbox);
	}

	getSearchInput(filterId: string): HTMLInputElement | null {
		return this.container.querySelector<HTMLInputElement>(`input[id="${filterId}-search"]`);
	}

	getSearchButton(filterId: string): HTMLButtonElement | null {
		return this.container.querySelector<HTMLButtonElement>(`button[id="${filterId}-search-button"]`);
	}

	async typeSearchInput(filterId: string, value: string): Promise<void> {
		const input = this.getSearchInput(filterId);
		assertCondition(!!input, "Search input not found");
		fireEvent.change(input, { target: { value } });
	}

	assertCriteriaValue(expected: string): void {
		expect(this.criteriaValue).toBe(expected);
	}

	assertEmptyMode(): void {
		expect(this.isEmptyMode).toBe(true);
	}

	assertTextInputMode(): void {
		expect(this.isEmptyMode).toBe(false);
		expect(this.criteriaInput).toBeDefined();
	}

	/** Simulate a backend candidates response for the list-mode editor. */
	simulateSearchResults(
		fieldPath: string,
		candidates: readonly string[],
		opts?: { keyword?: string; loading?: boolean; fullSize?: number }
	): void {
		act(() => {
			setTestEnumeratedStringFilterMap(this.renderResult.store, {
				[fieldPath]: {
					candidates: [...candidates],
					keyword: opts?.keyword ?? "",
					loading: opts?.loading ?? false,
					fullSize: opts?.fullSize ?? candidates.length
				}
			});
		});
	}

	get visibleLabels(): string[] {
		return this.checkboxLabels;
	}

	private getStringFilterState(): StringFilterState {
		const newFilter = this.renderResult.store.getState().newFilter;
		assertCondition(!!newFilter, "newFilter slice not initialized");

		const filters = Object.values(newFilter.filters);
		assertCondition(filters.length === 1, `expected exactly one filter, got ${filters.length}`);

		return filters[0] as StringFilterState;
	}

	get selectedValues(): readonly string[] {
		return this.getStringFilterState().options.selectedValues;
	}

	get appliedSelectedValues(): readonly string[] {
		return this.getStringFilterState().appliedOptions.selectedValues;
	}

	get selectAllCheckbox(): HTMLButtonElement {
		const checkboxContainer = queryAllByDataRole(this.container, DataRoles.Checkbox.Control).find((container) => {
			return getByDataRole(container, DataRoles.Checkbox.Label).textContent === StringFilterPage.SELECT_ALL_LABEL;
		});
		assertCondition(!!checkboxContainer, "Select All checkbox not found");

		return getByDataRole<HTMLButtonElement>(checkboxContainer, "checkbox-input");
	}

	async clickSelectAll(): Promise<void> {
		fireEvent.click(this.selectAllCheckbox);
	}

	/** Directly mutate `state.options.selectedValues` (e.g. seed prior pending selection). */
	setStoreSelectedValues(values: readonly string[]): void {
		const filter = this.getStringFilterState();
		act(() => {
			this.renderResult.store.dispatch(
				Commands.setFilterOptions({
					filterId: filter.model.id,
					options: { ...filter.options, selectedValues: [...values] }
				})
			);
		});
	}

	/** Move all pending selections to applied (same effect as the Apply All button). */
	applyAll(): void {
		act(() => {
			this.renderResult.store.dispatch(Events.NewFilter.onFilterSelectorAllApplied());
		});
	}
}

export async function renderStringFilter(options: {
	filterItem: OverviewModel.NewFilter.String.Item;
	documentModelModifier?: DocumentModelModifier;
	initialEnumeratedStringFilterMap?: OverviewEngineApi.EnumeratedStringFilterMap;
	dataservicesConfiguration?: Record<string, string>;
}): Promise<{ page: StringFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new StringFilterPage(result), ...result };
}
