<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/search/search.lib.js">
<import resource="classpath:/alfresco/extension/templates/webscripts/com/zaizi/sensefy/search/lib/sensefy-search.lib.js">

function reformatSensefyResults(stringRes)
{
	var originalResponse = eval ("(" + stringRes + ")");
	var formattedResponse = {};

	// format globals
	formattedResponse.paging = {};

	if(originalResponse.searchResults == null)
	{
		formattedResponse.paging.totalRecords = 0;
		formattedResponse.paging.startIndex = 0;
		formattedResponse.paging.totalRecordsUpper = 0;
	}
	else
	{
		formattedResponse.paging.totalRecords = originalResponse.searchResults.documents.length;
		formattedResponse.paging.startIndex = originalResponse.searchResults.start;
		formattedResponse.paging.totalRecordsUpper = originalResponse.searchResults.numFound;
	}

	var wsConfig = new XML(config.script)["fields"];

	// format items
	formattedResponse.items = [];
	if(originalResponse.searchResults != null)
	{
		for each(var currentOldItem in originalResponse.searchResults.documents)
		{
			var currentNewItem = {};
			if(currentOldItem[wsConfig["docUrl"]] != null) currentNewItem.docUrl=currentOldItem[wsConfig["docUrl"]];
			if(currentOldItem[wsConfig["path"]] != null) currentNewItem.path=currentOldItem[wsConfig["path"]];
			if(currentOldItem[wsConfig["thumbnailUrl"]] != null) currentNewItem.thumbnailUrl=currentOldItem[wsConfig["thumbnailUrl"]];
			else currentNewItem.thumbnailUrl="/share/proxy/alfresco/api/thumbnails/placeholder?mimetype=" + currentOldItem[wsConfig["mimetype"]];
			if(currentOldItem[wsConfig["name"]] != null) currentNewItem.name=currentOldItem[wsConfig["name"]];
			if(currentOldItem[wsConfig["title"]] != null) currentNewItem.title=currentOldItem[wsConfig["title"]];
			if(currentOldItem[wsConfig["description"]] != null) currentNewItem.description=currentOldItem[wsConfig["description"]];
			if(currentOldItem[wsConfig["modifiedOn"]] != null) currentNewItem.modifiedOn=utils.fromISO8601(currentOldItem[wsConfig["modifiedOn"]]);
			if(currentOldItem[wsConfig["modifiedBy"]] != null) currentNewItem.modifiedBy=currentOldItem[wsConfig["modifiedBy"]];
			if(currentOldItem[wsConfig["size"]] != null) currentNewItem.size=parseInt(currentOldItem[wsConfig["size"]]) || -1;
			if(currentOldItem[wsConfig["mimetype"]] != null) currentNewItem.mimetype=currentOldItem[wsConfig["mimetype"]];
			if(currentOldItem[wsConfig["source"]] != null) currentNewItem.source=currentOldItem[wsConfig["source"]];

			if(currentOldItem[wsConfig["site"]["shortName"]] != null && currentOldItem[wsConfig["site"]["title"]] != null)
			{
				currentNewItem.site={};
				currentNewItem.site.shortName=currentOldItem[wsConfig["site"]["shortName"]];
				currentNewItem.site.title=currentOldItem[wsConfig["site"]["title"]];
			}
			currentNewItem.displayName = currentNewItem.name;
			currentNewItem.modifiedByUser = currentNewItem.modifiedBy;
			currentNewItem.type = "enterprise-document";

			formattedResponse.items.push(currentNewItem);
		}
	}
	// format facets
	formattedResponse.faceted = [];
	if(originalResponse.facets != null && originalResponse.facets != "")
	{
		formattedResponse.faceted = originalResponse.facets; 
	}
	
	formattedResponse.suggestion =  "";
	if(originalResponse.searchResults.collationQuery != null && originalResponse.searchResults.collationQuery != ""){
		formattedResponse.suggestion = originalResponse.searchResults.collationQuery;
	}
	
	return formattedResponse;
}

function facetsToSearchSyntax(facets)
{
	if(facets == null || facets == "" || facets == "{}")
	{
		return "";
	}

	var result = "";
	var facetsJson = eval ("(" + facets + ")");

	for(var currentFacet in facetsJson)
	{
		result += "," + facetsJson[currentFacet].filter;
	}
	// Remove the first comma
	return result.substring(1);
}

function buildQuery(term)
{
	var searchString = (term !== null) ? term : "*";
	return searchString;
}

function main()
{
	var isSensefySearch = (args.sen != null) ? (args.sen == "true") : false;
	if(isSensefySearch)
	{
		/* Sensefy values */
		var params =
		{
			query: buildQuery(args.term),
			filters : facetsToSearchSyntax(args.facetedFields),
			sort: (args.sort !== null) ? args.sort : null,
			pageSize: (args.pageSize !== null) ? parseInt(args.pageSize, 10) : DEFAULT_PAGE_SIZE,
			startIndex: (args.startIndex !== null) ? parseInt(args.startIndex, 10) : 0,
			tzoffset: (args.tzoffset !== null) ? parseInt(args.tzoffset, 10) : 0
		};
	    var resString = getSensefySearchResults(params);
	    model.data = reformatSensefyResults(resString);
	}
	else
	{
		var params =
		{
			siteId: (args.site !== null) ? args.site : null,
			containerId: (args.container !== null) ? args.container : null,
			repo: (args.repo !== null) ? (args.repo == "true") : false,
			term: (args.term !== null) ? args.term : null,
			tag: (args.tag !== null) ? args.tag : null,
			query: (args.query !== null) ? args.query : null,
			rootNode: (args.rootNode !== null) ? args.rootNode : null,
			sort: (args.sort !== null) ? args.sort : null,
			maxResults: (args.maxResults !== null) ? parseInt(args.maxResults, 10) : DEFAULT_MAX_RESULTS,
			pageSize: (args.pageSize !== null) ? parseInt(args.pageSize, 10) : DEFAULT_PAGE_SIZE,
			startIndex: (args.startIndex !== null) ? parseInt(args.startIndex, 10) : 0
		};
	   model.data = getSearchResults(params);
	}
}

main();


