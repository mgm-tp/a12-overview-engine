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

import { expect } from "vitest";
import { userEvent } from "vitest/browser";
import { within, waitFor, fireEvent, queryByText } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import { renderFilter, getByDataRole, queryByDataRole, queryAllByDataRole, type FilterRenderResult } from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export type PeriodModeLabel = "Date" | "Year" | "Year & Month";

export class DatePickerDialogPage {
	constructor(public readonly container: HTMLElement) {}

	get dialog(): HTMLElement | null {
		return queryByDataRole(this.container, "date-picker");
	}

	get monthSelector(): HTMLSelectElement | undefined {
		return queryByDataRole(this.container, "month-selector-input") as HTMLSelectElement | undefined;
	}

	get yearSelector(): HTMLSelectElement | undefined {
		return queryByDataRole(this.container, "year-selector-input") as HTMLSelectElement | undefined;
	}

	get dayCells(): HTMLElement[] {
		return queryAllByDataRole(this.container, "date-picker-day-button");
	}

	getDayCell(day: number): HTMLElement | undefined {
		return this.dayCells.find((cell) => cell.textContent === String(day));
	}

	get prevMonthButton(): HTMLButtonElement | null {
		const buttons = within(this.container).queryAllByRole("button");

		return (buttons.find((btn) => btn.getAttribute("aria-label") === "Previous Month") as HTMLButtonElement) ?? null;
	}

	get nextMonthButton(): HTMLButtonElement | null {
		const buttons = within(this.container).queryAllByRole("button") as HTMLButtonElement[];

		return buttons.find((btn) => btn.getAttribute("aria-label") === "Next Month") ?? null;
	}

	clickDay(day: number): void {
		const dayCell = this.getDayCell(day);
		assertCondition(!!dayCell, `Day ${day} not found in calendar`);
		fireEvent.click(dayCell);
	}

	clickPrevMonth(): void {
		const btn = this.prevMonthButton;
		assertCondition(!!btn, "Previous month button not found");
		fireEvent.click(btn);
	}

	clickNextMonth(): void {
		const btn = this.nextMonthButton;
		assertCondition(!!btn, "Next month button not found");
		fireEvent.click(btn);
	}

	selectDate(day: number): void {
		this.clickDay(day);
	}
}

export class DateFilterPage extends FilterPage {
	get rangeInputContainers(): HTMLElement[] {
		return queryAllByDataRole(this.container, "range-filter-input");
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	get errorMessages(): string[] {
		return queryAllByDataRole(this.container, DataRoles.Error.Text).map((errorText) => errorText.textContent || "");
	}

	get dateView() {
		const [fromInput, toInput, exactInput] = ["From", "To", "Exact"].map((label) => this.getInputByLabel(label));
		const [setFrom, setTo, setExact] = ["From", "To", "Exact"].map((label) => {
			return async (value: string): Promise<void> => {
				const input = this.getInputByLabel(label);
				assertCondition(!!input, `'${label}' input not found`);
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			};
		});

		const [fromPlaceholder, toPlaceholder, exactPlaceholder] = [fromInput, toInput, exactInput].map(
			(input) => input?.getAttribute("placeholder") ?? null
		);

		return {
			fromInput,
			toInput,
			exactInput,
			fromPlaceholder,
			toPlaceholder,
			exactPlaceholder,
			setFrom,
			setTo,
			setExact
		};
	}

	get yearView() {
		const [fromSelect, toSelect, exactSelect] = ["From", "To", "Exact"].map((label) => {
			return this.getYearInputByLabel(label);
		});

		const [selectFrom, selectTo, selectExact] = ["From", "To", "Exact"].map((label) => {
			return async (value: string): Promise<void> => {
				const selector = this.getYearInputByLabel(label);
				assertCondition(!!selector, `'${label}' year input not found`);
				fireEvent.change(selector, { target: { value } });
				fireEvent.blur(selector);
			};
		});

		return {
			fromSelect,
			toSelect,
			exactSelect,
			selectFrom,
			selectTo,
			selectExact
		};
	}

	get yearSelectors(): HTMLElement[] {
		return queryAllByDataRole(this.container, "range-filter-input");
	}

	getYearInputByLabel(label: string): HTMLSelectElement | undefined {
		const selectors = this.yearSelectors;

		const container = selectors.find((selector) => {
			return getByDataRole(selector, "label").textContent === label;
		});

		if (!container) {
			return undefined;
		}

		return queryByDataRole(container, "year-selector-input") as HTMLSelectElement | undefined;
	}

	getMonthInputByLabel(label: string): HTMLSelectElement | undefined {
		const selectors = this.yearSelectors;

		const container = selectors.find((selector) => {
			return getByDataRole(selector, "label").textContent === label;
		});

		if (!container) {
			return undefined;
		}

		return queryByDataRole(container, "month-selector-input") as HTMLSelectElement | undefined;
	}

	get monthView() {
		const [fromSelect, toSelect, exactSelect] = ["From", "To", "Exact"].map((label) => {
			return this.getMonthInputByLabel(label);
		});

		const [selectFrom, selectTo, selectExact] = ["From", "To", "Exact"].map((label) => {
			return async (month: string): Promise<void> => {
				const select = this.getMonthInputByLabel(label);
				assertCondition(!!select, `'${label}' month input not found`);
				await userEvent.selectOptions(select, month);
			};
		});

		return {
			fromSelect,
			toSelect,
			exactSelect,
			selectFrom,
			selectTo,
			selectExact
		};
	}

	getYearMonthYearInputByLabel(label: string): HTMLSelectElement | undefined {
		const selectors = this.yearSelectors;

		const container = selectors.find((selector) => {
			return getByDataRole(selector, "label").textContent === label;
		});

		if (!container) {
			return undefined;
		}

		return queryByDataRole(container, "year-selector-input") as HTMLSelectElement | undefined;
	}

	getYearMonthMonthInputByLabel(label: string): HTMLSelectElement | undefined {
		const selectors = this.yearSelectors;

		const container = selectors.find((selector) => {
			return getByDataRole(selector, "label").textContent === label;
		});

		if (!container) {
			return undefined;
		}

		return queryByDataRole(container, "month-selector-input") as HTMLSelectElement | undefined;
	}

	get monthYearView() {
		const [fromYearSelect, toYearSelect, exactYearSelect] = ["From", "To", "Exact"].map((label) => {
			return this.getYearMonthYearInputByLabel(label);
		});
		const [fromMonthSelect, toMonthSelect, exactMonthSelect] = ["From", "To", "Exact"].map((label) => {
			return this.getYearMonthMonthInputByLabel(label);
		});

		const [selectFromYear, selectToYear, selectExactYear] = ["From", "To", "Exact"].map((label) => {
			return async (year: string): Promise<void> => {
				const yearInput = this.getYearMonthYearInputByLabel(label) as unknown as HTMLInputElement | undefined;
				assertCondition(!!yearInput, `'${label}' year input not found`);
				fireEvent.change(yearInput, { target: { value: year } });
				fireEvent.blur(yearInput);
			};
		});

		const [selectFromMonth, selectToMonth, selectExactMonth] = ["From", "To", "Exact"].map((label) => {
			return async (month: string): Promise<void> => {
				const monthSelect = this.getYearMonthMonthInputByLabel(label);
				assertCondition(!!monthSelect, `'${label}' month input not found`);
				await userEvent.selectOptions(monthSelect, month);
			};
		});

		return {
			fromYearSelect,
			toYearSelect,
			exactYearSelect,
			fromMonthSelect,
			toMonthSelect,
			exactMonthSelect,
			selectFromYear,
			selectToYear,
			selectExactYear,
			selectFromMonth,
			selectToMonth,
			selectExactMonth
		};
	}

	get isDatePickerOpen(): boolean {
		return queryByDataRole(this.container, "date-picker") !== null;
	}

	get datePickerDialog(): DatePickerDialogPage {
		return new DatePickerDialogPage(getByDataRole(this.container, "date-picker"));
	}

	getInputByLabel(label: string): HTMLInputElement | undefined {
		for (const container of this.rangeInputContainers) {
			if (queryByText(container, label)) {
				const input = queryByDataRole(container, DataRoles.TextField.Input);

				if (input) {
					return input as HTMLInputElement;
				}
			}
		}

		return undefined;
	}

	getInputs<T extends string>(labels: T[]): Record<T, { input: HTMLInputElement; value: string }> {
		const result = {} as Record<T, { input: HTMLInputElement; value: string }>;

		for (const label of labels) {
			const input = this.getInputByLabel(label);
			assertCondition(!!input, `Input with label '${label}' not found`);
			result[label] = { input, value: input.value };
		}

		return result;
	}

	getDatePickerButton(label: string): HTMLButtonElement | undefined {
		for (const container of this.rangeInputContainers) {
			if (queryByText(container, label)) {
				const buttons = within(container).queryAllByRole("button");

				return buttons.find((btn) => btn.getAttribute("aria-label")?.includes("date")) as HTMLButtonElement | undefined;
			}
		}

		return undefined;
	}

	get fromDatePickerButton(): HTMLButtonElement | undefined {
		return this.getDatePickerButton("From");
	}

	get toDatePickerButton(): HTMLButtonElement | undefined {
		return this.getDatePickerButton("To");
	}

	async openFromDatePicker(): Promise<DatePickerDialogPage> {
		const button = this.fromDatePickerButton;
		assertCondition(!!button, "'From' date picker button not found");
		fireEvent.click(button);
		await waitFor(() => {
			assertCondition(this.isDatePickerOpen, "Date picker dialog did not open");
		});

		return this.datePickerDialog;
	}

	async openToDatePicker(): Promise<DatePickerDialogPage> {
		const button = this.toDatePickerButton;
		assertCondition(!!button, "'To' date picker button not found");
		fireEvent.click(button);
		await waitFor(() => {
			assertCondition(this.isDatePickerOpen, "Date picker dialog did not open");
		});

		return this.datePickerDialog;
	}

	async setPeriodMode(mode: PeriodModeLabel): Promise<void> {
		await this.withSettings(async (portal) => {
			const periodRadioGroup = portal.period();
			expect(periodRadioGroup).toBeDefined();
			assertCondition(!!periodRadioGroup, "Period radio group not found in settings portal");

			fireEvent.click(periodRadioGroup.item(mode));
		});
	}
}

export async function renderDateFilter(options: {
	filterItem: OverviewModel.NewFilter.Date.Item;
}): Promise<{ page: DateFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new DateFilterPage(result), ...result };
}
