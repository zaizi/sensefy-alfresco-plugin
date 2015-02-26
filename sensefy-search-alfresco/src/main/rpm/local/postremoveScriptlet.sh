#!/bin/bash

if [ -e /usr/share/tomcat7/webapps/alfresco ]; then
    echo "Cleaning Alfresco installation"
    rm -rf /usr/share/tomcat7/webapps/alfresco*
fi

echo "Uninstall complete"
