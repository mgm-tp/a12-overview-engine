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

import { type Action, type AnyAction, type ActionCreator, actionCreatorFactory } from "typescript-fsa";

import { Activity, ActivityActions } from "@com.mgmtp.a12.client/client-core";

import { type UiState } from "../../store/index.js";

import { type EnumeratedStringDataHolder } from "./data-holder.js";

export namespace OverviewEngineActions {
	/**
	 * An action creator that enables specifying initial Overview Engine UI slices
	 * @param createActivityPayload - an object to specify core properties for the new activity
	 * @param initialUiState - to specify the initial Overview Engine UI slices
	 */
	export function createActivity(
		createActivityPayload: ActivityActions.CreatePayload,
		initialUiState?: UiState
	): Action<ActivityActions.PushPayload> {
		let action = ActivityActions.create(createActivityPayload);
		const defaultDataHolder = Activity.findDefaultDataHolder(action.payload.activity);

		if (initialUiState && defaultDataHolder) {
			const uiState = { ...initialUiState };
			const newDefaultDataHolder: Activity.DataHolder = {
				...defaultDataHolder,
				slices: { uiState: { ...(uiState as Activity.DataHolder["slices"]) } }
			};
			const newDataHolders = action.payload.activity.dataHolders?.map((dataHolder) =>
				dataHolder === defaultDataHolder ? newDefaultDataHolder : dataHolder
			);
			action = {
				...action,
				payload: {
					...action.payload,
					activity: { ...action.payload.activity, dataHolders: newDataHolders }
				}
			};
		}

		return action;
	}

	const commandActionType = "OverviewEngine/COMMAND";
	export const command: ActionCreator<CommandPayload> = Object.assign(
		(payload: CommandPayload): Action<CommandPayload> => {
			const { engineAction } = payload;
			const [, commandType] = typeof engineAction.type === "string" ? engineAction.type.split("/") : [];

			if (commandType) {
				return { type: `${commandActionType}/${commandType}`, payload };
			}

			return { type: commandActionType, payload };
		},
		{
			match(anyAction: AnyAction): anyAction is Action<CommandPayload> {
				return anyAction.type.includes(commandActionType);
			},
			toString: () => commandActionType,
			type: commandActionType
		}
	);
	export interface CommandPayload<T = AnyAction> {
		activityId: string;
		engineAction: T;
	}

	const eventActionType = "OverviewEngine/EVENT";
	export const event: ActionCreator<EventPayload> = Object.assign(
		(payload: EventPayload): Action<EventPayload> => {
			const { engineAction } = payload;
			const [, eventType] = typeof engineAction.type === "string" ? engineAction.type.split("/") : [];

			if (eventType) {
				return { type: `${eventActionType}/${eventType}`, payload };
			}

			return { type: eventActionType, payload };
		},
		{
			match(anyAction: AnyAction): anyAction is Action<EventPayload> {
				return anyAction.type.includes(eventActionType);
			},
			toString: () => eventActionType,
			type: eventActionType
		}
	);
	export interface EventPayload<T = AnyAction> {
		activityId: string;
		engineAction: T;
	}

	const factory = actionCreatorFactory("OverviewEngine");

	export const createEnumeratedStringDataHolder = factory<CreateEnumeratedStringDataHolderPayload>(
		"CREATE_ENUMERATED_STRING_DATA_HOLDER"
	);
	export interface CreateEnumeratedStringDataHolderPayload {
		readonly activityId: string;
		readonly descriptor: Activity.DataHolderDescriptor;
		readonly data: EnumeratedStringDataHolder.Data;
	}

	export const enumeratedStringQueryParametersChanged = factory<EnumeratedStringQueryParametersChangedPayload>(
		"ENUMERATED_STRING_QUERY_PARAMETERS_CHANGED"
	);
	export interface EnumeratedStringQueryParametersChangedPayload {
		readonly activityId: string;
		readonly fieldPath: string;
		readonly keyword: string;
		readonly nextPage: boolean;
		readonly reload?: boolean;
		readonly modelId?: string;
	}

	export const setEnumeratedStringCandidates = factory<SetEnumeratedStringCandidatesPayload>(
		"SET_ENUMERATED_STRING_CANDIDATES"
	);
	export interface SetEnumeratedStringCandidatesPayload {
		readonly activityId: string;
		readonly fieldPath: string;
		readonly candidates: string[];
		readonly fullSize: number;
	}
}
