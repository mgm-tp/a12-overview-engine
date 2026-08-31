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

import { OverviewModel } from "../../main/overview-model.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { enLocale, defaultEngineProps } from "../basic.spec.js";
import { resetWindowSize, setSmallWindowSize } from "../setup/widgets.js";
import { render } from "../test-utils.js";

const contentBoxDataRole = "contentbox";

describe("com.mgmtp.a12.overview-engine.view.heading", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	const buttonALabel = "A";
	const buttonA = {
		type: OverviewModel.ElementType.BUTTON,
		event: "A",
		label: [{ locale: enLocale.language, text: buttonALabel }]
	};

	const buttonBLabel = "B";
	const buttonB = {
		type: OverviewModel.ElementType.BUTTON,
		event: "B",
		label: [{ locale: enLocale.language, text: buttonBLabel }]
	};

	it("render heading addon on small window", async () => {
		await setSmallWindowSize();
		const props: OverviewEngine.Props = {
			...basicEngineProps,
			overviewModel: {
				...basicEngineProps.overviewModel,
				content: { ...basicEngineProps.overviewModel.content, subHeaderBox: { leftSlot: [buttonA, buttonB] } }
			}
		};
		const wrapper = render(<OverviewEngine {...props} />);

		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.Addon)).toHaveLength(1);
		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.GroupActionBar)).toHaveLength(0);

		await resetWindowSize();
	});

	it("render action bar group area on wide window", () => {
		const props: OverviewEngine.Props = {
			...basicEngineProps,
			overviewModel: {
				...basicEngineProps.overviewModel,
				content: { ...basicEngineProps.overviewModel.content, subHeaderBox: { leftSlot: [buttonA, buttonB] } }
			}
		};
		const wrapper = render(<OverviewEngine {...props} />);

		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.Addon)).toHaveLength(0);
		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.GroupActionBar)).toHaveLength(1);
	});

	it("button alignment", () => {
		const overviewModel: OverviewModel = {
			...basicEngineProps.overviewModel,
			content: {
				...basicEngineProps.overviewModel.content,
				subHeaderBox: { leftSlot: [buttonA], rightSlot: [buttonB] }
			}
		};

		const wrapper = render(<OverviewEngine {...{ ...basicEngineProps, overviewModel }} />);

		const buttonGroups = wrapper.queryAll(`[data-role="${contentBoxDataRole}-subheading"] [data-role="button-group"]`);

		expect(buttonGroups).toHaveLength(2);

		const leftButton = buttonGroups.get(0).queryAll("button");

		expect(leftButton).toHaveLength(1);
		expect(leftButton.first().element).toHaveTextContent(buttonALabel);

		const rightButton = buttonGroups.get(1).queryAll("button");

		expect(rightButton).toHaveLength(1);
		expect(rightButton.first().element).toHaveTextContent(buttonBLabel);
	});
});
