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
package com.zaizi.sensefy.service.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

import org.alfresco.repo.jscript.Search.SortColumn;
import org.alfresco.service.cmr.security.AuthenticationService;
import org.apache.commons.lang.NotImplementedException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.protocol.HTTP;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.RequestMethod;

import com.zaizi.sensefy.service.SensefyService;

/**
 * Implementation of the service interacting with Sensefy for search purposes.
 */
public class SensefyServiceImpl implements SensefyService
{
    /**
     * Sensefy host url.
     */
    private String sensefyHost;
    /**
     * Sensefy login-password based login url.
     */
    private String sensefyLoginEndpoint;
    /**
     * Sensefy alfresco-ticket based login url .
     */
    private String sensefyLoginAlfEndpoint;
    /**
     * Sensefy search url.
     */
    private String sensefySearchEndpoint;
    /**
     * Flag to know if we use the Alfresco ticket or user/password.
     */
    private boolean useAlfticket;
    /**
     * Fields that we need returned.
     */
    private String fields;
    /**
     * Alfresco's default authentication service.
     */
    private AuthenticationService authenticationService;

    /**
     * Commons logging logger for the current class.
     */
    private static final Log LOGGER = LogFactory.getLog(SensefyServiceImpl.class);
    /**
     * Constant to be logged when we failed to authenticate to Sensefy.
     */
    private static final String SENSEFY_AUTHENTICATION_ERROR = "Failed to authenticate on Sensefy.";
    /**
     * Constant to be logged when the Sensefy search failed.
     */
    private static final String SENSEFY_SEARCH_ERROR = "Failed to search on Sensefy.";

    /**
     * Send a query to Sensefy.
     * 
     * @param method the http method to use
     * @param url the url to call
     * @return the answer from the Sensefy server in a json-formatted string
     * @throws IOException when failing to properly query the Sensefy server
     */
    private String querySensefy(String method, URL url) throws IOException
    {
        if (!RequestMethod.GET.toString().equals(method))
        {
            // We only support GET requests for now
            throw new NotImplementedException();
        }

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(RequestMethod.GET.toString());

        try (InputStream is = conn.getInputStream(); BufferedReader br = new BufferedReader(new InputStreamReader(is)))
        {
            String line = null;
            StringBuffer sb = new StringBuffer();
            while ((line = br.readLine()) != null)
            {
                sb.append(line);
            }

            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK)
            {
                return sb.toString();
            }
            else
            {
                LOGGER.error("Failed to query Sensefy with the request: " + method + " " + url.toString()
                        + ". Sensefy returned with the code " + conn.getResponseCode() + " and the message "
                        + conn.getResponseMessage());
                return null;
            }
        }
    }

    @Override
    public String getTicket()
    {
        if (this.useAlfticket)
        {
            return this.getTicketFromAlfrescoTicket();
        }
        return this.getTicketFromPassword();
    }

    /**
     * Retrieve a Sensefy ticket based on a username and a password. This is only kept for testing purposes.
     * 
     * @return a valid Sensefy ticket identifying the admin user
     */
    private String getTicketFromPassword()
    {
        try
        {
            URL url = new URL(this.sensefyHost + this.sensefyLoginEndpoint + "?username=admin&password=admin");
            String ticket = this.querySensefy(RequestMethod.GET.toString(), url);

            if (ticket != null)
            {
                JSONObject res = new JSONObject(ticket);
                return res.getJSONObject("token").getString("value");
            }
        }
        catch (IOException | JSONException e)
        {
            LOGGER.error(SENSEFY_AUTHENTICATION_ERROR, e);
        }

        return null;
    }

    /**
     * Retrieve a Sensefy ticket based on the Alfresco ticket.
     * 
     * @return a valid Sensefy ticket identifying the current user
     */
    private String getTicketFromAlfrescoTicket()
    {
        String alfrescoTicket = this.authenticationService.getCurrentTicket();
        try
        {
            URL url = new URL(this.sensefyHost + this.sensefyLoginAlfEndpoint + "?alf_ticket=" + alfrescoTicket);
            String ticket = this.querySensefy(RequestMethod.GET.toString(), url);

            if (ticket != null)
            {
                JSONObject res = new JSONObject(ticket);
                return res.getJSONObject("token").getString("value");
            }
        }
        catch (IOException | JSONException e)
        {
            LOGGER.error(SENSEFY_AUTHENTICATION_ERROR, e);
        }

        return null;
    }

    @Override
    public String search(String query, String filters, int skipResults, int maxResults, SortColumn[] sortColumns,
            Integer tzoffset)
    {
        // get ticket
        String ticket = this.getTicket();
        if (ticket == null)
        {
            return null;
        }

        try
        {
            // base URL
            String fullUrl = this.sensefyHost + this.sensefySearchEndpoint + "?security=true&token="
                    + URLEncoder.encode(ticket, HTTP.UTF_8) + "&query=" + URLEncoder.encode(query, HTTP.UTF_8)
                    + "&filter=" + URLEncoder.encode(filters, HTTP.UTF_8) + "&start=" + skipResults + "&rows="
                    + maxResults + "&fields=" + URLEncoder.encode(this.fields, HTTP.UTF_8) + "&facet="
                    + Boolean.TRUE.toString() + "&spellcheck=" + Boolean.TRUE.toString() + "&tzoffset=" + tzoffset;

            // sort parameter
            if (sortColumns != null && sortColumns.length > 0)
            {
                String sortString = "";
                for (SortColumn sortColumn : sortColumns)
                {
                    sortString += "," + sortColumn.column + " " + ((sortColumn.asc) ? "ASC" : "DESC");
                }
                // remove first comma
                sortString = sortString.substring(1);
                // add to full url
                fullUrl += "&order=" + URLEncoder.encode(sortString, HTTP.UTF_8);
            }

            URL url = new URL(fullUrl);
            return this.querySensefy(RequestMethod.GET.toString(), url);
        }
        catch (IOException e)
        {
            LOGGER.error(SENSEFY_SEARCH_ERROR, e);
            return null;
        }
    }

    /**
     * @return the sensefyHost
     */
    public String getSensefyHost()
    {
        return sensefyHost;
    }

    /**
     * @param sensefyHost the sensefyHost to set
     */
    public void setSensefyHost(String sensefyHost)
    {
        this.sensefyHost = sensefyHost;
    }

    /**
     * @return the sensefyLoginEndpoint
     */
    public String getSensefyLoginEndpoint()
    {
        return sensefyLoginEndpoint;
    }

    /**
     * @param sensefyLoginEndpoint the sensefyLoginEndpoint to set
     */
    public void setSensefyLoginEndpoint(String sensefyLoginEndpoint)
    {
        this.sensefyLoginEndpoint = sensefyLoginEndpoint;
    }

    /**
     * @return the sensefySearchEndpoint
     */
    public String getSensefySearchEndpoint()
    {
        return sensefySearchEndpoint;
    }

    /**
     * @param sensefySearchEndpoint the sensefySearchEndpoint to set
     */
    public void setSensefySearchEndpoint(String sensefySearchEndpoint)
    {
        this.sensefySearchEndpoint = sensefySearchEndpoint;
    }

    /**
     * @return the fields
     */
    public String getFields()
    {
        return fields;
    }

    /**
     * @param fields the fields to set
     */
    public void setFields(String fields)
    {
        this.fields = fields;
    }

    /**
     * @return the useAlfticket
     */
    public boolean isUseAlfticket()
    {
        return useAlfticket;
    }

    /**
     * @param useAlfticket the useAlfticket to set
     */
    public void setUseAlfticket(boolean useAlfticket)
    {
        this.useAlfticket = useAlfticket;
    }

    /**
     * @return the authenticationService
     */
    public AuthenticationService getAuthenticationService()
    {
        return authenticationService;
    }

    /**
     * @param authenticationService the authenticationService to set
     */
    public void setAuthenticationService(AuthenticationService authenticationService)
    {
        this.authenticationService = authenticationService;
    }

    /**
     * @return the sensefyLoginAlfEndpoint
     */
    public String getSensefyLoginAlfEndpoint()
    {
        return sensefyLoginAlfEndpoint;
    }

    /**
     * @param sensefyLoginAlfEndpoint the sensefyLoginAlfEndpoint to set
     */
    public void setSensefyLoginAlfEndpoint(String sensefyLoginAlfEndpoint)
    {
        this.sensefyLoginAlfEndpoint = sensefyLoginAlfEndpoint;
    }
}
