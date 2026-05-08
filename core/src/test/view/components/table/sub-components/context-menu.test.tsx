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

import { type JSONDocument } from "../../../../../main/models/index.js";
import { type OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import hooks from "../../../../../main/view/components/table/sub-components/hooks.js";
import { ContextMenu } from "../../../../../main/view/components/table/sub-components/context-menu.js";

import { mockType } from "../../../../utils.js";
import { render, DataRoles } from "../../../../test-utils.js";
import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.context-menu", () => {
	const basicEngineProps = defaultEngineProps;

	const basicFirstGroup: OverviewModel.ActionGroup = {
		name: "firstGroup",
		title: [
			{ locale: "en", text: "first group title en" },
			{ locale: "de", text: "first group title de" }
		],
		actions: [{ event: "A" }, { event: "B", icon: { name: "add" } }]
	};

	const basicSecondGroup: OverviewModel.ActionGroup = {
		name: "secondGroup",
		title: [
			{ locale: "en", text: "second group title en" },
			{ locale: "de", text: "second group title de" }
		],
		actions: [{ event: "C" }, { event: "D" }]
	};

	const basicContextMenuModel: OverviewModel.ContextMenu = {
		groups: [basicFirstGroup, basicSecondGroup]
	};

	const basicRow = mockType<JSONDocument>({ id: "1023" });

	function setupTest(
		contextMenuModel: OverviewModel.ContextMenu,
		overviewEngineProps?: Partial<OverviewEngine.PaginatedProps>,
		locale = enLocale
	) {
		const overviewModel: OverviewModel = {
			...basicEngineProps.overviewModel,
			content: {
				...basicEngineProps.overviewModel.content,
				contextMenu: contextMenuModel
			}
		};

		const customOverviewEngineProps: OverviewEngine.Props = {
			...basicEngineProps,
			...overviewEngineProps,
			overviewModel
		};

		return render(
			<ContextMenu contextMenuModel={contextMenuModel} row={basicRow} />,
			{ wrappingComponent: OverviewEngine, wrappingComponentProps: customOverviewEngineProps, asBaseElement: true },
			locale
		);
	}

	describe("null rendering cases", () => {
		describe("when the context menu model has empty groups", () => {
			it("should return null", () => {
				const wrapper = setupTest({ groups: [] });
				const contextMenu = wrapper.queryByDataRole(DataRoles.ContextMenu).element;

				expect(contextMenu).not.toBeInTheDocument();
			});
		});

		describe("when the context menu model has non-empty groups but none of the groups have actions", () => {
			it("should return null", () => {
				const wrapper = setupTest(
					{
						groups: [
							{ name: "A", actions: [] },
							{ name: "B", actions: [] }
						]
					},
					undefined
				);
				const contextMenu = wrapper.queryByDataRole(DataRoles.ContextMenu).element;

				expect(contextMenu).not.toBeInTheDocument();
			});
		});

		describe("when the context menu has actions, but all actions are hidden by rowActionState", () => {
			it("should return null", () => {
				const wrapper = setupTest(basicContextMenuModel, {
					rowActionState: {
						rowActions: {
							A: { hidden: true },
							B: { hidden: true },
							C: { hidden: true },
							D: { hidden: true }
						}
					}
				});
				const contextMenu = wrapper.queryByDataRole(DataRoles.ContextMenu).element;

				expect(contextMenu).not.toBeInTheDocument();
			});
		});
	});

	describe("disabled", () => {
		it("should be disabled if the whole engine or row is disabled", () => {
			vi.spyOn(hooks, "useRowDisabilityGetter").mockReturnValue(() => true);
			const wrapper = setupTest(basicContextMenuModel);

			expect(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element).toBeDisabled();
		});

		it("should be enable if the whole engine or row is enable", () => {
			vi.spyOn(hooks, "useRowDisabilityGetter").mockReturnValue(() => false);
			const wrapper = setupTest(basicContextMenuModel);

			expect(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element).toBeEnabled();
		});
	});

	describe("onClick", () => {
		describe("when a menu button is clicked", () => {
			it("should not bubble up the event to the wrapper", () => {
				const wrapperOnClick = vi.fn();

				const wrapper = render(
					<OverviewEngine {...basicEngineProps}>
						<div onClick={wrapperOnClick}>
							<ContextMenu contextMenuModel={basicContextMenuModel} row={basicRow} />
						</div>
					</OverviewEngine>
				);

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				expect(wrapperOnClick).not.toHaveBeenCalled();
			});
		});
	});

	describe("paddedLeft", () => {
		describe("when an action model has an icon", () => {
			it("List should have paddedLeft", () => {
				const wrapper = setupTest(basicContextMenuModel);

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				expect(wrapper.getByDataRole(DataRoles.List).element).toHaveClass("list--items-padded-left");
			});
		});

		describe("when an action model has an icon, but it is hidden by rowActionState API", () => {
			it("List should not have paddedLeft", () => {
				const wrapper = setupTest(basicContextMenuModel, {
					rowActionState: { rowActions: { B: { hidden: true } } }
				});
				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				expect(wrapper.getByDataRole(DataRoles.List).element).not.toHaveClass("list--items-padded-left");
			});
		});

		describe("when none of action model has an icon", () => {
			it("List should not have paddedLeft", () => {
				const wrapper = setupTest({ ...basicContextMenuModel, groups: [basicSecondGroup] });

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				expect(wrapper.getByDataRole(DataRoles.List).element).not.toHaveClass("list--items-padded-left");
			});
		});
	});

	describe("subHeader", () => {
		describe("given english locale", () => {
			it("should render english labels", () => {
				const wrapper = setupTest(basicContextMenuModel);

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(2);
				expect(subHeaders[0]).toHaveTextContent("first group title en");
				expect(subHeaders[1]).toHaveTextContent("second group title en");
			});
		});

		describe("given german locale", () => {
			it("should render german labels", () => {
				const wrapper = setupTest(basicContextMenuModel, undefined, deLocale);

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(2);
				expect(subHeaders[0]).toHaveTextContent("first group title de");
				expect(subHeaders[1]).toHaveTextContent("second group title de");
			});
		});

		describe("given a group that has no title", () => {
			it("should not render a corresponding subHeader", () => {
				const wrapper = setupTest(
					{ groups: [{ ...basicFirstGroup, title: undefined }, basicSecondGroup] },
					undefined,
					deLocale
				);
				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(1);
				expect(subHeaders[0]).toHaveTextContent("second group title de");
			});
		});
	});

	describe("divider", () => {
		describe("when all groups have titles", () => {
			it("should not render any divider", () => {
				const wrapper = setupTest(basicContextMenuModel);

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(2);
				expect(subHeaders[0]).toHaveTextContent("first group title en");
				expect(subHeaders[1]).toHaveTextContent("second group title en");

				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(actions).toHaveLength(4);
			});
		});

		describe("when only the first group has no title", () => {
			it("should not render any divider", () => {
				const wrapper = setupTest({ groups: [{ ...basicFirstGroup, title: undefined }, basicSecondGroup] });
				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(1);
				expect(subHeaders[0]).toHaveTextContent("second group title en");

				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(actions).toHaveLength(4);
			});
		});

		describe("when the first group and second group have no title", () => {
			it("should render a divider", () => {
				const wrapper = setupTest({
					groups: [
						{ ...basicFirstGroup, title: undefined },
						{ ...basicSecondGroup, title: undefined }
					]
				});

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.queryAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(0);

				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(actions).toHaveLength(4);
			});
		});
	});

	describe("with rowActionState API", () => {
		describe("when no given rowActionState", () => {
			it("should render as usual", () => {
				const wrapper = setupTest(basicContextMenuModel, { rowActionState: undefined });

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);
				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(subHeaders).toHaveLength(2);
				expect(actions).toHaveLength(4);
			});
		});

		describe("when some of actions are hidden", () => {
			it("should not render the corresponding row actions", () => {
				const wrapper = setupTest(basicContextMenuModel, {
					rowActionState: {
						rowActions: {
							A: { hidden: true },
							D: { hidden: true }
						}
					}
				});

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);
				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(subHeaders).toHaveLength(2);
				expect(actions).toHaveLength(2);
			});
		});

		describe("when all actions in a group are hidden", () => {
			it("should not render the corresponding group even its subheader", () => {
				const wrapper = setupTest(basicContextMenuModel, {
					rowActionState: {
						rowActions: {
							A: { hidden: true },
							B: { hidden: true }
						}
					}
				});

				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.getAllByDataRole(DataRoles.List.SubHeader);
				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(subHeaders).toHaveLength(1);
				expect(subHeaders[0]).toHaveTextContent("second group title en");

				expect(actions).toHaveLength(2);
			});
		});

		describe("when all actions in the first group are hidden", () => {
			it("the second group should become the first and not render the divider", () => {
				const wrapper = setupTest(
					{ groups: [basicFirstGroup, { ...basicSecondGroup, title: undefined }] },
					{
						rowActionState: {
							rowActions: {
								A: { hidden: true },
								B: { hidden: true }
							}
						}
					}
				);
				fireEvent.click(wrapper.getByDataRole(DataRoles.Popup.TriggerElement).element);

				const subHeaders = wrapper.queryAllByDataRole(DataRoles.List.SubHeader);

				expect(subHeaders).toHaveLength(0);

				const actions = wrapper.getAllByDataRole(DataRoles.List.Item);

				expect(actions).toHaveLength(2);
			});
		});
	});
});
