###############################################################################
#
# Purpose: Construct a minimal Ubuntu V12.04 image that simply includes the
# a configurable file.  This is a pseudo sshserver implementation
#
##############################################################################

FROM	   dt_basic

###############################################################################
#
#
#  SERVICE_MANAGEMENT_ROOT
#    Directory location where all resources required to define a container's
#    service set and executables needed to manage these resources are stored.
#  SERVICE_MANAGEMENT_BIN
#    Directory location of executables needed to manage service resources,
#    and service management requests.  Service resources refer to things
#    produced or offerred by a service while a manage request executes
#    processes to provide, for example, the container's service manifest and
#    or binding service variables.
#  SERVICE_MANAGEMENT_LIB
#    Directory location of scripting libraries that support the 
#    construction of service management processes located in 
#    SERVICE_MANAGEMENT_BIN
#  SERVICE_CATALOG
#    A directory whose directory contents define the list of services offered 
#    by a container.  Each offered service appears as a directory name.  
#
#    Each service includes the following subdirectories:
#    >  'resource'  Encapsulates all resource related meta data for its 
#       parent service.
#    >  'resoruce/variable/definitions: This directory encapsulates meta data
#       describing resource variable definitions.  A varaible definition consists
#       of name and its type.  An instance of a ResourceType
#       supplies the implementation for primative resource management 
#       methods like its construction, connection, and disconnection to
#       the resource.  These operations are defined and exposed by
#       the ResourceHandle type.  They are used by management operations, like bind,
#       to govern/coordinate the consumption/production of resources between
#       services.
#       A resource variable may implement more than one ResourceType, but once
#       its bound it must be completely disconnected before binding it with a 
#       different ResourceType.
#    >  'resource/variable/definition/consumed' Declares all external resource variables
#       needed to satisfy a service's requirements to produce its product (output recources).
#       Each consumed resource is represented by a unique variable name.
#    >  'resource/variable/definition/produced' Identifies all the resources generated by transforming
#       the resources consumed by the service.
#    >  'resource/variable/definitions/type'  Contains ResourceType definitions needed to instantiate 
#       consumed or produced recources.
#TODO: Start
#  > For a distributed management scheme incorporate the following:
#  'resource/variable/bound/consumed'? Represents consumed resources instantiated and bound.
#  'resource/variable/bound/produced' Represents produced resources instantiated and bound.
#TODO: End
#
ENV SERVICE_MANAGEMENT_ROOT /
ENV SERVICE_MANAGEMENT_BIN ${SERVICE_MANAGEMENT_ROOT}/dt/bin
ENV SERVICE_MANAGEMENT_LIB ${SERVICE_MANAGEMENT_ROOT}/dt/lib
ENV SERVICE_CATALOG /services
ENV PATH ${SERVICE_MANAGEMENT_BIN}:${SERVICE_MANAGEMENT_LIB}:${PATH}

RUN mkdir -p "$SERVICE_CATALOG"           \
    mkdir -p "$SERVICE_MANAGEMENT_BIN"  ; \
    mkdir -p "$SERVICE_MANAGEMENT_LIB"  ; 

ADD ./services  ${SERVICE_CATALOG}/
ADD ./bin/*       ${SERVICE_MANAGEMENT_BIN}/
#ADD ./lib/*      ${SERVICE_MANAGEMENT_LIB}/

RUN mkdir -p '/bjail/restify'                                \
    && rm /restserver.js                                     \
    && touch '/bjail/restify/restserver.js'                  \
    && ln -s '/bjail/restify/restserver.js' '/restserver.js' \
    && echo '#!/bin/bash'> /startup.sh                       \
    && echo '/restserver.js & ' >> /startup.sh               \
    && chmod +x /startup.sh

EXPOSE 8080

ENTRYPOINT ["/bin/bash"]

