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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { TableHeadCell } from "../../../../../main/view/components/table/sub-components/table-head-cell.js";

import { defaultEngineProps } from "../../../../basic.spec.js";
import { createLocalizedModelText } from "../../../../utils.js";
import { render, type QueriableElement } from "../../../../test-utils.js";

const getTextContent = (text: string) => text + " EN";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.table-head-cell", () => {
	const basicEngineProps = defaultEngineProps;
	const basicColumnModel = basicEngineProps.overviewModel.content.columns[0];
	const columnModelWithoutLabel = basicEngineProps.overviewModel.content.columns[3];

	function setupTest(headerCellProps?: Partial<TableHeadCell.Props>, withoutLabel?: boolean): QueriableElement {
		let basicProps: TableHeadCell.Props = {
			columnModel: basicColumnModel
		};

		if (withoutLabel) {
			basicProps = { columnModel: columnModelWithoutLabel };
		}

		return render(<TableHeadCell {...basicProps} {...headerCellProps} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...basicEngineProps }
		});
	}

	describe("label", () => {
		describe("given a column model with label", () => {
			it("should render correctly", () => {
				const text = "column header";
				const wrapper = setupTest({
					columnModel: { ...basicColumnModel, label: createLocalizedModelText(text) }
				});

				expect(wrapper.element.querySelector("span")).toHaveTextContent(getTextContent(text));
			});
		});

		describe("given a column model without label", () => {
			it("should not render label", () => {
				const wrapper = setupTest(
					{
						columnModel: { ...columnModelWithoutLabel, label: undefined }
					},
					true
				);

				expect(wrapper.element.querySelector("span")).not.toBeInTheDocument();
			});
		});
	});

	describe("icon", () => {
		describe("given a column model with icon", () => {
			it("should render icon correctly", () => {
				const columnModel: OverviewModel.Column = {
					...basicColumnModel,
					icon: { name: "photo_camera" }
				};

				const wrapper = setupTest({ columnModel });

				expect(wrapper.getByDataRole(DataRoles.Icon).element).toBeInTheDocument();
			});

			it("should render icon correctly with the provided theme", () => {
				const columnModel: OverviewModel.Column = {
					...basicColumnModel,
					icon: {
						name: "location_on",
						theme: "outlined"
					},
					labelHidden: true
				};

				const wrapper = setupTest({ columnModel });

				const icon = wrapper.getByDataRole(DataRoles.Icon).element;

				expect(icon).toBeInTheDocument();
				expect(icon).toHaveClass("plasma-icon--outlined");
			});
		});

		describe("given a column model without icon", () => {
			it("should not render icon", () => {
				const modelWithoutIcon: OverviewModel.Column = {
					...basicColumnModel,
					icon: undefined
				};

				const wrapper = setupTest({ columnModel: modelWithoutIcon });

				expect(wrapper.queryByDataRole(DataRoles.Icon).element).not.toBeInTheDocument();
			});
		});
	});

	describe("given a column model with icon, label, with/without labelHidden", () => {
		const columnIcon: OverviewModel.Icon = {
			name: "person",
			theme: "outlined"
		};
		const label = "First Name";

		describe("with undefined labelHidden", () => {
			it("should render label", () => {
				const columnModel: OverviewModel.Column = {
					...basicColumnModel,
					label: createLocalizedModelText(label),
					icon: columnIcon
				};

				const wrapper = setupTest({ columnModel });

				expect(wrapper.getByDataRole(DataRoles.Icon).element).not.toHaveAttribute("title");
				expect(wrapper.element).toHaveTextContent(getTextContent(label));
			});
		});

		describe("with labelHidden = true", () => {
			const columnModel: OverviewModel.Column = {
				...basicColumnModel,
				label: createLocalizedModelText(label),
				icon: columnIcon,
				labelHidden: true
			};

			describe("no matter how sortable status of the column is", () => {
				it("should render icon title", () => {
					const wrappers: Array<QueriableElement> = [
						setupTest({ columnModel }),
						setupTest({ columnModel: { ...columnModel, sortable: undefined } })
					];

					for (const wrapper of wrappers) {
						expect(wrapper.getByDataRole(DataRoles.Icon).element).toHaveAttribute("title", getTextContent(label));
						expect(wrapper.element).toHaveTextContent(getTextContent(label));
					}
				});
			});
		});
	});

	describe("given a column model without icon and label is hidden", () => {
		it("should render label as hidden text", () => {
			const label = "First Name";
			const columnModel: OverviewModel.Column = {
				...basicColumnModel,
				label: createLocalizedModelText(label),
				icon: undefined,
				labelHidden: true
			};
			const wrapper = setupTest({ columnModel });

			expect(wrapper.getByDataRole(DataRoles.HiddenText).element).toHaveTextContent(label);
		});
	});
});
