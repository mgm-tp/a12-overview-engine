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
import { css, styled, useTheme, ThemeProvider } from "styled-components";

import {
	List,
	addPrefix,
	PopUpMenu,
	createTheme,
	HeaderTrigger,
	activeAndHover,
	type DefaultThemeType
} from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngineApi } from "../../../api.js";
import { DocumentModelUtils } from "../../../../models/internal/shared.js";
import { LocalizerHooks } from "../../../../services/localization/index.js";
import { type Filter, type FilterOptionsView } from "../filter-options-view.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { type EnumerationFilterOptionsView } from "./enumeration-filter-options-view.js";
import { convertToNumberFilterOptions, type NumberFilterOptionsView } from "./number-filter-options-view.js";

/** @internal */
export namespace EnumerationSuffixSelector {
	export interface Props extends Pick<FilterOptionsView.PropsType, "onChange" | "modelId"> {
		filterData: Filter.FilterData;
		enumerationOptions: EnumerationFilterOptionsView.EnumerationOption[];
		numberUiValues: NumberFilterOptionsView.NumberUiValueType;
	}
}

/** @internal */
export const EnumerationSuffixSelector: React.ComponentType<EnumerationSuffixSelector.Props> = React.memo(
	function EnumerationSuffixSelector(props: EnumerationSuffixSelector.Props) {
		const { enumerationOptions, numberUiValues, filterData, onChange } = props;
		const documentModel = useOverviewEngineContext((context) => context.documentModel);

		const sortByLocale = LocalizerHooks.useLocaleSorter();
		const options = React.useMemo<EnumerationFilterOptionsView.EnumerationOption[]>(() => {
			return DocumentModelUtils.isAlphabeticalSortedField(documentModel, filterData.path)
				? sortByLocale(enumerationOptions, ({ label }) => label)
				: enumerationOptions;
		}, [enumerationOptions, documentModel, filterData.path, sortByLocale]);

		const triggerChange = React.useCallback(
			(options: EnumerationFilterOptionsView.EnumerationOption[]) => {
				// Always trigger change for number options view (with criteria) so that the filter will be activated.
				onChange?.(convertToNumberFilterOptions(numberUiValues, props.modelId, true), numberUiValues);

				// Then trigger the change for enumeration option
				const selectedValues = options.filter((option) => option.checked).map((option) => option.value);
				onChange?.(
					OverviewEngineApi.Filter.EnumeratedSuffixOptions.create(selectedValues, props.modelId),
					undefined,
					filterData.id
				);
			},
			[filterData.id, numberUiValues, onChange, props.modelId]
		);

		const onOptionValueChange = React.useCallback(
			(option: EnumerationFilterOptionsView.EnumerationOption) => {
				triggerChange(
					enumerationOptions.map((currentOption) => {
						if (currentOption.value === option.value) {
							return { ...currentOption, checked: true };
						}

						return { ...currentOption, checked: false };
					})
				);
			},
			[enumerationOptions, triggerChange]
		);

		const activeOption = React.useMemo(() => {
			return enumerationOptions.find((o) => o.checked)?.label || "";
		}, [enumerationOptions]);

		const theme = useTheme() as DefaultThemeType;
		const customTheme = React.useMemo(() => {
			return createTheme({
				...theme,
				components: {
					...theme.components,
					popupMenu: {
						...theme.components.popupMenu,
						menu: { ...theme.components.popupMenu.menu, minWidth: "0" }
					}
				}
			});
		}, [theme]);

		return (
			<ThemeProvider theme={customTheme}>
				<PopUpMenu
					className={addPrefix("-u-height-full -u-width-full")}
					orientation="bottom-end"
					triggerElement={
						<StyledCustomButton
							text={activeOption}
							meta="keyboard_arrow_down"
							className={addPrefix("-u-normal-case")}
						/>
					}>
					<List>
						{options.map((option) => (
							<List.Item
								key={option.value}
								text={option.label}
								active={option.active}
								className={addPrefix("-u-text-right")}
								onClick={() => onOptionValueChange(option)}
							/>
						))}
					</List>
				</PopUpMenu>
			</ThemeProvider>
		);
	}
);

const StyledCustomButton = styled(HeaderTrigger)((params) => {
	const theme = params.theme as DefaultThemeType;
	const { textLine } = theme.components;
	const { input } = theme.applicationStyles;
	const { placeHolderBackgroundLight } = theme.colors;

	return css`
		background-color: ${textLine.textSuffix.background};
		min-height: ${input.height};
		width: 100%;
		justify-content: center;
		gap: 0;
		color: inherit;
		border: none;
		border-radius: 0;
		border-top-right-radius: ${input.borderRadius};
		border-bottom-right-radius: ${input.borderRadius};

		${activeAndHover(css`
			background-color: ${placeHolderBackgroundLight};
			color: inherit;
			border: none;
		`)}

		&:focus {
			background-color: ${placeHolderBackgroundLight};
			color: inherit;
			border: none;
		}
	`;
});
