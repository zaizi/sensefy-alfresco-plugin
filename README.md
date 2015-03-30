# sensefy-alfresco-plugin
Alfresco addon to search across Sensefy through Alfresco Share

## Supported versions

* Alfresco 4.2     

## Build

Run the following command:

‘mvn clean package’

Two AMPs will be created after that execution, under the following paths:

* Alfresco: sensefy-search-alfresco-module/target/sensefy-search-alfresco-module.amp
* Share: sensefy-search-share-module/target/sensefy-search-share-module.amp

Then apply amps accordingly by using apply_amps.sh (.exe) command or by following instructions here: http://docs.alfresco.com/4.1/tasks/amp-install.html


## Configuration

Set the following property in alfresco-global.properties

sensefy.host.url=localhost:8081/SensefySearchAPI

Where this is the URL to Sensefy API, normally deployed in host:8081/SensefySearchAPI

## Copyright
© Zaizi Limited. Code for this plugin is licensed under the Apache license.

Any trademarks and logos included in these plugins are property of their respective owners and should not be reused, redistributed, modified, repurposed, or otherwise altered or used outside of this plugin.
