#!/bin/bash

echo "Installing Share 4.2.2"

if [ -e /mnt/alfdata/alfresco-4.2.0/alfresco.sh ]; then
    echo "Trying to stop tomcat"
    /mnt/alfdata/alfresco-4.2.0/alfresco.sh stop tomcat
fi

if [ -e /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/share ]; then
    echo "Cleaning preview installation"
    rm -rf /mnt/alfdata/alfresco-4.2.0/tomcat/webapps/share*
fi
