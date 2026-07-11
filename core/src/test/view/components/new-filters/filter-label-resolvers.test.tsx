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

import * as React from "react";
import { Lens } from "monocle-ts";
import { it, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewModel } from "../../../../main/overview-model.js";
import {
	useFilterLabelResolver,
	useFilterGroupLabelResolver
} from "../../../../main/view/components/new-filters/components/filter-label-resolvers.js";

import { ProductFieldIds } from "../../../setup/product-field-ids.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";

import { renderWithStore, baseFilterGroup, baseFilterConfiguration } from "./setup.js";

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);

interface ProbeProps {
	readonly filterItem?: OverviewModel.NewFilter.Item;
	readonly filterGroup?: OverviewModel.NewFilter.Group;
}

const Probe: React.FC<ProbeProps> = ({ filterItem, filterGroup }) => {
	const resolveLabel = useFilterLabelResolver();
	const resolveGroupLabel = useFilterGroupLabelResolver();

	return (
		<div>
			{filterItem !== undefined && <span data-testid="item-label">{resolveLabel(filterItem)}</span>}
			{filterGroup !== undefined && <span data-testid="group-label">{resolveGroupLabel(filterGroup)}</span>}
		</div>
	);
};

async function setup(probeProps: ProbeProps, filterItems: OverviewModel.NewFilter.Item[] = []) {
	const documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");
	const overviewModel = filterConfigurationLens.set({
		...baseFilterConfiguration,
		filterGroups: [{ ...baseFilterGroup, filterItems }]
	})(productOM);

	return renderWithStore(<Probe {...probeProps} />, {
		engineProps: { documentModel, overviewModel, data: [] }
	});
}

const stringFilterItem: OverviewModel.NewFilter.String.Item = {
	id: "string-1",
	type: "string",
	label: [{ locale: "en", text: "Name Label" }],
	preferFilterBar: true,
	options: {
		fieldId: ProductFieldIds.name.id,
		empty: { enabled: true, value: false },
		caseSensitive: { enabled: true, value: false },
		exactMatch: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

const queryFilterItem: OverviewModel.NewFilter.Query.Item = {
	id: "query-1",
	type: "query",
	label: [],
	preferFilterBar: true,
	description: [{ locale: "en", text: "Custom Query Description" }],
	options: {
		operator: { operator: Query.OPERATORS.AND_OPERATOR, operands: [] },
		enabled: { enabled: true, value: true }
	}
};

describe("useFilterLabelResolver", () => {
	it("returns explicit label when filter item has localized label", async () => {
		const { findByTestId } = await setup({ filterItem: stringFilterItem }, [stringFilterItem]);
		const label = await findByTestId("item-label");

		expect(label.textContent).toBe("Name Label");
	});

	it("falls back to field label when item label is missing for FieldBasedItem", async () => {
		const noLabel = { ...stringFilterItem, id: "string-2", label: [] };
		const { findByTestId } = await setup({ filterItem: noLabel }, [noLabel]);
		const label = await findByTestId("item-label");

		expect(label.textContent).not.toBe("");
	});

	it("uses description for Query filter when label missing", async () => {
		const { findByTestId } = await setup({ filterItem: queryFilterItem }, [queryFilterItem]);
		const label = await findByTestId("item-label");

		expect(label.textContent).toBe("Custom Query Description");
	});

	it("returns explicit label for Query filter when label set", async () => {
		const labeled: OverviewModel.NewFilter.Query.Item = {
			...queryFilterItem,
			id: "query-2",
			label: [{ locale: "en", text: "Explicit Label" }]
		};
		const { findByTestId } = await setup({ filterItem: labeled }, [labeled]);
		const label = await findByTestId("item-label");

		expect(label.textContent).toBe("Explicit Label");
	});

	it("returns empty string for Query filter when both label and description missing", async () => {
		const empty: OverviewModel.NewFilter.Query.Item = {
			...queryFilterItem,
			id: "query-3",
			label: [],
			description: []
		};
		const { findByTestId } = await setup({ filterItem: empty }, [empty]);
		const label = await findByTestId("item-label");

		expect(label.textContent).toBe("");
	});
});

describe("useFilterGroupLabelResolver", () => {
	it("returns localized group label", async () => {
		const group: OverviewModel.NewFilter.Group = {
			id: "g1",
			name: "g1",
			label: [{ locale: "en", text: "Group Title" }],
			filterItems: []
		};
		const { findByTestId } = await setup({ filterGroup: group });
		const label = await findByTestId("group-label");

		expect(label.textContent).toBe("Group Title");
	});

	it("returns empty string when group label is empty", async () => {
		const group: OverviewModel.NewFilter.Group = {
			id: "g2",
			name: "g2",
			label: [],
			filterItems: []
		};
		const { findByTestId } = await setup({ filterGroup: group });
		const label = await findByTestId("group-label");

		expect(label.textContent).toBe("");
	});
});
