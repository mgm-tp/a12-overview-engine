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

import { type Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import {
	AttachmentIcon,
	AttachmentCellContent
} from "../../../../../main/view/components/table/sub-components/attachment-cell-content.js";

import { mockType } from "../../../../utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, DataRoles, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.attachment-cell-content", () => {
	const basicEngineProps = defaultEngineProps;
	const basicAttachment: Attachment = {
		internal_filename: "internal_filename.jpg",
		original_filename: "filename.jpg",
		mime_type: "image/jpeg",
		description: "an image",
		attachment_id: null
	};

	const basicThumbnailUrl = "content";

	const MIME_TYPE = {
		supportedImage: "image/jpeg",
		nonSupportedImage: "image/tiff",
		nonImage: "application/pdf"
	};

	function setupTest(
		props?: Partial<AttachmentCellContent.Props>,
		customEngineProps?: Partial<OverviewEngine.PaginatedProps>
	): QueriableElement {
		const attachment: Attachment = {
			...basicAttachment,
			...props?.attachment
		};

		return render(
			<OverviewEngine {...basicEngineProps} {...customEngineProps}>
				<AttachmentCellContent {...props} attachment={attachment} thumbnailUrl={basicThumbnailUrl} />
			</OverviewEngine>
		);
	}

	describe("displayMode", () => {
		describe("when given displayMode = preview", () => {
			describe("when given support image attachment", () => {
				it("should render ResponsiveImageContainer", () => {
					const wrapper = setupTest({
						attachment: { mime_type: MIME_TYPE.supportedImage },
						columnModel: mockType<OverviewModel.ReferenceColumn>({
							attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.PREVIEW
						})
					});

					const responsiveImageContainer = wrapper.getByDataRole(DataRoles.ResponsiveImageContainer).element;

					expect(responsiveImageContainer).toBeInTheDocument();
					expect(responsiveImageContainer).toHaveAttribute("src", basicThumbnailUrl);
					expect(responsiveImageContainer).toHaveAttribute("alt", basicAttachment.description);
					expect(responsiveImageContainer).toHaveAttribute("title", basicAttachment.original_filename);
				});
			});

			describe("when given non-support image or non-image attachment", () => {
				it("should render an icon", () => {
					[MIME_TYPE.nonSupportedImage, MIME_TYPE.nonImage].forEach((mime_type) => {
						const attachment: Attachment = { ...basicAttachment, mime_type };
						const columnModel = mockType<OverviewModel.ReferenceColumn>({
							attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.PREVIEW
						});
						const wrapper = setupTest({ attachment, columnModel });

						const responsiveImageContainer = wrapper.queryByDataRole(DataRoles.ResponsiveImageContainer).element;
						const attachmentIcon = wrapper.getByDataRole(DataRoles.Icon).element;

						expect(responsiveImageContainer).toBeNull();
						expect(attachmentIcon).toBeInTheDocument();
						expect(attachmentIcon).toHaveAttribute("title", basicAttachment.original_filename);
					});
				});
			});
		});

		describe("when given displayMode = icon", () => {
			it("should render an icon only", () => {
				Object.values(MIME_TYPE).forEach((mime_type) => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const columnModel = mockType<OverviewModel.ReferenceColumn>({
						attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.ICON
					});
					const wrapper = setupTest({ attachment, columnModel });

					const responsiveImageContainer = wrapper.queryByDataRole(DataRoles.ResponsiveImageContainer).element;
					const attachmentIcon = wrapper.getByDataRole(DataRoles.Icon).element;

					expect(responsiveImageContainer).toBeNull();
					expect(attachmentIcon).toBeInTheDocument();
					expect(attachmentIcon).toHaveAttribute("title", basicAttachment.original_filename);
				});
			});
		});

		describe("when given displayMode = file_name", () => {
			Object.values(MIME_TYPE).forEach((mime_type) => {
				it(`should render file name only with given mime type ${mime_type}`, () => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const columnModel = mockType<OverviewModel.ReferenceColumn>({
						attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.FILE_NAME
					});
					const wrapper = setupTest({ attachment, columnModel });

					const responsiveImageContainer = wrapper.queryByDataRole(DataRoles.ResponsiveImageContainer).element;
					const attachmentIcon = wrapper.queryByDataRole(DataRoles.Icon).element;

					expect(responsiveImageContainer).toBeNull();
					expect(attachmentIcon).toBeNull();

					expect(wrapper.element).toHaveTextContent(attachment.original_filename as string);
				});
			});

			it("should use internal_filename when no given original_filename", () => {
				const attachment: Attachment = {
					...basicAttachment,
					mime_type: MIME_TYPE.nonImage,
					original_filename: undefined
				};
				const columnModel = mockType<OverviewModel.ReferenceColumn>({
					attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.FILE_NAME
				});
				const wrapper = setupTest({ attachment, columnModel });

				expect(wrapper.element).toHaveTextContent(attachment.internal_filename as string);
			});
		});

		describe("when given displayMode = icon_with_file_name", () => {
			it("should render icon and file name", () => {
				Object.values(MIME_TYPE).forEach((mime_type) => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const columnModel = mockType<OverviewModel.ReferenceColumn>({
						attachmentDisplayMode: OverviewModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME
					});
					const wrapper = setupTest({ attachment, columnModel });

					const responsiveImageContainer = wrapper.queryByDataRole(DataRoles.ResponsiveImageContainer).element;
					const attachmentIcon = wrapper.getByDataRole(DataRoles.Icon).element;

					expect(responsiveImageContainer).toBeNull();
					expect(attachmentIcon).toBeInTheDocument();
					expect(attachmentIcon).not.toHaveAttribute("title");
					expect(attachmentIcon.parentElement).toHaveTextContent(attachment.original_filename as string);
				});
			});
		});
	});

	describe("AttachmentIcon", () => {
		describe("given various mime type", () => {
			it("should render proper icon type", () => {
				const testCases: [MimeType: string | undefined | null, ExpectedIcon: string][] = [
					[undefined, "datatype_default"],
					[null, "datatype_default"],
					["application/pdf", "datatype_pdf"],
					["application/msword", "datatype_text"],
					["text/plain", "datatype_text"],
					["application/vnd.ms-excel", "datatype_spreadsheet"],
					["image/png", "datatype_image"],
					["image/ico", "datatype_image"],
					["image/tiff", "datatype_image"],
					["video/mp4", "datatype_video"],
					["video/mov", "datatype_video"],
					["audio/mp3", "datatype_audio"],
					["something/unknown", "datatype_default"]
				];

				testCases.forEach(([mime_type]) => {
					const wrapper = render(<AttachmentIcon attachment={{ ...basicAttachment, mime_type }} />, {
						wrappingComponent: OverviewEngine,
						wrappingComponentProps: basicEngineProps
					});

					const attachmentIcon = wrapper.getByDataRole(DataRoles.Icon).element;

					expect(attachmentIcon).toHaveClass("plasma-icon--big plasma-icon--custom");

					const spanElement = attachmentIcon.querySelector("span");

					expect(spanElement).toBeInTheDocument();

					expect(attachmentIcon.firstElementChild?.textContent).toBeTruthy();
				});
			});
		});
	});
});
