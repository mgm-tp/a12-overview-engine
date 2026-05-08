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

import { it, expect, describe } from "vitest";
import { waitFor, fireEvent } from "@testing-library/react";

import { type JSONDocument } from "../../../../../main/models/index.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { OverviewDialog } from "../../../../../main/view/components/dialogs/overview-dialog.js";
import { RowAction } from "../../../../../main/view/components/table/sub-components/row-action.js";

import { noop, mockType } from "../../../../utils.js";
import { render, DataRoles, type QueriableElement } from "../../../../test-utils.js";
import { StringColumnModel, NumberColumnModel, defaultEngineProps } from "../../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.row-action", () => {
	const rowMock = mockType<JSONDocument>({ id: "1023" });

	const rowActionModel: OverviewModel.Button = {
		event: "test",
		icon: { name: "add" },
		label: [{ text: "Button Label Test", locale: "en" }],
		confirmation: {
			title: [{ text: "Confirmation Title Test", locale: "en" }],
			message: [{ text: "Confirmation Message Test", locale: "en" }]
		}
	};

	const basicEngineProps: OverviewEngine.PaginatedProps = {
		...defaultEngineProps,
		eventHandlers: {
			...defaultEngineProps.eventHandlers,
			onRowButtonClick: noop
		}
	};

	const basicProps: RowAction.PropsType = {
		row: rowMock,
		rowActionModel
	};

	function setupTest(
		props?: Partial<RowAction.PropsType>,
		engineProps?: Partial<OverviewEngine.PaginatedProps> & { asBaseElement?: boolean }
	): QueriableElement {
		const mergedRowActionProps = { ...basicProps, ...props };

		const mergedEngineProps: OverviewEngine.Props = {
			...basicEngineProps,
			...engineProps
		};

		return render(
			<OverviewEngine {...mergedEngineProps}>
				<RowAction {...mergedRowActionProps} />
				<OverviewDialog />
			</OverviewEngine>,
			{ asBaseElement: engineProps?.asBaseElement }
		);
	}

	describe("has correct props", () => {
		describe("icon", () => {
			describe("when icon = undefined", () => {
				it("should pass undefined icon to Button props", () => {
					const wrapper = setupTest({ rowActionModel: { ...rowActionModel, icon: undefined } });

					const icon = wrapper.queryByDataRole(DataRoles.Icon).element;

					expect(icon).not.toBeInTheDocument();
				});
			});

			describe("when having icon", () => {
				it("should pass icon to Button correctly", () => {
					const wrapper = setupTest({
						rowActionModel: { ...rowActionModel, icon: { name: "delete", theme: "outlined" } }
					});

					const icon = wrapper.queryByDataRole(DataRoles.Icon).element;

					expect(icon?.firstElementChild).toBeInTheDocument();
					expect(icon).toHaveClass("plasma-icon--outlined");
				});
			});
		});

		describe("primary, destructive, label, description, labelHidden", () => {
			it("should render button with hidden label", () => {
				const wrapper = setupTest({
					rowActionModel: {
						...rowActionModel,
						primary: undefined,
						destructive: undefined,
						labelHidden: true
					}
				});

				const button = wrapper.getByDataRole(DataRoles.Button).element;

				expect(button).toHaveAttribute("aria-label", rowActionModel.label?.[0].text);
			});

			it("should render primary button with provided description", () => {
				const descriptionText = "Button Title Test";
				const wrapper = setupTest({
					rowActionModel: {
						...rowActionModel,
						primary: true,
						description: [{ text: "Button Title Test", locale: "en" }],
						destructive: undefined,
						label: undefined
					}
				});

				const button = wrapper.getByDataRole(DataRoles.Button).element;

				expect(button).toHaveClass("button--primary");
				expect(button).toHaveAttribute("aria-label", descriptionText);
			});

			it("should render destructive button", () => {
				const descriptionText = "Button Title Test";
				const wrapper = setupTest({
					rowActionModel: {
						...rowActionModel,
						primary: undefined,
						destructive: true,
						description: [{ text: "Button Title Test", locale: "en" }]
					}
				});
				const button = wrapper.getByDataRole(DataRoles.Button).element;

				expect(button).toHaveClass("button--destructive");
				expect(button).toHaveAttribute("aria-label", `${rowActionModel.label?.[0].text} - ${descriptionText}`);
			});
		});
	});

	describe("Confirmation Dialog", () => {
		describe("given a row action with confirmation", () => {
			type ExpectedResult = { expectedTitle: string; expectedMessage: string };

			const testCases: [OverviewModel.ConfirmationText, ExpectedResult][] = [
				[{}, { expectedTitle: "", expectedMessage: "" }],
				[
					{ title: undefined, message: [] },
					{ expectedTitle: "", expectedMessage: "" }
				],
				[
					{ title: [], message: [] },
					{ expectedTitle: "", expectedMessage: "" }
				],
				[
					{ title: [], message: [] },
					{ expectedTitle: "", expectedMessage: "" }
				],
				[
					{ title: [{ text: "Bestätigungsnachrichtentest", locale: "de_DE" }], message: [] },
					{ expectedTitle: "", expectedMessage: "" }
				],
				[
					{ ...basicProps.rowActionModel.confirmation, title: undefined },
					{ expectedTitle: "", expectedMessage: "Confirmation Message Test" }
				],
				[
					{ ...basicProps.rowActionModel.confirmation, message: undefined },
					{ expectedTitle: "Confirmation Title Test", expectedMessage: "" }
				],
				[
					{ ...basicProps.rowActionModel.confirmation },
					{ expectedTitle: "Confirmation Title Test", expectedMessage: "Confirmation Message Test" }
				]
			];

			it.skip.each(testCases)("should work properly", async (confirmation, expectedResult) => {
				const wrapper = setupTest(
					{ rowActionModel: { ...basicProps.rowActionModel, confirmation } },
					{ asBaseElement: true }
				);
				const button = wrapper.getByDataRole(DataRoles.Button);

				fireEvent.click(button.element);
				await waitFor(() => {
					const modal = wrapper.getByDataRole(DataRoles.Modal.Overlay);
					expect(modal.element).toBeInTheDocument();
				});

				expect(wrapper.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent(
					expectedResult.expectedTitle
				);
				expect(wrapper.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent(
					expectedResult.expectedMessage
				);

				const buttons = wrapper.getByDataRole(DataRoles.Contentbox.Footer).getAllByDataRole(DataRoles.Button);

				expect(buttons).toHaveLength(2);
				expect(buttons[0]).toBe(en.overviewEngine.rowAction.confirmation.ok);
				expect(buttons[1]).toBe(en.overviewEngine.rowAction.confirmation.cancel);
			});

			describe("given a row action with no confirmation", () => {
				it("the confirmation dialog should not be opened", () => {
					const wrapper = setupTest({ rowActionModel: { ...basicProps.rowActionModel, confirmation: undefined } });
					const button = wrapper.getByDataRole(DataRoles.Button);

					fireEvent.click(button.element);

					const modal = wrapper.queryByDataRole(DataRoles.Modal.Overlay);

					expect(modal.element).not.toBeInTheDocument();
				});
			});
		});

		describe("disabled", () => {
			describe("when the engine is in a normal state", () => {
				it("should be false be default", () => {
					const wrapper = setupTest();

					const button = wrapper.getByDataRole(DataRoles.Button);

					expect(button.element).toBeEnabled();
				});
			});

			describe("when the engine is disabled", () => {
				it("should be true", () => {
					const wrapper = setupTest(undefined, {
						uiState: { disabled: true },
						rowActionState: {
							rows: {
								[basicProps.row.id]: {
									[basicProps.rowActionModel.event]: { disabled: false }
								}
							},
							rowActions: {
								[basicProps.rowActionModel.event]: { disabled: false }
							}
						}
					});
					const button = wrapper.getByDataRole(DataRoles.Button);

					expect(button.element).toBeDisabled();
				});
			});

			describe("when the engine is not disabled", () => {
				describe("when the row is disabled via RowState API", () => {
					it("should be true", () => {
						const wrapper = setupTest(undefined, {
							uiState: { rowState: { [basicProps.row.id]: { disabled: true } } }
						});
						const button = wrapper.getByDataRole(DataRoles.Button);

						expect(button.element).toBeDisabled();
					});
				});

				describe("when specifically given disabled = true for the row event", () => {
					it("should be true regardless the overall event state", () => {
						const wrapper = setupTest(undefined, {
							rowActionState: {
								rows: {
									[basicProps.row.id]: {
										[basicProps.rowActionModel.event]: { disabled: true }
									}
								},
								rowActions: {
									[basicProps.rowActionModel.event]: { disabled: false }
								}
							}
						});
						const button = wrapper.getByDataRole(DataRoles.Button);

						expect(button.element).toBeDisabled();
					});
				});

				describe("when specifically given disabled = false for the row event", () => {
					it("should be false regardless the overall event state", () => {
						const wrapper = setupTest(undefined, {
							rowActionState: {
								rows: {
									[basicProps.row.id]: {
										[basicProps.rowActionModel.event]: { disabled: false }
									}
								},
								rowActions: {
									[basicProps.rowActionModel.event]: { disabled: true }
								}
							}
						});
						const button = wrapper.getByDataRole(DataRoles.Button);

						expect(button.element).toBeEnabled();
					});
				});

				describe("when rowActions.event has disabled = true and no given overall event disabled state", () => {
					it("should be true", () => {
						const wrapper = setupTest(undefined, {
							rowActionState: {
								rowActions: {
									[basicProps.rowActionModel.event]: { disabled: true }
								}
							}
						});
						const button = wrapper.getByDataRole(DataRoles.Button);

						expect(button.element).toBeDisabled();
					});
				});

				describe("when rowActions.event has disabled = false and no given overall event disabled state", () => {
					it("should be false", () => {
						const wrapper = setupTest(undefined, {
							rowActionState: {
								rowActions: {
									[basicProps.rowActionModel.event]: { disabled: false }
								}
							}
						});
						const button = wrapper.getByDataRole(DataRoles.Button);

						expect(button.element).toBeEnabled();
					});
				});
			});
		});
	});

	describe("readable column value", () => {
		const screenReaderColumn: OverviewModel.ColumnRef = {
			idref: StringColumnModel.id
		};

		const descriptionText = "Edit";
		const rowActionModelWithDescription: OverviewModel.Button = {
			...rowActionModel,
			description: [{ text: descriptionText, locale: "en" }]
		};

		const realRow = defaultEngineProps.data[0] as JSONDocument;

		function setupReadableTest(
			props?: Partial<RowAction.PropsType>,
			engineProps?: Partial<OverviewEngine.PaginatedProps> & { asBaseElement?: boolean }
		): QueriableElement {
			const overviewModel: OverviewModel = {
				...defaultEngineProps.overviewModel,
				content: {
					...defaultEngineProps.overviewModel.content,
					configuration: {
						...defaultEngineProps.overviewModel.content.configuration,
						screenReaderColumn
					},
					columns: [StringColumnModel, NumberColumnModel]
				}
			};

			return setupTest(
				{ row: realRow, rowActionModel: rowActionModelWithDescription, ...props },
				{ overviewModel, ...engineProps }
			);
		}

		it("should set aria-labelledby on button referencing itself and the cell", () => {
			const wrapper = setupReadableTest();
			const button = wrapper.getByDataRole(DataRoles.Button).element;

			const ariaLabelledBy = button.getAttribute("aria-labelledby");
			expect(ariaLabelledBy).toBeTruthy();

			const ids = (ariaLabelledBy ?? "").split(" ");
			expect(ids[0]).toBe(button.id);
			expect(ids[1]).toBe(`${realRow.id}_${StringColumnModel.id}`);
		});

		it("should keep button title as description", () => {
			const wrapper = setupReadableTest();
			const button = wrapper.getByDataRole(DataRoles.Button).element;

			expect(button).toHaveAttribute("title", descriptionText);
		});

		it("should not have aria-labelledby when no screenReaderColumn is configured", () => {
			const overviewModel: OverviewModel = {
				...defaultEngineProps.overviewModel,
				content: {
					...defaultEngineProps.overviewModel.content,
					columns: [StringColumnModel, NumberColumnModel]
				}
			};

			const wrapper = setupTest({ row: realRow, rowActionModel: rowActionModelWithDescription }, { overviewModel });
			const button = wrapper.getByDataRole(DataRoles.Button).element;

			expect(button).not.toHaveAttribute("aria-labelledby");
			expect(button).toHaveAttribute("title", descriptionText);
		});
	});
});
