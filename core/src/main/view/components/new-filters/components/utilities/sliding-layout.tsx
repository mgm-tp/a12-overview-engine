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

import { memo, useRef, type FC, useState, useEffect, useCallback, type ReactNode, type RefObject } from "react";

import { css, styled } from "styled-components";

export interface SlidingLayoutOptions {
	readonly focusRef?: RefObject<HTMLElement | null>;
}

export function useSlidingLayout(options?: SlidingLayoutOptions) {
	const [activeIndex, setActiveIndex] = useState(0);
	const prevIndexRef = useRef(activeIndex);

	useEffect(() => {
		if (activeIndex !== prevIndexRef.current) {
			options?.focusRef?.current?.focus();
			prevIndexRef.current = activeIndex;
		}
	}, [activeIndex, options?.focusRef]);

	const showPanel = useCallback((index: number) => setActiveIndex(index), []);
	const reset = useCallback(() => setActiveIndex(0), []);

	return { activeIndex, showPanel, reset } as const;
}

export interface SlidingLayoutProps {
	readonly activeIndex: number;
	readonly children: ReactNode;
}

export const SlidingLayout: FC<SlidingLayoutProps> = memo(function SlidingLayout({ activeIndex, children }) {
	return (
		<Viewport>
			<Slider $activeIndex={activeIndex}>{children}</Slider>
		</Viewport>
	);
});

export interface SlidingPanelProps {
	readonly children: ReactNode;
}

export const SlidingPanel: FC<SlidingPanelProps> = memo(function SlidingPanel({ children }) {
	return <Panel>{children}</Panel>;
});

const Viewport = styled.div`
	overflow: hidden;
`;

const Slider = styled.div<{ $activeIndex: number }>(({ $activeIndex }) => {
	return css`
		display: flex;
		transition: transform 0.25s ease;
		transform: translateX(${$activeIndex * -100}%);
	`;
});

const Panel = styled.div`
	flex: 0 0 100%;
	min-width: 0;
`;
