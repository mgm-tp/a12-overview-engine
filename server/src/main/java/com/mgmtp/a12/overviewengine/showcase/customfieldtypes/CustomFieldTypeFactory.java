/**
 * (c) copyright 2012-2026 mgm technology partners GmbH.
 * This software, the underlying source code and other artifacts are protected by copyright.
 * All rights, in particular the right to use, reproduce, publish and edit are reserved.
 * A simple right of use (license) can be acquired for use, duplication, publication, editing etc.
 * Requests for this can be made at A12-license@mgm-tp.com or other official channels of the copyright holder.
 */


package com.mgmtp.a12.overviewengine.showcase.customfieldtypes;

import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldType;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CustomFieldTypeFactory implements ICustomFieldTypeFactory {
    @Override
    public Optional<ICustomFieldType> createCustomFieldTypeV2(String customFieldTypeName) {
        if (customFieldTypeName.equals("sellerEmail")) {
            return Optional.of(new EmailType());
        } else {
            throw new RuntimeException("Could not identify the custom field type: " + customFieldTypeName);
        }
    }
}
