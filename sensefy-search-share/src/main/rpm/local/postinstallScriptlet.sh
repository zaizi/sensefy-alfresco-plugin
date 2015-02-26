#!/bin/bash

existsUser=`grep tomcat /etc/passwd`

if [ ! -n "$existsUser" ]; then   # -n tests to see if the argument is non empty
	echo "Creating user tomcat"
	/usr/sbin/useradd -s /bin/bash -d /var/share/tomcat7 tomcat
else 
	echo "The user tomcat already exists, avoiding creation."       
fi

echo "Switching permissions to user tomcat"

chown -R tomcat:tomcat /var/log/tomcat7
chown -R tomcat:tomcat /var/lib/tomcat7
chown -R tomcat:tomcat /etc/tomcat7
chown -R tomcat:tomcat /var/cache/tomcat7
chown -R tomcat:tomcat /usr/share/tomcat7

echo "Installation complete"
