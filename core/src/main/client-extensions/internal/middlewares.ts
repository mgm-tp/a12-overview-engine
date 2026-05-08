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

import { type AnyAction } from "typescript-fsa";
import { type Dispatch, type Middleware, type MiddlewareAPI } from "redux";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { ActivityActions } from "@com.mgmtp.a12.client/client-core";
import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DataServicesConfiguration } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { Commands, createEngineMiddlewares } from "../../store/index.js";
import { OverviewEngineInternalConstants } from "../../shared/constants.js";

import { OverviewEngineActions } from "./actions.js";
import { OverviewEngineSelectors } from "./selectors.js";

/** @internal */
export const createOverviewEngineAdapterMiddleware = (): Middleware => {
	const middlewares = createEngineMiddlewares();

	return (api) => (next) => (action) => {
		if (
			OverviewEngineActions.event.match(action) ||
			(OverviewEngineActions.command.match(action) && !Commands.setQueryParameters.match(action.payload.engineAction))
		) {
			createEngineNextActionDispatch({ activityId: action.payload.activityId, api, next, middlewares })(
				action.payload.engineAction
			);

			return action;
		}

		return next(action);
	};
};

function createEngineGetState(getState: () => object, activityId: string): () => object {
	return () => {
		const uiState = OverviewEngineSelectors.uiState(activityId)(getState());

		if (!uiState) {
			throw new Error("Cannot find UiState");
		}

		return uiState;
	};
}

function createEngineDispatch(dispatch: Dispatch<AnyAction>, activityId: string): Dispatch<AnyAction> {
	return <T extends AnyAction>(engineAction: T): T => {
		if (engineAction.type.includes("COMMAND")) {
			dispatch(OverviewEngineActions.command({ activityId, engineAction }));
		} else {
			dispatch(OverviewEngineActions.event({ activityId, engineAction }));
		}

		return engineAction;
	};
}

/**
 * @see https://redux.js.org/advanced/middleware#attempt-6-naively-applying-the-middleware
 */
function createEngineNext(
	api: MiddlewareAPI<Dispatch<AnyAction>, object>,
	next: Dispatch,
	activityId: string,
	middlewares: Middleware[]
): <T extends AnyAction>(action: T) => T {
	const reversedMiddlewares = [...middlewares].reverse();
	const engineDispatch = createEngineDispatch(next, activityId);
	let dispatch = <T extends AnyAction>(engineAction: T): T => {
		engineDispatch(engineAction);

		return engineAction;
	};

	reversedMiddlewares.forEach((middleware) => {
		dispatch = middleware(api)(dispatch);
	});

	return dispatch;
}

function createEngineNextActionDispatch(params: {
	activityId: string;
	api: MiddlewareAPI<Dispatch<AnyAction>, object>;
	next: Dispatch<AnyAction>;
	middlewares: Middleware[];
}): <T extends AnyAction>(action: T) => T {
	const { activityId, api, next, middlewares } = params;
	const engineApi: MiddlewareAPI = {
		getState: createEngineGetState(api.getState, activityId),
		dispatch: createEngineDispatch(api.dispatch, activityId)
	};

	return createEngineNext(engineApi, next, activityId, middlewares);
}

const usedProps: (keyof DataServicesConfiguration)[] = [
	OverviewEngineInternalConstants.MIN_SEARCH_TOKEN_SIZE_KEY,
	OverviewEngineInternalConstants.MAX_METHOD_CALLS_PER_REQUEST_KEY
];
let monitoredPropsChecked = false;
/** @internal */
export const createOverviewEngineDataServicesMonitoredPropertiesMiddleware = (): Middleware => {
	return (api) => (next) => (action) => {
		const result = next(action);

		if (monitoredPropsChecked) {
			return result;
		}

		if (
			// MIN_SEARCH_TOKEN_SIZE_KEY
			OverviewEngineActions.command.match(action) ||
			OverviewEngineActions.event.match(action) ||
			OverviewEngineActions.enumeratedStringQueryParametersChanged.match(action) ||
			// MAX_METHOD_CALLS_PER_REQUEST_KEY
			ActivityActions.loadData.match(action)
		) {
			const allMonitoredPropsSet = usedProps
				.map((key) => DataServicesSelectors.configurationByKey(key)(api.getState()))
				.every((value) => value !== undefined);
			monitoredPropsChecked = true;

			if (!allMonitoredPropsSet) {
				LoggerFactory.getLogger("OverviewEngine").warn(
					"Missing monitored properties from Data Services. The engine may not function properly!"
				);
			}
		}

		return result;
	};
};
