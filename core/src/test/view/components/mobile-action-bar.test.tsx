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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { MobileActionBar } from "../../../main/view/components/mobile-action-bar.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../basic.spec.js";
import { render } from "../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.mobile-action-bar", () => {
	function TestElement(id: string): React.ReactNode {
		return <Button label={id} key={id} data-role="test-button" />;
	}

	function setupTest(buttons: React.ReactNode) {
		return render(<MobileActionBar buttons={buttons} disabled={true} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps }
		});
	}

	describe("given buttons", () => {
		it("renders the Mobile Action Bar correctly", () => {
			const result = setupTest([TestElement("left"), TestElement("right")]);

			expect(
				result.getByDataRoles(DataRoles.Contentbox.Addon, DataRoles.Popup, DataRoles.Popup.TriggerElement).element
			).toBeDisabled();
		});
	});

	describe("given no buttons", () => {
		it("renders nothing", () => {
			expect(setupTest(null).queryAllByDataRole(DataRoles.Contentbox.Addon)).toHaveLength(0);
		});
	});
});
