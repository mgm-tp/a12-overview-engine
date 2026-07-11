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

import { it, vi, expect, describe } from "vitest";
import { fireEvent } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import type { JSONDocument } from "../../../../../main/models/index.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { RightClickContextMenu } from "../../../../../main/view/components/table/sub-components/right-click-context-menu.js";

import { mockType } from "../../../../utils.js";
import { render } from "../../../../test-utils.js";
import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.right-click-context-menu", () => {
	const basicEngineProps = defaultEngineProps;

	const basicRow = mockType<JSONDocument>({ id: "1024", linkId: undefined });

	const closeHandlerSpy = vi.fn();

	function setupTest(overviewEngineProps?: Partial<OverviewEngine.PaginatedProps>, locale?: Locale) {
		const overviewModel = overviewEngineProps?.overviewModel ?? basicEngineProps.overviewModel;

		const customOverviewEngineProps: OverviewEngine.Props = {
			...basicEngineProps,
			...overviewEngineProps,
			overviewModel
		};

		return render(
			<OverviewEngine {...customOverviewEngineProps}>
				<RightClickContextMenu row={basicRow} rowIndex={0} closeHandler={closeHandlerSpy} />
			</OverviewEngine>,
			undefined,
			locale
		);
	}

	describe("null rendering cases", () => {
		describe("when there are no row and context menu actions", () => {
			it("should return null", () => {
				const overviewModel: OverviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						rowActionGroup: {},
						contextMenu: undefined
					}
				};
				const wrapper = setupTest({ overviewModel });
				const rightClickContextMenu = wrapper.getByDataRole(DataRoles.List);

				expect(rightClickContextMenu.element.childElementCount).toEqual(0);
			});
		});

		describe("when having a row action but hidden by rowActionState API", () => {
			it("should return null", () => {
				const overviewModel: OverviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						rowActionGroup: { actions: [{ event: "delete_event" }] },
						contextMenu: undefined
					}
				};
				const wrapper = setupTest({
					overviewModel,
					rowActionState: { rowActions: { delete_event: { hidden: true } } }
				});
				const rightClickContextMenu = wrapper.getByDataRole(DataRoles.List).queryAllByDataRole(DataRoles.List.Item);

				expect(rightClickContextMenu).toHaveLength(0);
			});
		});
	});

	describe("basic rendering", () => {
		it("should render the right click context menu", () => {
			const overviewModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					rowActionGroup: { actions: [{ event: "rowAction event 1" }, { event: "rowAction event 2" }] },
					contextMenu: {
						groups: [
							{ name: "group 1", actions: [{ event: "event 1" }] },
							{ name: "group 2", actions: [{ event: "event 2.1" }, { event: "event 2.2" }] }
						]
					}
				}
			};

			const wrapper = setupTest({ overviewModel });
			const rightClickContextMenu = wrapper.getByDataRole(DataRoles.List).getAllByDataRole(DataRoles.List.Item);

			expect(rightClickContextMenu).toHaveLength(5);
		});
	});

	describe("label", () => {
		describe("when given label", () => {
			const overviewModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					rowActionGroup: {
						actions: [
							{
								event: "rowAction event 1",
								label: [
									{ text: "Label en", locale: "en" },
									{ text: "Label de", locale: "de" }
								]
							}
						]
					},
					contextMenu: { groups: [] }
				}
			};

			it("should use it as label regarding to the English locale", () => {
				const wrapper = setupTest({ overviewModel }, enLocale);

				expect(wrapper.getByDataRole(DataRoles.List.Item.Text).element).toHaveTextContent("Label en");
			});

			it("should use it as label regarding to the German locale", () => {
				const wrapper = setupTest({ overviewModel }, deLocale);

				expect(wrapper.getByDataRole(DataRoles.List.Item.Text).element).toHaveTextContent("Label de");
			});
		});

		describe("when no given label but title", () => {
			const overviewModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					rowActionGroup: {
						actions: [
							{
								event: "rowAction event 1",
								description: [
									{ text: "Title en", locale: "en" },
									{ text: "Title de", locale: "de" }
								]
							}
						]
					},
					contextMenu: { groups: [] }
				}
			};

			it("should use title as fallback regarding to the English locale", () => {
				const wrapper = setupTest({ overviewModel }, enLocale);

				expect(wrapper.getByDataRole(DataRoles.List.Item.Text).element).toHaveTextContent("Title en");
			});

			it("should use title as fallback regarding to the German locale", () => {
				const wrapper = setupTest({ overviewModel }, deLocale);

				expect(wrapper.getByDataRole(DataRoles.List.Item.Text).element).toHaveTextContent("Title de");
			});
		});

		describe("onClick", () => {
			it("should call the closeHandler and onRowButtonClick", () => {
				const overviewModel: OverviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						rowActionGroup: { actions: [{ event: "edit_event" }] }
					}
				};

				const onRowButtonClickSpy = vi.fn();

				const wrapper = setupTest({ overviewModel, eventHandlers: { onRowButtonClick: onRowButtonClickSpy } });
				const listItem = wrapper.getAllByDataRole(DataRoles.List.Item.Content);

				expect(listItem).toHaveLength(1);

				fireEvent.click(listItem[0]);

				expect(closeHandlerSpy).toHaveBeenCalledOnce();
				expect(onRowButtonClickSpy).toHaveBeenCalledExactlyOnceWith({
					documentId: "1024",
					rowActionModel: { event: "edit_event" }
				});
			});
		});

		describe("paddedLeft", () => {
			it("should have no left padding if the action has no icon", () => {
				const overviewModel: OverviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						rowActionGroup: { actions: [{ event: "edit_event" }] }
					}
				};

				const wrapper = setupTest({ overviewModel });

				expect(wrapper.queryByDataRole(DataRoles.List.Item.Graphic).element).not.toBeInTheDocument();
			});

			it("should have left padding if the action has icon", () => {
				const overviewModel: OverviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						rowActionGroup: { actions: [{ event: "edit_event", icon: { name: "icon_name" } }] }
					}
				};

				const wrapper = setupTest({ overviewModel });

				expect(wrapper.queryByDataRole(DataRoles.List.Item.Graphic).element).toBeInTheDocument();
			});
		});
	});
});
