#!/bin/bash
###############################################################################
#
#  Purpose:
#    Reflection API defining the list of types this variable can assume.
#
#  Input:
#    None.
#
#  Output:
#    STDOUT - List of ResourceTypes. Each line represents
#      another type entry.
#
###############################################################################
function resourceTypesSupported() {
  echo 'dynamicDT.SHARE_LINK'
}
###############################################################################
#
#  Purpose:
#    Reflection API to define the constuctor arguments supported by the
#    desired ResourceType.
#
#  Input:
#    $1  - ResourceType
#
#  Output:
#    STDOUT - List of arguments, their types, and presence. Each line represents
#      another argument definition.
#
###############################################################################
function resourceConstructorArgs() {
  declare -r resource_type="$1"
  # define both the argument types, names, and presence traits for
  # each dynamicDT.SHARE_LINK argument constructor
  declare -Ar args=(['dynamicDT.SHARE_LINK']='(
  [0]="DIRECTORY/SHARE_LINK_SOME_DIRECTORY/presence=required"
  [1]="DIRECTORY/SHARE_LINK_POINT_DIRECTORY/presence=required"
  )')
  if [ -z "${args[$resource_type]}" ]; then echo "Error: unknow resource type: '$resource_type'.">&2; exit 1; fi
  # outptut resource type arguments 
  eval declare -a arg_list=\'${args["$resource_type"]}\'
  for arg_entry in "${arg_list[@]}"
  do
    echo "$arg_entry"
  done
}

