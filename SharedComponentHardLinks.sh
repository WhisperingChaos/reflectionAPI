#!/bin/bash
  if [ "$1" == 'create' ]; then 
    function sharedOper () {
      declare -r basicBuildComp="$1"
      declare -r binaryJailComp="$2"
      if [ -e $basicBuildComp ]; then continue; fi
      if ! ln $binaryJailComp $basicBuildComp; then return 1; fi
      return 0;
    }
  elif [ "$1" == 'destroy' ]; then 
    function sharedOper () {
      declare -r basicBuildComp="$1"
      if [ -e $basicBuildComp ]; then 
        if ! rm $basicBuildComp; then return 1; fi
      fi
      return 0;
    }
  else
    echo "Abort: Specify either 'create' or 'destroy' as first argument.">&2
    exit 1;
  fi

  BINARY_JAIL_DIR='./binaryjail/containerSetup'
  BASIC_BUIL_DIR='./component/dt_basic/context/build'
  ## shared components for basic container
  for sharedcomp in Dockerfile provision_container.sh restserver.js runrest.sh test.sh
  do
    if ! sharedOper "$BASIC_BUIL_DIR/$sharedcomp" "$BINARY_JAIL_DIR/$sharedcomp"; then exit 1; fi
  done;

exit 0;


