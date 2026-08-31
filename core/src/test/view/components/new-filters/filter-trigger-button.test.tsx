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

import { waitFor } from "@testing-library/react";
import { Lens } from "monocle-ts";
import { it, expect, describe } from "vitest";
import { userEvent } from "vitest/browser";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { noop, DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { FilterSelectorTriggerButton } from "../../../../main/view/components/new-filters/components/filter-selector-trigger-button.js";
import { OverviewContentBoxContext } from "../../../../main/view/context/overview-content-box-context.js";
import { deLocale } from "../../../basic.spec.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { baseFilterGroup, queryByDataRole, renderWithStore, baseFilterConfiguration } from "./setup.js";

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

const contentBoxContextValue: OverviewContentBoxContext.Type = {
	showFilterSelector: false,
	showMobileFilterBar: false,
	showMobileSearchBar: false,
	setShowMobileSearchBar: noop,
	toggleMobileFilterBar: noop,
	onFilterSelectorVisibilityChange: noop,
	getTriggerElementRef: noop
};

async function setupTest(options?: {
	filterConfiguration?: Partial<OverviewModel.NewFilterConfiguration>;
	filterGroups?: OverviewModel.NewFilter.Group[];
	removeNewFilterConfig?: boolean;
	locale?: Locale;
}) {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");

	const filterGroups = options?.filterGroups ?? [{ ...baseFilterGroup, filterItems: [stringFilterItem] }];

	let overviewModel: OverviewModel;

	if (options?.removeNewFilterConfig) {
		overviewModel = filterConfigurationLens.set(undefined as never)(productOM);
	} else {
		overviewModel = filterConfigurationLens.set({
			...baseFilterConfiguration,
			...options?.filterConfiguration,
			filterGroups
		})(productOM);
	}

	const renderResult = await renderWithStore(
		<OverviewContentBoxContext.Provider value={contentBoxContextValue}>
			<FilterSelectorTriggerButton />
		</OverviewContentBoxContext.Provider>,
		{ engineProps: { documentModel, overviewModel, data: [] }, locale: options?.locale }
	);

	return { documentModel, overviewModel, ...renderResult };
}

function getButton(container: HTMLElement): HTMLButtonElement | null {
	return queryByDataRole(container, DataRoles.Button) as HTMLButtonElement | null;
}

function getIconName(button: HTMLButtonElement | null): string | undefined {
	return button?.querySelector("[data-role='plasma-icon'] span")?.textContent ?? undefined;
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.filter-selector-trigger-button", () => {
	describe("Rendering Conditions", () => {
		it("renders when newFilterConfiguration exists", async () => {
			const { container } = await setupTest();

			await waitFor(() => {
				expect(getButton(container)).not.toBeNull();
			});
		});

		it("always renders when mounted — visibility guards are the parent's responsibility", async () => {
			const { container } = await setupTest({
				filterGroups: [
					{
						...baseFilterGroup,
						filterItems: [{ ...stringFilterItem, preferFilterBar: true }]
					}
				]
			});

			await waitFor(() => {
				expect(getButton(container)).not.toBeNull();
			});
		});
	});

	describe("Trigger Configuration", () => {
		type TriggerConfig = OverviewModel.NewFilterConfiguration["filterSelector"]["trigger"];

		interface TriggerCase {
			readonly name: string;
			readonly trigger: TriggerConfig;
			readonly expected: {
				/** Rendered icon glyph, or undefined when no icon is shown. */
				readonly icon: string | undefined;
				/** Whole button text content (icon glyph + visible label). */
				readonly text: string;
				/** Accessible name (title attribute). */
				readonly title: string;
			};
		}

		const CUSTOM_ICON = { name: "tune", theme: "outlined" } as const;
		const CUSTOM_LABEL = [{ locale: "en", text: "Show Filters" }];

		const cases: TriggerCase[] = [
			{
				name: "no trigger config → default icon button",
				trigger: undefined,
				expected: { icon: "filter_list", text: "filter_list", title: "Open filter" }
			},
			{
				name: "enabled, empty value → default icon button",
				trigger: { enabled: true, value: {} },
				expected: { icon: "filter_list", text: "filter_list", title: "Open filter" }
			},
			{
				name: "icon only → custom icon, no label",
				trigger: { enabled: true, value: { icon: CUSTOM_ICON } },
				expected: { icon: "tune", text: "tune", title: "Open filter" }
			},
			{
				name: "icon + labelHidden → custom icon, no label",
				trigger: { enabled: true, value: { icon: CUSTOM_ICON, labelHidden: true } },
				expected: { icon: "tune", text: "tune", title: "Open filter" }
			},
			{
				name: "label only → visible label, no icon",
				trigger: { enabled: true, value: { label: CUSTOM_LABEL } },
				expected: { icon: undefined, text: "Show Filters", title: "Show Filters" }
			},
			{
				name: "icon + label → custom icon and visible label",
				trigger: { enabled: true, value: { icon: CUSTOM_ICON, label: CUSTOM_LABEL } },
				expected: { icon: "tune", text: "tuneShow Filters", title: "Show Filters" }
			},
			{
				name: "label + labelHidden → hidden label, title only",
				trigger: { enabled: true, value: { label: CUSTOM_LABEL, labelHidden: true } },
				expected: { icon: undefined, text: "", title: "Show Filters" }
			}
		];

		it.each(cases)("$name", async ({ trigger, expected }) => {
			const { container } = await setupTest({
				filterConfiguration: {
					filterSelector: { ...baseFilterConfiguration.filterSelector, trigger }
				}
			});

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();
				expect(getIconName(button)).toBe(expected.icon);
				expect(button?.textContent).toBe(expected.text);
				expect(button?.getAttribute("title")).toBe(expected.title);
			});
		});
	});

	describe("Badge", () => {
		it("shows badge when selector is closed and filters are set", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test value" }
			};

			const { container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [filterWithValue] }]
			});

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();

				const badge = button?.querySelector("[data-role='badge-content']");
				expect(badge?.hasAttribute("hidden")).toBe(false);
			});
		});

		it("exposes the localized title on the badge when filters are set", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test value" }
			};

			const { container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [filterWithValue] }]
			});

			await waitFor(() => {
				const badge = queryByDataRole(container, DataRoles.Badge);
				expect(badge?.getAttribute("title")).toBe("Filters are applied");
			});
		});

		it("exposes the German badge title for the de locale", async () => {
			const filterWithValue: OverviewModel.NewFilter.String.Item = {
				...stringFilterItem,
				options: { ...stringFilterItem.options, criteria: "test value" }
			};

			const { container } = await setupTest({
				filterGroups: [{ ...baseFilterGroup, filterItems: [filterWithValue] }],
				locale: deLocale
			});

			await waitFor(() => {
				const badge = queryByDataRole(container, DataRoles.Badge);
				expect(badge?.getAttribute("title")).toBe("Filter sind angewendet");
			});
		});

		it("hides badge when no filters are set", async () => {
			const { container } = await setupTest();

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();

				const badge = button?.querySelector("[data-role='badge-content']");

				if (badge) {
					expect(badge.hasAttribute("hidden")).toBe(true);
				}
			});
		});
	});

	describe("ARIA Attributes", () => {
		it("sets aria-expanded=false when selector is closed", async () => {
			const { container } = await setupTest();

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();
				expect(button?.getAttribute("aria-expanded")).toBe("false");
			});
		});

		it("sets aria-haspopup when viewMode is overlay", async () => {
			const { container } = await setupTest({
				filterConfiguration: { filterSelector: { ...baseFilterConfiguration.filterSelector, viewMode: "overlay" } }
			});

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();
				expect(button?.getAttribute("aria-haspopup")).toBe("true");
			});
		});

		it("does not set aria-haspopup when viewMode is docked", async () => {
			const { container } = await setupTest({
				filterConfiguration: { filterSelector: { ...baseFilterConfiguration.filterSelector, viewMode: "docked" } }
			});

			await waitFor(() => {
				const button = getButton(container);
				expect(button).not.toBeNull();
				expect(button?.hasAttribute("aria-haspopup")).toBe(false);
			});
		});
	});

	describe("Interaction", () => {
		it("click toggles selectorOpen to true when closed", async () => {
			const { container, store } = await setupTest();

			await waitFor(() => {
				expect(getButton(container)).not.toBeNull();
			});

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const button = getButton(container)!;
			await userEvent.click(button);

			await waitFor(() => {
				expect(store.getState().newFilter?.filterSelectorOptions.open).toBe(true);
			});
		});
	});
});
