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

import { noop } from "../utils.js";
import { render, ClassNames } from "../test-utils.js";
import { enLocale, defaultEngineProps } from "../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.footer", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	const buttonALabel = "A";
	const buttonA: OverviewModel.ButtonElement = {
		type: OverviewModel.ElementType.BUTTON,
		event: "A",
		label: [{ locale: enLocale.language, text: buttonALabel }]
	};

	const buttonBLabel = "B";
	const buttonB: OverviewModel.ButtonElement = {
		type: OverviewModel.ElementType.BUTTON,
		event: "B",
		label: [{ locale: enLocale.language, text: buttonBLabel }]
	};
	const buttons = [buttonA, buttonB];

	it("isNotShownWithoutEventButtonsAndPagination", () => {
		const wrapper = render(<OverviewEngine {...basicEngineProps} />);

		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.Footer)).toHaveLength(0);
	});

	it("isShownWithAtLeastOneEventButton", () => {
		const overviewModel: OverviewModel = {
			...basicEngineProps.overviewModel,
			content: {
				...basicEngineProps.overviewModel.content,
				footerBox: { leftSlot: buttons }
			}
		};

		const wrapper = render(<OverviewEngine {...{ ...basicEngineProps, overviewModel }} />);

		expect(wrapper.queryAllByDataRoles(DataRoles.Contentbox.Footer, DataRoles.Button)).toHaveLength(buttons.length);
	});

	it("isShownWithPagination", () => {
		const props: OverviewEngine.Props = {
			...basicEngineProps,
			uiState: { pagination: { pageNumber: 1, pageSize: 1 } },
			totalDocumentsCount: 2,
			eventHandlers: { onPageChange: noop }
		};
		const wrapper = render(<OverviewEngine {...props} />);

		expect(wrapper.queryAllByDataRole(DataRoles.Contentbox.Footer)).toHaveLength(1);
		expect(wrapper.queryAllByDataRoles(DataRoles.Contentbox.Footer, DataRoles.Pagination)).toHaveLength(1);
	});

	it("majorMinorAlignment", () => {
		const overviewModel: OverviewModel = {
			...basicEngineProps.overviewModel,
			content: {
				...basicEngineProps.overviewModel.content,
				footerBox: { rightSlot: [buttonB], leftSlot: [buttonA] }
			}
		};

		const props: OverviewEngine.Props = { ...basicEngineProps, overviewModel };
		const wrapper = render(<OverviewEngine {...props} />);
		const buttonGroupContainer = wrapper.queryByDataRoles(DataRoles.Contentbox.Footer, DataRoles.ButtonGroupContainer);

		expect(buttonGroupContainer?.element).toHaveClass(`${ClassNames.ButtonGroupContainer}--responsive`);

		const leftSlot = buttonGroupContainer?.queryAll(`.${ClassNames.ButtonGroup}--left`);

		expect(leftSlot).toHaveLength(1);
		expect(leftSlot?.first().query("button")?.element).toHaveTextContent("A");

		const rightSlot = buttonGroupContainer?.queryAll(`.${ClassNames.ButtonGroup}--right`);

		expect(rightSlot).toHaveLength(1);
		expect(rightSlot?.first().query("button")?.element).toHaveTextContent("B");
	});
});
