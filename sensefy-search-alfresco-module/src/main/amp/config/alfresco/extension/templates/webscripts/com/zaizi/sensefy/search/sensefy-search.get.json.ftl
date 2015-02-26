<#escape x as jsonUtils.encodeJSONString(x)>
{
	"totalRecords": ${data.paging.totalRecords?c},
	"totalRecordsUpper": ${data.paging.totalRecordsUpper?c},
	"startIndex": ${data.paging.startIndex?c},
	"items":
	[
	  <#if data.items?? && (data.items?size > 0)>
		<#list data.items as item>
		{
			<#if item.nodeRef??>
			"nodeRef": "${item.nodeRef}",
			</#if>
			<#if item.type??>
			"type": "${item.type}",
			</#if>
			"name": "${item.name!''}",
			"displayName": "${item.displayName!''}",
			<#if item.title??>
			"title": "${item.title}",
			</#if>
			"description": "${item.description!''}",
			"modifiedOn": "${xmldate(item.modifiedOn)!''}",
			"modifiedByUser": "${item.modifiedByUser!''}",
			"modifiedBy": "${item.modifiedBy!''}",
			"size": ${(item.size?c)!'-1'},
			"mimetype": "${item.mimetype!''}",
			<#if item.site??>
			"site":
			{
				"shortName": "${item.site.shortName}",
				"title": "${item.site.title}"
			},
			"container": "${item.container!''}",
			</#if>
			<#if item.path??>
			"path": "${item.path}",
			</#if>

			<#if item.docUrl??>
			"docUrl": "${item.docUrl}",
			</#if>
			<#if item.containerUrl??>
			"containerUrl": "${item.containerUrl}",
			</#if>
			<#if item.thumbnailUrl??>
			"thumbnailUrl": "${item.thumbnailUrl}",
			</#if>
			<#if item.source??>
			"source": "${item.source}",
			</#if>

			"tags": [<#list item.tags![] as tag>"${tag}"<#if tag_has_next>,</#if></#list>]
		}<#if item_has_next>,</#if>
		</#list>
	  </#if>
	]

	<#if data.faceted?? && data.items?? && (data.items?size > 0)>
	,
	"facetedSearch" :
	{
		<#list data.faceted as facet>
   			"${facet.label?string}" :
   			[
   			<#list facet.facetItems as element>
   			  {
                  "realValue": "${element.value?string}",
                  "count" : ${element.occurrence?c},
                  "filter": "${element.filter?string}"
   			  }
   			<#if element_has_next>,</#if>
   			</#list>
   			]<#if facet_has_next>,</#if>
		</#list>
	}
	</#if>
	<#if data.suggestion??>
	,
	"suggestion" : "${data.suggestion}"
	</#if>
}
</#escape>