#!/bin/bash

if [ -e /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/alfresco ]; then
    echo "Cleaning Alfresco installation"
    rm -rf /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/alfresco*
fi

echo "Uninstall complete"
