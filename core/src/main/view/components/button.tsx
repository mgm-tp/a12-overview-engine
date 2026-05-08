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

import { useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export const Button: React.ComponentType<Button.PropsType> = React.memo(function Button(props) {
	const {
		id,
		label,
		description,
		className,
		disabled,
		onClick,
		icon,
		primary,
		destructive,
		labelHidden,
		ariaLabelledBy
	} = props;

	const BaseButton = useOverviewEngineContext((context) => context.widgetMap.Button);

	const title = React.useMemo<string | undefined>(
		() => getButtonTitle({ description, labelHidden, label }),
		[description, labelHidden, label]
	);

	const buttonAttributes = React.useMemo(
		() => getButtonAttributes({ description, label, ariaLabelledBy }),
		[description, label, ariaLabelledBy]
	);

	return (
		<BaseButton
			id={id}
			label={label}
			title={title}
			buttonAttributes={buttonAttributes}
			disabled={disabled}
			primary={primary}
			destructive={destructive}
			className={className}
			onClick={onClick}
			icon={icon}
			labelHidden={labelHidden}
		/>
	);
});

export namespace Button {
	export interface PropsType {
		readonly id?: string;
		readonly label: string;
		readonly description?: string;
		readonly disabled?: boolean;
		readonly className?: string;
		readonly icon: React.ReactNode;
		readonly primary?: boolean;
		readonly destructive?: boolean;
		readonly labelHidden?: true;
		readonly ariaLabelledBy?: string;
		onClick?(event: React.MouseEvent<HTMLElement>): void;
	}
}

/** @internal */
export function getButtonTitle(params: {
	description: string | undefined;
	labelHidden: true | undefined;
	label: string;
}): string | undefined {
	const { description, labelHidden, label } = params;

	if (description) {
		return description;
	}

	return labelHidden && label ? label : undefined;
}

/** @internal */
export function getButtonAttributes(params: {
	description: string | undefined;
	label: string;
	ariaLabelledBy?: string;
}): { "aria-label"?: string; "aria-labelledby"?: string } | undefined {
	const { description, label, ariaLabelledBy } = params;

	if (ariaLabelledBy) {
		return { "aria-labelledby": ariaLabelledBy };
	}

	let ariaLabel = label || description || undefined;

	if (label && description) {
		ariaLabel = `${label} - ${description}`;
	}

	return ariaLabel ? { "aria-label": ariaLabel } : undefined;
}
