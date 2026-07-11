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
import { useDispatch } from "react-redux";

import type { ViewNGProps } from "@com.mgmtp.a12.client/client-core";
import {
	type Container,
	ActionContentbox,
	ContentBoxElements,
	ButtonGroupContainer
} from "@com.mgmtp.a12.widgets/widgets-core";

import { useFormDataHolder } from "./hooks.js";
import { SimpleFormActions } from "./actions.js";

export const SimpleForm: React.FC<ViewNGProps & Container & { title: string }> = (props) => {
	const { activityId } = props;
	const dispatch = useDispatch();
	const onSave = React.useCallback(() => dispatch(SimpleFormActions.onSave({ activityId })), [activityId, dispatch]);
	const onCancel = React.useCallback(
		() => dispatch(SimpleFormActions.onCancel({ activityId })),
		[activityId, dispatch]
	);

	const defaultDataHolder = useFormDataHolder();
	const dirty = React.useMemo(() => defaultDataHolder.dirty, [defaultDataHolder.dirty]);

	return (
		<ActionContentbox
			listenToNavigationContext
			headingElements={<ContentBoxElements.Title ariaLevel={2} text={props.title} />}
			footer={
				<ContentBoxElements.Footer>
					<ButtonGroupContainer
						responsive
						leftSlotButtons={[{ label: "Cancel", destructive: true, onClick: onCancel }]}
						rightSlotButtons={[{ label: "Save", disabled: !dirty, primary: true, onClick: onSave }]}
					/>
				</ContentBoxElements.Footer>
			}
			padding="18px">
			{props.children}
		</ActionContentbox>
	);
};
