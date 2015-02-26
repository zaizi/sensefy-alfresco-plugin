function main()
{
	var mimetype = args.mimetype;
    var thumbnailPath = thumbnailService.getMimeAwarePlaceHolderResourcePath("doclib", mimetype);
    model.contentPath = thumbnailPath;
}

main();