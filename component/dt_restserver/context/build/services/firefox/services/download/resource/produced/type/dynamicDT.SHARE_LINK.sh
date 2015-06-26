#!/bin/bash
function constructorVariables(){
  echo 'DIRECTORY/SHARE_LINK_SOME_DIRECTORY'
  echo 'DIRECTORY/SHARE_LINK_POINT_DIRECTORY' 
}
function ScriptUnwind (){
  echo "Abort: Module: '$0' LINENO: '$1', $2" >&2
  exit 1
}
function shareLinkVerify () {
  if   [ -z "$SHARE_LINK_SOME_DIRECTORY" ];  then ScriptUnwind "$LINENO" "Directory to be share linked not specified."; fi
  if ! [ -d "$SHARE_LINK_SOME_DIRECTORY" ];  then ScriptUnwind "$LINENO" "Directory to be share linked: '$SHARE_LINK_SOME_DIRECTORY' doesn't exist."; fi
  if   [ -z "$SHARE_LINK_POINT_DIRECTORY" ]; then ScriptUnwind "$LINENO" "Directory share link point not specified."; fi
}
function connect(){
  ScriptDebug "$LINENO" 'connecting'
  shareLinkVerify
  while true; do
    if ! [ -h "$SHARE_LINK_POINT_DIRECTORY" ]; then
      if [ -d "$SHARE_LINK_POINT_DIRECTORY" ]; then
        if [ -z "`ls -A $SHARE_LINK_POINT_DIRECTORY/`" ] && rm -r "$SHARE_LINK_POINT_DIRECTORY/"; then
          # share link point an empty directory and has been removed to permit creation of 
          # desired link
          break 
        fi
        ScriptUnwind "$LINENO" "Directory share link point not empty: '$SHARE_LINK_POINT_DIRECTORY'."
      fi
      # share link point doesn't exist at all
      # TODO: ensure parent directory exists.
      break
    fi
    if [ "`readlink -e "$SHARE_LINK_POINT_DIRECTORY"`" == "`readlink -e "$SHARE_LINK_SOME_DIRECTORY"`" ]; then
      # link point already pointing at the requested directory :: consider it successfully connected
      return 0
    fi
    # link not pointing at same directory, unlink current
    if unlink "$SHARE_LINK_POINT_DIRECTORY"; then
      # successfully unlinked :: now create share point.
      break
    fi
    ScriptUnwind "$LINENO" "Failed to redirect existing share link point: '$SHARE_LINK_POINT_DIRECTORY'."
  done
  if ln -s "$SHARE_LINK_SOME_DIRECTORY" "$SHARE_LINK_POINT_DIRECTORY"; then
    # link successful
    return 0;
  fi
  ScriptUnwind "$LINENO" "Share link failed for: '$SHARE_LINK_SOME_DIRECTORY' to share link point:  '$SHARE_LINK_POINT_DIRECTORY'."
}
function disconnect(){
  shareLinkVerify  
  while true; do
    #  see if share link point is a syslink - it should be
    if ! [ -h "$SHARE_LINK_POINT_DIRECTORY" ]; then
      # not a syslink :: consider as if disconnected
      break;
    fi
    # it's a syslink - is it pointing to the tartet directory?
    if [ "`readlink -e "$SHARE_LINK_POINT_DIRECTORY"`" != "`readlink -e "$SHARE_LINK_SOME_DIRECTORY"`" ]; then
      # link not pointing at expected directory. Consider it already disconnected
      break;
    fi
    # it's a syslink pointing to the correct directory :: unlink it.
    if unlink "$SHARE_LINK_POINT_DIRECTORY"; then 
      # successfully unlinked.
      break;
    fi
    ScriptUnwind "$LINENO" "Unlink of share link point: '$SHARE_LINK_POINT_DIRECTORY' from: '$SHARE_LINK_SOME_DIRECTORY' failed."
  done
  return 0
}
