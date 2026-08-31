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

import type { Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @internal */
export namespace AttachmentCellContent {
	export interface Props {
		thumbnailUrl?: string;
		attachment: Attachment;
		columnModel?: OverviewModel.ReferenceColumn;
	}
}

/** @internal */
export namespace AttachmentIcon {
	export interface Props {
		attachment: Attachment;
		title?: string;
	}
}

/** @internal */
export const AttachmentCellContent: React.FC<AttachmentCellContent.Props> = React.memo(
	function AttachmentCellContent(props) {
		const { columnModel, attachment, thumbnailUrl } = props;

		const ResponsiveImageContainer = useOverviewEngineContext((context) => context.widgetMap.ResponsiveImageContainer);

		const { useImage, hasIcon, hasFileName } = React.useMemo(() => {
			const displayMode = columnModel?.attachmentDisplayMode ?? OverviewModel.AttachmentDisplayMode.PREVIEW;
			const hasFileName = [
				OverviewModel.AttachmentDisplayMode.FILE_NAME,
				OverviewModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME
			].includes(displayMode);

			if (isSupportedImage(attachment.mime_type ?? "")) {
				if (displayMode === OverviewModel.AttachmentDisplayMode.PREVIEW) {
					return { useImage: true };
				}

				return {
					hasIcon: [
						OverviewModel.AttachmentDisplayMode.ICON,
						OverviewModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME
					].includes(displayMode),
					hasFileName
				};
			}

			return {
				hasIcon: displayMode !== OverviewModel.AttachmentDisplayMode.FILE_NAME,
				hasFileName
			};
		}, [attachment.mime_type, columnModel?.attachmentDisplayMode]);

		const fileName = React.useMemo(
			() => attachment.original_filename || attachment.internal_filename || undefined,
			[attachment.internal_filename, attachment.original_filename]
		);

		if (useImage && thumbnailUrl) {
			return <ResponsiveImageContainer src={thumbnailUrl} alt={attachment.description || undefined} title={fileName} />;
		}

		if (hasIcon || hasFileName) {
			return (
				<span className={addPrefix("-u-inline-flex -u-items-center")}>
					{hasIcon && <AttachmentIcon attachment={attachment} title={hasFileName ? undefined : fileName} />}
					{hasFileName && fileName}
				</span>
			);
		}

		return null;
	}
);

/** @internal */
export const AttachmentIcon: React.FC<AttachmentIcon.Props> = React.memo(function AttachmentIcon(props) {
	const { attachment, title } = props;

	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);

	const attachmentType = React.useMemo(() => getAttachmentType(attachment), [attachment]);

	return (
		<Icon className={addPrefix("-u-text-black")} size="big" title={title} iconTheme="custom">
			{`datatype_${attachmentType}`}
		</Icon>
	);
});

type AttachmentType = "image" | "text" | "pdf" | "spreadsheet" | "audio" | "video" | "default";

function getAttachmentType(attachment: Attachment): AttachmentType {
	const mimeType = attachment?.mime_type;

	if (!mimeType) {
		return "default";
	}

	if (mimeType === "application/pdf") {
		return "pdf";
	}

	if (
		[
			"text/rtf",
			"text/plain",
			"application/rtf",
			"application/msword",
			"application/vnd.oasis.opendocument.text",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		].includes(mimeType)
	) {
		return "text";
	}

	if (
		[
			"application/vnd.ms-excel",
			"application/vnd.oasis.opendocument.spreadsheet",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		].includes(mimeType)
	) {
		return "spreadsheet";
	}

	const type = mimeType.split("/")[0];

	if (["image", "video", "audio"].includes(type)) {
		return type as AttachmentType;
	}

	return "default";
}

function isSupportedImage(mimeType: string): boolean {
	return ["image/jpeg", "image/png", "image/bmp", "image/gif", "image/vnd.microsoft.icon", "image/webp"].includes(
		mimeType
	);
}
