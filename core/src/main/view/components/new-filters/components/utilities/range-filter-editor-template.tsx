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

import { memo, type FC, type ReactNode } from "react";

import { styled } from "styled-components";

import { Label, InputElements } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import type { SegmentOption } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface RangeFilterEditorTemplateProps {
	readonly renderInput: (segment: SegmentOption) => ReactNode;
	readonly range: OverviewModel.NewFilter.RangeOption;
	readonly overallErrorMessage?: string;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const RangeFilterEditorTemplate: FC<RangeFilterEditorTemplateProps> = memo(function RangeFilterEditorTemplate({
	renderInput,
	range,
	overallErrorMessage
}) {
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const rangeKeys = RESOURCE_KEYS.overviewEngine.newFilter.rangeEditor;
	const settingKeys = RESOURCE_KEYS.overviewEngine.newFilter.setting;

	return (
		<>
			{overallErrorMessage && <InputElements.Error errorMessage={overallErrorMessage} />}
			{(range === "fromTo" || range === "fromOnly") && (
				<TemplateContainer data-role="range-filter-input">
					<StyledLabel label={localizedResource(rangeKeys.fromLabel)} />
					{renderInput("from")}
				</TemplateContainer>
			)}
			{(range === "fromTo" || range === "toOnly") && (
				<TemplateContainer data-role="range-filter-input">
					<StyledLabel label={localizedResource(rangeKeys.toLabel)} />
					{renderInput("to")}
				</TemplateContainer>
			)}
			{range === "exact" && (
				<TemplateContainer data-role="range-filter-input">
					<StyledLabel label={localizedResource(settingKeys.exact)} />
					{renderInput("exact")}
				</TemplateContainer>
			)}
		</>
	);
});

/** @deprecated Redundant styled-component — single property (font-weight). */
const StyledLabel = styled(Label)`
	font-weight: ${({ theme }) => theme.typography.fontWeight.mediumFontWeight};
`;

const TemplateContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;

	& > div:last-child {
		flex-basis: 70%;
		flex-grow: unset;
	}
`;
