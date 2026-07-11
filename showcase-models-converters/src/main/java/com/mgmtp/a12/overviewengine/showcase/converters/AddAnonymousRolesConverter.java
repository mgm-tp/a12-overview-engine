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
package com.mgmtp.a12.overviewengine.showcase.converters;

import com.mgmtp.a12.dataservices.wcf.WorkspaceConverter;
import com.mgmtp.a12.dataservices.wcf.annotations.WcfConverter;
import com.mgmtp.a12.dataservices.wcf.domain.ModelTuple;
import com.mgmtp.a12.dataservices.wcf.domain.Workspace;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@WcfConverter(order = 9000, name = "addAnonymousRoles", description = "Inject roles:anonymous on all runtime models for showcase anonymous auth")
public class AddAnonymousRolesConverter implements WorkspaceConverter {

    private static final String ROLES = "roles";
    private static final String ANONYMOUS = "anonymous";
    private final JsonMapper mapper = new JsonMapper();

    @Override
    public Workspace convert(Workspace workspace) {
        for (ModelTuple tuple : workspace.getModels().values()) {
            ObjectNode root = (ObjectNode) mapper.readTree(tuple.getContent());
            ObjectNode header = (ObjectNode) root.get("header");
            if (header == null) {
                continue;
            }
            ArrayNode annotations = header.has("annotations")
                    ? (ArrayNode) header.get("annotations")
                    : header.putArray("annotations");
            boolean hasRoles = false;
            for (JsonNode node : annotations) {
                if (ROLES.equals(node.path("name").asText())) {
                    hasRoles = true;
                    break;
                }
            }
            if (!hasRoles) {
                annotations.addObject().put("name", ROLES).put("value", ANONYMOUS);
            }
            tuple.setContent(mapper.writeValueAsString(root));
        }
        return workspace;
    }
}
