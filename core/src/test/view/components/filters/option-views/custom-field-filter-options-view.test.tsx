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

import "../../../../setup/jsdom.js";

import { vi, it, expect, describe } from "vitest";
import { fireEvent } from "@testing-library/react";

import { type OverviewEngineApi } from "../../../../../main/view/api.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { CustomFieldFilterOptionsView } from "../../../../../main/view/components/filters/options-views/custom-field-filter-options-view.js";

import { render, DataRoles } from "../../../../test-utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";

import { getClearAllButton } from "./shared.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.custom-field-filter-options-view", () => {
	const viewName = "CustomField";

	const basicProps: CustomFieldFilterOptionsView.Props = {
		path: [],
		viewName: viewName,
		uiValue: { value: "" }
	};

	function setupTest(props?: Partial<CustomFieldFilterOptionsView.Props>, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<CustomFieldFilterOptionsView {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, ...engineProps }
		});
	}

	describe("Given a normal filter option view", () => {
		describe("render a string filter option view", () => {
			it("initial states with viewName and disabled clearAllButton", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText(viewName).element).toBeInTheDocument();

				const clearAllButton = getClearAllButton(wrapper);

				expect(clearAllButton).toBeInTheDocument();
				expect(clearAllButton).toBeDisabled();
			});

			it("onChange should always receive option with filterType=CustomField", () => {
				const onChangeSpy = vi.fn();

				const wrapper = setupTest({ onChange: onChangeSpy });

				fireEvent.input(wrapper.getByDataRole(DataRoles.Textline.Input).element, { target: { value: "mock-value" } });

				const stringFilterOption: OverviewEngineApi.Filter.StringOptions = {
					filterType: "String",
					criteria: { value: "mock-value" }
				};

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ ...stringFilterOption, filterType: "CustomField" });
			});
		});
	});
});
