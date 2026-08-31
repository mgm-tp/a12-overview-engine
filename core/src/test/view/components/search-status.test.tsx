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

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../main/overview-model.js";
import { de, en } from "../../../main/services/localization/internal/shared.js";
import type { OverviewEngineApi } from "../../../main/view/api.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { deLocale, enLocale, defaultEngineProps } from "../../basic.spec.js";
import { render, type QueriableElement } from "../../test-utils.js";
import { noop, type PartialOEInfiniteScrollProps } from "../../utils.js";

const getSearchResult = (searchLocale: string, searchString: string, rowCount?: number) => {
	if (rowCount) {
		return `${rowCount} ${searchLocale} ${searchString}`;
	}

	return `${searchLocale} ${searchString}`;
};

describe("com.mgmtp.a12.overview-engine.view.components.search-status", () => {
	const basicEngineProps: OverviewEngine.PaginatedProps = {
		...defaultEngineProps,
		eventHandlers: { onSearch: noop }
	};

	function setupTest(
		engineProps?: Partial<OverviewEngine.PaginatedProps> | PartialOEInfiniteScrollProps,
		locale?: Locale
	): QueriableElement {
		return render(<OverviewEngine {...basicEngineProps} {...engineProps} />, undefined, locale);
	}

	const defaultOverviewModel = defaultEngineProps.overviewModel;

	describe("when showFullTextSearch = false", () => {
		it("should not render hidden text", () => {
			const overviewModel = {
				...defaultOverviewModel,
				content: {
					...defaultOverviewModel.content,
					configuration: {
						...defaultOverviewModel.content.configuration,
						showFullTextSearch: false
					}
				}
			};
			const wrapper = setupTest({ overviewModel });

			expect(wrapper.queryByDataRole(DataRoles.HiddenText).element).not.toBeInTheDocument();
		});
	});

	describe("when missing onSearch", () => {
		it("should not render hidden text", () => {
			const wrapper = setupTest({ eventHandlers: {} });

			expect(wrapper.queryByDataRole(DataRoles.HiddenText).element).not.toBeInTheDocument();
		});
	});

	describe("when have onSearch and showFullTextSearch = true", () => {
		describe("when searchString is empty", () => {
			it("should render hidden text as allEntriesShown", () => {
				const testCases = [
					{ locale: enLocale, expected: en.overviewEngine.searchStatus.allEntriesShown },
					{ locale: deLocale, expected: de.overviewEngine.searchStatus.allEntriesShown }
				];

				testCases.forEach(({ locale, expected }) => {
					const wrapper = setupTest(undefined, locale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(expected);
				});
			});
		});

		describe("when searchString is not empty", () => {
			const searchString = "ball";

			describe("when rowCount is undefined", () => {
				it("should render searchResultsFor and searchString when given English locale", () => {
					const wrapper = setupTest({ uiState: { searchString } }, enLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(getSearchResult(en.overviewEngine.searchStatus.searchResultsFor, searchString));
				});

				it("should render searchResultsFor and searchString when given German locale", () => {
					const wrapper = setupTest({ uiState: { searchString } }, deLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(getSearchResult(de.overviewEngine.searchStatus.searchResultsFor, searchString));
				});
			});

			describe("when has rowCount", () => {
				const pagination = {
					pageSize: 10,
					pageNumber: 1
				};
				const totalDocumentsCount = 25;

				it("should render hidden text properly for pagination when given English locale", () => {
					const wrapper = setupTest({ uiState: { searchString, pagination }, totalDocumentsCount }, enLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(
						getSearchResult(en.overviewEngine.searchStatus.searchResultsFor, searchString, totalDocumentsCount)
					);
				});

				it("should render hidden text properly for pagination when given German locale", () => {
					const wrapper = setupTest({ uiState: { searchString, pagination }, totalDocumentsCount }, deLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(
						getSearchResult(de.overviewEngine.searchStatus.searchResultsFor, searchString, totalDocumentsCount)
					);
				});
			});

			describe("when has infiniteScrollOptions", () => {
				const overviewModel: OverviewModel = {
					...defaultOverviewModel,
					content: {
						...defaultOverviewModel.content,
						configuration: {
							...defaultOverviewModel.content.configuration,
							enableInfiniteScroll: true,
							rowHeight: 70
						}
					}
				};
				const infiniteScrollOptions: OverviewEngineApi.InfiniteScrollOptions = {
					rowCount: 120,
					rowLoadingStatus: () => "loaded",
					loadData: vi.fn()
				};

				it("should render hidden text properly for infiniteScroll when given English locale", () => {
					const wrapper = setupTest({ overviewModel, uiState: { searchString }, infiniteScrollOptions }, enLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(
						getSearchResult(
							en.overviewEngine.searchStatus.searchResultsFor,
							searchString,
							infiniteScrollOptions.rowCount
						)
					);
				});

				it("should render hidden text properly for infiniteScroll when given German locale", () => {
					const wrapper = setupTest({ overviewModel, uiState: { searchString }, infiniteScrollOptions }, deLocale);

					expect(
						wrapper.queryByDataRoles(DataRoles.Contentbox.Content, DataRoles.HiddenText)?.element
					).toHaveTextContent(
						getSearchResult(
							de.overviewEngine.searchStatus.searchResultsFor,
							searchString,
							infiniteScrollOptions.rowCount
						)
					);
				});
			});
		});
	});
});
