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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { Footer } from "../../../main/view/components/footer.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";

import { render } from "../../test-utils.js";
import { defaultEngineProps } from "../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.footer", () => {
	function setupTest(props?: Partial<Footer.PropsType>) {
		return render(<Footer buttonPanel={<MockButtonPanel />} pagination={<MockPagination />} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps }
		});
	}

	it("renders the footer correctly", () => {
		const result = setupTest();

		expect(result.getAllByDataRole("mock-button-panel")).toHaveLength(1);
		expect(result.getAllByDataRole("mock-pagination")).toHaveLength(1);
	});

	describe("ariaLevel", () => {
		describe("given a certain level", () => {
			it("should pass it to Widget footer component", () => {
				expect(
					setupTest({ ariaLevel: 5 }).queryByDataRoles(DataRoles.Contentbox.Footer, DataRoles.HiddenText)?.element
				).toHaveAttribute("aria-level", "5");
			});
		});

		describe("given an undefined", () => {
			it("should use default aria-level 2", () => {
				expect(
					setupTest({ ariaLevel: undefined }).queryByDataRoles(DataRoles.Contentbox.Footer, DataRoles.HiddenText)
						?.element
				).toHaveAttribute("aria-level", "2");
			});
		});
	});
});

const MockButtonPanel: React.FC = () => {
	return <div data-role="mock-button-panel" />;
};

const MockPagination: React.FC = () => {
	return <div data-role="mock-pagination" />;
};
