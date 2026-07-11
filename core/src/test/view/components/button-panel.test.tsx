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
import { it, expect, describe } from "vitest";

import { Button, ButtonGroupContainer } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { ButtonPanel } from "../../../main/view/components/button-panel.js";

import { shallowRender } from "../../test-utils.js";
import { defaultEngineProps } from "../../basic.spec.js";

interface PanelButton {
	readonly rank: "left" | "right";
	readonly element: React.ReactNode;
}

describe("com.mgmtp.a12.overview-engine.view.components.button-panel", () => {
	const leftButtons: PanelButton[] = [
		{ rank: "left", element: <Button label={"Left button 1"} /> },
		{ rank: "left", element: <Button label={"Left button 2"} /> }
	];
	const rightButtons: PanelButton[] = [
		{ rank: "right", element: <Button label={"Right button 1"} /> },
		{ rank: "right", element: <Button label={"Right button 2"} /> },
		{ rank: "right", element: <Button label={"Right button 3"} /> }
	];
	const buttons: PanelButton[] = [...leftButtons, ...rightButtons];

	const tests = [
		{ responsive: undefined, expectedResponsive: false },
		{ responsive: false, expectedResponsive: false }
	];
	tests.forEach((testCase) => {
		const buttonPanelType =
			testCase.responsive === undefined
				? "has default responsive prop"
				: testCase.responsive
					? "is responsive"
					: "is unresponsive";

		describe(`given a button-panel that ${buttonPanelType}`, () => {
			it("should render left/right buttons regardless the responsiveness", async () => {
				const buttonPanel = await shallowRender(<ButtonPanel responsive={testCase.responsive} buttons={buttons} />, {
					wrappingComponent: OverviewEngine,
					wrappingComponentProps: defaultEngineProps
				});

				const buttonGroupContainer = buttonPanel.root.findByType(ButtonGroupContainer);

				expect(buttonGroupContainer.props.responsive).toEqual(testCase.expectedResponsive);

				expect(buttonGroupContainer.props.leftSlot).toHaveLength(2);
				expect(buttonGroupContainer.props.leftSlot).toStrictEqual(leftButtons.map((button) => button.element));

				expect(buttonGroupContainer.props.rightSlot).toHaveLength(3);
				expect(buttonGroupContainer.props.rightSlot).toStrictEqual(rightButtons.map((button) => button.element));
			});
		});
	});
});
