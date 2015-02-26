#!/bin/bash

echo "Installing Alfresco 4.2.2"

if [ -e /etc/init.d/tomcat7 ]; then
    echo "Trying to stop tomcat"
    service tomcat7 stop
fi

if [ -e /usr/share/tomcat7/webapps/alfresco ]; then
    echo "Cleaning preview installation"
    rm -rf /usr/share/tomcat7/webapps/alfresco*
fi
