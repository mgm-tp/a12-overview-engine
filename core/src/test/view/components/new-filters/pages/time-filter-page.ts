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
import { within, waitFor, fireEvent, queryByText } from "@testing-library/react";

import { DataRoles, type DateTimeContextType } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../main/index.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import { renderFilter, getByDataRole, queryByDataRole, queryAllByDataRole, type FilterRenderResult } from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class TimePickerDialogPage {
	constructor(public readonly container: HTMLElement) {}

	get dialog(): HTMLElement | null {
		return queryByDataRole(this.container, "time-picker");
	}

	get isOpen(): boolean {
		return this.dialog !== null;
	}

	get headerTitle(): string | null {
		const titleElement = queryByDataRole(this.container, "date-time-picker-title");

		return titleElement?.textContent ?? null;
	}

	get clock(): HTMLElement | null {
		return queryByDataRole(this.container, "time-picker-clock");
	}

	get clockNumbers(): HTMLElement[] {
		return queryAllByDataRole(this.container, "time-picker-clock-num");
	}

	getClockNumber(value: string): HTMLElement | undefined {
		const paddedValue = value.padStart(2, "0");

		const clockNumbers = this.clockNumbers.filter((el) => el.textContent === paddedValue);

		if (clockNumbers.length > 1) {
			throw new Error(`Multiple clock numbers found for value '${paddedValue}'`);
		}

		return clockNumbers[0];
	}

	get pointerValue(): string | null {
		const pointer = queryByDataRole(this.container, "time-picker-pointer");

		if (!pointer) {
			return null;
		}

		const outerDotContent = pointer.querySelector("[class*='OuterDotContent']");

		return outerDotContent?.textContent ?? null;
	}

	get timeValues(): HTMLElement[] {
		return queryAllByDataRole(this.container, "time-picker-time");
	}

	get hourDisplay(): HTMLElement | null {
		return this.timeValues[0] ?? null;
	}

	get minuteDisplay(): HTMLElement | null {
		return this.timeValues[1] ?? null;
	}

	get hourValue(): string | null {
		return this.hourDisplay?.textContent ?? null;
	}

	get minuteValue(): string | null {
		return this.minuteDisplay?.textContent ?? null;
	}

	get isHourViewActive(): boolean {
		return !this.isMinuteViewActive;
	}

	get isMinuteViewActive(): boolean {
		return !!this.clockNumbers.find((el) => el.textContent === "45");
	}

	get amButton(): HTMLElement | null {
		return queryByDataRole(this.container, "time-picker-am");
	}

	get pmButton(): HTMLElement | null {
		return queryByDataRole(this.container, "time-picker-pm");
	}

	get isAmSelected(): boolean {
		return this.amButton?.classList.contains("TimePicker__am--selected") ?? false;
	}

	get isPmSelected(): boolean {
		return this.pmButton?.classList.contains("TimePicker__pm--selected") ?? false;
	}

	get amPmValue(): "AM" | "PM" | null {
		if (this.isAmSelected) {
			return "AM";
		}

		if (this.isPmSelected) {
			return "PM";
		}

		return null;
	}

	get footer(): HTMLElement | null {
		return queryByDataRole(this.container, "picker-footer");
	}

	get footerActions(): HTMLElement[] {
		return queryAllByDataRole(this.container, "picker-footer-action");
	}

	get okButton(): HTMLButtonElement | null {
		const buttons = this.footer?.querySelectorAll<HTMLButtonElement>('[data-role="button"]') ?? [];

		return Array.from(buttons).find((btn) => btn.textContent?.includes("Ok")) ?? null;
	}

	get clearButton(): HTMLButtonElement | null {
		const buttons = this.footer?.querySelectorAll<HTMLButtonElement>('[data-role="button"]') ?? [];

		return Array.from(buttons).find((btn) => btn.textContent?.includes("Clear")) ?? null;
	}

	async clickClockNumber(value: string) {
		const numberElement = this.getClockNumber(value);
		assertCondition(!!numberElement, `Clock number '${value}' not found`);

		const clock = this.clock;
		assertCondition(!!clock, "Clock element not found");

		const numberRect = numberElement.getBoundingClientRect();

		const centerX = numberRect.left + numberRect.width / 2;
		const centerY = numberRect.top + numberRect.height / 2;

		fireEvent.click(clock, {
			clientX: centerX,
			clientY: centerY
		});
	}

	clickHourDisplay(): void {
		assertCondition(!!this.hourDisplay, "Hour display not found");
		fireEvent.click(this.hourDisplay);
	}

	clickMinuteDisplay(): void {
		assertCondition(!!this.minuteDisplay, "Minute display not found");
		fireEvent.click(this.minuteDisplay);
	}

	clickAm(): void {
		assertCondition(!!this.amButton, "AM button not found");
		fireEvent.click(this.amButton);
	}

	clickPm(): void {
		assertCondition(!!this.pmButton, "PM button not found");
		fireEvent.click(this.pmButton);
	}

	clickOk(): void {
		assertCondition(!!this.okButton, "Ok button not found");
		fireEvent.click(this.okButton);
	}

	clickClear(): void {
		assertCondition(!!this.clearButton, "Clear button not found");
		fireEvent.click(this.clearButton);
	}

	async selectHour(hour: string, waitForMinuteView = false): Promise<void> {
		if (!this.isHourViewActive) {
			this.clickHourDisplay();
			await waitFor(() => {
				assertCondition(this.isHourViewActive, "Expected hour view after clicking hour display");
			});
		}

		await this.clickClockNumber(hour);

		if (waitForMinuteView) {
			await waitFor(() => {
				assertCondition(this.isMinuteViewActive, "Expected minute view after selecting hour");
			});
		}
	}

	async selectMinute(minute: string): Promise<void> {
		if (!this.isMinuteViewActive) {
			this.clickMinuteDisplay();
			await waitFor(() => {
				assertCondition(this.isMinuteViewActive, "Expected minute view after clicking minute display");
			});
		}

		await this.clickClockNumber(minute);
	}

	async selectTime(hour: string, minute: string, amPm: "AM" | "PM"): Promise<void> {
		await this.selectHour(hour);

		await this.selectMinute(minute);

		if (amPm === "AM") {
			this.clickAm();
		} else {
			this.clickPm();
		}

		this.clickOk();
	}
}

export class TimeFilterPage extends FilterPage {
	get rangeInputContainers(): HTMLElement[] {
		return queryAllByDataRole(this.container, "range-filter-input");
	}

	get fromInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("From");
	}

	get toInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("To");
	}

	get exactInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("Exact");
	}

	get fromValue(): string {
		return this.fromInput?.value ?? "";
	}

	get toValue(): string {
		return this.toInput?.value ?? "";
	}

	get exactValue(): string {
		return this.exactInput?.value ?? "";
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	get errorMessage(): string | null {
		const errorElement = queryAllByDataRole(this.container, DataRoles.Error.Text)[0];

		return errorElement?.textContent ?? null;
	}

	get hasError(): boolean {
		return queryAllByDataRole(this.container, DataRoles.Error.Text).length > 0;
	}

	assertError(expectedMessage: string): void {
		const errorElement = getByDataRole(this.container, DataRoles.Error.Text);
		expect(errorElement.textContent).toBe(expectedMessage);
	}

	assertNoError(): void {
		expect(queryAllByDataRole(this.container, DataRoles.Error.Text).length).toBe(0);
	}

	getPlaceholder(label: string): string | null {
		const input = this.getInputByLabel(label);

		return input?.getAttribute("placeholder") ?? null;
	}

	get fromPlaceholder(): string | null {
		return this.getPlaceholder("From");
	}

	get toPlaceholder(): string | null {
		return this.getPlaceholder("To");
	}

	get exactPlaceholder(): string | null {
		return this.getPlaceholder("Exact");
	}

	getInputByLabel(label: string): HTMLInputElement | undefined {
		for (const container of this.rangeInputContainers) {
			if (queryByText(container, label)) {
				return getByDataRole<HTMLInputElement>(container, DataRoles.TextField.Input);
			}
		}

		return undefined;
	}

	getTimePickerButton(label: string): HTMLButtonElement | undefined {
		for (const container of this.rangeInputContainers) {
			if (queryByText(container, label)) {
				const buttons = within(container).queryAllByRole("button");

				return buttons.find((btn) => btn.getAttribute("aria-label")?.includes("time")) as HTMLButtonElement | undefined;
			}
		}

		return undefined;
	}

	get fromTimePickerButton(): HTMLButtonElement | undefined {
		return this.getTimePickerButton("From");
	}

	get toTimePickerButton(): HTMLButtonElement | undefined {
		return this.getTimePickerButton("To");
	}

	get exactTimePickerButton(): HTMLButtonElement | undefined {
		return this.getTimePickerButton("Exact");
	}

	getInputs<T extends string>(labels: T[]): Record<T, { input: HTMLInputElement | undefined; value: string }> {
		const result = {} as Record<T, { input: HTMLInputElement | undefined; value: string }>;

		for (const label of labels) {
			const input = this.getInputByLabel(label);
			result[label] = { input, value: input?.value ?? "" };
		}

		return result;
	}

	get visibleInputLabels(): string[] {
		const labels: string[] = [];

		for (const container of this.rangeInputContainers) {
			const labelElement = container.querySelector("[class*='label']");

			if (labelElement?.textContent) {
				labels.push(labelElement.textContent);
			}
		}

		return labels;
	}

	get timePickerDialog(): TimePickerDialogPage {
		return new TimePickerDialogPage(document.body);
	}

	get isTimePickerOpen(): boolean {
		return this.timePickerDialog.isOpen;
	}

	async setFromValue(value: string): Promise<void> {
		const input = this.fromInput;
		assertCondition(!!input, "'From' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setToValue(value: string): Promise<void> {
		const input = this.toInput;
		assertCondition(!!input, "'To' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setExactValue(value: string): Promise<void> {
		const input = this.exactInput;
		assertCondition(!!input, "'Exact' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setRange(from: string, to: string): Promise<void> {
		await this.setFromValue(from);
		await this.setToValue(to);
	}

	async openFromTimePicker(): Promise<TimePickerDialogPage> {
		const button = this.fromTimePickerButton;
		assertCondition(!!button, "'From' time picker button not found");
		fireEvent.click(button);
		await waitFor(() => {
			assertCondition(this.isTimePickerOpen, "Time picker dialog did not open");
		});

		return this.timePickerDialog;
	}

	async openToTimePicker(): Promise<TimePickerDialogPage> {
		const button = this.toTimePickerButton;
		assertCondition(!!button, "'To' time picker button not found");
		fireEvent.click(button);
		await waitFor(() => {
			assertCondition(this.isTimePickerOpen, "Time picker dialog did not open");
		});

		return this.timePickerDialog;
	}

	async openExactTimePicker(): Promise<TimePickerDialogPage> {
		const button = this.exactTimePickerButton;
		assertCondition(!!button, "'Exact' time picker button not found");
		fireEvent.click(button);
		await waitFor(() => {
			assertCondition(this.isTimePickerOpen, "Time picker dialog did not open");
		});

		return this.timePickerDialog;
	}
}

export async function renderTimeFilter(options: {
	filterItem: OverviewModel.NewFilter.Time.Item;
	dateTimeContext?: DateTimeContextType;
}): Promise<{ page: TimeFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new TimeFilterPage(result), ...result };
}
