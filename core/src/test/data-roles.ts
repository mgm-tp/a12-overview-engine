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

import { kebabCase } from "lodash-es";

const DataRolesTree = {
	Button: {
		Label: ""
	},
	ButtonGroup: {
		Container: ""
	},
	Checkbox: {
		Input: "",
		Label: ""
	},
	Contentbox: {
		Header: "",
		Heading: "",
		Title: "",
		Content: "",
		Subtitle: "",
		Footer: "",
		Addon: "",
		GroupActionBar: "",
		ActionBarGroupDivider: ""
	},
	CssEllipsis: "",
	Message: "",
	Modal: {
		Overlay: "",
		OverlayContent: ""
	},
	Filter: {
		Selector: {
			ActionElement: "",
			ActionBar: "",
			List: {
				Item: ""
			},
			Section: "",
			Content: {
				Primary: "",
				Secondary: ""
			}
		}
	},
	HiddenText: "",
	Icon: "plasma-icon",
	Link: "",
	Popup: {
		TriggerElement: ""
	},
	Pagination: "",
	ProgressIndicator: {
		OuterOverlay: ""
	},
	Radio: {
		Item: "control",
		Input: ""
	},
	Table: {
		Header: {
			Row: "",
			Cell: {
				Content: ""
			}
		},
		Body: { Row: "", Cell: "" },
		Footer: { Row: "", Cell: "" },
		Column: {
			LeftResizeHandler: ""
		}
	},
	Textline: { Input: "", ErrorMessage: "" },
	Counter: "",
	TextOutput: {
		Content: "",
		Text: ""
	},
	ResponsiveImageContainer: "",
	ContextMenu: "",
	List: {
		Item: {
			Text: "",
			Content: "",
			Graphic: ""
		},
		SubHeader: ""
	},
	UnorderedBulletList: "",
	BulletList: {
		Item: ""
	},
	TimePicker: {
		Wrapper: "",
		Input: "",
		Clock: {
			Num: ""
		}
	},
	Messagebox: "",
	Portal: ""
};

function initialize(obj: object, paths: string[] = []): object {
	return new Proxy(obj, {
		get: (target: any, key: string) => {
			if (Object.keys(target).includes(key)) {
				const value = target[key];

				if (typeof value === "string") {
					return [...paths, value || key].map(kebabCase).join("-");
				}

				if (typeof value === "object") {
					return initialize(value, [...paths, key]);
				}

				throw new Error("Unexpected type");
			}

			return () => paths.map(kebabCase).join("-");
		}
	});
}

type DataRoleFromTree<T> = T extends string ? string : { [K in keyof T]: string & DataRoleFromTree<T[K]> };

export const InternalDataRoles = initialize(DataRolesTree) as DataRoleFromTree<typeof DataRolesTree>;
