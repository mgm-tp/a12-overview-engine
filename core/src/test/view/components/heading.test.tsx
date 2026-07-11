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
import { it, vi, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, ContentBoxElements, NavigationContentboxContext } from "@com.mgmtp.a12.widgets/widgets-core";

import { Heading } from "../../../main/view/components/heading.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";

import { defaultEngineProps } from "../../basic.spec.js";
import { render, shallowRender } from "../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.heading", () => {
	function setupTest(props?: Partial<Heading.PropsType>) {
		return render(<Heading title={"TITLE_TEST"} buttons={[<Button label={"TEST_BUTTON"} key="1" />]} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, uiState: { disabled: true } }
		});
	}

	it("renders title and subtitle if this props is provided", () => {
		const result = setupTest({ subtitle: "SUBTITLE_TEST" });
		const title = result.getByDataRole(DataRoles.Contentbox.Title);
		const subtitle = result.getByDataRole(DataRoles.Contentbox.Subtitle);
		const mobileActionBar = result.queryAllByDataRole(DataRoles.Contentbox.Addon);

		expect(title.element).toHaveTextContent("TITLE_TEST");
		expect(subtitle.element).toHaveTextContent("SUBTITLE_TEST");
		expect(mobileActionBar).toHaveLength(1);
		expect(mobileActionBar.first().query("button")?.element).toBeDisabled();
	});

	it("renders only title if subtitle props is not provided", () => {
		const result = setupTest();
		const title = result.getByDataRole(DataRoles.Contentbox.Title);
		const subtitle = result.getByDataRole(DataRoles.Contentbox.Subtitle);
		const mobileActionBar = result.queryAllByDataRole(DataRoles.Contentbox.Addon);

		expect(title.element).toHaveTextContent("TITLE_TEST");
		expect(subtitle.element).toHaveTextContent("");
		expect(mobileActionBar).toHaveLength(1);
		expect(mobileActionBar.first().query("button")?.element.getAttribute("disabled")).not.toBeUndefined();
	});

	it("renders hidden text if label is hidden", () => {
		const result = setupTest({ title: "", hiddenText: "HIDDEN_TEXT_TEST", labelHidden: true });

		expect(result.queryAllByDataRole(DataRoles.Contentbox.Title)).toHaveLength(0);
		expect(result.queryAllByDataRole(DataRoles.Contentbox.Subtitle)).toHaveLength(0);
		expect(result.getByDataRole(DataRoles.HiddenText).element).toHaveTextContent("HIDDEN_TEXT_TEST");
	});

	it("render back button when NavigationContext and onBackButtonClicked is defined", async () => {
		const backButtonClickStub = vi.fn();
		const wrapper = await shallowRender(
			<NavigationContentboxContext.Provider value={{ onBackButtonClicked: backButtonClickStub }}>
				<Heading title={"TITLE_TEST"} buttons={[<Button label={"TEST_BUTTON"} key="1" />]} />
			</NavigationContentboxContext.Provider>,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: defaultEngineProps
			}
		);

		const backButton = wrapper.root.findByType(ContentBoxElements.BackButton);

		React.act(() => {
			backButton.props.onBackButtonClicked?.();
		});

		expect(backButtonClickStub).toHaveBeenCalledOnce();
	});

	it("should not render back button when NavigationContext and onBackButtonClicked is defined, but embedded mode is on", async () => {
		const backButtonClickStub = vi.fn();
		const wrapper = await shallowRender(
			<NavigationContentboxContext.Provider value={{ onBackButtonClicked: backButtonClickStub }}>
				<Heading title={"TITLE_TEST"} buttons={[<Button key="1" />]} />
			</NavigationContentboxContext.Provider>,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...defaultEngineProps, embedded: true }
			}
		);

		expect(wrapper.root.findAllByType(ContentBoxElements.BackButton)).toHaveLength(0);
	});

	describe("arialLevel", () => {
		describe("given a certain value", () => {
			it("should pass the value to Widget component", () => {
				expect(setupTest({ ariaLevel: 5 }).getByDataRole(DataRoles.Contentbox.Title).element).toHaveAttribute(
					"aria-level",
					"5"
				);
			});
		});

		describe("given an undefined value", () => {
			it("should pass the value to Widget component", () => {
				expect(
					setupTest({ ariaLevel: undefined }).getByDataRole(DataRoles.Contentbox.Title).element
				).not.toHaveAttribute("aria-level");
			});
		});
	});

	it("should render additionalPrefixes when this prop is provided", () => {
		const additionalPrefixes = <Button label={"ADDITIONAL_PREFIX_BUTTON"} />;
		const result = setupTest({ additionalPrefixes });

		expect(result.query("button")?.element).toHaveTextContent("ADDITIONAL_PREFIX_BUTTON");
	});
});
