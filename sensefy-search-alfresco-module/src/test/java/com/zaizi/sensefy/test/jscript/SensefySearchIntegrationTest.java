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
package com.zaizi.sensefy.test.jscript;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.zaizi.test.groups.IntegrationTest;

import com.tradeshift.test.remote.Remote;
import com.tradeshift.test.remote.RemoteTestRunner;
import com.zaizi.sensefy.jscript.SensefySearch;

/**
 * Tests that the Sensefy Search JavaScript object work fine.
 */
@RunWith(RemoteTestRunner.class)
@Remote(runnerClass = SpringJUnit4ClassRunner.class)
@ContextConfiguration("classpath:alfresco/application-context.xml")
@Category(IntegrationTest.class)
public class SensefySearchIntegrationTest implements IntegrationTest
{
    /**
     * The Sensefy JavaScript Object that we want to test.
     */
    @Autowired
    private SensefySearch sensefySearch;

    /**
     * The number of results to be returned for our unit tests.
     */
    private static final int TEST_MAX_RESULTS = 5;
    /**
     * The number of results to be skipped for our unit tests.
     */
    private static final int TEST_SKIP_RESULTS = 2;

    /**
     * Try to search a simple query.
     * @throws IOException when failing to contact the server
     * @throws JSONException when failing to parse the response
     */
    @Test
    public void testSimpleQuery() throws IOException, JSONException
    {
        Map<Serializable, Serializable> obj = new HashMap<>();
        obj.put("query", "test");
        String res = this.sensefySearch.sensefyQuery(obj);
        assertNotNull(res);
        assertFalse("{}".equals(res));
    }

    /**
     * Try to search a simple query and order the results.
     * @throws IOException when failing to contact the server
     * @throws JSONException when failing to parse the response
     */
    @Test
    public void testOrderedQuery() throws IOException, JSONException
    {
        Map<Serializable, Serializable> obj = new HashMap<>();
        obj.put("query", "test");

        List<Map<Serializable, Serializable>> sortList = new ArrayList<>();
        Map<Serializable, Serializable> column1 = new HashMap<>();
        column1.put("column", "title");
        column1.put("ascending", true);
        sortList.add(column1);
        Map<Serializable, Serializable> column2 = new HashMap<>();
        column2.put("column", "ds_creation_date");
        column2.put("ascending", false);
        sortList.add(column2);
        obj.put("sort", (Serializable) sortList);

        String res = this.sensefySearch.sensefyQuery(obj);
        assertNotNull(res);
        assertFalse("{}".equals(res));
    }

    /**
     * Try to search a simple paginated query.
     * @throws IOException when failing to contact the server
     * @throws JSONException when failing to parse the response
     */
    @Test
    public void testPaginatedQuery() throws IOException, JSONException
    {
        Map<Serializable, Serializable> obj = new HashMap<>();
        obj.put("query", "test");

        Map<Serializable, Serializable> page = new HashMap<>();
        page.put("maxItems", TEST_MAX_RESULTS);
        page.put("skipCount", TEST_SKIP_RESULTS);
        obj.put("page", (Serializable) page);

        String res = this.sensefySearch.sensefyQuery(obj);
        assertNotNull(res);
        assertFalse("{}".equals(res));
    }
}
