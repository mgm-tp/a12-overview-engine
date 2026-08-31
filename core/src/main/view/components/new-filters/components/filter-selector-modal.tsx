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

import { memo, type FC, useCallback } from "react";

import { css, styled } from "styled-components";

import { useWindowSize } from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { FilterSelector } from "./filter-selector.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorModalProps {}

/** @internal */
export function useShouldShowFilterSelectorModal(): boolean {
	return useOverviewEngineState((s) => !!s.newFilter?.filterSelectorOptions.open);
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelectorModal: FC<FilterSelectorModalProps> = memo(function FilterSelectorModal() {
	const ModalOverlay = useOverviewEngineContext((c) => c.widgetMap.ModalOverlay);
	const onSelectorVisibilityChange = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterSelectorVisibilityChanged
	);
	const onClose = useCallback(() => onSelectorVisibilityChange?.({ visible: false }), [onSelectorVisibilityChange]);
	const { breakPoint } = useWindowSize();
	const size = breakPoint?.size ?? "lg";
	const fullHeight = size === "sm" || size === "xs";
	const modalMaxWidth = size === "xs" ? undefined : 420;

	return (
		<ModalOverlay onClose={onClose} closeOnEsc closeOnOutsideClick maxWidth={modalMaxWidth}>
			<MinHeightSizing $fullHeight={fullHeight}>
				<FilterSelector />
			</MinHeightSizing>
		</ModalOverlay>
	);
});

const MinHeightSizing = styled.div<{ $fullHeight: boolean }>(
	({ theme, $fullHeight }) => css`
		min-width: 360px;
		display: flex;
		flex-direction: column;
		${$fullHeight
			? css`
					height: calc(100vh - ${theme.components.modalOverlay.gutterMargin} * 2);
				`
			: css`
					height: 70vh;
				`}
	`
);
