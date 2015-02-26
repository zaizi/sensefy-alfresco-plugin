#!/bin/bash

if [ -e /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/share ]; then
    echo "Cleaning Share installation"
    rm -rf /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/share*
fi

echo "Uninstall complete"
