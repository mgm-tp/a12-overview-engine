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

import { it, vi, expect, describe } from "vitest";
import { fireEvent } from "@testing-library/react";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { Button } from "../../../main/view/components/button.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";

import { render } from "../../test-utils.js";
import { defaultEngineProps } from "../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.button", () => {
	const spyFunction = vi.fn();
	const basicEngineProps = defaultEngineProps;

	function setupTest(props?: Partial<Button.PropsType>) {
		return render(
			<Button
				label={"TEST_BUTTON"}
				disabled={true}
				primary={true}
				destructive={true}
				className={"TEST_CLASS_NAME"}
				onClick={spyFunction}
				icon={<Icon dataRole="add-icon">add</Icon>}
				{...props}
			/>,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: basicEngineProps
			}
		);
	}

	describe("renders the Button correctly", () => {
		describe("given icon and label", () => {
			it("button should have icon and label", () => {
				const wrapper = setupTest();

				expect(wrapper.queryAllByDataRole("add-icon")).toHaveLength(1);
				expect(wrapper.getByDataRole(DataRoles.Button).element).toHaveTextContent("TEST_BUTTON");
			});
		});

		describe("only given label", () => {
			it("button should only have label", () => {
				const wrapper = setupTest({ icon: undefined });
				const button = wrapper.getByDataRole(DataRoles.Button);

				expect(button.queryAllByDataRole("add-icon")).toHaveLength(0);
				expect(button.element).toHaveTextContent("TEST_BUTTON");
			});
		});

		describe("only given icon", () => {
			it("button should only have icon", () => {
				const wrapper = setupTest({ label: undefined });
				const button = wrapper.getByDataRole(DataRoles.Button);

				expect(button.queryAllByDataRole("add-icon")).toHaveLength(1);
				expect(button.element).not.toHaveTextContent("TEST_BUTTON");
			});
		});

		describe("given an undefined title", () => {
			it("button should not have title", () => {
				const wrapper = setupTest();

				expect(wrapper.getByDataRole(DataRoles.Button).element).not.toHaveAccessibleDescription("Test");
			});
		});

		describe("given a title", () => {
			it("button should have configured title", () => {
				const wrapper = setupTest({ description: "Test" });

				expect(wrapper.getByDataRole(DataRoles.Button).element).toHaveAttribute(
					"aria-label",
					expect.stringMatching(/Test$/)
				);
			});
		});

		describe("given a hidden label", () => {
			it("button should not have label", () => {
				const wrapper = setupTest({ labelHidden: true });
				const button = wrapper.getByDataRole(DataRoles.Button);

				expect(button.element).not.toHaveTextContent("TEST_BUTTON");
			});
		});

		it("renders other props correctly", () => {
			const button = setupTest().getByDataRole(DataRoles.Button).element;

			expect(button).toBeDisabled();
			expect(button).toHaveClass("button--destructive");
			expect(button).toHaveClass("button--primary");
			expect(button).toHaveClass("TEST_CLASS_NAME");

			fireEvent.click(button);

			expect(spyFunction).not.toHaveBeenCalled();
		});
	});
});
