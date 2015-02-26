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
package com.zaizi.sensefy.jscript;

import java.io.IOException;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.repo.jscript.Search;
import org.alfresco.repo.jscript.ValueConverter;
import org.json.JSONException;

import com.zaizi.sensefy.service.SensefyService;

/**
 * Javascript root object to perform searches on Sensefy.
 */
public class SensefySearch extends Search
{
    /**
     * The Sensefy service class.
     */
    private SensefyService sensefyService;

    /**
     * Default page size.
     * The default value set in share config is 50.
     * Since we can't access share config from Alfresco, let's just use 1k to have some margin in case it is changed up.
     */
    private static final int DEFAULT_MAX_RESULTS = 1000;

    /**
     * Default skip count
     * The default value is 0: begin from the start.
     */
    private static final int DEFAULT_SKIP_COUNT = 0;

    /**
     * Key for the query field in the request object.
     */
    private static final String QUERY_FIELD = "query";
    /**
     * Key for the filters field in the request object.
     */
    private static final String FILTERS_FIELD = "filters";
    /**
     * Key for the timezone offset object in the request object.
     */
    private static final String TIMEZONE_OFFSET_FIELD = "tzoffset";
    /**
     * Error message to be logged when trying to perform a search without defining a query.
     */
    private static final String QUERY_MISSING_MESSAGE = "Failed to search: Missing mandatory 'query' value.";
    /**
     * Key for the max items field in the request object.
     */
    private static final String MAX_ITEMS_FIELD = "maxItems";
    /**
     * Key for the start index field in the request object.
     */
    private static final String START_INDEX_FIELD = "startIndex";
    /**
     * Key for the sort column field in the request object.
     */
    private static final String SORT_COLUMN_FIELD = "column";
    /**
     * Key for the sort direction field in the request object.
     */
    private static final String SORT_ASCENDING_FIELD = "ascending";
    /**
     * String representation of an empty JSON object to return when the search can't be run.
     */
    private static final String EMPTY_JSON_STRING = "{}";
    /**
     * Key for the pagination object in the request object.
     */
    private static final String PAGE_OBJECT = "page";
    /**
     * Key for the sort object in the request object.
     */
    private static final String SORT_OBJECT = "sort";

    /**
     * Retrieve the query from the serializable map.
     * @param def the serializable map from JavaScript.
     * @return the query string.
     */
    private String getQuery(Map<Serializable, Serializable> def)
    {
        String query = (String) def.get(QUERY_FIELD);
        if (query == null || query.isEmpty())
        {
            throw new AlfrescoRuntimeException(QUERY_MISSING_MESSAGE);
        }
        return query;
    }

    /**
     * Retrieve the filters from the serializable map.
     * @param def the serializable map from JavaScript.
     * @return the query string.
     */
    private String getFilters(Map<Serializable, Serializable> def)
    {
        String filters = (String) def.get(FILTERS_FIELD);
        if (filters == null)
        {
            return "";
        }
        return filters;
    }

    /**
     * Retrieve the timezone offset of the current client.
     * This is used to add padding to the dateRange facets.
     * @param def the serializable map from JavaScript.
     * @return the timezone offset of the current user.
     */
    private Integer getTimezoneOffset(Map<Serializable, Serializable> def)
    {
        Integer tzoffset = 0;
        Object tzObjectOffset = def.get(TIMEZONE_OFFSET_FIELD);
        if (tzObjectOffset instanceof Number)
        {
            tzoffset = ((Number) tzObjectOffset).intValue();
        }
        return tzoffset;
    }

    /**
     * Retrieve the maximum number of results from the serializable map.
     * @param page the serializable map from JavaScript.
     * @return the maximum number of results to return
     */
    private int getMaxResults(Map<Serializable, Serializable> page)
    {
        int maxResults = DEFAULT_MAX_RESULTS;
        if (page != null && page.get(MAX_ITEMS_FIELD) != null)
        {
            Object maxItems = page.get(MAX_ITEMS_FIELD);
            if (maxItems instanceof Number)
            {
                maxResults = ((Number) maxItems).intValue();
            }
            else if (maxItems instanceof String)
            {
                // try and convert to int (which it what it should be!)
                maxResults = Integer.parseInt((String) maxItems);
            }
        }
        return maxResults;
    }

    /**
     * Retrieve the index of the first result to query from the serializable map.
     * @param page the serializable map from JavaScript.
     * @return the start index from which to query.
     */
    private int getSkipCount(Map<Serializable, Serializable> page)
    {
        int skipResults = DEFAULT_SKIP_COUNT;
        if (page != null && page.get(START_INDEX_FIELD) != null)
        {
            Object skipCount = page.get(START_INDEX_FIELD);
            if (skipCount instanceof Number)
            {
                skipResults = ((Number) page.get(START_INDEX_FIELD)).intValue();
            }
            else if (skipCount instanceof String)
            {
                // try and convert to int (which it what it should be!)
                skipResults = Integer.parseInt((String) skipCount);
            }
        }
        return skipResults;
    }

    /**
     * Retrieve the sorting preferences from the serializable object.
     * @param sort the list serializable maps from JavaScript.
     * @return a list of the SortColumn object representing which colomns to sort on in what order.
     */
    private SortColumn[] getSortParameter(List<Map<Serializable, Serializable>> sort)
    {
        SortColumn[] sortColumns = null;
        if (sort != null)
        {
            sortColumns = new SortColumn[sort.size()];
            int index = 0;
            for (Map<Serializable, Serializable> column : sort)
            {
                String strCol = (String) column.get(SORT_COLUMN_FIELD);
                if (strCol != null && !strCol.isEmpty())
                {
                    Boolean boolAsc = (Boolean) column.get(SORT_ASCENDING_FIELD);
                    boolean ascending = boolAsc != null ? boolAsc.booleanValue() : false;
                    sortColumns[index++] = new SortColumn(strCol, ascending);
                }
            }
        }
        return sortColumns;
    }

    /**
     * Executes a query on Sensefy based on the supplied search definition object.
     * @param search Search definition object as above
     * @return Array of ScriptNode results
     * @throws JSONException when the JSON returned by sensefy is badly formatted
     * @throws IOException when it failed to properly retrieve the result from sensefy
     */
    public String sensefyQuery(Object search) throws IOException, JSONException
    {
        String results = EMPTY_JSON_STRING;

        if (search instanceof Serializable)
        {
            Serializable obj = new ValueConverter().convertValueForRepo((Serializable) search);

            if (obj instanceof Map)
            {
                @SuppressWarnings("unchecked")
                Map<Serializable, Serializable> def = (Map<Serializable, Serializable>) obj;

                // get query
                String query = this.getQuery(def);

                // get filters
                String filters = this.getFilters(def);

                // get timezone offset
                Integer tzoffset = this.getTimezoneOffset(def);

                // get first and count attributes
                @SuppressWarnings("unchecked")
                Map<Serializable, Serializable> page = (Map<Serializable, Serializable>) def.get(PAGE_OBJECT);
                int maxResults = this.getMaxResults(page);
                int skipResults = this.getSkipCount(page);

                // get sort attributes
                @SuppressWarnings("unchecked")
                List<Map<Serializable, Serializable>> sort = (List<Map<Serializable, Serializable>>) def.get(SORT_OBJECT);
                SortColumn[] sortColumns = this.getSortParameter(sort);

                results = this.sensefyService.search(query, filters, skipResults, maxResults, sortColumns, tzoffset);
            }
        }

        return results;
    }

    /**
     * @return the sensefyService
     */
    public SensefyService getSensefyService()
    {
        return sensefyService;
    }

    /**
     * @param sensefyService the sensefyService to set
     */
    public void setSensefyService(SensefyService sensefyService)
    {
        this.sensefyService = sensefyService;
    }
}
