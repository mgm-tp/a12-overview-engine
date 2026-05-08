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

import { type RESOURCE_KEYS } from "./keys.js";

// prettier-ignore
/** @internal */
export const en: typeof RESOURCE_KEYS = {
	"overviewEngine": {
		"button": {
			"confirmation": {
				"ok": "Ok",
				"cancel": "Cancel"
			}
		},
		"rowAction": {
			"confirmation": {
				"ok": "Ok",
				"cancel": "Cancel"
			},
			"deleteConfirmation": {
				"delete": "Delete",
				"cancel": "Cancel"
			}
		},
		"filterSelector": {
			"searchFilter": "Filter Search",
			"title": "Filter Selector",
			"inactive": "Inactive",
			"clearAll": "Clear all",
			"selectAll": "Select All",
			"noFilterFound": "No filter found",
			"selectDeselectAllCheckboxLabel": "De/Select all",
			"errorIconTitle": "This filter option contains error",
			"section": {
				"other": "Other"
			}
		},
		"searchButton": {
			"openSearch": "Open search",
			"hideSearch": "Hide search"
		},
		"searchFooter": {
			"filterLabel": "Apply",
			"cancelLabel": "Cancel"
		},
		"emptyFilterOptionsView": {
			"title": "Filter Options",
			"noViewSelected": "No filter selected"
		},
		"enumerationFilterOptionView": {
			"noOptionFound": "No option found"
		},
		"enumeratedStringFilterOptionView": {
			"loadMore": "Load more"
		},
		"filterOptionView": {
			"sectionHeader": {
				"start": "Start",
				"end": "End"
			},
			"placeholder": {
				"start": "Start Filter Value",
				"end": "End Filter Value",
				"singleInput": "Filter Value",
				"valueSearch": "Value Search"
			},
			"select": {
				"mode": "Selection Mode",
				"date": "Date Range",
				"dateTime": "Date & Time Range",
				"time": "Time Range (Today)",
				"monthYear": "Month & Year Range",
				"year": "Year Range",
				"empty": "Empty",
			},
			"hidden": {
				"year": {
					"start": "Start Year",
					"end": "End Year"
				},
				"month": {
					"start": "Start Month",
					"end": "End Month"
				}
			},
			"error": {
				"startGreaterThanEnd": "The start value must not be bigger than the end value."
			},
			"picker": {
				"ok": "Ok",
				"clear": "Clear",
				"back": "Back",
				"editTime": "Edit Time",
				"datePickerButton": "Select a date",
				"timePickerButton": "Select a time",
				"dateTimePickerHeader": "Select a date and time"
			},
			"filterOperation": {
				"title": "Filter Operation",
				"and": "And",
				"or": "Or"
			},
			"null": "Empty",
			"true": "Yes",
			"false": "No"
		},
		"filterBar": {
			"edit": "Edit"
		},
		"filterButton": {
			"openFilter": "Open filter",
			"closeFilter": "Close filter"
		},
		"searchBar": {
			"searchButtonTitle": "Search",
			"searchButtonMinLengthTitle": "Enter at least $count$ characters",
			"placeholder": "Search",
            "resetSearch": "Reset search"
		},
		"searchStatus": {
			"allEntriesShown": "All entries shown",
			"searchResultsFor": "Search results for"
		},
		"multiSelection": {
			"multiSelectionButton": {
				"expandTitle": "Expand functions for bulk operation",
				"collapseTitle": "Collapse functions for bulk operation",
			},
			"clearConfirmation": {
				"title": "Warning",
				"message": "If you filter, search or collapse the multi-selection panel, all selected documents will be cleared. Do you want to continue?",
				"ok": "Clear selection",
				"cancel": "Cancel"
			},
			"overallCheckboxTitle": "De/Select all",
			"rowCheckboxTitle": "Select",
		},
		"noResultFound": "No results found",
		"noInitQuery": "Please apply a filter or perform a search to see results",
		"footer": {
			"sumIconTitle": "Total"
		},
		"error": {
			"requestLimitExceeded": {
				"title": "Request Limit Exceeded",
				"message": "Too many requests. Maximum allowed is $maxRequests$. Please reduce the number of operations."
			}
		}
	},
	"true": "yes",
	"false": "no",
	"null": "",
	"attachment-handler": {
		"error": {
			"unknown": "An unknown error occurred.",
			"internal": "An internal error occurred.",
			"abort": "An error occurred during the cancel.",
			"not-found": "The selected file cannot be found any longer.",
			"security": "No access to the selected file.",
			"no-preview": "A preview does not exist.",
			"invalid-file": "The last given file could not be processed.",
			"no-handler": "No AttachmentHandler was defined."
		}
	}
}
