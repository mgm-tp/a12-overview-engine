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
import { fireEvent } from "@testing-library/react";
import { it, vi, expect, describe, beforeEach } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewEngineApi } from "../../../../../main/view/api.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { OverviewEngineInternalConstants } from "../../../../../main/shared/constants.js";
import { EnumeratedStringFilterOptionsView } from "../../../../../main/view/components/filters/options-views/enumerated-string-filter-options-view.js";

import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type TestReduxState } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.enumerated-string-filter-options-view", () => {
	const viewName = "Enumerated String Filter Options View";
	const onChangeSpy = vi.fn();
	const emptyLabel = en.overviewEngine.filterOptionView.null;
	const candidateSamples = ["Spencer", "Lynch", "DuBuque", "Monahan", "Johnston", "Crist", "Crisit", "Mills", "Emma"];

	const basicProps: EnumeratedStringFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: "string" }],
		viewName: viewName,
		onChange: onChangeSpy,
		selectedValues: [],
		activeValues: [],
		candidates: candidateSamples,
		fullSize: candidateSamples.length
	};

	function setupTest(
		props?: Partial<EnumeratedStringFilterOptionsView.Props>,
		engineProps?: Partial<OverviewEngine.Props>,
		renderOptions?: { reduxState?: Partial<TestReduxState> }
	) {
		return render(<EnumeratedStringFilterOptionsView {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, ...engineProps },
			reduxState: renderOptions?.reduxState
		});
	}

	const onSearchEnumeratedStringField = vi.fn();

	describe("The enumeration filter", () => {
		it("should render correctly based on the input candidates", () => {
			const wrapper = setupTest();
			const filterSelectorList = wrapper.getByDataRole(DataRoles.Filter.Selector.List);

			expect(wrapper.getAllByDataRole(DataRoles.Filter.Selector.List.Item)).toHaveLength(candidateSamples.length + 1);

			candidateSamples.forEach((candidate) => {
				expect(filterSelectorList.getByLabelText(candidate).element).toBeInTheDocument();
			});
		});
	});

	describe("search input minimum length", () => {
		const minSearchableTokenSize = 3;
		const reduxState: Partial<TestReduxState> = {
			dataservices: {
				configuration: {
					[OverviewEngineInternalConstants.MIN_SEARCH_TOKEN_SIZE_KEY]: String(minSearchableTokenSize)
				}
			}
		};

		it("disables search when the keyword is shorter than configured minimum", () => {
			const wrapper = setupTest(undefined, undefined, { reduxState });
			const searchInput = wrapper.query(
				`input[placeholder="${en.overviewEngine.filterOptionView.placeholder.valueSearch}"]`
			);
			expect(searchInput).not.toBeNull();

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			fireEvent.change(searchInput!.element, { target: { value: "ab" } });

			const minLengthLabel = en.overviewEngine.searchBar.searchButtonMinLengthTitle.replace(
				"$count$",
				String(minSearchableTokenSize)
			);
			const searchButton = wrapper.getByLabelText(minLengthLabel, { selector: "button" }).element;

			expect(searchButton).toBeDisabled();
		});

		it("enables search once the minimum keyword length is met", () => {
			const wrapper = setupTest(undefined, { eventHandlers: { onSearchEnumeratedStringField } }, { reduxState });
			expect(onSearchEnumeratedStringField).toHaveBeenCalledOnce();
			onSearchEnumeratedStringField.mockReset();

			const searchInput = wrapper.query(
				`input[placeholder="${en.overviewEngine.filterOptionView.placeholder.valueSearch}"]`
			);
			expect(searchInput).not.toBeNull();

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			fireEvent.change(searchInput!.element, { target: { value: "able" } });

			const searchButton = wrapper.getByLabelText(en.overviewEngine.searchBar.searchButtonTitle, {
				selector: "button"
			}).element;

			expect(searchButton).not.toBeDisabled();

			fireEvent.click(searchButton);

			expect(onSearchEnumeratedStringField).toHaveBeenCalledTimes(1);
			expect(onSearchEnumeratedStringField).toHaveBeenCalledWith(
				expect.objectContaining({ fieldPath: "/root/string", keyword: "able" })
			);
		});
	});

	describe("onSearchEnumeratedStringField", () => {
		describe("when the user enters something in the input", () => {
			it("calls the given onSearchEnumeratedStringField callback with value: ['Test']", () => {
				setupTest(undefined, {
					eventHandlers: { onSearchEnumeratedStringField: onSearchEnumeratedStringField }
				});

				expect(onSearchEnumeratedStringField).toHaveBeenCalledOnce();

				onSearchEnumeratedStringField.mockReset();
				onSearchEnumeratedStringField({ fieldPath: "/root/string", keyword: "Test" });

				expect(onSearchEnumeratedStringField).toHaveBeenCalledExactlyOnceWith({
					fieldPath: "/root/string",
					keyword: "Test"
				});
			});
		});

		describe("when the user delete everything in the input", () => {
			it("call the given onSearchEnumeratedStringField callback with empty keyword", () => {
				setupTest(undefined, {
					eventHandlers: { onSearchEnumeratedStringField: onSearchEnumeratedStringField }
				});

				expect(onSearchEnumeratedStringField).toHaveBeenCalledOnce();

				onSearchEnumeratedStringField.mockReset();
				onSearchEnumeratedStringField({ fieldPath: "/root/string", keyword: "" });

				expect(onSearchEnumeratedStringField).toHaveBeenCalledExactlyOnceWith({
					fieldPath: "/root/string",
					keyword: ""
				});
			});
		});

		describe('when the user enters "em" in the input', () => {
			it("should filter candidates and rerender the list correctly", () => {
				const wrapper = setupTest(undefined, {
					eventHandlers: { onSearchEnumeratedStringField: onSearchEnumeratedStringField }
				});

				const searchInput = wrapper.getByDataRole(DataRoles.TextField.Input);
				fireEvent.change(searchInput.element, { target: { value: "em" } });

				expect(onSearchEnumeratedStringField).toHaveBeenCalledOnce();
				onSearchEnumeratedStringField.mockReset();
				onSearchEnumeratedStringField({ fieldPath: "/root/string", keyword: "em" });
				expect(onSearchEnumeratedStringField).toHaveBeenCalledExactlyOnceWith({
					fieldPath: "/root/string",
					keyword: "em"
				});

				// Simulate the filtered results being returned and component rerendering
				const filteredCandidates = ["Emma"];
				const updatedWrapper = setupTest(
					{
						candidates: filteredCandidates,
						fullSize: filteredCandidates.length
					},
					{
						eventHandlers: { onSearchEnumeratedStringField: onSearchEnumeratedStringField }
					}
				);
				const listItems = updatedWrapper.getAllByDataRole(DataRoles.Filter.Selector.List.Item);
				expect(listItems).toHaveLength(2);
				expect(updatedWrapper.getByText(emptyLabel).element).toBeInTheDocument();
				expect(updatedWrapper.getByText("Emma").element).toBeInTheDocument();

				expect(updatedWrapper.queryByText("Spencer").element).not.toBeInTheDocument();
				expect(updatedWrapper.queryByText("Lynch").element).not.toBeInTheDocument();
			});
		});

		describe("LoadMoreItem", () => {
			describe("when the total count is less than the number of candidates", () => {
				it("Should not be rendered", () => {
					const wrapper = setupTest();

					expect(wrapper.queryByDataRole(DataRoles.Link).element).not.toBeInTheDocument();
				});
			});

			describe("When the total count is more than the number of candidates", () => {
				it("Should be rendered", () => {
					const wrapper = setupTest({ fullSize: candidateSamples.length + 1 });

					expect(wrapper.getByText("Load more").element).toBeInTheDocument();
				});

				it("onSearchEnumeratedStringField should be called with next page when click", () => {
					const wrapper = setupTest(
						{ fullSize: candidateSamples.length + 1 },
						{ eventHandlers: { onSearchEnumeratedStringField } }
					);
					fireEvent.click(wrapper.getByText("Load more").element);

					expect(onSearchEnumeratedStringField).toHaveBeenLastCalledWith({
						fieldPath: "/root/string",
						keyword: undefined,
						nextPage: true
					});
				});
			});
		});
	});

	describe("Select", () => {
		const expectedSelectedFirstValue: OverviewEngineApi.Filter.EnumeratedStringOptions = {
			filterType: "Enumeration",
			type: "EnumeratedString",
			criteria: {
				selectedValues: ["Spencer"]
			}
		};

		const expectedSelectedAllValues: OverviewEngineApi.Filter.EnumeratedStringOptions = {
			filterType: "Enumeration",
			type: "EnumeratedString",
			criteria: {
				selectedValues: candidateSamples
			},
			undefinedMatch: true
		};

		it("Select an enum value", () => {
			const wrapper = setupTest();

			fireEvent.click(wrapper.getByLabelText("Spencer").element);

			expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(expectedSelectedFirstValue, undefined);
		});

		describe("selectAll", () => {
			it("selects all enum values", () => {
				const wrapper = setupTest();
				const selectAllCheckbox = wrapper.getByLabelText(
					en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
				).element;

				fireEvent.click(selectAllCheckbox);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(expectedSelectedAllValues, undefined);
			});

			it("Selects all enum values when there is a selected value in advance", () => {
				const wrapper = setupTest({ selectedValues: ["Spencer"] });
				const selectAllCheckbox = wrapper.getByLabelText(
					en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
				).element;

				fireEvent.click(selectAllCheckbox);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(expectedSelectedAllValues, undefined);
			});
		});
	});

	describe("props", () => {
		describe("viewName", () => {
			it("is shown correctly in the title", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText(viewName).element).toBeInTheDocument();
			});
		});

		describe("Loading", () => {
			it("Should not be rendered when the loading is false", () => {
				const wrapper = setupTest({ loading: false });

				expect(wrapper.queryByDataRole(DataRoles.ProgressIndicator.OuterOverlay).element).not.toBeInTheDocument();
			});

			it("Should be rendered when the loading is true", () => {
				const wrapper = setupTest({ loading: true });

				expect(wrapper.queryByDataRole(DataRoles.ProgressIndicator.OuterOverlay).element).toBeInTheDocument();
			});
		});
	});

	describe("Empty option visibility reacts to keyword prop changes", () => {
		it("shows the Empty option again after keyword prop is cleared (regression: A12-18586)", () => {
			function KeywordController({ initialKeyword }: { initialKeyword?: string }) {
				const [keyword, setKeyword] = React.useState<string | undefined>(initialKeyword);

				return (
					<>
						<button data-testid="clear-keyword" onClick={() => setKeyword(undefined)} />
						<EnumeratedStringFilterOptionsView {...basicProps} keyword={keyword} />
					</>
				);
			}

			const wrapper = render(<KeywordController initialKeyword="Luu" />, {
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: defaultEngineProps
			});

			expect(wrapper.queryByText(emptyLabel).element).not.toBeInTheDocument();

			const clearKeywordButton = wrapper.query("[data-testid='clear-keyword']");
			expect(clearKeywordButton).not.toBeNull();

			if (!clearKeywordButton) {
				throw new Error("Clear keyword button not found");
			}

			fireEvent.click(clearKeywordButton.element);

			expect(wrapper.getByText(emptyLabel).element).toBeInTheDocument();
		});
	});

	describe("hideEmptyValueOption", () => {
		beforeEach(() => {
			onChangeSpy.mockClear();
		});

		it("removes the empty entry from the list when true", () => {
			const wrapper = setupTest({ hideEmptyValueOption: true });

			expect(wrapper.getAllByDataRole(DataRoles.Filter.Selector.List.Item)).toHaveLength(candidateSamples.length);
			expect(wrapper.queryByText(emptyLabel).element).toBeNull();
		});

		it("does not emit undefinedMatch when selecting all values", () => {
			const wrapper = setupTest({ hideEmptyValueOption: true });
			const selectAllCheckbox = wrapper.getByLabelText(
				en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
			).element;

			fireEvent.click(selectAllCheckbox);

			expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
				{
					filterType: "Enumeration",
					type: "EnumeratedString",
					criteria: { selectedValues: candidateSamples }
				},
				undefined
			);
		});
	});
});
