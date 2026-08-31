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

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../main/overview-model.js";
import { OverviewButton } from "../../../main/view/components/overview-button.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { deLocale, defaultEngineProps } from "../../basic.spec.js";
import { render } from "../../test-utils.js";
import { createLocalizedModelText } from "../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.overview-button", () => {
	const basicButtonModel: OverviewModel.Button = {
		event: "A",
		label: createLocalizedModelText("test label"),
		description: createLocalizedModelText("test title")
	};

	const basicOverviewButtonProps: OverviewButton.Props = {
		buttonModel: basicButtonModel,
		componentKey: "anotherComponent"
	};

	const basicEngineProps: OverviewEngine.Props = {
		...defaultEngineProps,
		uiState: { rowState: { "1": { selected: true } } }
	};

	function setupTest(
		overviewButtonProps?: OverviewButton.Props,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	) {
		const mergeOverviewButtonProps: OverviewButton.Props = { ...basicOverviewButtonProps, ...overviewButtonProps };

		return render(
			<OverviewButton {...mergeOverviewButtonProps} />,
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
				const wrapper = setupTest();
				const button = wrapper.getByDataRole(DataRoles.Button).element;

				expect(button).toHaveAttribute("aria-label", expect.stringMatching(/test title EN$/));
				expect(button).toHaveTextContent("test label EN");
			});

			it("should work in german locale", () => {
				const wrapper = setupTest(undefined, undefined, deLocale);
				const button = wrapper.getByDataRole(DataRoles.Button).element;

				expect(button).toHaveAttribute("aria-label", expect.stringMatching(/test title DE$/));
				expect(button).toHaveTextContent("test label DE");
			});
		});
	});
});
