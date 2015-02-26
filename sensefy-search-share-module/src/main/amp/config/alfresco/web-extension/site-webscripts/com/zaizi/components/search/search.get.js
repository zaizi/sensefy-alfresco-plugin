function changeSortParams()
{
	// get the search sorting fields from the config
	var sortables = config.scoped["Search"]["sensefySorting"].childrenMap["sort"];
	var sortFields = [];
	for (var i = 0, sort, label; i < sortables.size(); i++)
	{
		sort = sortables.get(i);

		// resolve label text
		label = sort.attributes["label"];
		if (label == null)
		{
			label = sort.attributes["labelId"];
			if (label != null)
			{
				label = msg.get(label);
			}
		}

		// create the model object to represent the sort field definition
		sortFields.push(
		{
			type : (sort.value !== null ? sort.value : ""),
			label : label ? label : sort.value
		});
	}

	model.sortFields = sortFields;
	model.searchSort = (page.url.args["s"] != null) ? page.url.args["s"]
			: (sortFields.length !== 0 ? sortFields[0].type : "");
}

function main()
{
	// Override the current search type to be displayed
	if (page.url.args["sen"] == "true")
	{
		model.searchSensefy = true;
		model.searchRepo = false;
		model.searchAllSites = false;
		changeSortParams();
	} else
	{
		model.searchSensefy = false;
	}

	// Change widget to our custom javascript object
	var widget = widgetUtils.findObject(model.widgets, "id", "Search");
	if (widget)
	{
		// extend to our custom object
		widget.name = "Alfresco.CustomSearch";
		// set items per page
		var limit = config.scoped["Search"]["max-page-size"].value;
		widget.options.pageSize = limit;
		
		// adds the currently selected facets
		if (page.url.args["selectedFacets"])
		{
			widget.options.selectedFacets = jsonUtils.toObject(page.url.args["selectedFacets"]);
		}
	}
}

main();
