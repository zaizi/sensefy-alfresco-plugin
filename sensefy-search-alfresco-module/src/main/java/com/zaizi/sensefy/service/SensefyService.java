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
package com.zaizi.sensefy.service;

import org.alfresco.repo.jscript.Search.SortColumn;

/**
 * Service interacting with Sensefy for search purposes.
 */
public interface SensefyService
{
    /**
     * Logs in on Sensefy to retrieve a ticket for following calls.
     * @return a Sensefy compatible ticket
     */
    String getTicket();

    /**
     * Execute a search on Sensefy.
     * @param query the search query to be run by sensefy
     * @param filters the search filters used to refine the query
     * @param sortColumns The sorting preferences
     * @param maxResults The maximum number of results to return
     * @param skipResults The first result to be returned
     * @param tzoffset The offset that the current user's timezone has compared to UTC
     * @return an object array that can be returned to the webscript
     */
    String search(String query, String filters, int skipResults, int maxResults, SortColumn[] sortColumns,
            Integer tzoffset);
}
