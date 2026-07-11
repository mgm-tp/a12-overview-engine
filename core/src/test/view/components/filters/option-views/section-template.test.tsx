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

import { styled } from "styled-components";
import { it, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/shared.js";
import {
	SectionType,
	SectionTemplate
} from "../../../../../main/view/components/filters/options-views/section-template.js";

import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableList } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.option-views.section-template", () => {
	const basicProps: SectionTemplate.Props = {
		errorMessage: undefined,
		sectionRenderer: (type: SectionType) => <div>{type}</div>
	};

	function setupTest(props?: Partial<SectionTemplate.Props>, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<SectionTemplate {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, ...engineProps }
		});
	}

	describe("render correctly", () => {
		describe("ErrorMessageBox", () => {
			it.each(["", undefined])("should not render ErrorMessageBox if errorMessage = %s", (errorMessage) => {
				const wrapper = setupTest({ ...basicProps, errorMessage });

				expect(wrapper.queryAllByDataRole(DataRoles.Messagebox)).toHaveLength(0);
			});

			it("should render ErrorMessageBox if errorMessage is provided", () => {
				const errorMessage = "error";
				const wrapper = setupTest({ ...basicProps, errorMessage });

				expect(wrapper.getByDataRole(DataRoles.Messagebox).element).toHaveTextContent(errorMessage);
			});
		});

		describe("Filter Selector sections", () => {
			it("should render section header and section content according to sectionRenderer", () => {
				const StyledSection = styled.div``;
				const wrapper = setupTest({
					...basicProps,
					sectionRenderer: (type: SectionType) => <StyledSection data-role="styled-section">{type}</StyledSection>
				});

				const filterSelectorTemplateSections: QueriableList = wrapper.queryAllByDataRole(
					DataRoles.FilterSelector.Section
				);

				expect(filterSelectorTemplateSections).toHaveLength(2);

				const sectionHeaders = [
					en.overviewEngine.filterOptionView.sectionHeader.start,
					en.overviewEngine.filterOptionView.sectionHeader.end
				];
				filterSelectorTemplateSections.forEach((section, sectionIndex) => {
					expect(section).toHaveTextContent(sectionHeaders[sectionIndex]);
				});

				const sections = wrapper.queryAllByDataRole("styled-section");

				expect(sections).toHaveLength(2);

				const sectionLabels = [SectionType.START, SectionType.END];
				sections.forEach((section, sectionIndex) => {
					expect(section).toHaveTextContent(sectionLabels[sectionIndex]);
				});
			});
		});
	});
});
