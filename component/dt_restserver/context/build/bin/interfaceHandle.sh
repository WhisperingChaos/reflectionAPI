function handleCreate () {
  local -r interface_type="$1"
  local -r variable_name="$2"

  ScriptDebug $LINENO "check variable name"
  variableNameVerify "$variable_name"
  ScriptDebug $LINENO "check variable type"
  variableTypeSupported "$variable_name" "$interface_type"
  ScriptDebug $LINENO "check arguments"
  variableConstructorArgsVerify "$variable_name" "$interface_type" "${@:3}"
  ScriptDebug $LINENO "creating instance of variable"
  variableCreate "$variable_name" "$interface_type" "${@:3}"
  return 0
}
function variableNameVerify () {
  local -r variable_name="$1"
  if ! ls "$VARIABLE_DEFINITION_DIR/$variable_name.sh"; then ScriptUnwind "$LINENO" "Unknown resource variable name: '$variable_name'."; fi
  return 0
}
function variableTypeSupported () {
  local -r variable_name="$1"
  local -r interface_type="$2"
  source "$VARIABLE_DEFINITION_DIR/$variable_name.sh"
  for type_name_supported in `interfaceTypesSupported`
  do 
    if [ "$interface_type" == "$type_name_supported" ]; then
      if ls "$INTERFACE_DEFINITION_DIR/$interface_type.sh"; then
        # interface is supported by variable & interface definition exists.
        return 0
      fi
      ScriptUnwind "$LINENO" "Interface type: '$interface_type' supported by resource variable name: '$variable_name' but interface definition missing from: '$INTERFACE_DEFINITION_DIR'."
    fi
  done
  ScriptUnwind "$LINENO" "Interface type: '$interface_type' for variable name: '$variable_name' not supported."
}
function variableConstructorArgsVerify () {
  local -r variable_name="$1"
  local -r interface_type="$2"
  source "$INTERFACE_DEFINITION_DIR/$interface_type.sh";
  local -A variable_interface_map
  shift 2
  while [ "$#" -gt 0 ]; do
    local variable_value="${1#*=}"
    local -i variable_name_type_len=$(( ${#1} - ${#variable_value} - 1 ))
    local variable_name_type="${1:0:$variable_name_type_len}"
    variable_interface_map["$variable_name_type"]="$variable_value"
    shift
  done
  # ensure all constructor argument variables are defined for constructor
  # TODO: doesn't check if extra argument variables are supplied by caller to the factory.
  local  variable_defined
  for variable_defined in `constructorVariables`
  do
    local variable_value="${variable_interface_map["$variable_defined"]}"
    if [ -z "$variable_value" ]; then ScriptUnwind "$LINENO" "Value not supplied for variable: '$variable_defined' of interface: '$interface_type' defined for resource: '$variable_name'."; fi
  done
  return 0
}
function variableCreate () {
  local -r variable_name="$1"
  local -r interface_type="$2"

  if [ -f "$VARIABLE_INSTANCE_DIR/$variable_name.sh" ]; then ScriptUnwind "$LINENO" "Resource variable: '$variable_name' already defined/coupled."; fi
  # efficiently copy the interface implementation to the variable definition
  cat "$VARIABLE_DEFINITION_DIR/$variable_name.sh" "$INTERFACE_DEFINITION_DIR/$interface_type.sh" <( variableAssignementGen "${@:3}" ) > "$VARIABLE_INSTANCE_DIR/$variable_name.sh"
  return 0
}
function variableAssignementGen () {
  for variable_assignment in "${@:1}"
  do
    # remove argument's type definition to reveal its name and assigned value            
    local environment_variable_def="${variable_assignment#*/}"
    echo "local $environment_variable_def"
  done
}
function handleConnect () {
  local -r variable_name="$1"
  variableInstanceVerify "$variable_name"
  source "$VARIABLE_INSTANCE_DIR/$variable_name.sh";
  connect
}
function handleDisconnect () {
  local -r variable_name="$1"
  variableInstanceVerify "$variable_name"
  source "$VARIABLE_INSTANCE_DIR/$variable_name.sh";
  disconnect
}
function handleDestroy () {
  local -r variable_name="$1"
  variableInstanceVerify "$variable_name"
  if ! rm "$VARIABLE_INSTANCE_DIR/$variable_name.sh"; then ScriptUnwind "$LINENO" "Unable to destroy instance variable name: '$variable_name'."; fi
}
function variableInstanceVerify () {
  local -r variable_name="$1"
  if ! ls "$VARIABLE_INSTANCE_DIR/$variable_name.sh"; then ScriptUnwind "$LINENO" "Unknown instance variable name: '$variable_name'."; fi
  return 0
}


