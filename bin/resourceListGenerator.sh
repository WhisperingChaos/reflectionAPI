#!/bin/bash
function ScriptUnwind (){
  echo "Abort: Module: '$0' LINENO: '$1', $2" >&2
  exit 1
}
function ScriptDebug (){
  echo "Debug: Module: '$0' LINENO: '$1', $2" >&2
  return 0
}
###############################################################################
##
##  Purpose:
##    Generate a JSON file enumerating a ResourceTypeMap list.  
##    A ResourceTypeMap list consists of one or more resource variable
##    definitions.  A resource variable definition consists of a 
##    variable name - type name pair.  This routine uses a reflection
##    API to generate a JSON file containing these pairs for each
##    resource variable definition within a specific context.
##
##  Constraints:
##    > A varaible name identifies a resource either consumed or produced by
##    a given service.  A variable name must be unique within the context of
##    both a specific service and the qualifier of either consumed or produced.
##    > A variable name can support any number of types.
##      
##  Inputs:
##    STDIN - A directory name that contains variable name definitions.
##
##  Outputs:
##    STDOUT - A stream of JSON syntax that contains variable name - type pairs.
##
###############################################################################
function main () {
  local varDefDir
  local -r typeListAPI='resourceTypesSupported'
  local -r argListAPI='resourceConstructorArgs'
  while read varDefDir; do
    if ! [ -d "$varDefDir" ]; then 
      ScriptUnwind "$LINENO" "Resource variable directory must exist.  '$varDefDir' missing."
    fi
    # Declare array of resource variables
    echo '['
    for varDef in "${varDefDir}/"*.sh; do
      # if no files exist, avoid simply getting the desired file pattern.
      if ! [ -e "$varDef" ]; then continue; fi
      # Remove the function that provides a variable's types
      # as it's a leftover from a previous iteration.
      unset -f $typeListAPI 
      # Load a variable's definition which includes its reflection API.
      source $varDef
      if ! declare -F $typeListAPI >/dev/null 2>/dev/null; then
        # API type enumeration function not defined
        ScriptUnwind "$LINENO" "Resource variable definition: '$varDef', missing reflection API: '$typeListAPI'."
      fi
      # variable name omits file extension
      local -r fileName="`basename "$varDef"`"
      local -r variableName="${fileName%.*}"
      declare commaTypDef=' '
      declare typeDef
      for typeDef in `$typeListAPI`; do
        declare argList='"constructorArgs" : ['
        declare argDef
        declare commaArgs=''
        for argDef in `$argListAPI $typeDef` ; do
          declare argJSONobj=''
          argJSONgen "$argDef" 'argJSONobj'
          argList+="$commaArgs$argJSONobj"
          commaArgs=',';
        done
        argList+=']'
        echo " $commaTypeDef{ \"variableName\" : \"$variableName\" , \"typeName\" : \"$typeDef\", $argList }"
        commaTypeDef=","
      done
    done
    # Terminate array of resource variables 
    echo ']'
  done
}
###############################################################################
##
##  Purpose:
##    Generate a JSON object to describe the arguments that need
##    to be supplied to the ResourceType constructor.  The JSON object example:
##      {
##        "typeName": "DIRECTORY",
##        "variableName": "SHARE_LINK_SOME_DIRECTORY",
##        "presence": "required"
##      }
##
##  Inputs:
##    $1 - An argument descriptor of format: <typeName>/<variableName>/<propertyName>=<value>
##    $2 - A variable name to receive the generated JSON.
##
##  Outputs:
##    $2 - Will be assigned a list of JSON objects with 
##
###############################################################################
function argJSONgen (){
  declare -r argDef="$1"
  declare -r argJSONoutNM="$2"
  declare -ar nameless_list='([0]="typeName" [1]="variableName")'

  declare JSONsyntx=''
  declare -i cursor=0
  declare -i nameless_ix=0
  declare comma=''
  declare -i remain=${#argDef}
  while [ "$remain" -gt '0' ]; do
    declare -i token_len="$(expr index "${argDef:$cursor}" '/')"
    if [ "$token_len" -lt '1' ]; then
      let token_len=$remain
    else
      ((--token_len))
    fi
    let remain=remain-token_len-1 
    declare token="${argDef:$cursor:$token_len}"
    let cursor=cursor+token_len+1
    # check for attribute name - value pairs
    declare -i token_attrib_len="$(expr index "${token}" '=')"
    if [ "$token_attrib_len" -gt '0' ]; then
      # detected attribute name - value pair
      JSONsyntx+="${comma} \"${token:0:$token_attrib_len-1}\" : \"${token:$token_attrib_len:$token_len-$token_attrib_len}\" "
    else
      JSONsyntx+="${comma} \"${nameless_list[$nameless_ix]}\" : \"${token:0:$token_len}\" "
      ((++nameless_ix))
      if ! [ "$nameless_ix" -lt "${#nameless_list}" ]; then 
        ScriptUnwind "$LINENO" "Unknown nameless attribute: '${token:0:$token_len}'."
      fi
    fi 
    comma=','
  done
  if [ -n "$JSONsyntx" ]; then
    eval $argJSONoutNM\=\"\{\$JSONsyntx\}\"
  else
    eval $argJSONoutNM\=\'\'
  fi
}
main
