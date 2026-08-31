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

import * as TypeMoq from "typemoq";
import { it, expect, describe } from "vitest";

import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { CustomFieldTypeCell } from "../../../../../main/view/components/table/sub-components/custom-field-type-cell.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.custom-field-type-cell", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	const basicProps: CustomFieldTypeCell.Props = {
		uiValue: "default-value",
		dataType: TypeMoq.Mock.ofType<DocumentModel.CustomFieldType>().object
	};

	function setupTest(props?: Partial<CustomFieldTypeCell.Props>): QueriableElement {
		return render(<CustomFieldTypeCell {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: basicEngineProps
		});
	}

	describe("given an uiValue", () => {
		const uiValue = "mock-ui-value";

		it("should render the uiValue", () => {
			const wrapper = setupTest({ uiValue });

			expect(wrapper.element).toHaveTextContent(uiValue);
		});
	});
});
