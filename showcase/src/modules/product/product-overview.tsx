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
import { Icon, Button, Message, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	Events,
	type Heading,
	type TableBody,
	UiStateSelector,
	type SelectorMap,
	type ComponentMap,
	DefaultSelectorMap,
	DefaultComponentMap,
	OverviewEngineActions,
	type OverviewEngineApi,
	useOverviewEngineState,
	useOverviewEngineContext
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";

import { customEnumeratedStringQuery } from "./saga.js";

export const ProductOverview = (props: View) => {
	// tag::customOnSearchEnumeratedStringFieldEvent[]
	const { activityId } = props;
	const dispatch = useDispatch();

	const eventHandlers: OverviewEngineApi.EventHandlers = React.useMemo(() => {
		return {
			onSearchEnumeratedStringField(params: { fieldPath: string; keyword?: string; nextPage?: boolean }) {
				const { fieldPath, keyword = "", nextPage = false } = params;

				if (fieldPath === "product.externalNumber.system") {
					dispatch(
						customEnumeratedStringQuery({
							activityId,
							fieldPath,
							keyword,
							nextPage
						})
					);
				} else {
					dispatch(
						OverviewEngineActions.enumeratedStringQueryParametersChanged({
							activityId,
							fieldPath,
							keyword,
							nextPage
						})
					);
				}
			}
		};
	}, [activityId, dispatch]);
	// end::customOnSearchEnumeratedStringFieldEvent[]

	return (
		<ShowcaseOverview
			{...props}
			rowStyling={({ rowIndex }) => {
				if (rowIndex === 1) {
					return { title: "This row should be interactive" };
				}

				return { interactive: false };
			}}
			componentMap={createCustomComponentMap({
				activityId,
				onEventButtonClick: (eventName) => {
					alert("EventButtonClick: " + eventName);
				}
			})}
			eventHandlers={eventHandlers}
			selectorMap={CustomSelectorMap}
		/>
	);
};

ProductOverview.handleProgressIndicator = ShowcaseOverview.handleProgressIndicator;

const CustomSelectorMap: SelectorMap = {
	...DefaultSelectorMap,
	attachmentThumbnail: (attachment) => {
		return (state) =>
			attachment.content?.startsWith("data:image/")
				? attachment.content
				: DefaultSelectorMap.attachmentThumbnail(attachment)(state);
	}
};

function createCustomComponentMap(params: {
	onEventButtonClick?: (event: string) => void;
	activityId: string;
}): ComponentMap {
	const { onEventButtonClick, activityId } = params;

	return {
		...DefaultComponentMap,
		RightClickContextMenu: (props) => {
			const firstContextMenuGroup = props.contextMenuModel?.groups[0];

			return (
				<DefaultComponentMap.RightClickContextMenu
					{...props}
					rowActionGroupModel={{ actions: [] }}
					contextMenuModel={{
						groups: firstContextMenuGroup
							? [{ ...firstContextMenuGroup, title: [{ locale: "en", text: "Customized via API" }] }]
							: []
					}}
				/>
			);
		},
		Heading(props: Heading.PropsType) {
			const DefaultHeading = DefaultComponentMap.Heading;

			return (
				<DefaultHeading
					{...props}
					additionalControls={<CustomHeadingButtons onEventButtonClick={onEventButtonClick} activityId={activityId} />}
					additionalPrefixes={<Icon title={"This icon is an additional prefix"}>category</Icon>}
				/>
			);
		},
		TableBody: CustomTableBody,
		FilterOptionsViews: {
			...DefaultComponentMap.FilterOptionsViews,
			StringFilterOptionsView: (props) => (
				<DefaultComponentMap.FilterOptionsViews.StringFilterOptionsView {...props} hideEmptyValueOption />
			)
		}
	};
}

const CustomTableBody: React.ComponentType<TableBody.Props> = (props) => {
	const data = useOverviewEngineContext((context) => context.data);
	const searchString = useOverviewEngineState(UiStateSelector.searchString());
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());

	if (data.length === 0 && (searchString || Object.keys(activeFilters ?? {}).length > 0)) {
		return (
			<div className={addPrefix("-u-height-full")}>
				<Message className={addPrefix("-u-flex -u-justify-center")}>
					No search results. Try again with another query
				</Message>
				<Separator>OR</Separator>
				<div className={addPrefix("-u-flex -u-justify-center -u-width-full")}>
					<div>
						<CustomAddButton />
					</div>
				</div>
			</div>
		);
	}

	return <DefaultComponentMap.TableBody {...props} />;
};

const Separator = styled.div`
	& {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 1em;
	}
	&::before,
	&::after {
		content: "";
		flex: 1;
		border-bottom: 1px solid #a9b3bc;
	}
	&::before {
		margin-right: 0.25em;
	}
	&::after {
		margin-left: 0.25em;
	}
`;

const HeadingButtonsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CustomHeadingButtons = (props: { onEventButtonClick?(event: string): void; activityId: string }) => {
	const { onEventButtonClick, activityId } = props;

	return (
		<HeadingButtonsWrapper>
			<LikeButton onEventButtonClick={onEventButtonClick} />
			<ScrollToRowButton activityId={activityId} />
		</HeadingButtonsWrapper>
	);
};

const LikeButton = (props: { onEventButtonClick?(event: string): void }) => {
	const { onEventButtonClick } = props;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const onClick = React.useCallback(() => {
		onEventButtonClick?.("<3");
	}, [onEventButtonClick]);

	return <Button title="Like" disabled={disabled} destructive icon={<Icon>favorite</Icon>} onClick={onClick} />;
};

const ScrollToRowButton = (props: { activityId: string }) => {
	const { activityId } = props;
	const dispatch = useDispatch();
	const disabled = useOverviewEngineState(UiStateSelector.disabled());

	const onClick = React.useCallback(() => {
		dispatch(
			OverviewEngineActions.event({
				activityId,
				engineAction: Events.onScrollToRow({ rowIndex: 0 })
			})
		);
	}, [activityId, dispatch]);

	return (
		<Button
			disabled={disabled}
			icon={<Icon>vertical_align_bottom</Icon>}
			onClick={onClick}
			label={`Scroll to top`}
			title={`Demonstrate programmatic scrolling to row number 1`}
		/>
	);
};

const CustomAddButton = () => {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onEventButtonClick = useOverviewEngineContext((context) => context.eventHandlers.onEventButtonClick);

	const onClick = React.useCallback(() => {
		onEventButtonClick?.("add_event");
	}, [onEventButtonClick]);

	return <Button disabled={disabled} icon={<Icon>add</Icon>} onClick={onClick} label={"Add new product"} secondary />;
};
