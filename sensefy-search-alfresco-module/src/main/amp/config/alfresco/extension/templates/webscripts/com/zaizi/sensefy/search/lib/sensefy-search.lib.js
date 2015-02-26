/**
 * Return Sensefy Search results with the given search terms.
 */
function getSensefySearchResults(params)
{
	// handle sort formatting
	var sortColumns = [];
	var sort = params.sort;
	if (sort != null && sort.length != 0)
	{
		var asc = true;
		var separator = sort.indexOf("|");
		if (separator != -1)
		{
			asc = (sort.substring(separator + 1) == "true");
			sort = sort.substring(0, separator);
		}
		sortColumns.push(
		{
			column : sort,
			ascending : asc
		});
	}

	// perform Sensefy query
	var queryDef =
	{
		query : params.query,
		filters : params.filters,
		page :
		{
			startIndex : params.startIndex,
			maxItems : params.pageSize
		},
		sort : sortColumns,
		tzoffset : params.tzoffset
	};
	return sensefySearch.sensefyQuery(queryDef);
}