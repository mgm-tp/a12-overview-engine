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

// tag::main[]
import { type Middleware } from "redux";

import { DirtyHandlingFactories } from "@com.mgmtp.a12.client/client-core/dirtyHandling";
import { OverviewEngineFactories } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import {
	type Module,
	type DataLoader,
	type DataHandler,
	type DataProvider,
	ApplicationFactories,
	type ActivityReducers,
	type ApplicationSetup,
	ModuleRegistryProvider
} from "@com.mgmtp.a12.client/client-core";

export function setup(): ApplicationSetup {
	projectModules.forEach((module) => ModuleRegistryProvider.getInstance().addModule(module));

	const dataHandlers: DataHandler[] = [
		...projectDataLoaders,

		createEmptyDocumentDataProvider(),
		RelationshipFactories.createRelationshipDataProvider(),
		...OverviewEngineFactories.createDataProviders(),
		new PlatformSingleDocumentDataLoader(localeProvider)
	];

	return ApplicationFactories.createApplicationSetup({
		...otherConfigurations,
		dataHandlers,
		overridePlatformSagas: [
			...OverviewEngineFactories.createApplicationSagas(),
			...DirtyHandlingFactories.createSagas()
		],
		additionalMiddlewares: [...OverviewEngineFactories.createMiddlewares(), ...otherMiddlewares],
		dataReducers: [...OverviewEngineFactories.createDataReducers(), ...otherDataReducers]
	});
}

// end::main[]

const projectModules: Module[] = [];
const projectDataLoaders: DataLoader[] = [];
const otherMiddlewares: Middleware[] = [];
const otherDataReducers: ActivityReducers.DataReducer[] = [];

declare const createEmptyDocumentDataProvider: () => DataProvider;
declare const RelationshipFactories: { createRelationshipDataProvider: () => DataProvider };

declare const localeProvider: (state: object) => string;

class PlatformSingleDocumentDataLoader implements DataLoader {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(_localeProvider: (state: object) => string) {}

	readonly name = "PlatformSingleDocumentDataLoader";

	canHandle(): boolean {
		return false;
	}

	delete(): Promise<void> {
		return Promise.resolve(undefined);
	}

	load(): Promise<object> {
		return Promise.resolve({});
	}

	save(): Promise<object> {
		return Promise.resolve({});
	}
}

declare const otherConfigurations: Parameters<typeof ApplicationFactories.createApplicationSetup>[0];
