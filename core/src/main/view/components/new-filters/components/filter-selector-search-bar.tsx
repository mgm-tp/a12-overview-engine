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

import { memo, type FC, useCallback, type ChangeEvent } from "react";

import { css, styled } from "styled-components";

import { DataRoles, FilterSelectorTemplate as WidgetFilterSelectorTemplate } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorSearchBarProps {
	readonly text: string;
	readonly onTextChange: (newText: string) => void;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelectorSearchBar: FC<FilterSelectorSearchBarProps> = memo(function FilterSelectorSearchBar({
	text,
	onTextChange
}) {
	const SearchInput = useOverviewEngineContext((c) => c.widgetMap.FilterSelectorTemplateSearchInput);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const placeholder = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.selector.searchPlaceholder);

	const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => onTextChange(e.target.value), [onTextChange]);
	const onClearButtonClick = useCallback(() => onTextChange(""), [onTextChange]);

	return (
		<StyledSearchWrapper>
			<SearchInput
				placeholder={placeholder}
				value={text}
				hideLabel
				onChange={onChange}
				onClearButtonClick={onClearButtonClick}
			/>
		</StyledSearchWrapper>
	);
});

const StyledSearchWrapper = styled(WidgetFilterSelectorTemplate.ActionBar)(({ theme }) => {
	const { contentBox } = theme.components;

	return css`
		background-color: ${contentBox.actionBar.background};

		[data-role="${DataRoles.TextField.Input.Wrapper}"] {
			background-color: ${contentBox.subHeading.inputBackground};
		}
	`;
});
