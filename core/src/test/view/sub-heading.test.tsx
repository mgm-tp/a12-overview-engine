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

import { OverviewEngineApi } from "../../main/view/api.js";
import { OverviewModel } from "../../main/overview-model.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";

import { render } from "../test-utils.js";
import { enLocale, defaultEngineProps } from "../basic.spec.js";
import { resetWindowSize, setSmallWindowSize } from "../setup/widgets.js";

describe("com.mgmtp.a12.overview-engine.view.sub-heading", () => {
	const basicProps = {
		...defaultEngineProps,
		sorting: OverviewEngineApi.Sorting.getInitialValue(defaultEngineProps.overviewModel),
		pagination: OverviewEngineApi.Pagination.getInitialValue(defaultEngineProps.overviewModel)
	};

	const buttons: OverviewModel.ButtonElement[] = [
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "A",
			label: [{ locale: enLocale.language, text: "A" }]
		},
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "B",
			label: [{ locale: enLocale.language, text: "B" }]
		}
	];

	describe("Given an overview-engine without buttons, search bar and filter selector", () => {
		describe("On desktop device", () => {
			it("Action bar should be not rendered", () => {
				const wrapper = render(<OverviewEngine {...basicProps} />);

				expect(wrapper.queryAll(".contentbox__subheadingActionBar")).toHaveLength(0);
			});
		});

		describe("On small window", () => {
			it("Action bar should be not rendered", async () => {
				await setSmallWindowSize();
				const wrapper = render(<OverviewEngine {...basicProps} />);

				expect(wrapper.queryAll(".contentbox__subheadingActionBar")).toHaveLength(0);

				await resetWindowSize();
			});
		});
	});

	describe("Given an overview-engine with some buttons", () => {
		describe("On desktop device", () => {
			it("Action bar should be rendered with the buttons", () => {
				const overviewModel: OverviewModel = {
					...basicProps.overviewModel,
					content: { ...basicProps.overviewModel.content, subHeaderBox: { leftSlot: buttons } }
				};
				const wrapper = render(<OverviewEngine {...{ ...basicProps, overviewModel }} />);

				expect(wrapper.queryAll(".contentbox__subheadingActionBarGroupArea button")).toHaveLength(buttons.length);
			});
		});

		describe("On small window", () => {
			it("Action bar should be not rendered", async () => {
				await setSmallWindowSize();
				const overviewModel: OverviewModel = {
					...basicProps.overviewModel,
					content: { ...basicProps.overviewModel.content, subHeaderBox: { leftSlot: buttons } }
				};
				const wrapper = render(<OverviewEngine {...{ ...basicProps, overviewModel }} />);

				expect(wrapper.queryAll(".contentbox__subheadingActionBar")).toHaveLength(0);
				await resetWindowSize();
			});
		});
	});
});
