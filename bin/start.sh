#!/bin/sh

###############################################################################
## Configuration variables 

APP_FOLDER="/mnt/us/extensions/WebLaunch"

APPREG="/var/local/appreg.db"

APP_ID="com.PaulFreund.WebLaunch"
APP_ID_STRING="'$APP_ID'"

## WARNING - Changing the extension path after first run will result in errors,
## the following commands delete old keys from the app registry
# sqlite3 $APPREG "delete from handlerIds where handlerId=$APP_ID_STRING"
# sqlite3 $APPREG "delete from properties where handlerId=$APP_ID_STRING"

###############################################################################
## Register powerbutton handler

FILE_RULES="/etc/udev/rules.d/98-yoshibutton.rules"
FILE_NOTIFY="/lib/udev/bin/notifyyoshibutton"

#------------------------------------------------------------------------------
# Rules
if [ ! -f $FILE_RULES ]
then
	mntroot rw
	echo "KERNEL==\"yoshibutton\",  RUN+=\"$FILE_NOTIFY\"" > $FILE_RULES
	udevadm control --reload-rules
	mntroot ro
fi

#------------------------------------------------------------------------------
# Notifier
if [ ! -f $FILE_NOTIFY ]
then
	mntroot rw
	echo '#!/bin/sh' > $FILE_NOTIFY
	echo '/usr/bin/lipc-send-event com.lab126.system.event yoshibutton' >> $FILE_NOTIFY
	chmod +x $FILE_NOTIFY
	mntroot ro
fi

###############################################################################
## Register application if neccessary

#------------------------------------------------------------------------------
# Application Id
REG_ID=$(sqlite3 $APPREG "select handlerId from handlerIds where handlerId=$APP_ID_STRING")

if [[ -z "$REG_ID" ]]
then
	echo "Application Id not registered, registering..."
	sqlite3 $APPREG "INSERT INTO handlerIds VALUES ($APP_ID_STRING)"
fi

#------------------------------------------------------------------------------
# Application command
REG_COMMAND=$(sqlite3 $APPREG "select handlerId from properties where handlerId=$APP_ID_STRING and name='command'")

if [[ -z "$REG_COMMAND" ]]
then
	echo "Application command not registered, registering..."
	sqlite3 $APPREG "INSERT INTO properties (handlerId, name, value) VALUES ($APP_ID_STRING,'command','/usr/bin/mesquite -l $APP_ID -c $APP_FOLDER/bin/')"
fi

#------------------------------------------------------------------------------
# Application unloadPolicy
REG_UNLOADPOLICY=$(sqlite3 $APPREG "select handlerId from properties where handlerId=$APP_ID_STRING and name='unloadPolicy'")

if [[ -z "$REG_UNLOADPOLICY" ]]
then
	echo "Application unloadPolicy not registered, registering..."
	sqlite3 $APPREG "INSERT INTO properties (handlerId, name, value) VALUES ($APP_ID_STRING,'unloadPolicy','unloadOnPause')"
fi

###############################################################################
## Start the application

lipc-set-prop com.lab126.appmgrd start app://$APP_ID



