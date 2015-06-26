

+ Create a directory called 'projects' in your host OS.
+ Create subdirectory within 'projects' named 'desktop'
+ git clone [reflectionAPI - master](https://github.com/WhisperingChaos/reflectionAPI) directly into 'desktop'.
  + git clone git@github.com:WhisperingChaos/reflectionAPI.git .
+ git clone [binaryjail - restify] (https://github.com/binaryjail/binaryjail) into 'desktop/binaryjail'
  + ```git clone git@github.com:binaryjail/binaryjail.git```
+ while current in 'desktop' run ```./SharedComponentHardLinks.sh create``` .  This will establish proper hardlinks to files in the build context of the ```dt_basic``` image.
+ Follow the instructions [to Pull the dlw and execute dlwRun.sh](https://github.com/WhisperingChaos/DeveloperLocalWorkbenchForDocker#installing-pulling-image) (DeveloperLocalWorkbenchForDocker) image.  Place the ```dlwRun.sh``` script in 'desktop`.
+ Once ```dlwRun.sh``` has been started with the '-p' option referencing the path to 'projects' directory, the ```dlw``` container's terminal should be current.
+ Follow similar instructions to the [Tutorial](https://github.com/WhisperingChaos/DeveloperLocalWorkbenchForDocker#project-tutorial-build) to build, report on, and run the project's images/containers.


