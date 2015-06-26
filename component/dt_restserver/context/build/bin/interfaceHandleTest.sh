#!/bin/bash
function ScriptUnwind (){
  echo "Abort: Module: '$0' LINENO: '$1', $2" >&2
  exit 1
}
function ScriptDebug (){
  echo "Debug: Module: '$0' LINENO: '$1', $2" >&2
  return 0
}
function main () {
  source "interfaceHandle.sh"
  handleCreate  'dynamicDT.SHARE_LINK' 'download' 'DIRECTORY/SHARE_LINK_SOME_DIRECTORY=/root/sharemount/download' 'DIRECTORY/SHARE_LINK_POINT_DIRECTORY=/root/download'
  handleConnect 'download'
  if ! [ -f "/root/download/hello.txt" ]; then ScriptUnwind "$LINENO" "Connection failed.  Can't see file: '/root/download/hello.txt'"; fi
  handleDisconnect 'download'
  handleDestroy 'download'
}
main
