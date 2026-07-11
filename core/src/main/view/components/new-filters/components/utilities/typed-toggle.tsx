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
import { memo, useMemo, type ReactNode } from "react";

import { Toggle, StyledToggle, StyledFieldLabel } from "@com.mgmtp.a12.widgets/widgets-core";

import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";

export interface ToggleSettingProps<T = string> {
	readonly label?: string;
	readonly items: { value: T; label: ReactNode }[];
	readonly selectedValue: T;
	readonly onChange: (value: T) => void;
}

const ToggleSettingMemo = memo(function ToggleSetting(props: ToggleSettingProps<unknown>) {
	return (
		<CustomToggle
			showOnlySelectedOption
			block
			label={props.label}
			value={String(props.selectedValue)}
			onValueChanged={(newValue) => {
				const item = props.items.find((i) => newValue === String(i.value));

				if (!item) {
					throw new Error(`ToggleSetting: No item found for value ${newValue}`);
				}

				props.onChange(item.value);
			}}>
			{props.items.map((item) => {
				return (
					<Toggle.Item value={String(item.value)} key={String(item.value)}>
						{item.label}
					</Toggle.Item>
				);
			})}
		</CustomToggle>
	);
});

export function ToggleSetting<T = string>(props: ToggleSettingProps<T>) {
	return <ToggleSettingMemo {...(props as ToggleSettingProps<unknown>)} />;
}

const t = RESOURCE_KEYS.overviewEngine.newFilter.setting;

export const BooleanToggleSetting = memo(function BooleanToggleSetting(
	props: Omit<ToggleSettingProps<boolean>, "items">
) {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const items = useMemo(
		() => [
			{ value: true as const, label: localizedResource(t.yes) },
			{ value: false as const, label: localizedResource(t.no) }
		],
		[localizedResource]
	);

	return <ToggleSetting<boolean> {...props} items={items} />;
});

const CustomToggle: typeof Toggle = styled(Toggle)`
	width: 100%;
	display: flex;
	justify-content: space-between;

	${StyledToggle.StyledToggleWrapper} {
		flex: 1;
	}

	${StyledFieldLabel} {
		font-weight: ${({ theme }) => theme.typography.fontWeight.regularFontWeight};
	}

	&:has(${StyledFieldLabel}) ${StyledToggle.StyledToggleWrapper} {
		flex: 0 0 70%;
	}
`;
