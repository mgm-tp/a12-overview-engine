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

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { DefaultWidgetMap } from "../../../../../main/view/configuration/widget-map.js";
import { DefaultSelectorMap } from "../../../../../main/view/configuration/selector-map.js";
import { DefaultComponentMap } from "../../../../../main/view/configuration/component-map.js";
import { AttachmentCell } from "../../../../../main/view/components/table/sub-components/attachment-cell.js";
import {
	OverviewEngineContext,
	type OverviewEngineContextType
} from "../../../../../main/view/context/overview-engine-context.js";

import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.attachment-cell", () => {
	const basicEngineProps = {
		...defaultEngineProps
	};
	const dataForAttachmentField = {
		internal_filename: "new.jpg",
		original_filename: null,
		category: null,
		description: null,
		attachment_id: null,
		size: null
	};

	const contextValue: OverviewEngineContextType.Paginated = {
		...defaultEngineProps,
		uiState: {},
		eventHandlers: {},
		widgetMap: DefaultWidgetMap,
		componentMap: DefaultComponentMap,
		selectorMap: DefaultSelectorMap
	};

	function setupTest(
		props?: Partial<AttachmentCell.Props>,
		engineProps?: Partial<OverviewEngine.Props>,
		thumbnails?: Record<string, string>
	): QueriableElement {
		return render(
			<OverviewEngineContext.Provider value={{ ...contextValue, thumbnails }}>
				<AttachmentCell attachment={props?.attachment ?? dataForAttachmentField} documentId="test" />
			</OverviewEngineContext.Provider>,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			}
		);
	}

	describe("Given an attachment with mime type is an image", () => {
		const image = {
			...dataForAttachmentField,
			mime_type: "image/jpeg"
		};

		describe("without attachment_id", () => {
			const testCases = [
				{
					description: "without attachment_id",
					attachment: { ...image, attachment_id: null }
				}
			];
			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should not render img tag and icon", () => {
						const result = setupTest({ attachment: { ...testCase.attachment } });

						expect(result.query("img")).toBe(null);
						expect(result.queryByDataRole(DataRoles.Icon).element).toBe(null);
					});
				});
			});
		});

		describe("with attachment_id", () => {
			const attachmentIdWithThumbnails = "defc13ef-8e49-4a2e-9590-eb0c4f35c379";
			const imgSrc = "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d";
			const thumbnails = { [attachmentIdWithThumbnails]: imgSrc };

			describe(`with thumbnailUrl`, () => {
				it("should render image tag instead of icon", () => {
					const attachment = { ...image, attachment_id: attachmentIdWithThumbnails };
					const result = setupTest({ attachment }, undefined, thumbnails);

					expect(result.query("img")?.element).toBeInTheDocument();
					expect(result.query("img")?.element.getAttribute("src")).toEqual(imgSrc);
					expect(result.queryByDataRole(DataRoles.Icon).element).toBe(null);
				});
			});
		});
	});

	describe("Given an attachment with mime type is not an image", () => {
		const attachment = {
			...dataForAttachmentField,
			mime_type: "application/pdf"
		};

		describe("without attachment_id", () => {
			it("should not render img tag but will render an icon", () => {
				const result = setupTest({ attachment: { ...attachment, attachment_id: null } });

				expect(result.query("img")).toBe(null);
				expect(result.queryByDataRole(DataRoles.Icon).element).toBeInTheDocument();
			});
		});

		describe("with attachment_id", () => {
			const attachmentIdWithThumbnails = "defc13ef-8e49-4a2e-9590-eb0c4f35c379";
			const thumbnails = {
				[attachmentIdWithThumbnails]: "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d"
			};

			const testCases = [
				{
					description: "with attachment_id, with thumbnailUrl",
					attachment: { ...attachment, attachment_id: attachmentIdWithThumbnails }
				},
				{
					description: "with attachment_id, without thumbnailUrl",
					attachment: { ...attachment, attachment_id: "defc13ef" }
				}
			];

			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should render icon instead of image tag", () => {
						const result = setupTest(
							{ attachment: { ...testCase.attachment, internal_filename: "Booking.pdf" } },
							undefined,
							thumbnails
						);

						expect(result.query("img")).toBe(null);
						expect(result.queryByDataRole(DataRoles.Icon).element).toHaveTextContent("Booking.pdf");
					});
				});
			});
		});
	});

	describe("Given an image attachment with inline content", () => {
		const attachment = {
			...dataForAttachmentField,
			mime_type: "image/jpeg",
			content: "data:image/abcdef1cf7f6f3b61d"
		};

		const attachmentIdWithThumbnails = "defc13ef-8e49-4a2e-9590-eb0c4f35c379";
		const imgSrc = "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d";
		const thumbnails = { [attachmentIdWithThumbnails]: imgSrc };

		const testCases = [
			{
				description: "with attachment_id",
				attachment: { ...attachment, attachment_id: attachmentIdWithThumbnails }
			},
			{
				description: "without attachment_id",
				attachment: { ...attachment, attachment_id: null }
			}
		];

		testCases.forEach((testCase) => {
			it(testCase.description, () => {
				const result = setupTest({ attachment: testCase.attachment }, undefined, thumbnails);
				expect(result.query("img")?.element.getAttribute("src")).not.toEqual(testCase.attachment.content);
			});
		});
	});
});
