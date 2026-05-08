/**
 * (c) copyright 2012-2026 mgm technology partners GmbH.
 * This software, the underlying source code and other artifacts are protected by copyright.
 * All rights, in particular the right to use, reproduce, publish and edit are reserved.
 * A simple right of use (license) can be acquired for use, duplication, publication, editing etc.
 * Requests for this can be made at A12-license@mgm-tp.com or other official channels of the copyright holder.
 */


package com.mgmtp.a12.overviewengine.showcase;

import org.springframework.boot.SpringApplication;

import com.mgmtp.a12.dataservices.DataServicesApplication;
import com.mgmtp.a12.dataservices.configuration.DataServicesCoreProperties;
import com.mgmtp.a12.kernel.core.customfieldtype.CustomFieldTypeService;
import com.mgmtp.a12.overviewengine.showcase.customfieldtypes.CustomFieldTypeFactory;

@DataServicesApplication(scanBasePackages = { DataServicesCoreProperties.DS_PACKAGE_PREFIX, "com.mgmtp.a12.overviewengine.showcase" })
public class ShowcaseServerApplication {
    public static void main(String[] args) {
	    CustomFieldTypeService.getInstanceV2().registerV2(new CustomFieldTypeFactory());

        SpringApplication.run(ShowcaseServerApplication.class, args);
    }
}
