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

import { getByText } from "@testing-library/react";
import { expect } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { getByDataRole, queryAllByDataRole } from "./setup.js";

interface ToggleItem {
	button: HTMLButtonElement;
	label: string;
	isSelected: boolean;
}

export interface SettingsToggleState<Label extends string = string> {
	getItemByLabel: (label: Label) => HTMLButtonElement;
}

export function assertToggles<Label extends string>(
	section: HTMLElement,
	expectedLabels: Label[],
	selectedLabel: Label
): SettingsToggleState<Label> {
	const toggleButtons = queryAllByDataRole(section, DataRoles.Toggle.Item) as HTMLButtonElement[];

	expect(toggleButtons.length).toBe(expectedLabels.length);

	const items: ToggleItem[] = toggleButtons.map((button, index) => {
		const label = button.textContent?.trim() || "";
		const isSelected = button.getAttribute("aria-pressed") === "true";

		expect(label).toContain(expectedLabels[index]);

		return { button, label, isSelected };
	});

	const selectedItem = items.find((item) => item.label === selectedLabel);
	expect(selectedItem).toBeDefined();
	expect(selectedItem?.isSelected).toBe(true);

	items.forEach((item) => {
		if (!item.label.includes(selectedLabel)) {
			expect(item.isSelected).toBe(false);
		}
	});

	return {
		getItemByLabel: (label: Label) => {
			const item = items.find((item) => item.label === label);

			if (!item) {
				throw new Error(`Toggle item with label "${label}" not found.`);
			}

			return item.button;
		}
	};
}

export function assertInputs<T extends string>(
	container: HTMLElement,
	inputs: { label: T; value: string }[] | null
): Record<T, HTMLInputElement> {
	if (inputs === null) {
		const inputElements = queryAllByDataRole<HTMLInputElement>(container, DataRoles.TextField.Input);
		expect(inputElements.length).toBe(1);

		expect(inputElements[0].getAttribute("value")).toBe("Empty");

		return {} as Record<T, HTMLInputElement>;
	}

	const inputContainers = queryAllByDataRole<HTMLInputElement>(container, "range-filter-input");

	expect(inputContainers.length).toBe(inputs.length);

	const result: [T, HTMLInputElement][] = [];

	for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
		const { label, value } = inputs[inputIndex];
		const inputContainer = inputContainers[inputIndex];

		const labelElement = getByText(inputContainer, label);
		const inputElement = getByDataRole<HTMLInputElement>(inputContainer, DataRoles.TextField.Input);

		expect(labelElement.textContent).toBe(label);
		expect(inputElement.value).toBe(value);

		result.push([label, inputElement]);
	}

	return Object.fromEntries(result) as Record<T, HTMLInputElement>;
}

export function assertCheckboxes<T extends string>(
	container: HTMLElement,
	checkboxes: { label: T; checked?: boolean }[]
): Record<T, HTMLInputElement> {
	const checkboxControls = queryAllByDataRole<HTMLInputElement>(container, DataRoles.Checkbox.Control);

	expect(checkboxControls.length).toBe(checkboxes.length);

	const result: [T, HTMLInputElement][] = [];

	for (let inputIndex = 0; inputIndex < checkboxes.length; inputIndex++) {
		const { label, checked = false } = checkboxes[inputIndex];
		const inputContainer = checkboxControls[inputIndex];

		const labelElement = getByText(inputContainer, label);
		const inputElement = getByDataRole<HTMLInputElement>(inputContainer, DataRoles.Checkbox.Input);

		expect(labelElement.textContent).toBe(label);
		expect(inputElement.checked).toBe(checked);

		result.push([label, inputElement]);
	}

	return Object.fromEntries(result) as Record<T, HTMLInputElement>;
}
