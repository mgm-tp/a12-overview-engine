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

import { memo, type FC, useState, useCallback, type MouseEvent } from "react";

import { styled } from "styled-components";

import { ActionContentbox } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import type { FilterItemState } from "../../../../store/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSettingButtonProps {
	readonly filterState: FilterItemState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSettingButton: FC<FilterSettingButtonProps> = memo(function FilterSettingButton({ filterState }) {
	const FilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSetting);
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const HiddenText = useOverviewEngineContext((c) => c.widgetMap.HiddenText);
	const AttachedPortal = useOverviewEngineContext((c) => c.widgetMap.AttachedPortal);
	const onFilterItemSettingsOpened = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterItemSettingsOpened
	);
	const configViewMode = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterSelector.viewMode
	);
	const isModalVariant = configViewMode === "modal";
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const a11yLabel = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.optionsButton.a11yLabel);

	const [show, setShow] = useState(false);
	const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);

	const onClick = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			event.stopPropagation();

			if (isModalVariant) {
				onFilterItemSettingsOpened?.({ filterId: filterState.model.id });

				return;
			}

			setShow((prevState) => !prevState);
		},
		[filterState.model.id, isModalVariant, onFilterItemSettingsOpened]
	);

	return (
		<>
			<Button onClick={onClick} icon={<Icon>build</Icon>} buttonRef={setButtonElement} />
			{!isModalVariant && buttonElement && show && (
				<AttachedPortal
					closeOnOutsideClick
					referenceElement={buttonElement}
					onVisibilityChange={setShow}
					orientation={"bottom-start"}>
					<StyledDropdownContentbox boxShadow="always" padding={0}>
						<HiddenText>{a11yLabel}</HiddenText>
						<FilterSetting filterState={filterState} />
					</StyledDropdownContentbox>
				</AttachedPortal>
			)}
		</>
	);
});

const StyledDropdownContentbox = styled(ActionContentbox)`
	width: 360px;
	max-height: 80vh;
	overflow-y: auto;
`;
