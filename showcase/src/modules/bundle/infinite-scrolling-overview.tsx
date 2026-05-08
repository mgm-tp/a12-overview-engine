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
import { useDispatch } from "react-redux";
import { styled } from "styled-components";

import { type View } from "@com.mgmtp.a12.client/client-core";
import { Icon, Button } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	Events,
	type Heading,
	UiStateSelector,
	type ComponentMap,
	DefaultComponentMap,
	OverviewEngineActions,
	useOverviewEngineState
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";

export function InfiniteScrollingOverview(props: View): React.JSX.Element {
	const { activityId } = props;
	const componentMap = React.useMemo(() => createComponentMap(activityId), [activityId]);

	return <ShowcaseOverview {...props} componentMap={componentMap} />;
}

InfiniteScrollingOverview.handleProgressIndicator = ShowcaseOverview.handleProgressIndicator;

function createComponentMap(activityId: string): ComponentMap {
	return {
		...DefaultComponentMap,
		Heading(headingProps: Heading.PropsType) {
			const DefaultHeading = DefaultComponentMap.Heading;

			return (
				<DefaultHeading
					{...headingProps}
					additionalControls={
						<HeadingButtonsWrapper>
							<ScrollToTopButton activityId={activityId} />
						</HeadingButtonsWrapper>
					}
				/>
			);
		}
	};
}

const HeadingButtonsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ScrollToTopButton = (props: { activityId: string }) => {
	const { activityId } = props;
	const dispatch = useDispatch();
	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const onClick = React.useCallback(() => {
		dispatch(
			OverviewEngineActions.event({
				activityId,
				engineAction: Events.onScrollToRow({ rowIndex: 0, autoFocus: true })
			})
		);
	}, [activityId, dispatch]);

	return (
		<Button
			disabled={disabled}
			icon={<Icon>vertical_align_top</Icon>}
			onClick={onClick}
			label="Scroll to top"
			title="Demonstrate programmatic scrolling"
		/>
	);
};
