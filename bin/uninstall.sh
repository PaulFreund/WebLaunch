#!/bin/sh

###############################################################################
## Configuration variables 

APP_FOLDER="/mnt/us/extensions/WebLaunch"

APPREG="/var/local/appreg.db"

APP_ID="com.PaulFreund.WebLaunch"
APP_ID_STRING="'$APP_ID'"

## WARNING - Changing the extension path after first run will result in errors,

###############################################################################
## Uninstall from registry

sqlite3 $APPREG "delete from handlerIds where handlerId=$APP_ID_STRING"
sqlite3 $APPREG "delete from properties where handlerId=$APP_ID_STRING"

###############################################################################
## Uninstall powerbutton filter 

FILE_RULES="/etc/udev/rules.d/98-yoshibutton.rules"
FILE_NOTIFY="/lib/udev/bin/notifyyoshibutton"

#------------------------------------------------------------------------------
# Rules
if [ -f $FILE_RULES ]
then
	mntroot rw
	rm $FILE_RULES
	udevadm control --reload-rules
	mntroot ro
fi

#------------------------------------------------------------------------------
# Notifier
if [ -f $FILE_NOTIFY ]
then
	mntroot rw
	rm $FILE_NOTIFY
	mntroot ro
fi