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

import { Lens } from "monocle-ts";
import { it, expect, describe } from "vitest";
import { waitFor } from "@testing-library/react";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewModel as OverviewModelNs } from "../../../../../main/overview-model.js";
import {
	useFilterTriggerPlacement,
	type FilterTriggerPlacement
} from "../../../../../main/view/components/new-filters/hooks/use-filter-trigger-placement.js";

import { ProductFieldIds } from "../../../../setup/product-field-ids.js";
import { getDocumentModel, getOverviewModel } from "../../../../setup/models.js";
import { renderWithStore, baseFilterGroup, baseFilterConfiguration } from "../setup.js";

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);
const enableFilterLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "enableFilter"]);
const subHeaderBoxLens = Lens.fromPath<OverviewModel>()(["content", "subHeaderBox"]);

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

function Probe(props: { onResolve: (value: FilterTriggerPlacement) => void }) {
	const placement = useFilterTriggerPlacement();
	props.onResolve(placement);

	return null;
}

interface RunOptions {
	readonly enableFilter?: boolean;
	readonly removeNewFilterConfig?: boolean;
	readonly filterConfiguration?: Partial<OverviewModel.NewFilterConfiguration>;
	readonly filterGroups?: OverviewModel.NewFilter.Group[];
	readonly subHeaderBox?: OverviewModel.SubHeaderBox | null;
}

async function resolvePlacement(options: RunOptions = {}): Promise<FilterTriggerPlacement> {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");

	const filterGroups = options.filterGroups ?? [{ ...baseFilterGroup, filterItems: [stringFilterItem] }];

	let overviewModel: OverviewModel = productOM;

	if (options.removeNewFilterConfig) {
		overviewModel = filterConfigurationLens.set(undefined as never)(overviewModel);
	} else {
		overviewModel = filterConfigurationLens.set({
			...baseFilterConfiguration,
			...options.filterConfiguration,
			filterGroups
		})(overviewModel);
	}

	if (options.enableFilter !== undefined) {
		overviewModel = enableFilterLens.set(options.enableFilter)(overviewModel);
	}

	// `null` => clear subHeaderBox entirely (covers "undefined subHeaderBox" case).
	// `undefined` => keep ProductOM default.
	if (options.subHeaderBox === null) {
		overviewModel = subHeaderBoxLens.set(undefined as never)(overviewModel);
	} else if (options.subHeaderBox !== undefined) {
		overviewModel = subHeaderBoxLens.set(options.subHeaderBox)(overviewModel);
	}

	let resolved: FilterTriggerPlacement | undefined;

	await renderWithStore(<Probe onResolve={(p) => (resolved = p)} />, {
		engineProps: { documentModel, overviewModel, data: [] }
	});

	await waitFor(() => {
		expect(resolved).toBeDefined();
	});

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return resolved!;
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.use-filter-trigger-placement", () => {
	it("returns 'none' when enableFilter is false", async () => {
		expect(await resolvePlacement({ enableFilter: false })).toBe("none");
	});

	it("returns 'none' when no newFilterConfiguration", async () => {
		expect(await resolvePlacement({ removeNewFilterConfig: true })).toBe("none");
	});

	it("returns 'none' when trigger config is disabled (custom trigger)", async () => {
		const placement = await resolvePlacement({
			filterConfiguration: {
				filterSelector: { ...baseFilterConfiguration.filterSelector, trigger: { enabled: false } }
			}
		});

		expect(placement).toBe("none");
	});

	it("returns 'none' for a disabled trigger even when a filter prefers the filter bar", async () => {
		const placement = await resolvePlacement({
			filterGroups: [{ ...baseFilterGroup, filterItems: [{ ...stringFilterItem, preferFilterBar: true }] }],
			filterConfiguration: {
				filterSelector: { ...baseFilterConfiguration.filterSelector, trigger: { enabled: false } }
			}
		});

		expect(placement).toBe("none");
	});

	it("returns 'filter-bar' when any filter has preferFilterBar", async () => {
		const placement = await resolvePlacement({
			filterGroups: [{ ...baseFilterGroup, filterItems: [{ ...stringFilterItem, preferFilterBar: true }] }]
		});

		expect(placement).toBe("filter-bar");
	});

	it("returns 'header-suffix' when subHeaderBox is undefined", async () => {
		expect(await resolvePlacement({ subHeaderBox: null })).toBe("header-suffix");
	});

	it("returns 'header-suffix' when subHeaderBox has empty slots", async () => {
		expect(await resolvePlacement({ subHeaderBox: { leftSlot: [], rightSlot: [] } })).toBe("header-suffix");
	});

	it("returns 'search-adjacent' when subHeaderBox contains a SearchElement", async () => {
		const placement = await resolvePlacement({
			subHeaderBox: { rightSlot: [{ type: OverviewModelNs.ElementType.SEARCH }] }
		});

		expect(placement).toBe("search-adjacent");
	});

	it("returns 'action-bar' when subHeaderBox has elements but no SearchElement", async () => {
		const placement = await resolvePlacement({
			subHeaderBox: {
				rightSlot: [{ type: OverviewModelNs.ElementType.BUTTON, event: "doStuff" }]
			}
		});

		expect(placement).toBe("action-bar");
	});

	it("prefers 'filter-bar' over subHeaderBox-based placements", async () => {
		const placement = await resolvePlacement({
			filterGroups: [{ ...baseFilterGroup, filterItems: [{ ...stringFilterItem, preferFilterBar: true }] }],
			subHeaderBox: { rightSlot: [{ type: OverviewModelNs.ElementType.SEARCH }] }
		});

		expect(placement).toBe("filter-bar");
	});
});
