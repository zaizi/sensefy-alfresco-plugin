/**
 * Copyright (C) 2015 Zaizi (sensefy@zaizi.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.zaizi.sensefy.test.service;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import org.alfresco.repo.jscript.Search.SortColumn;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.zaizi.test.groups.IntegrationTest;

import com.tradeshift.test.remote.Remote;
import com.tradeshift.test.remote.RemoteTestRunner;
import com.zaizi.sensefy.service.impl.SensefyServiceImpl;

/**
 * Tests that the Sensefy remote searches work fine.
 */
@RunWith(RemoteTestRunner.class)
@Remote(runnerClass = SpringJUnit4ClassRunner.class)
@ContextConfiguration("classpath:alfresco/application-context.xml")
@Category(IntegrationTest.class)
public class SensefyServiceImplIntegrationTest implements IntegrationTest
{
    /**
     * The Sensefy service class that we want to test.
     */
    @Autowired
    private SensefyServiceImpl sensefyService;

    /**
     * The number of results to be returned for our unit tests.
     */
    private static final int TEST_MAX_RESULTS = 5;

    /**
     * Tests the retrieval of the authentication token.
     */
    @Test
    public void testGetTicket()
    {
        String ticket = this.sensefyService.getTicket();
        assertNotNull(ticket);
    }

    /**
     * Try to search a simple query.
     */
    @Test
    public void testSimpleQuery()
    {
        String res = this.sensefyService.search("test", "", 0, TEST_MAX_RESULTS, new SortColumn[0], 0);
        assertNotNull(res);
        assertFalse("{}".equals(res));
    }

    /**
     * Try to search with a date filters for the document created this year.
     */
    @Test
    public void testFilteredQuery()
    {
        String query = "test";
        String filters = "ds_creation_date:[NOW-1YEAR/YEAR TO NOW+1DAY/DAY]";
        String res = this.sensefyService.search(query, filters, 0, TEST_MAX_RESULTS, new SortColumn[0], 0);
        assertNotNull(res);
        assertFalse("{}".equals(res));
    }
}
