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
import { useSelector } from "react-redux";

import { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { toggleWdyr, isWdyrEnabled } from "@com.mgmtp.a12.devtools/why-did-you-render";
import { List, Icon, PopUpMenu, HeaderTrigger, GlobalMessageBox } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	Model,
	type FrameViews,
	ApplicationFrameLayoutNGComponent,
	type ApplicationFrameLayoutPropsNG
} from "@com.mgmtp.a12.client/client-core";

import { THEMES, useThemeContext } from "./themes.js";
import { LOCALES, TIME_MODES, type TimeMode, useLocalizationContext } from "./localization.js";

declare const __VERSION__: string;
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "Unknown version";

export const CustomApplicationFrameLayout: React.FC<ApplicationFrameLayoutPropsNG> = (props) => {
	const settingItem: FrameViews.HeaderItemProps = {
		orientation: "rightSlots-left",
		item: (
			<PopUpMenu
				triggerElement={
					<HeaderTrigger>
						<Icon>info</Icon>
						<span>{version}</span>
						<Icon>arrow_drop_down</Icon>
					</HeaderTrigger>
				}>
				<List>
					<List.SubHeader fill>Locale</List.SubHeader>
					{LOCALES.map((locale) => (
						<LocaleItem locale={locale} key={Locale.toString(locale)} />
					))}
					<List.SubHeader fill>Theme</List.SubHeader>
					{Object.keys(THEMES).map((item) => (
						<ThemeItem key={item} theme={item} />
					))}
					<List.SubHeader fill>Time mode</List.SubHeader>
					{TIME_MODES.map((mode) => (
						<TimeModeItem key={mode} timeMode={mode} />
					))}
					{process.env.NODE_ENV === "development" && (
						<>
							<List.SubHeader fill>Devtools</List.SubHeader>
							<WhyDidYouRenderItem />
						</>
					)}
				</List>
			</PopUpMenu>
		)
	};

	const errors = useSelector(ModelSlice.selectErrors());
	const errorModels = React.useMemo(() => errors?.map((error) => error.name).join(", "), [errors]);

	React.useEffect(() => {
		if (errors) {
			// eslint-disable-next-line no-console
			console.error(errors);
		}
	}, [errors]);

	return (
		<ApplicationFrameLayoutNGComponent
			{...props}
			additionalHeaderItems={[settingItem]}
			globalMessageBox={
				errors && <GlobalMessageBox variant="error" content={`Invalid models found: ${errorModels}.`} />
			}
		/>
	);
};

const LocaleItem: React.FC<{ locale: Locale }> = ({ locale }) => {
	const { locale: currentLocale } = React.useContext(LocalizerContext);
	const setLocale = useLocalizationContext((context) => context.setLocale);

	const isCurrentLocale = React.useMemo(
		() => Locale.toString(locale) === Locale.toString(currentLocale),
		[currentLocale, locale]
	);

	const onClick = React.useCallback(() => setLocale(locale), [locale, setLocale]);

	return (
		<List.Item
			text={Locale.toString(locale)}
			meta={isCurrentLocale ? <Icon>check</Icon> : undefined}
			onClick={onClick}
		/>
	);
};

const ThemeItem: React.FC<{ theme: string }> = React.memo(({ theme }) => {
	const currentTheme = useThemeContext((context) => context.theme);
	const setTheme = useThemeContext((context) => context.setTheme);
	const onClick = React.useCallback(() => setTheme(theme), [setTheme, theme]);

	return <List.Item text={theme} onClick={onClick} meta={currentTheme === theme ? <Icon>check</Icon> : undefined} />;
});

const TimeModeItem: React.FC<{ timeMode: TimeMode }> = React.memo(({ timeMode }) => {
	const currentTimeMode = useLocalizationContext((context) => context.timeMode);
	const setTimeMode = useLocalizationContext((context) => context.setTimeMode);
	const onClick = React.useCallback(() => setTimeMode(timeMode), [setTimeMode, timeMode]);

	return (
		<List.Item text={timeMode} onClick={onClick} meta={currentTimeMode === timeMode ? <Icon>check</Icon> : undefined} />
	);
});

const WhyDidYouRenderItem: React.FC = React.memo(() => {
	const handleClick = React.useCallback(() => {
		toggleWdyr();
	}, []);

	return (
		<List.Item
			text="WDYR"
			title="Toggle @welldone-software/why-did-you-render"
			meta={isWdyrEnabled() ? <Icon>check</Icon> : undefined}
			onClick={handleClick}
		/>
	);
});

interface ModelSlice {
	models: ModelSlice.ModelMap;
}

namespace ModelSlice {
	export function isInstance(slice: unknown): slice is ModelSlice {
		if (typeof slice !== "object" || slice === null) {
			return false;
		}

		return "models" in slice && ModelMap.isInstance(slice.models);
	}

	export interface ModelMap {
		readonly [id: string]: Model.Error | unknown | undefined;
	}

	export namespace ModelMap {
		export function isInstance(map: unknown): map is ModelMap {
			return typeof map === "object";
		}
	}

	export const selectErrors = () => {
		return (state: object) => {
			if (!("models" in state) || !ModelSlice.isInstance(state.models)) {
				return undefined;
			}

			const modelMap = state.models.models;
			const result = Object.entries(modelMap)
				.filter(([, details]) => {
					return Model.Error.isInstance(details);
				})
				.map(([model, details]) => {
					if (!Model.Error.isInstance(details)) {
						throw new Error("Invalid model error, expect an error.");
					}

					return { name: model, message: details.message };
				});

			if (result.length === 0) {
				return undefined;
			}

			return result;
		};
	};
}
