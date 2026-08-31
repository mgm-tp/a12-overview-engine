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

import { within, waitFor, fireEvent, queryByText } from "@testing-library/react";
import { expect } from "vitest";

import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../../main/index.js";
import { renderFilter, queryByDataRole, type FilterRenderResult } from "../setup.js";

import {
	DateFilterPage,
	DatePickerDialogPage,
	type PeriodModeLabel as DatePeriodModeLabel
} from "./date-filter-page.js";
import { TimePickerDialogPage } from "./time-filter-page.js";

export type DateTimePeriodModeLabel = DatePeriodModeLabel | "Date & Time" | "Time (Today)";

export class DateTimePickerDialogPage {
	constructor(public readonly container: HTMLElement) {}

	get dialog(): HTMLElement | null {
		return queryByDataRole(this.container, "date-time-picker") ?? queryByDataRole(this.container, "date-picker");
	}

	get isOpen(): boolean {
		return this.dialog !== null;
	}

	get datePicker(): DatePickerDialogPage | null {
		const datePickerContainer = queryByDataRole(this.container, "date-picker");

		return datePickerContainer ? new DatePickerDialogPage(datePickerContainer) : null;
	}

	get timePicker(): TimePickerDialogPage | null {
		const timePickerContainer = queryByDataRole(this.container, "time-picker");

		return timePickerContainer ? new TimePickerDialogPage(timePickerContainer) : null;
	}

	get footer(): HTMLElement | null {
		return queryByDataRole(this.container, "picker-footer");
	}

	get okButton(): HTMLButtonElement | null {
		const buttons = this.footer?.querySelectorAll<HTMLButtonElement>('[data-role="button"]') ?? [];

		return Array.from(buttons).find((btn) => btn.textContent?.includes("Ok")) ?? null;
	}

	get clearButton(): HTMLButtonElement | null {
		const buttons = this.footer?.querySelectorAll<HTMLButtonElement>('[data-role="button"]') ?? [];

		return Array.from(buttons).find((btn) => btn.textContent?.includes("Clear")) ?? null;
	}

	get cancelButton(): HTMLButtonElement | null {
		const buttons = this.footer?.querySelectorAll<HTMLButtonElement>('[data-role="button"]') ?? [];

		return Array.from(buttons).find((btn) => btn.textContent?.toLowerCase() === "cancel") ?? null;
	}

	clickOk(): void {
		assertCondition(!!this.okButton, "Ok button not found");
		fireEvent.click(this.okButton);
	}

	clickClear(): void {
		assertCondition(!!this.clearButton, "Clear button not found");
		fireEvent.click(this.clearButton);
	}

	clickCancel(): void {
		assertCondition(!!this.cancelButton, "Cancel button not found");
		fireEvent.click(this.cancelButton);
	}

	async selectDateTime(day: number, hour: string, minute: string, amPm: "AM" | "PM"): Promise<void> {
		const datePicker = this.datePicker;
		assertCondition(!!datePicker, "Date picker section not found");
		datePicker.selectDate(day);

		const timePicker = this.timePicker;
		assertCondition(!!timePicker, "Time picker section not found");
		await timePicker.selectTime(hour, minute, amPm);
	}
}

export class DateTimeFilterPage extends DateFilterPage {
	get timeView() {
		// eslint-disable-next-line typescript/no-this-alias -- needed: nested getters in returned object literal cannot use arrow functions
		const page = this;

		return {
			get fromInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("From");
			},
			get toInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("To");
			},
			get exactInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("Exact");
			},
			get fromValue(): string {
				return this.fromInput?.value ?? "";
			},
			get toValue(): string {
				return this.toInput?.value ?? "";
			},
			get exactValue(): string {
				return this.exactInput?.value ?? "";
			},
			get fromPlaceholder(): string | null {
				return this.fromInput?.getAttribute("placeholder") ?? null;
			},
			get toPlaceholder(): string | null {
				return this.toInput?.getAttribute("placeholder") ?? null;
			},
			get exactPlaceholder(): string | null {
				return this.exactInput?.getAttribute("placeholder") ?? null;
			},

			getPickerButton(label: string): HTMLButtonElement | undefined {
				for (const container of page.rangeInputContainers) {
					if (queryByText(container, label)) {
						const buttons = within(container).queryAllByRole("button");

						return buttons.find((btn) => btn.getAttribute("aria-label")?.includes("time")) as
							| HTMLButtonElement
							| undefined;
					}
				}

				return undefined;
			},
			get fromPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("From");
			},
			get toPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("To");
			},
			get exactPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("Exact");
			},

			get pickerDialog(): TimePickerDialogPage {
				return new TimePickerDialogPage(document.body);
			},
			get isPickerOpen(): boolean {
				return this.pickerDialog.isOpen;
			},

			async setFromValue(value: string): Promise<void> {
				const input = this.fromInput;
				assertCondition(!!input, "'From' time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setToValue(value: string): Promise<void> {
				const input = this.toInput;
				assertCondition(!!input, "'To' time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setExactValue(value: string): Promise<void> {
				const input = this.exactInput;
				assertCondition(!!input, "'Exact' time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setRange(from: string, to: string): Promise<void> {
				await this.setFromValue(from);
				await this.setToValue(to);
			},

			async openFromPicker(): Promise<TimePickerDialogPage> {
				const button = this.fromPickerButton;
				assertCondition(!!button, "'From' time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Time picker dialog did not open");
				});

				return this.pickerDialog;
			},
			async openToPicker(): Promise<TimePickerDialogPage> {
				const button = this.toPickerButton;
				assertCondition(!!button, "'To' time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Time picker dialog did not open");
				});

				return this.pickerDialog;
			},
			async openExactPicker(): Promise<TimePickerDialogPage> {
				const button = this.exactPickerButton;
				assertCondition(!!button, "'Exact' time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Time picker dialog did not open");
				});

				return this.pickerDialog;
			}
		};
	}

	get dateTimeView() {
		// eslint-disable-next-line typescript/no-this-alias -- needed: nested getters in returned object literal cannot use arrow functions
		const page = this;

		return {
			get fromInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("From");
			},
			get toInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("To");
			},
			get exactInput(): HTMLInputElement | undefined {
				return page.getInputByLabel("Exact");
			},
			get fromValue(): string {
				return this.fromInput?.value ?? "";
			},
			get toValue(): string {
				return this.toInput?.value ?? "";
			},
			get exactValue(): string {
				return this.exactInput?.value ?? "";
			},
			get fromPlaceholder(): string | null {
				return this.fromInput?.getAttribute("placeholder") ?? null;
			},
			get toPlaceholder(): string | null {
				return this.toInput?.getAttribute("placeholder") ?? null;
			},
			get exactPlaceholder(): string | null {
				return this.exactInput?.getAttribute("placeholder") ?? null;
			},

			getPickerButton(label: string): HTMLButtonElement | undefined {
				for (const container of page.rangeInputContainers) {
					if (queryByText(container, label)) {
						const buttons = within(container).queryAllByRole("button");

						return buttons.find(
							(btn) =>
								btn.getAttribute("aria-label")?.includes("date") || btn.getAttribute("aria-label")?.includes("calendar")
						) as HTMLButtonElement | undefined;
					}
				}

				return undefined;
			},
			get fromPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("From");
			},
			get toPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("To");
			},
			get exactPickerButton(): HTMLButtonElement | undefined {
				return this.getPickerButton("Exact");
			},

			get pickerDialog(): DateTimePickerDialogPage {
				return new DateTimePickerDialogPage(document.body);
			},
			get isPickerOpen(): boolean {
				return this.pickerDialog.isOpen;
			},

			async setFromValue(value: string): Promise<void> {
				const input = this.fromInput;
				assertCondition(!!input, "'From' date-time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setToValue(value: string): Promise<void> {
				const input = this.toInput;
				assertCondition(!!input, "'To' date-time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setExactValue(value: string): Promise<void> {
				const input = this.exactInput;
				assertCondition(!!input, "'Exact' date-time input not found");
				fireEvent.change(input, { target: { value } });
				fireEvent.blur(input);
			},
			async setRange(from: string, to: string): Promise<void> {
				await this.setFromValue(from);
				await this.setToValue(to);
			},

			async openFromPicker(): Promise<DateTimePickerDialogPage> {
				const button = this.fromPickerButton;
				assertCondition(!!button, "'From' date-time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Date-time picker dialog did not open");
				});

				return this.pickerDialog;
			},
			async openToPicker(): Promise<DateTimePickerDialogPage> {
				const button = this.toPickerButton;
				assertCondition(!!button, "'To' date-time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Date-time picker dialog did not open");
				});

				return this.pickerDialog;
			},
			async openExactPicker(): Promise<DateTimePickerDialogPage> {
				const button = this.exactPickerButton;
				assertCondition(!!button, "'Exact' date-time picker button not found");
				fireEvent.click(button);
				await waitFor(() => {
					assertCondition(this.isPickerOpen, "Date-time picker dialog did not open");
				});

				return this.pickerDialog;
			}
		};
	}

	async setPeriodMode(mode: DateTimePeriodModeLabel): Promise<void> {
		await this.withSettings(async (portal) => {
			const periodRadioGroup = portal.period();
			expect(periodRadioGroup).toBeDefined();
			assertCondition(!!periodRadioGroup, "Period radio group not found in settings portal");

			fireEvent.click(periodRadioGroup.item(mode));
		});
	}
}

export async function renderDateTimeFilter(options: {
	filterItem: OverviewModel.NewFilter.DateTime.Item;
}): Promise<{ page: DateTimeFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new DateTimeFilterPage(result), ...result };
}
