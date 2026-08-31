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

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../../main/overview-model.js";
import { MultiSelectCell } from "../../../../../main/view/components/table/sub-components/multi-select-cell.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";
import { createGroup, createDocumentModel, createOverviewModel, createEnumerationField } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.multi-select-cell", () => {
	const basicEngineProps = defaultEngineProps;
	interface EngineParams {
		alphabeticalSorting?: boolean;
		overviewModel?: OverviewModel;
	}

	function createEngineProps(params?: EngineParams): OverviewEngine.Props {
		const documentModel = createDocumentModel([
			createGroup({
				repeatability: 3,
				elements: [createEnumerationField(params?.alphabeticalSorting)],
				id: "a-multi-select-field",
				usageType: "multi-select"
			})
		]);

		const overviewModel = params?.overviewModel ?? basicEngineProps.overviewModel;

		return {
			...basicEngineProps,
			overviewModel,
			documentModel
		};
	}

	function setupTest(
		props?: Partial<MultiSelectCell.Props>,
		engineParams?: EngineParams,
		locale?: Locale
	): QueriableElement {
		const basicProps: MultiSelectCell.Props = {
			data: [],
			elementPath: [{ elementName: "root" }, { elementName: "a-multi-select-field" }]
		};

		return render(
			<MultiSelectCell {...basicProps} {...props} />,
			{ wrappingComponent: OverviewEngine, wrappingComponentProps: createEngineProps(engineParams) },
			locale
		);
	}

	describe("Renderer", () => {
		describe("when the data has only one value", () => {
			it("should render just text inside TextOutput", () => {
				const wrapper = setupTest({ data: [{ value: "1" }] });

				const textOutput = wrapper.getByDataRole(DataRoles.TextOutput).getByDataRole(DataRoles.TextOutput.Text);

				expect(textOutput.element).toHaveTextContent("One");
			});
		});

		function testItems(params: {
			cellProps: Partial<MultiSelectCell.Props>;
			engineParams: EngineParams;
			locale: Locale;
			expectedResults: string[];
		}) {
			const { cellProps, engineParams, locale, expectedResults } = params;
			const wrapper = setupTest(cellProps, engineParams, locale);

			expect(wrapper.getByDataRole(DataRoles.TextOutput).element).toBeInTheDocument();

			const items = wrapper.getAllByDataRole(DataRoles.BulletList.Item);

			expect(items).toHaveLength(expectedResults.length);

			items.forEach((item, index) => {
				expect(item).toHaveTextContent(expectedResults[index]);
			});
		}

		describe("when the data has multiple values", () => {
			const cellProps: Partial<MultiSelectCell.Props> = { data: [{ value: "2" }, { value: "1" }, { value: "3" }] };

			describe("given english language", () => {
				it("should sort by english alphabet only if enabling alphabeticalSorting", () => {
					testItems({
						cellProps,
						expectedResults: ["Two", "One", "Three"],
						engineParams: { alphabeticalSorting: undefined },
						locale: enLocale
					});

					testItems({
						cellProps,
						expectedResults: ["Two", "One", "Three"],
						engineParams: { alphabeticalSorting: false },
						locale: enLocale
					});

					testItems({
						cellProps,
						expectedResults: ["One", "Three", "Two"],
						engineParams: { alphabeticalSorting: true },
						locale: enLocale
					});
				});
			});

			describe("given german language", () => {
				it("should sort by german alphabet only if enabling alphabeticalSorting", () => {
					testItems({
						cellProps,
						expectedResults: ["Zwei", "Einer", "Drei"],
						engineParams: { alphabeticalSorting: undefined },
						locale: deLocale
					});

					testItems({
						cellProps,
						expectedResults: ["Zwei", "Einer", "Drei"],
						engineParams: { alphabeticalSorting: false },
						locale: deLocale
					});

					testItems({
						cellProps,
						expectedResults: ["Drei", "Einer", "Zwei"],
						engineParams: { alphabeticalSorting: true },
						locale: deLocale
					});
				});
			});
		});

		describe("when display mode is comma separated", () => {
			const overviewModelWithCommaDisplayMode = createOverviewModel([
				{
					label: [{ text: "MultiSelect [OM]", locale: enLocale.language }],
					id: "column-34567",
					elementRef: "F9",
					sortable: true,
					width: 1,
					multiSelectDisplayMode: OverviewModel.MultiSelectDisplayMode.COMMA_SEPARATED
				}
			]);

			describe("when the data has only one value", () => {
				it("should render just text inside TextOutput", () => {
					const wrapper = setupTest(
						{
							data: [{ value: "3" }],
							displayMode: OverviewModel.MultiSelectDisplayMode.COMMA_SEPARATED
						},
						{ overviewModel: overviewModelWithCommaDisplayMode }
					);

					const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

					expect(textOutput.element).toBeInTheDocument();
					expect(textOutput.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent("Three");
					expect(wrapper.queryByDataRole(DataRoles.BulletList).element).not.toBeInTheDocument();
				});
			});

			function testItems(params: {
				cellProps: Partial<MultiSelectCell.Props>;
				engineParams: EngineParams;
				expectedResults: string;
				locale: Locale;
			}) {
				const { cellProps, engineParams, expectedResults, locale } = params;

				const wrapper = setupTest(
					cellProps,
					{ ...engineParams, overviewModel: overviewModelWithCommaDisplayMode },
					locale
				);
				const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

				expect(textOutput.element).toBeInTheDocument();
				expect(textOutput.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent(expectedResults);
				expect(wrapper.queryByDataRole(DataRoles.BulletList).element).not.toBeInTheDocument();
			}

			describe("given english language", () => {
				it("should render texts separated by comma and sort by english alphabetically only if enabling alphabeticalSorting", () => {
					const cellProps: Partial<MultiSelectCell.Props> = {
						data: [{ value: "2" }, { value: "1" }, { value: "3" }],
						displayMode: OverviewModel.MultiSelectDisplayMode.COMMA_SEPARATED
					};

					testItems({
						cellProps,
						expectedResults: "Two, One, Three",
						engineParams: {
							alphabeticalSorting: undefined
						},
						locale: enLocale
					});

					testItems({
						cellProps,
						expectedResults: "Two, One, Three",
						engineParams: { alphabeticalSorting: false },
						locale: enLocale
					});

					testItems({
						cellProps,
						expectedResults: "One, Three, Two",
						engineParams: { alphabeticalSorting: true },
						locale: enLocale
					});
				});
			});

			describe("given german language", () => {
				it("should render texts separated by comma and sort by german alphabetically only if enabling alphabeticalSorting", () => {
					const cellProps: Partial<MultiSelectCell.Props> = {
						data: [{ value: "2" }, { value: "1" }, { value: "3" }],
						displayMode: OverviewModel.MultiSelectDisplayMode.COMMA_SEPARATED
					};

					testItems({
						cellProps,
						expectedResults: "Zwei, Einer, Drei",
						engineParams: {
							alphabeticalSorting: undefined
						},
						locale: deLocale
					});

					testItems({
						cellProps,
						expectedResults: "Zwei, Einer, Drei",
						engineParams: { alphabeticalSorting: false },
						locale: deLocale
					});

					testItems({
						cellProps,
						expectedResults: "Drei, Einer, Zwei",
						engineParams: { alphabeticalSorting: true },
						locale: deLocale
					});
				});
			});
		});

		describe("when has rowHeight", () => {
			const overviewModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					configuration: {
						...basicEngineProps.overviewModel.content.configuration,
						rowHeight: 50
					}
				}
			};

			describe("when there is only one value", () => {
				it("should be wrapped by CssEllipsis", () => {
					const cellProps: Partial<MultiSelectCell.Props> = { data: [{ value: "3" }] };
					const wrapper = setupTest(cellProps, { overviewModel });
					const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);
					const cssEllipsis = textOutput.getByDataRole(DataRoles.CssEllipsis);

					expect(textOutput.element).toBeInTheDocument();
					expect(cssEllipsis.element).toBeInTheDocument();
					expect(textOutput.element).toHaveTextContent("Three");
				});
			});

			describe("when there are multiple values", () => {
				it("should be wrapped by CssEllipsis and split by commas", () => {
					const cellProps: Partial<MultiSelectCell.Props> = { data: [{ value: "2" }, { value: "1" }, { value: "3" }] };
					const wrapper = setupTest(cellProps, { overviewModel });
					const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);
					const cssEllipsis = textOutput.getByDataRole(DataRoles.CssEllipsis);

					expect(textOutput.element).toBeInTheDocument();
					expect(cssEllipsis.element).toBeInTheDocument();
					expect(textOutput.element).toHaveTextContent("Two, One, Three");
				});
			});
		});
	});

	describe("Alignment", () => {
		it("should have TextOutput with left alignment", () => {
			const wrapper = setupTest({ data: [{ value: "enum value" }], alignment: "left" });
			const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

			expect(textOutput.element).toBeInTheDocument();
			expect(textOutput.element.classList).not.toContain("text-output-wrapper--center");
			expect(textOutput.element.classList).not.toContain("text-output-wrapper--right");
		});

		it("should have TextOutput with no alignment", () => {
			const wrapper = setupTest({ data: [{ value: "enum value" }], alignment: undefined });
			const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

			expect(textOutput.element).toBeInTheDocument();
			expect(textOutput.element.classList).not.toContain("text-output-wrapper--center");
			expect(textOutput.element.classList).not.toContain("text-output-wrapper--right");
		});

		it("should have TextOutput with right alignment", () => {
			const wrapper = setupTest({ data: [{ value: "enum value" }], alignment: "right" });
			const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

			expect(textOutput.element).toBeInTheDocument();
			expect(textOutput.element).toHaveClass("text-output-wrapper--right");
		});

		it("should have TextOutput with center alignment", () => {
			const wrapper = setupTest({ data: [{ value: "enum value" }], alignment: "center" });
			const textOutput = wrapper.getByDataRole(DataRoles.TextOutput);

			expect(textOutput.element).toBeInTheDocument();
			expect(textOutput.element).toHaveClass("text-output-wrapper--center");
		});
	});
});
