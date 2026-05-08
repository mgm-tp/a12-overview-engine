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

import { it, expect, describe } from "vitest";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewEngineApi } from "../../main/view/api.js";
import { type JSONDocument } from "../../main/models/index.js";
import { type OverviewModel } from "../../main/overview-model.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { RowAction } from "../../main/view/components/table/sub-components/row-action.js";

import { render } from "../test-utils.js";
import { mockType, createLocalizedModelText } from "../utils.js";
import { deLocale, enLocale, defaultEngineProps } from "../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.row-action", () => {
	const basicProps = {
		...defaultEngineProps,
		sorting: OverviewEngineApi.Sorting.getInitialValue(defaultEngineProps.overviewModel),
		pagination: OverviewEngineApi.Pagination.getInitialValue(defaultEngineProps.overviewModel)
	};

	const actions = [
		{
			event: "A",
			label: [{ locale: enLocale.language, text: "Button with text only" }],
			styles: ["styleA"]
		},
		{
			event: "B",
			title: [{ locale: enLocale.language, text: "Button with icon only and title" }],
			styles: ["styleB1", "styleB2"],
			icon: { name: "add" }
		},
		{
			event: "C",
			label: [{ locale: enLocale.language, text: "Button with icon and text" }],
			styles: ["styleB1", "styleB2"],
			icon: { name: "add" }
		}
	];

	it("isNotShownWithoutActions", () => {
		const wrapper = render(<OverviewEngine {...basicProps} />);

		expect(wrapper.queryAll(".table__actionCell")).toHaveLength(0);
	});

	it("isShownWithAtLeastOneAction", () => {
		const props = {
			...basicProps,
			overviewModel: {
				...basicProps.overviewModel,
				content: { ...basicProps.overviewModel.content, rowActionGroup: { actions } }
			}
		};
		const wrapper = render(<OverviewEngine {...props} />);

		expect(wrapper.queryAll(".table__header .table__actionCell")).toHaveLength(1);
		expect(wrapper.queryAll(".table__content .table__actionCell")).toHaveLength(props.data.length);
		expect(wrapper.queryAll(".table__footer .table__actionCell")).toHaveLength(1);
	});

	it("isStyleable", () => {
		const props = {
			...basicProps,
			overviewModel: {
				...basicProps.overviewModel,
				content: {
					...basicProps.overviewModel.content,
					rowActionGroup: { actions }
				}
			}
		};

		const wrapper = render(<OverviewEngine {...props} />);

		wrapper.queryAll(".table__content .table__actionCell button").forEach((element, index) => {
			actions[index % actions.length].styles.forEach((style) => {
				expect(element).toHaveClass(style);
			});
		});
	});

	const basicEngineProps = defaultEngineProps;

	const basicRowActionModel: OverviewModel.Button = {
		event: "A",
		label: createLocalizedModelText("test label"),
		description: createLocalizedModelText("test title")
	};

	const basicRowActionProps: RowAction.PropsType = {
		row: mockType<JSONDocument>(),
		rowActionModel: basicRowActionModel
	};

	function setupTest(
		rowActionProps?: RowAction.PropsType,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	) {
		const mergeRowActionProps: RowAction.PropsType = { ...basicRowActionProps, ...rowActionProps };

		return render(
			<RowAction {...mergeRowActionProps} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	describe("props", () => {
		describe("label and title", () => {
			it("should work in english locale", () => {
				const button = setupTest().getByDataRole("button");

				expect(button?.element).toHaveTextContent("test label EN");
				expect(button.element).toHaveAttribute("aria-label", expect.stringMatching(/test title EN$/));
			});

			it("should work in german locale", () => {
				const button = setupTest(undefined, undefined, deLocale).getByDataRole("button");

				expect(button?.element).toHaveTextContent("test label DE");
				expect(button.element).toHaveAttribute("aria-label", expect.stringMatching(/test title DE$/));
			});
		});
	});
});
