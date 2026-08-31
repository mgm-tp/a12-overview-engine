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

import { initializeKeys } from "@com.mgmtp.a12.utils/utils-localization";

// oxfmt-ignore
export const RESOURCE_KEYS = {
	"overviewEngine": {
		"button": {
			"confirmation": {
				"ok": "",
				"cancel": ""
			}
		},
		"rowAction": {
			"confirmation": {
				"ok": "",
				"cancel": ""
			},
			"deleteConfirmation": {
				"delete":"",
				"cancel":""
			}
		},
		"filterSelector": {
			"searchFilter": "",
			"title": "",
			"inactive": "",
			"clearAll": "",
			"selectAll": "",
			"noFilterFound": "",
			"noSetFilters": "",
			"noSearchResults": "",
			"selectDeselectAllCheckboxLabel" : "",
			"errorIconTitle": "",
			"errorBanner": "",
			"section": {
				"other": ""
			}
		},
		"newFilter": {
			"selector": {
				"closeButtonTitle": "",
				"searchPlaceholder": ""
			},
			"section": {
				"appliedTitle": "",
				"errorTitle": ""
			},
			"selectorOptions": {
				"viewHeader": "",
				"showSearch": "",
				"expandAll": "",
				"collapseAll": "",
				"showSetFiltersOnly": "",
				"pinFilterList": "",
				"matchHeader": "",
				"any": "",
				"all": "",
				"resultHeader": "",
				"invert": ""
			},
			"optionsButton": {
				"a11yLabel": ""
			},
			"barItemDropdown": {
				"settingsTitle": "",
				"resetLabel": "",
				"applyLabel": ""
			},
			"footer": {
				"resetAllLabel": "",
				"applyAllLabel": ""
			},
			"setting": {
				"empty": "",
				"match": "",
				"range": "",
				"period": "",
				"invertResult": "",
				"fromTo": "",
				"fromOnly": "",
				"toOnly": "",
				"exact": "",
				"any": "",
				"all": "",
				"caseSensitive": "",
				"exactMatch": "",
				"periodDate": "",
				"periodYear": "",
				"periodYearMonth": "",
				"periodMonth": "",
				"periodTime": "",
				"periodDateTime": "",
				"yes": "",
				"no": ""
			},
			"rangeEditor": {
				"fromLabel": "",
				"toLabel": ""
			},
			"queryEnable": "",
			"queryEnabledValue": "",
			"emptyValue": "",
			"fieldLabel": {
				"year": "",
				"month": ""
			}
		},
		"searchButton": {
			"openSearch": "",
			"hideSearch": ""
		},
		"searchFooter": {
			"filterLabel": "",
			"cancelLabel": ""
		},
		"emptyFilterOptionsView": {
			"title": "",
			"noViewSelected": ""
		},
		"enumerationFilterOptionView": {
			"noOptionFound": "",
			"showMore": "",
			"showLess": ""
		},
		"enumeratedStringFilterOptionView": {
			"loadMore": ""
		},
		"filterOptionView": {
			"sectionHeader": {
				"start": "",
				"end": ""
			},
			"placeholder": {
				"start": "",
				"end": "",
				"singleInput": "",
				"valueSearch": ""
			},
			"select": {
				"mode": "",
				"date": "",
				"dateTime": "",
				"time": "",
				"monthYear": "",
				"year": "",
				"empty": ""
			},
			"hidden": {
				"year": {
					"start": "",
					"end": ""
				},
				"month": {
					"start": "",
					"end": ""
				}
			},
			"error": {
				"startGreaterThanEnd": "",
				"partialYearMonth":"",
				"invalidYear": ""
			},
			"picker": {
				"ok": "",
				"clear": "",
				"back": "",
				"editTime": "",
				"datePickerButton": "",
				"timePickerButton": "",
				"dateTimePickerHeader": ""
			},
			"filterOperation": {
				"title": "",
				"and": "",
				"or": "",
			},
			"null": "",
			"true": "",
			"false": ""
		},
		"filterBar": {
			"edit": ""
		},
		"filterButton": {
			"openFilter": "",
			"closeFilter": "",
			"filtersAppliedTitle": ""
		},
		"searchBar": {
			"searchButtonTitle": "",
			"searchButtonMinLengthTitle": "",
			"placeholder": "",
			"resetSearch": ""
		},
		"searchStatus": {
			"allEntriesShown": "",
			"searchResultsFor": ""
		},
		"multiSelection": {
			"multiSelectionButton": {
				"expandTitle": "",
				"collapseTitle": "",
			},
			"clearConfirmation": {
				"title": "",
				"message": "",
				"ok": "",
				"cancel": ""
			},
			"overallCheckboxTitle": "",
			"rowCheckboxTitle": "",
		},
		"table": {
			"linkNotFound": ""
		},
		"noResultFound": "",
		"noInitQuery": "",
		"footer": {
			"sumIconTitle": ""
		},
		"error": {
			"requestLimitExceeded": {
				"title": "",
				"message": ""
			},
			"serverError": {
				"title": "",
				"message": ""
			}
		}
	},
	"true": "",
	"false": "",
	"null": "",
	"attachment-handler": {
		"error": {
			"unknown": "",
			"internal": "",
			"abort": "",
			"not-found": "",
			"security": "",
			"no-preview": "",
			"invalid-file": "",
			"no-handler": ""
		}
	}
};

initializeKeys(RESOURCE_KEYS);
