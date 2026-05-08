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

import { type Recipe, migrateImports, type ImportMigrationConfiguration } from "@com.mgmtp.a12.devtools/codemod";

const OVERVIEW_MODEL_ENTITIES = [
	"Content",
	"Configuration",
	"ContextMenu",
	"ActionGroup",
	"ColumnRef",
	"Styles",
	"Width",
	"PinDirection",
	"Column",
	"ReferenceColumn",
	"Summary",
	"ExpressionColumn",
	"BaseColumn",
	"SubHeaderBox",
	"FooterBox",
	"Element",
	"BaseElement",
	"ButtonElement",
	"MultiSelectionElement",
	"SearchElement",
	"FilterElement",
	"ElementType",
	"SectionItem",
	"FilterConfiguration",
	"FilterMode",
	"EnumeratedStringFilterConfiguration",
	"FieldConfiguration",
	"RowActionGroup",
	"ConfirmationText",
	"DefaultRowAction",
	"Triggerable",
	"ContextMenuItem",
	"Button",
	"Annotated",
	"Icon",
	"ColumnAlignment",
	"ColumnStyles",
	"Alignment",
	"HorizontalAlignment",
	"VerticalAlignment",
	"MultiSelection",
	"AttachmentDisplayMode",
	"MultiSelectDisplayMode",
	"IconTheme"
];

const packageName = "@com.mgmtp.a12.overviewengine/overviewengine-core";

const migrationConfig: ImportMigrationConfiguration = {
	entityMigrations: [
		{
			from: { packageName, subPath: "/lib/main/overview-model.js", entity: "OverviewModel" },
			to: { subPath: "" }
		},
		...OVERVIEW_MODEL_ENTITIES.map((entity) => ({
			from: { packageName, subPath: "/lib/main/overview-model.js", entity },
			to: { subPath: "", namespaces: ["OverviewModel"] }
		}))
	],
	pathMigrations: [
		{
			from: `${packageName}/lib/main/**/*.js`,
			exclude: [`${packageName}/lib/main/overview-model.js`],
			to: packageName
		}
	]
};

/**
 * Recipe that migrates Overview Engine imports to prefer top-level namespace imports
 */
export const preferTopLevelImportsRecipe: Recipe = {
	metadata: {
		id: "prefer-top-level-imports",
		description:
			"Migrates Overview Engine imports from deep paths to top-level namespace imports (e.g., OverviewModel.Content instead of importing from /lib/main/overview-model.js)",
		supportedVersions: "^38.2.0"
	},

	execute(project): void {
		const sourceFiles = project.getSourceFiles();

		for (const sourceFile of sourceFiles) {
			migrateImports(sourceFile, migrationConfig);
		}
	}
};
