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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../main/overview-model.js";
import { OverviewContentBox } from "../../main/view/overview-content-box.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { defaultEngineProps } from "../basic.spec.js";
import { resetWindowSize, setSmallWindowSize } from "../setup/widgets.js";
import { render } from "../test-utils.js";
import { noop } from "../utils.js";

describe("com.mgmtp.a12.overview-engine.view.OverviewContentBox with/without labelHidden", () => {
	const basicOverviewModel: OverviewModel = defaultEngineProps.overviewModel;

	function setupTestWithLabelHidden(labelHidden: true | undefined) {
		const basicEngineProps: OverviewEngine.Props = {
			...defaultEngineProps,
			overviewModel: {
				...basicOverviewModel,
				content: {
					...basicOverviewModel.content,
					configuration: { ...basicOverviewModel.content.configuration, labelHidden: labelHidden }
				}
			}
		};

		return render(<OverviewContentBox />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: {
				eventHandlers: {
					...basicEngineProps.eventHandlers,
					onSearch: noop
				},
				...basicEngineProps
			}
		});
	}

	describe("given labelHidden = true", () => {
		it("should not show content box heading on normal mode", () => {
			const wrapper = setupTestWithLabelHidden(true);

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.Heading).element).toBeNull();
		});

		it("should show content box heading on mobile mode", async () => {
			await setSmallWindowSize();

			const wrapper = setupTestWithLabelHidden(true);

			expect(wrapper.getByDataRole(DataRoles.Contentbox.Heading).element).toBeDefined();

			await resetWindowSize();
		});
	});

	describe("given labelHidden = undefined", () => {
		it("should show content box heading", () => {
			const wrapper = setupTestWithLabelHidden(undefined);

			expect(wrapper.getByDataRole(DataRoles.Contentbox.Heading).element).toBeDefined();
		});
	});
});
