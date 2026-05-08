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

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { type JSONDocument } from "../../../../main/models/index.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { type OverviewEngine } from "../../../../main/view/overview-engine.js";
import { de } from "../../../../main/services/localization/internal/languages/de.js";
import { en } from "../../../../main/services/localization/internal/languages/en.js";
import { DefaultWidgetMap } from "../../../../main/view/configuration/widget-map.js";
import { DefaultSelectorMap } from "../../../../main/view/configuration/selector-map.js";
import { DefaultComponentMap } from "../../../../main/view/configuration/component-map.js";
import { RowActionConfirmDialog } from "../../../../main/view/components/dialogs/sub-components/row-action-confirm-dialog.js";
import {
	OverviewEngineContext,
	type OverviewEngineContextType
} from "../../../../main/view/context/overview-engine-context.js";

import { render, DataRoles } from "../../../test-utils.js";
import { deLocale, defaultEngineProps } from "../../../basic.spec.js";
import { mockType, createLocalizedModelText } from "../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.dialog.row-action-confirm-dialog", () => {
	const onRowButtonClick = vi.fn();
	const onDialogConfirm = vi.fn();
	const onDialogClose = vi.fn();

	const contextValue: OverviewEngineContextType.Paginated = {
		...defaultEngineProps,
		uiState: {},
		eventHandlers: { onRowButtonClick, onDialogConfirm, onDialogClose },
		widgetMap: DefaultWidgetMap,
		componentMap: DefaultComponentMap,
		selectorMap: DefaultSelectorMap
	};

	const basicRowActionModel: OverviewModel.Button = {
		event: "test_event",
		label: createLocalizedModelText("test label"),
		confirmation: {
			title: createLocalizedModelText("test title"),
			message: createLocalizedModelText("test message")
		}
	};

	const basicDialogProps: RowActionConfirmDialog.Props = {
		row: { ...mockType<JSONDocument>(), id: "testId" },
		rowActionModel: basicRowActionModel,
		componentKey: "anotherComponent"
	};

	function setupTest(
		dialogProps?: Partial<RowActionConfirmDialog.Props>,
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		locale?: Locale
	) {
		const mergeDialogProps: RowActionConfirmDialog.Props = { ...basicDialogProps, ...dialogProps };

		return render(
			<OverviewEngineContext.Provider value={contextValue}>
				<RowActionConfirmDialog {...mergeDialogProps} />
			</OverviewEngineContext.Provider>,
			{
				asBaseElement: true
			},
			locale
		);
	}

	describe("row action dialog props", () => {
		describe("label and title", () => {
			it("should show English props values when given English locale", () => {
				const wrapper = setupTest();

				expect(wrapper.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent("test title EN");
				expect(wrapper.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent("test message EN");
				expect(wrapper.getByText(en.overviewEngine.rowAction.confirmation.cancel).element).toBeInTheDocument();
				expect(wrapper.getByText(en.overviewEngine.rowAction.confirmation.ok).element).toBeInTheDocument();
			});

			it("should show destructive English label for delete event", () => {
				const wrapper = setupTest({
					...basicDialogProps,
					rowActionModel: { ...basicDialogProps.rowActionModel, event: "delete" }
				});

				expect(wrapper.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent("test title EN");
				expect(wrapper.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent("test message EN");
				expect(wrapper.getByText(en.overviewEngine.rowAction.confirmation.cancel).element).toBeInTheDocument();
				expect(wrapper.getByText(en.overviewEngine.rowAction.deleteConfirmation.delete).element).toBeInTheDocument();
			});

			it("should show German props values when given German locale", () => {
				const wrapper = setupTest(undefined, undefined, deLocale);

				expect(wrapper.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent("test title DE");
				expect(wrapper.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent("test message DE");
				expect(wrapper.getByText(de.overviewEngine.rowAction.confirmation.cancel).element).toBeInTheDocument();
				expect(wrapper.getByText(de.overviewEngine.rowAction.confirmation.ok).element).toBeInTheDocument();
			});

			it("should show destructive German label for delete event", () => {
				const wrapper = setupTest(
					{
						...basicDialogProps,
						rowActionModel: { ...basicDialogProps.rowActionModel, event: "delete" }
					},
					undefined,
					deLocale
				);

				expect(wrapper.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent("test title DE");
				expect(wrapper.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent("test message DE");
				expect(wrapper.getByText(de.overviewEngine.rowAction.confirmation.cancel).element).toBeInTheDocument();
				expect(wrapper.getByText(de.overviewEngine.rowAction.deleteConfirmation.delete).element).toBeInTheDocument();
			});
		});
	});

	describe("row action dialog behaviors", () => {
		describe("on confirmation", () => {
			it("call onConfirm event handler", () => {
				const wrapper = setupTest();

				const confirmButton = wrapper.getByText(en.overviewEngine.rowAction.confirmation.ok).element;

				expect(confirmButton).toBeInTheDocument();

				fireEvent.click(confirmButton);

				expect(onRowButtonClick).toHaveBeenCalledExactlyOnceWith({
					documentId: basicDialogProps.row.id,
					rowActionModel: basicDialogProps.rowActionModel
				});

				expect(onDialogConfirm).toHaveBeenCalledOnce();
			});
		});

		describe("on cancel", () => {
			it("calls onClose event handler", () => {
				const wrapper = setupTest();

				const cancelButton = wrapper.getByText(en.overviewEngine.rowAction.confirmation.cancel).element;

				expect(cancelButton).toBeInTheDocument();

				fireEvent.click(cancelButton);

				expect(onRowButtonClick).not.toHaveBeenCalled();
				expect(onDialogClose).toHaveBeenCalledOnce();
			});
		});
	});
});
