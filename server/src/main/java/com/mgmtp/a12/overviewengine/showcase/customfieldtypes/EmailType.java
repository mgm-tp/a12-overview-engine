/**
 * (c) copyright 2012-2026 mgm technology partners GmbH.
 * This software, the underlying source code and other artifacts are protected by copyright.
 * All rights, in particular the right to use, reproduce, publish and edit are reserved.
 * A simple right of use (license) can be acquired for use, duplication, publication, editing etc.
 * Requests for this can be made at A12-license@mgm-tp.com or other official channels of the copyright holder.
 */


package com.mgmtp.a12.overviewengine.showcase.customfieldtypes;

import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldType;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeCheckError;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeConversionResult;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeValidationParam;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

public class EmailType implements ICustomFieldType {
    Pattern emailMatcher= Pattern.compile("^\\S+@\\S+$");

    public Optional<ICustomFieldTypeCheckError> validate(String value, ICustomFieldTypeValidationParam valParam, boolean isDisplayValue, Map<String, Object> map) {
        if(emailMatcher.matcher(value).matches()) {
            return Optional.empty();
        } else {
            return Optional.of(new ICustomFieldTypeCheckError() {
                @Override
                public String getErrorMessage() {
                    return "Invalid email format";
                }

                @Override
                public String getErrorKey() {
                    return "invalid-email-format";
                }
            });
        }
    }

    public ICustomFieldTypeConversionResult convertDisplay2Internal(String displayValue, Map<String, Object> configData) {
        return new ICustomFieldTypeConversionResult() {
            @Override
            public String getConvertedValue() {
                return displayValue;
            }

            @Override
            public Optional<String> getErrorMessage() {
                return Optional.empty();
            }
        };
    }

    public ICustomFieldTypeConversionResult convertInternal2Display(String internalValue, Map<String, Object> configData) {
        return new ICustomFieldTypeConversionResult() {
            @Override
            public String getConvertedValue() {
                return internalValue;
            }

            @Override
            public Optional<String> getErrorMessage() {
                return Optional.empty();
            }
        };
    }
}
