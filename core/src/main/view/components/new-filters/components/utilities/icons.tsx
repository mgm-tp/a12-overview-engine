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

import { memo, type FC } from "react";
import { styled } from "styled-components";

import { StyledIconWrapper } from "@com.mgmtp.a12.widgets/widgets-core";

export interface RangeIconProps {
	readonly dataRole?: string;
}

const RangeIconWrapper = styled(StyledIconWrapper)`
	> svg {
		fill: currentColor;
	}
`;

export const EqualRangeIcon: FC<RangeIconProps> = memo(function EqualRangeIcon({ dataRole }) {
	return (
		<RangeIconWrapper as="span" data-role={dataRole}>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden={true}
				focusable="false">
				<path d="M12.6667 6.66683H3.33337V5.3335H12.6667V6.66683ZM12.6667 10.6668H3.33337V9.3335H12.6667V10.6668Z" />
			</svg>
		</RangeIconWrapper>
	);
});

export const BoundedRangeIcon: FC<RangeIconProps> = memo(function BoundedRangeIcon({ dataRole }) {
	return (
		<RangeIconWrapper as="span" data-role={dataRole}>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden={true}
				focusable="false">
				<path d="M12.1134 7.33333H4.00004V8.66667H12.1134V7.33333ZM1.33337 4V12H2.66671V4H1.33337Z" />
				<path d="M3.88663 7.33333H12V8.66667H3.88663V7.33333ZM14.6666 4V12H13.3333V4H14.6666Z" />
			</svg>
		</RangeIconWrapper>
	);
});
