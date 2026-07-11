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

import type { RESOURCE_KEYS } from "./keys.js";

// prettier-ignore
/** @internal */
export const de: typeof RESOURCE_KEYS = {
	overviewEngine: {
		button: {
			confirmation: {
				ok: "Ok",
				cancel: "Abbrechen"
			}
		},
		rowAction: {
			confirmation: {
				ok: "Ok",
				cancel: "Abbrechen"
			},
			deleteConfirmation: {
				delete: "Löschen",
				cancel: "Abbrechen"
			}
		},
		filterSelector: {
			searchFilter: "Filtersuche",
			title: "Filter",
			inactive: "Inaktiv",
			clearAll: "Alle löschen",
			selectAll: "Alle auswählen",
			noFilterFound: "Es wurde kein Filter gefunden",
			noSetFilters: "Es sind keine Filter gesetzt.",
			noSearchResults: "Keine Suchergebnisse. Versuchen Sie es mit einer anderen Anfrage.",
			selectDeselectAllCheckboxLabel: "Alle auswählen / abwählen",
			errorIconTitle: "Diese Filteroptionen enthalten Fehler",
			errorBanner: "Es sind Fehler aufgetreten",
			section: {
				other: "Sonstige"
			}
		},
		newFilter: {
			selector: {
				closeButtonTitle: "Schließen",
				searchPlaceholder: "Suchen"
			},
			selectorOptions: {
				viewHeader: "Ansicht",
				showSearch: "Suche anzeigen",
				expandAll: "Alle Filter aufklappen",
				collapseAll: "Alle Filter einklappen",
				showSetFiltersOnly: "Nur gesetzte Filter anzeigen",
				pinFilterList: "Filterliste anheften",
				matchHeader: "Übereinstimmung",
				any: "Beliebige",
				all: "Alle",
				resultHeader: "Ergebnis",
				invert: "Invertieren"
			},
			optionsButton: {
				a11yLabel: "Einstellungsdialog"
			},
			barItemDropdown: {
				settingsTitle: "Konfigurationen",
				resetLabel: "Zurücksetzen",
				applyLabel: "Anwenden"
			},
			footer: {
				resetAllLabel: "Alle zurücksetzen",
				applyAllLabel: "Alle anwenden"
			},
			setting: {
				empty: "Leer",
				match: "Übereinstimmung",
				range: "Bereich",
				period: "Zeitraum",
				invertResult: "Ergebnis invertieren",
				fromTo: "Von Bis",
				fromOnly: "Von",
				toOnly: "Bis",
				exact: "Exakt",
				any: "Beliebige",
				all: "Alle",
				caseSensitive: "Groß-/Kleinschreibung",
				exactMatch: "Exakt",
				periodDate: "Datum",
				periodYear: "Jahr",
				periodYearMonth: "Jahr & Monat",
				periodMonth: "Monat",
				periodTime: "Uhrzeit (Heute)",
				periodDateTime: "Datum & Uhrzeit",
				yes: "Ja",
				no: "Nein"
			},
			rangeEditor: {
				fromLabel: "Von",
				toLabel: "Bis"
			},
			queryEnable: "Aktivieren",
			queryEnabledValue: "Aktiviert",
			emptyValue: "Leer",
			fieldLabel: {
				year: "Jahr",
				month: "Monat"
			}
		},
		searchButton: {
			openSearch: "Suchfeld öffnen",
			hideSearch: "Suchfeld schließen"
		},
		searchFooter: {
			filterLabel: "Anwenden",
			cancelLabel: "Abbrechen"
		},
		emptyFilterOptionsView: {
			title: "Filteroptionen",
			noViewSelected: "Kein Filter ausgewählt"
		},
		enumerationFilterOptionView: {
			noOptionFound: "Es wurde keine Option gefunden",
			showMore: "Weitere anzeigen",
			showLess: "Weniger anzeigen"
		},
		enumeratedStringFilterOptionView: {
			loadMore: "Mehr laden"
		},
		filterOptionView: {
			sectionHeader: {
				start: "Von",
				end: "Bis"
			},
			placeholder: {
				start: "Startwert für Filter",
				end: "Endwert für Filter",
				singleInput: "Filterwert",
				valueSearch: "Suche nach Wert"
			},
			select: {
				mode: "Auswahlmodus",
				date: "Datum",
				dateTime: "Datum & Zeit",
				time: "Zeit (heute)",
				monthYear: "Monat & Jahr",
				year: "Jahr",
				empty: "Leer"
			},
			hidden: {
				year: {
					start: "Startjahr",
					end: "Endjahr"
				},
				month: {
					start: "Startmonat",
					end: "Endmonat"
				}
			},
			error: {
				startGreaterThanEnd: "Der Startwert darf nicht größer als der Endwert sein.",
				partialYearMonth: "Nur Jahr-Monat-Auswahlen oder keine Auswahl sind zulässig.",
				invalidYear: "Das Jahr muss eine 4-stellige Zahl sein."
			},
			picker: {
				ok: "Ok",
				clear: "Löschen",
				back: "Zurück",
				editTime: "Zeit bearbeiten",
				datePickerButton: "Wählen Sie ein Datum",
				timePickerButton: "Wählen Sie eine Uhrzeit",
				dateTimePickerHeader: "Wählen Sie ein Datum und eine Uhrzeit"
			},
			filterOperation: {
				title: "Filter-Operatoren",
				and: "Und",
				or: "Oder"
			},
			null: "Leer",
			true: "Ja",
			false: "Nein"
		},
		filterBar: {
			edit: "Bearbeiten"
		},
		filterButton: {
			openFilter: "Filter öffnen",
			closeFilter: "Filter schließen"
		},
		"searchBar": {
			"searchButtonTitle": "Suche",
			"searchButtonMinLengthTitle": "Mindestens $count$ Zeichen eingeben",
			"placeholder": "Suche",
            "resetSearch": "Suche zurücksetzen"
		},
		searchStatus: {
			allEntriesShown: "Alle Einträge angezeigt",
			searchResultsFor: "Suchergebnisse für"
		},
		multiSelection: {
			multiSelectionButton: {
				expandTitle: "Öffne Funktionen für Massenbearbeitung",
				collapseTitle: "Schließe Funktionen für Massenbearbeitung"
			},
			clearConfirmation: {
				title: "Warnung",
				message:
					"Durch Filtern, Suchen oder Einklappen des Mehrfachauswahlfelds wird die Auswahl der Dokumente zurückgesetzt. Sind Sie sicher, dass Sie fortfahren möchten?",
				ok: "Auswahl Löschen",
				cancel: "Abbrechen"
			},
			overallCheckboxTitle: "Alle auswählen / abwählen",
			rowCheckboxTitle: "Auswählen"
		},
		"table": {
			"linkNotFound": "Link nicht gefunden."
		},
		"noResultFound": "Keine Ergebnisse gefunden",
		"noInitQuery": "Bitte wenden Sie einen Filter an oder führen Sie eine Suche aus, um Ergebnisse anzuzeigen",
		"footer": {
			"sumIconTitle": "Gesamtbetrag"
		},
		"error": {
			"requestLimitExceeded": {
				"title": "Anfragelimit überschritten",
				"message": "Zu viele Anfragen. Maximal erlaubt sind $maxRequests$. Bitte reduzieren Sie die Anzahl der Operationen."
			},
			"serverError": {
				"title": "Ein Fehler ist aufgetreten",
				"message": "$message$"
			}
		}
	},
	true: "ja",
	false: "nein",
	null: "",
	"attachment-handler": {
		error: {
			unknown: "Ein unbekannter Fehler ist aufgetreten.",
			internal: "Ein interner Fehler ist aufgetreten.",
			abort: "Beim abbrechen trat ein Fehler auf.",
			"not-found": "Die ausgewählte Datei kann nicht mehr gefunden werden.",
			security: "Keinen Zugriff auf die ausgewählte Datei.",
			"no-preview": "Eine Vorschau exestiert nicht.",
			"invalid-file": "Die letzte angegebene Datei konnte nicht verarbeitet werden.",
			"no-handler": "Kein AttachmentHandler wurde definiert."
		}
	}
};
