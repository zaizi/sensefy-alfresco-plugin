/**
 * Custom search component.
 * 
 * @namespace Alfresco
 * @class CustomSearch
 */
(function() {
    /**
     * YUI Library aliases
     */
    var Dom = YAHOO.util.Dom,
        Event = YAHOO.util.Event,
        sizeFacetValues = ['B', 'KB', 'MB', 'GB', 'TB'];

    /**
     * CustomSearch constructor.
     * 
     * @param {String} htmlId The HTML id of the parent element
     * @return {Alfresco.CustomSearch} The new CustomSearch instance
     * @constructor
     */
    Alfresco.CustomSearch = function(htmlId) {
        return Alfresco.CustomSearch.superclass.constructor.call(this, htmlId);
    };

    /**
     * Extend Alfresco.Search.
     */
    YAHOO.extend(Alfresco.CustomSearch, Alfresco.Search);

    /**
     * Augment prototype with main class implementation, ensuring overwrite is enabled.
     */
    YAHOO.lang.augmentObject(Alfresco.CustomSearch.prototype, {
        options: {
            selectedFacets: {},
            facetedSearch: {}
        },

        /**
         * This is just a copy paste of the 4.2.1 version of this function since the 4.2.2 would conflict.
         */
        onSearch: function Search_onSearch(layer, args) {
            var obj = args[1];
            if (obj !== null) {
                var searchTerm = this.searchTerm;
                if (obj.searchTerm !== undefined) {
                    searchTerm = obj.searchTerm;
                }
                var searchTag = this.searchTag;
                if (obj.searchTag !== undefined) {
                    searchTag = obj.searchTag;
                }
                var searchAllSites = this.searchAllSites;
                if (obj.searchAllSites !== undefined) {
                    searchAllSites = obj.searchAllSites;
                }
                var searchRepository = this.searchRepository;
                if (obj.searchRepository !== undefined) {
                    searchRepository = obj.searchRepository;
                }
                var searchSort = this.searchSort;
                if (obj.searchSort !== undefined) {
                    searchSort = obj.searchSort;
                }
                // if no facet passed in parameter: reset facets
                var selectedFacets = {};
                if (obj.selectedFacets !== undefined) {
                    selectedFacets = obj.selectedFacets;
                }
                this._performSearch({
                    searchTerm: searchTerm,
                    searchTag: searchTag,
                    searchAllSites: searchAllSites,
                    searchRepository: searchRepository,
                    searchSort: searchSort,
                    facetedFields: selectedFacets
                });
            }
        },

        _overrideDatasource: function() {
            // DataSource definition
            var uriSearchResults = Alfresco.constants.PROXY_URI_RELATIVE + "slingshot/sensefy-search?";
            this.widgets.dataSource = new YAHOO.util.DataSource(
                uriSearchResults, {
                    responseType: YAHOO.util.DataSource.TYPE_JSON,
                    connXhrMode: "queueRequests",
                    responseSchema: {
                        resultsList: "items",
                        metaFields: {
                            paginationRecordOffset: "startIndex",
                            totalRecords: "totalRecords",
                            totalRecordsUpper: "totalRecordsUpper"
                        }

                    }
                });
        },

        _updatePagination: function() {
            var me = this;
            // YUI Paginator definition
            var handlePagination = function Search_handlePagination(state, me) {
                me.currentPage = state.page;
                me.widgets.paginator.setState(state);

                // run the search with page settings
                me._performSearch({
                    searchTerm: me.searchTerm,
                    searchTag: me.searchTag,
                    searchAllSites: me.searchAllSites,
                    searchRepository: me.searchRepository,
                    searchSort: me.searchSort,
                    page: me.currentPage,
                    facetedFields: me.options.selectedFacets
                });
            };
            this.widgets.paginator = new YAHOO.widget.Paginator({
                containers: [this.id + "-paginator-top",
                    this.id + "-paginator-bottom"
                ],
                rowsPerPage: this.options.pageSize,
                initialPage: 1,
                template: this.msg("pagination.template"),
                pageReportTemplate: this
                    .msg("pagination.template.page-report"),
                previousPageLinkLabel: this
                    .msg("pagination.previousPageLinkLabel"),
                nextPageLinkLabel: this
                    .msg("pagination.nextPageLinkLabel")
            });
            this.widgets.paginator.subscribe("changeRequest",
                handlePagination, this);
        },

        _updateResultsHandling: function() {
            var me = this;

            this.widgets.dataSource.doBeforeParseData = function doBeforeParseData(
                oRequest, oFullResponse, oCallback) {
                me.processSpellcheck(oFullResponse);
                me.processFacetedFields(oFullResponse);
                return oFullResponse;
            };

            //hide facets when no results are returned
            var oldBeforeLoadData = this.widgets.dataTable.doBeforeLoadData;
            this.widgets.dataTable.doBeforeLoadData = function(sRequest, oResponse, oPayload) {
                //execute the initial behavior
                oldBeforeLoadData(sRequest, oResponse, oPayload);

                //hide facets if results empty
                if (oResponse.results && oResponse.results.length === 0) {
                    Dom.addClass(me.id + "-facets", "hidden");
                }
                return true;
            };

            //update column definition
            var oldDescFormatter = this.widgets.dataTable.getColumn("summary").formatter;
            this.widgets.dataTable.getColumn("summary").formatter = function(elCell, oRecord, oColumn, oData) {
                //execute initial formatter
                oldDescFormatter(elCell, oRecord, oColumn, oData);

                // add the source
                var source = oRecord.getData("source");
                if (source != null) {
                    var sourceDiv = document.createElement("div");
                    sourceDiv.className = "details";
                    sourceDiv.innerHTML = "Source: " + Alfresco.util.encodeHTML(source);
                    elCell.appendChild(sourceDiv);
                }
            };
        },

        /**
         * Fired by YUI when parent element is available for
         * scripting. Component initialisation, including
         * instantiation of YUI widgets and event listener binding.
         *
         * @method onReady
         */
        onReady: function Search_onReady() {
            var me = this;

            this._overrideDatasource();
            this._updatePagination();

            // setup of the datatable.
            this._setupDataTable();

            this._updateResultsHandling();

            // set initial value and register the "enter" event on the search text field
            var queryInput = Dom.get(this.id + "-search-text");
            queryInput.value = this.options.initialSearchTerm;

            this.widgets.enterListener = new YAHOO.util.KeyListener(
                queryInput, {
                    keys: YAHOO.util.KeyListener.KEY.ENTER
                }, {
                    fn: me._searchEnterHandler,
                    scope: this,
                    correctScope: true
                }, "keydown").enable();

            // trigger the initial search
            YAHOO.Bubbling.fire("onSearch", {
                searchTerm: this.options.initialSearchTerm,
                searchTag: this.options.initialSearchTag,
                searchSort: this.options.initialSort,
                searchAllSites: this.options.initialSearchAllSites,
                searchRepository: this.options.initialSearchRepository,
                selectedFacets: this.options.selectedFacets
            });

            // toggle site scope links
            var toggleLink = Dom.get(this.id + "-site-link");
            Event.addListener(toggleLink, "click", this.onSiteSearch,
                this, true);
            toggleLink = Dom.get(this.id + "-all-sites-link");
            Event.addListener(toggleLink, "click",
                this.onAllSiteSearch, this, true);
            toggleLink = Dom.get(this.id + "-repo-link");
            Event.addListener(toggleLink, "click",
                this.onRepositorySearch, this, true);
            // handle the enterprise search link behavior
            var toggleLink = Dom.get(this.id + "-sensefy-link");
            Event.addListener(toggleLink, "click", this.onSensefySearch, this, true);

            // search YUI button
            this.widgets.searchButton = Alfresco.util
                .createYUIButton(this, "search-button",
                    this.onSearchClick);

            // menu button for sort options
            this.widgets.sortButton = new YAHOO.widget.Button(this.id + "-sort-menubutton", {
                type: "menu",
                menu: this.id + "-sort-menu",
                menualignment: ["tr", "br"],
                lazyloadmenu: false
            });
            // set initially selected sort button label
            var menuItems = this.widgets.sortButton.getMenu().getItems();
            for (var m in menuItems) {
                if (menuItems[m].value === this.options.initialSort) {
                    this.widgets.sortButton.set("label", this.msg(
                        "label.sortby", menuItems[m].cfg
                        .getProperty("text")));
                    break;
                }
            }
            // event handler for sort menu
            this.widgets.sortButton.getMenu().subscribe("click",
                function(p_sType, p_aArgs) {
                    var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                        YAHOO.util.History.getQueryStringParameter("sen") : "false";
                    isSensefySearch = (isSensefySearch == "true");
                    var menuItem = p_aArgs[1];
                    if (menuItem) {
                        me.refreshSearch({
                            searchSort: menuItem.value,
                            searchSensefy: isSensefySearch,
                            selectedFacets: YAHOO.lang.JSON.stringify(me.options.selectedFacets)
                        });
                    }
                });

            // Hook action events
            var fnActionHandler = function Search_fnActionHandler(
                layer, args) {
                var owner = YAHOO.Bubbling.getOwnerByTagName(
                    args[1].anchor, "span");
                if (owner !== null) {
                    if (typeof me[owner.className] == "function") {
                        args[1].stop = true;
                        var tagId = owner.id.substring(me.id.length + 1);
                        me[owner.className].call(me, tagId);
                    }
                }
                return true;
            };
            YAHOO.Bubbling.addDefaultAction("search-tag",
                fnActionHandler);

            // Finally show the component body here to prevent
            // UI
            // artifacts on
            // YUI button decoration
            Dom.setStyle(this.id + "-body", "visibility", "visible");
        },

        buildThumbnailHtml: function(record, height, width) {
            var thumbnailUrl = record.getData("thumbnailUrl");
            if (thumbnailUrl != null) {
                var htmlName = Alfresco.util.encodeHTML(record.getData("displayName"));
                return '<span><a href="' + thumbnailUrl + '"><img src="' + thumbnailUrl + '" alt="' + htmlName + '" title="' + htmlName + '"' + (height && width ? ' width="' + width + '" height="' + height + '"' : "") + '/></a></span>';
            }
            return Alfresco.CustomSearch.superclass.buildThumbnailHtml.call(this, record, height, width);
        },

        /**
         * Override rendering text for enterprise documents.
         */
        buildTextForType: function(type) {
            if (type == "enterprise-document") {
                return Alfresco.util.message("label.document");
            }
            return Alfresco.CustomSearch.superclass.buildTextForType.call(this, type);
        },

        /**
         * Override the default url generated to acknowledge external paths
         */
        buildPath: function(type, path, site) {
            if (type == "enterprise-document") {
                return '<div class="details">' + Alfresco.util.message("message.enterprise.container") +
                    ': <a href="' + path + '">' + Alfresco.util.encodeHTML(path) + '</a></div>';
            }
            return Alfresco.CustomSearch.superclass.buildPath.call(this, type, path, site);
        },

        /**
         * Override the default way to retrieve the document URL
         */
        getBrowseUrlForRecord: function(record) {
            var url = record.getData("docUrl");
            if (url != null) {
                return url;
            }
            return Alfresco.CustomSearch.superclass.getBrowseUrlForRecord.call(this, record);
        },

        /**
         * Function parameterizing the search refresh for the Sensefy search type.
         */
        onSensefySearch: function(e, args) {
            this.refreshSearch({
                searchAllSites: false,
                searchRepository: false,
                searchSensefy: true
            });
        },

        /**
         * Event handler that gets fired when user clicks the Search button.
         *
         * @method onSearchClick
         * @param e {object} DomEvent
         * @param obj {object} Object passed back from addListener method
         */
        onSearchClick: function Search_onSearchClick(e, obj) {
            var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                YAHOO.util.History.getQueryStringParameter("sen") : "false";
            isSensefySearch = (isSensefySearch == "true");

            this.refreshSearch({
                searchTag: "",
                searchTerm: YAHOO.lang.trim(Dom.get(this.id + "-search-text").value),
                searchQuery: "",
                searchSensefy: isSensefySearch
            });
        },

        /**
         * Search text box ENTER key event handler
         * 
         * @method _searchEnterHandler
         */
        _searchEnterHandler: function Search__searchEnterHandler(e, args) {
            var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                YAHOO.util.History.getQueryStringParameter("sen") : "false";
            isSensefySearch = (isSensefySearch == "true");

            this.refreshSearch({
                searchTag: "",
                searchTerm: YAHOO.lang.trim(Dom.get(this.id + "-search-text").value),
                searchQuery: "",
                searchSensefy: isSensefySearch
            });
        },

        /**
         * Handle Size Facet Value
         */
        buildFacetValue: function SensefySearch_buildFacetValue(prop, entry) {
            var facetValue = entry.realValue;
            if (prop == "Size") {
                facetValue = facetValue.slice(1, -1).split(' TO ');
                var res = [];
                for (var x in facetValue) {
                    var size = parseInt(facetValue[x]);
                    var i = 0;
                    while (size > 1000) {
                        size = size / 1000;
                        i++;
                    }
                    size = size.toFixed(2) + " " + sizeFacetValues[i];
                    res.push(size);
                }
                facetValue = res.join(" - ");
            }
            return facetValue;
        },

        /**
         * Process spellcheck
         *
         * @param oFullResponse
         */
        processSpellcheck: function SensefySearch_processSpellcheck(
            oFullResponse) {
            var spellcheckDiv = Dom.get(this.id + "-spellcheckContainerId");
            if (spellcheckDiv.children.length > 0) {
                spellcheckDiv.innerHTML = "";
            }

            this.suggestion = oFullResponse.suggestion;

            if (this.suggestion) {
                var spanSuggestionQuestion = document
                    .createElement("span");
                var spanSuggestion = document.createElement("span");

                spanSuggestionQuestion.appendChild(document
                    .createTextNode(this
                        .msg("label.spellcheck.question") + " "));
                spanSuggestion.appendChild(document
                    .createTextNode(this.suggestion));

                Dom.addClass(spanSuggestionQuestion,
                    "spellcheckContainer");
                Dom.addClass(spanSuggestionQuestion, "spellcheck");

                Dom.addClass(spanSuggestion, "spellcheckContainer");
                Dom.addClass(spanSuggestion, "word");

                YAHOO.util.Event.addListener(spanSuggestion, "click",
                    this.onSpellCheck, this);

                spellcheckDiv.appendChild(spanSuggestionQuestion);
                spellcheckDiv.appendChild(spanSuggestion);

            }
        },

        /**
         * Reload the page, searching by suggestion
         */
        onSpellCheck: function SensefySearch_onSpellCheck(e, me) {
            var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                YAHOO.util.History.getQueryStringParameter("sen") : "false";
            isSensefySearch = (isSensefySearch == "true");

            me.refreshSearch({
                searchTag: "",
                searchTerm: me.suggestion,
                searchQuery: "",
                searchSensefy: isSensefySearch
            });
        },

        /**
         * Process faceted search fields.
         *
         * @param facetedFields
         *          {string} the record
         */
        processFacetedFields: function Search_processFacetedFields(oFullResponse) {
            this.options.facetedSearch = oFullResponse.facetedSearch;

            if (this.options.facetedSearch != undefined) {
                var facetedDiv = Dom.get(this.id + "-facets");
                facetedDiv.innerHTML = "";

                for (var prop in this.options.facetedSearch) {
                    if (this.options.facetedSearch.hasOwnProperty(prop)) {
                        var entry = this.options.facetedSearch[prop];
                        if (entry.length > 0) {
                            var parentDiv = document.createElement("div");

                            parentDiv.setAttribute("id", this.id + "-" + prop);
                            Dom.addClass(parentDiv, this.id + "-" + prop);

                            var h3 = document.createElement("h3");

                            var strong = document.createElement("strong");
                            var listItems = document.createElement("ul");

                            var facetString = this.msg(prop);
                            facetString = facetString.charAt(0).toUpperCase() + facetString.slice(1);
                            strong.innerHTML = facetString;
                            strong.title = facetString;
                            h3.appendChild(strong);
                            parentDiv.appendChild(h3);

                            var li = null;
                            var spanFilter = null;

                            for (var i = 0; i < entry.length; i++) {
                                li = document.createElement("li");

                                spanFilter = document.createElement("span");

                                Dom.addClass(spanFilter, this.id + "-" + prop + "-" + i);

                                spanFilter.innerHTML = this.msg(this.buildFacetValue(prop, entry[i])) + " (" + entry[i].count + ")";

                                var spanExclude = document.createElement("span");

                                Dom.addClass(spanExclude, "exclude");
                                Dom.addClass(spanExclude, this.id + "-" + prop + "-" + i);

                                // Commented to remove "x" mark as
                                // spanExclude.innerHTML = "x";

                                YAHOO.util.Event.addListener(spanExclude, "click",
                                    this.onFacetedSearch, this);

                                YAHOO.util.Event.addListener(spanFilter, "click",
                                    this.onFacetedSearch, this);

                                li.appendChild(spanFilter);
                                li.appendChild(spanExclude);
                                listItems.appendChild(li);
                            }

                            parentDiv.appendChild(listItems);

                            facetedDiv.appendChild(parentDiv);
                        }
                    }
                }
                var me = this;

                // Read the filtered factes and display them in the
                // search bar
                var facetedSelectedDiv = Dom.get(this.id + "-facets-selected");
                facetedSelectedDiv.innerHTML = "";

                for (var selprop in me.options.selectedFacets) {
                    Dom.get(this.id + "-" + selprop).remove();
                    var i = 0;

                    var facetedSelectedSelDiv = document
                        .createElement("div");
                    facetedSelectedSelDiv.setAttribute("id", this.id + "-facets-selected" + "-" + selprop);
                    Dom.addClass(facetedSelectedSelDiv, this.id + "-facets-selected" + "-" + selprop);

                    // Exclude span for "x"
                    var spanExclude = document.createElement("span");

                    Dom.addClass(spanExclude, this.id + "-" + selprop + "-" + i + "_exclude");

                    spanExclude.innerHTML = "x";

                    YAHOO.util.Event.addListener(spanExclude, "click",
                        this.onFacetedSearch, this);

                    facetedSelectedSelDiv.appendChild(spanExclude);

                    // Main span for Title
                    var mainspan = document.createElement("span");
                    Dom.addClass(mainspan, this.id + "-" + selprop + "-" + i + "_selected_value");
                    var strong = document.createElement("strong");

                    var propString = this.msg(selprop);
                    propString = propString.charAt(0).toUpperCase() + propString.slice(1);
                    strong.innerHTML = propString;
                    strong.title = propString;
                    mainspan.appendChild(strong);
                    facetedSelectedSelDiv.appendChild(mainspan);

                    // Filter span for filter value
                    spanFilter = document.createElement("span");

                    Dom.addClass(spanFilter, this.id + "-" + selprop + "-" + i + "_selected_value");

                    spanFilter.innerHTML = this
                        .msg(this.buildFacetValue(selprop, me.options.selectedFacets[selprop]));

                    facetedSelectedSelDiv.appendChild(spanFilter);

                    facetedSelectedDiv.appendChild(facetedSelectedSelDiv);
                    Dom.removeClass(this.id + "-facets-selected" + "-" + selprop, "hidden");
                    Dom.removeClass(this.id + "-facets-selected", "hidden");
                }
            }

        },

        /**
         * Function to control a faceted search
         *
         * @param e
         * @param obj
         */
        onFacetedSearch: function Search_onFacetedSearch(e, obj) {

            var me = this;
            var srcEl = e.srcelement ? e.srcelement : e.target;

            var excluderSpan = Dom.hasClass(srcEl, 'exclude');

            var facetedId = "";

            if (excluderSpan) {
                facetedId = srcEl.className.substr("facets".length + 1).substr(
                    obj.id.length + 1);
            } else {
                facetedId = srcEl.className.substr(obj.id.length + 1);
            }

            var excludedFacetedId = facetedId;
            var facetedIndex = facetedId.split("-")[1];

            facetedId = facetedId.split("-")[0];

            var facetedFields = {};

            // Exclude selected
            if (!excludedFacetedId.match("_exclude")) {
                facetedFields[facetedId] = obj.options.facetedSearch[facetedId][facetedIndex];

                // Assign the selected factes to array object
                // obj.options.selectedFacets = facetedFields;
                obj.options.selectedFacets[facetedId] = obj.options.facetedSearch[facetedId][facetedIndex];

                if (obj.options.facetedSearch[facetedId][facetedIndex].count / obj.options.pageSize < obj.currentPage) {
                    obj.currentPage = 1;
                }
            } else {
                // Remove the factes that are excluded from
                // search-bar, and rearrange the facted fields
                // query string.

                delete obj.options.selectedFacets[facetedId];
                Dom.addClass(obj.id + "-facets-selected" + "-" + facetedId, "hidden");
                // facetedFields = obj.options.selectedFacets;
                facetedFields[Object.keys(obj.options.selectedFacets)[Object
                    .keys(obj.options.selectedFacets).length - 1]] = obj.options.selectedFacets[Object
                    .keys(obj.options.selectedFacets)[Object
                        .keys(obj.options.selectedFacets).length - 1]];
            }

            // obj.setupQuery(YAHOO.lang.JSON.stringify(actualQuery));

            obj._performSearch({
                searchTerm: obj.searchTerm,
                searchTag: obj.searchTag,
                searchAllSites: obj.searchAllSites,
                searchRepository: obj.searchRepository,
                searchSort: obj.searchSort,
                page: obj.currentPage,
                facetedFields: obj.options.selectedFacets
            });
        },

        /**
         * Alfresco version of the refreshSearch function modified to RETURN the url instead of redirecting the user.
         */
        oldRefreshSearch: function Search_refreshSearch(args) {
            var searchTerm = this.searchTerm;
            if (args.searchTerm !== undefined) {
                searchTerm = args.searchTerm;
            }
            var searchTag = this.searchTag;
            if (args.searchTag !== undefined) {
                searchTag = args.searchTag;
            }
            var searchAllSites = this.searchAllSites;
            if (args.searchAllSites !== undefined) {
                searchAllSites = args.searchAllSites;
            }
            var searchRepository = this.searchRepository;
            if (args.searchRepository !== undefined) {
                searchRepository = args.searchRepository;
            }
            var searchSort = this.searchSort;
            if (args.searchSort !== undefined) {
                searchSort = args.searchSort;
            }
            var searchQuery = this.options.searchQuery;
            if (args.searchQuery !== undefined) {
                searchQuery = args.searchQuery;
            }

            // redirect back to the search page - with appropriate site context
            var url = Alfresco.constants.URL_PAGECONTEXT;
            if (this.options.siteId.length !== 0) {
                url += "site/" + this.options.siteId + "/";
            }

            // add search data webscript arguments
            url += "search?t=" + encodeURIComponent(searchTerm);
            url += "&s=" + searchSort;
            if (searchQuery.length !== 0) {
                // if we have a query (already encoded), then apply it
                // most other options such as tag, terms are trumped
                url += "&q=" + searchQuery;
            } else if (searchTag.length !== 0) {
                url += "&tag=" + encodeURIComponent(searchTag);
            }
            url += "&a=" + searchAllSites + "&r=" + searchRepository;
            return url;
        },

        /**
         * Modification to the default refreshSearch function to adapt to our new search type.
         */
        refreshSearch: function(args) {
            var url = this.oldRefreshSearch(args);

            // Set sensefy as the selected search if need be
            if (args.searchSensefy) {
                url += "&sen=true";
            } else {
                url += "&sen=false";
            }

            // Filter on potential existing facets
            if (args.selectedFacets !== undefined) {
                url += "&selectedFacets=" + args.selectedFacets;
            }


            window.location = url;
        },

        _buildSearchParams: function(searchRepository, searchAllSites, searchTerm, searchTag, searchSort, page, facetedFields) {
            var site = searchAllSites ? "" : this.options.siteId;
            var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                YAHOO.util.History.getQueryStringParameter("sen") : "false";

            var params = YAHOO.lang
                .substitute(
                    "site={site}&term={term}&tag={tag}&maxResults={maxResults}&sort={sort}&query={query}&facetedFields={facetedFields}&repo={repo}&rootNode={rootNode}&pageSize={pageSize}&startIndex={startIndex}&sen={sen}&tzoffset={tzoffset}", {
                        site: encodeURIComponent(site),
                        repo: searchRepository.toString(),
                        term: encodeURIComponent(searchTerm),
                        tag: encodeURIComponent(searchTag),
                        sort: encodeURIComponent(searchSort),
                        query: encodeURIComponent(this.options.searchQuery),
                        facetedFields: encodeURIComponent(YAHOO.lang.JSON.stringify(facetedFields)),
                        rootNode: encodeURIComponent(this.options.searchRootNode),
                        maxResults: this.options.maxSearchResults + 1, // to
                        // calculate whether more results were available
                        pageSize: this.options.pageSize,
                        startIndex: (page - 1) * this.options.pageSize,
                        sen: isSensefySearch,
                        tzoffset: new Date().getTimezoneOffset()
                    });

            return params;
        },

        /**
         * Updates the results info text.
         * 
         * @method _updateResultsInfo
         */
        _updateResultsInfo: function Search__updateResultsInfo() {
            // update the search results field
            var text;
            var resultsCount = "" + this.resultsCount;
            if (this.hasMoreResults) {
                text = this.msg("search.info.resultinfomore", resultsCount);
            } else {
                text = this.msg("search.info.resultinfo", resultsCount);
            }

            var isSensefySearch = (YAHOO.util.History.getQueryStringParameter("sen") != null) ?
                YAHOO.util.History.getQueryStringParameter("sen") : "false";
            isSensefySearch = (isSensefySearch == "true");

            // apply the context
            if (isSensefySearch) {
                text += ' ' + this.msg("search.info.foundinenterprise");
            } else if (this.searchRepository || this.options.searchQuery.length !== 0) {
                text += ' ' + this.msg("search.info.foundinrepository");
            } else if (this.searchAllSites) {
                text += ' ' + this.msg("search.info.foundinallsite");
            } else {
                text += ' ' + this.msg("search.info.foundinsite", Alfresco.util.encodeHTML(this.options.siteTitle));
            }

            // set the text
            Dom.get(this.id + '-search-info').innerHTML = text;
        },

        /**
         * Change the default return behavior to fill in the facets
         */
        _performSearch: function Search__performSearch(args) {
            var facetedFields = args.facetedFields == undefined ? "" : args.facetedFields;

            /**
             * All the following isn't modified except the last statement.
             */
            var searchTerm = YAHOO.lang.trim(args.searchTerm),
                searchTag = YAHOO.lang.trim(args.searchTag),
                searchAllSites = args.searchAllSites,
                searchRepository = args.searchRepository,
                searchSort = args.searchSort,
                page = args.page || 1;

            if (this.options.searchQuery.length === 0 &&
                searchTag.length === 0 &&
                searchTerm.replace(/\*/g, "").length < this.options.minSearchTermLength) {
                Alfresco.util.PopupManager.displayMessage({
                    text: this.msg("message.minimum-length", this.options.minSearchTermLength)
                });
                return;
            }

            // empty results table
            this.widgets.dataTable.deleteRows(0, this.widgets.dataTable.getRecordSet().getLength());

            // hide paginator controls
            Dom.addClass(this.id + "-paginator-top", "hidden");
            Dom.addClass(this.id + "-search-bar-bottom", "hidden");

            // update the ui to show that a search is on-going
            Dom.get(this.id + '-search-info').innerHTML = this.msg("search.info.searching");
            this.widgets.dataTable.set("MSG_EMPTY", "");
            this.widgets.dataTable.render();

            // Success handler
            function successHandler(sRequest, oResponse, oPayload) {
                // update current state on success
                this.searchTerm = searchTerm;
                this.searchTag = searchTag;
                this.searchAllSites = searchAllSites;
                this.searchRepository = searchRepository;
                this.searchSort = searchSort;

                this.widgets.dataTable.onDataReturnInitializeTable
                    .call(this.widgets.dataTable, sRequest,
                        oResponse, oPayload);

                // update the results info text
                this._updateResultsInfo();

                // set focus to search input textbox
                Dom.get(this.id + "-search-text").focus();
            }

            // Failure handler
            function failureHandler(sRequest, oResponse) {
                switch (oResponse.status) {
                    case 401:
                        // Session has likely timed-out, so refresh to display login page
                        window.location.reload();
                        break;
                    case 408:
                        // Timeout waiting on Alfresco server - probably due to heavy load
                        Dom.get(this.id + '-search-info').innerHTML = this.msg("message.timeout");
                        break;
                    default:
                        // General server error code
                        if (oResponse.responseText) {
                            var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                            Dom.get(this.id + '-search-info').innerHTML = response.message;
                        } else {
                            Dom.get(this.id + '-search-info').innerHTML = oResponse.statusText;
                        }
                        break;
                }
            }

            /**
             * Small modification to include Sensefy faceted fields
             */
            this.widgets.dataSource.sendRequest(this._buildSearchParams(
                searchRepository, searchAllSites, searchTerm, searchTag, searchSort, page, facetedFields), {
                success: successHandler,
                failure: failureHandler,
                scope: this
            });
        }

    }, true);
})();