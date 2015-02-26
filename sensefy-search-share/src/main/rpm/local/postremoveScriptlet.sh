#!/bin/bash

if [ -e /usr/share/tomcat7/webapps/share ]; then
    echo "Cleaning Share installation"
    rm -rf /usr/share/tomcat7/webapps/share*
fi

echo "Uninstall complete"
