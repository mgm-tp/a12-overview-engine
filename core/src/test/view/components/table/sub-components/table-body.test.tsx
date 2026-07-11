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

import * as TypeMoq from "typemoq";
import { it, vi, expect, describe, beforeAll, type MockInstance } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DefaultTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../../main/models/index.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { de, en } from "../../../../../main/services/localization/internal/shared.js";
import { TableBody } from "../../../../../main/view/components/table/sub-components/table-body.js";

import { deLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.table-body", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;
	let bodyRendererStub: MockInstance<(typeof DefaultTableComponentRenderers)["bodyRenderer"]>;
	const jsonDocument = TypeMoq.Mock.ofType<JSONDocument>();

	const basicProps: TableBody.Props = {
		data: [jsonDocument.object]
	};

	function setupTest(
		props?: TableBody.Props,
		locale?: Locale,
		engineProps?: Partial<OverviewEngine.Props>
	): QueriableElement {
		return render(
			<TableBody {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	beforeAll(() => {
		bodyRendererStub = vi.spyOn(DefaultTableComponentRenderers, "bodyRenderer");
	});

	describe("given a table body", () => {
		describe("given no data", () => {
			describe("given english locale", () => {
				it("should render english message only", () => {
					const wrapper = setupTest({ data: [] });

					const message = wrapper.getByDataRole(DataRoles.Message).element;

					expect(message).toHaveTextContent(en.overviewEngine.noResultFound);
					expect(bodyRendererStub).not.toHaveBeenCalled();
				});
			});

			describe("given german locale", () => {
				it("should render german message only", () => {
					const wrapper = setupTest({ data: [] }, deLocale);

					const message = wrapper.getByDataRole(DataRoles.Message).element;

					expect(message).toHaveTextContent(de.overviewEngine.noResultFound);
					expect(bodyRendererStub).not.toHaveBeenCalled();
				});
			});
		});

		describe("given data", () => {
			it("should render using default bodyRenderer", () => {
				const text = "rendered correctly";
				bodyRendererStub.mockImplementation(() => <div>{text}</div>);
				const wrapper = setupTest().element;

				expect(wrapper).toHaveTextContent(text);
			});
		});

		describe("given skipInitialLoad is enabled", () => {
			const skipInitialLoadModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					configuration: {
						...basicEngineProps.overviewModel.content.configuration,
						skipInitialLoad: true
					}
				}
			};

			it("should render noInitQuery message when dataLoadTriggered is not set", () => {
				const wrapper = setupTest({ data: [] }, undefined, {
					overviewModel: skipInitialLoadModel,
					uiState: { ...basicEngineProps.uiState }
				});

				const message = wrapper.getByDataRole(DataRoles.Message).element;

				expect(message).toHaveTextContent(en.overviewEngine.noInitQuery);
			});

			it("should render noResultFound message when dataLoadTriggered is true and no data", () => {
				const wrapper = setupTest({ data: [] }, undefined, {
					overviewModel: skipInitialLoadModel,
					uiState: { ...basicEngineProps.uiState, dataLoadTriggered: true }
				});

				const message = wrapper.getByDataRole(DataRoles.Message).element;

				expect(message).toHaveTextContent(en.overviewEngine.noResultFound);
			});
		});
	});
});
