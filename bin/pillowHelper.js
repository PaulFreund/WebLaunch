/*##############################################################################
//
// pillowHelper.js  - Library for mesquite apps requiring more capabilities
//                  - Version 1.1
//
//##############################################################################

//==============================================================================
// Exposed API 
//==============================================================================

pillowHelper.Run                                // Run function as Pillow
pillowHelper.RegisterStatusBarEventCallback     // Register for system events
pillowHelper.UnRegisterStatusBarEventCallback   // Unregister from system events
pillowHelper.RequestStatusBarEvent              // Request specific system event

//==============================================================================
// pillowHelper.Run - Run functions in the scope of a a pillow application 
//==============================================================================

//------------------------------------------------------------------------------
// Arguments 
//------------------------------------------------------------------------------

* appID has to be the id of the mesquite app currently running 
* fkt can be a string with javascript expressions or a real javascript function
* callback has one argument which is the return value of the supplied function

//------------------------------------------------------------------------------
// Information
//------------------------------------------------------------------------------

* Return values will be automatically converted to strings
* You can not access external variables inside the function supplied to fkt

//------------------------------------------------------------------------------
// Example
//------------------------------------------------------------------------------

pillowHelper.Run(
	'default_status_bar',
	'com.PaulFreund.WebLaunch',
	function() 
	{
		// Get the Screen saver prevention status
		return nativeBridge.getIntLipcProperty(
			'com.lab126.powerd', 
			'preventScreenSaver'
		);
	}, 
	function(retVal) {
		document.write('preventScreenSaver is set to '+retVal+'<br>');
	}
);

//==============================================================================
// pillowHelper.RegisterStatusBarEventCallback 
// pillowHelper.UnRegisterStatusBarEventCallback 
//==============================================================================

//------------------------------------------------------------------------------
// Arguments 
//------------------------------------------------------------------------------

* appID has to be the id of the mesquite app currently running 
* callback has one argument which is the return value of the supplied function.
  Only RegisterStatusBarEventCallback has this argument

//------------------------------------------------------------------------------
// Information
//------------------------------------------------------------------------------

* IMPORTANT!, call pillowHelper.UnRegisterStatusBarEventCallback(appID)
  before exiting the app, or else dbus will complain. This is really IMPORTANT!
* Call this function once, it will call the supplied callback for ALL events
* Events most likely have to be defined in DBUS

//------------------------------------------------------------------------------
// Example
//------------------------------------------------------------------------------

pillowHelper.RegisterStatusBarEventCallback(
	'com.PaulFreund.WebLaunch', 
	function(value) 
	{
		document.write(JSON.stringify(value));
	}
);

// Later when you close the app, this is very IMPORTANT
pillowHelper.UnRegisterStatusBarEventCallback('com.PaulFreund.WebLaunch');

//==============================================================================
// pillowHelper.RequestStatusBarEvent 
//==============================================================================

//------------------------------------------------------------------------------
// Arguments 
//------------------------------------------------------------------------------

* appID has to be the id of the mesquite app currently running 
* eventAppID has to be the name of an app you want to catch events from
* eventID has to be the message name you want to catch

//------------------------------------------------------------------------------
// Information
//------------------------------------------------------------------------------

* This works only with a registered callback (RegisterStatusBarEventCallback)
* Events most likely have to be defined in DBUS

//------------------------------------------------------------------------------
// Example
//------------------------------------------------------------------------------

pillowHelper.RequestStatusBarEvent(
	'com.PaulFreund.WebLaunch', 
	'org.freedesktop.DBus', 
	'NameOwnerChanged'
);

//==============================================================================
// Additional information
//==============================================================================

//------------------------------------------------------------------------------
// Available nativeBridge methods ( from /usr/lib/libpillow.so )
//------------------------------------------------------------------------------

devcapInitialize, raiseChrome, dismissChrome, devcapGetInt, devcapIsAvailable,
accessHasharrayProperty, getIntLipcProperty, showDialog, setLipcProperty, 
logString, setIntLipcProperty, getOrientationValue, getDynamicConfigValue,
devcapGetString, getAppId, getStringLipcProperty, messagePillowCase, 
setWindowTitle, setWindowPosition, getWindowPosition, hideKb, showKb, 
setAcceptFocus, hideMe, showMe, setWindowSize, registerEventsWatchCallback,
subscribeToEvent, cancelPendingDismiss, registerClientParamsCallback, dismissMe,
clearFlashTrigger, createFlashTrigger, flash, redraw, logTime, logDbgNum, 
logDbg, dbgCmd

//------------------------------------------------------------------------------
// Tested methods with parameters
//------------------------------------------------------------------------------

* showMe() - Set the supplied pillow visible (useful for default_status_bar)
* hideMe() - Set the supplied pillow invisible (useful for default_status_bar)
* showKb() - Show the keyboard
* hideKb() - Hide the keyboard

* getIntLipcProperty(appID, propertyName)           - Returns a integer property
* getStringLipcProperty(appID, propertyName)        - Returns a string property
* setLipcProperty(appID, propertyName, valueString) - Set property with string
* setIntLipcProperty(appID, propertyName, valueInt) - Set proprety with int


* registerEventsWatchCallback(cb)   - Set a function that will be called 
                                      when a registered event fires, 
                                      first argument of callback gets value
* subscribeToEvent(appID, eventID)  - Add a event that triggers the function
								      supplied to registerEventsWatchCallback

* dbgCmd(command) - Execute command, mainly from 
                    /usr/share/webkit-1.0/pillow/debug_cmds.json

//------------------------------------------------------------------------------
// Notes
//------------------------------------------------------------------------------

Special thanks go to mobileread.com, especially silver18 and eureka for 
discovering a lot of the functionality I'm using

##############################################################################*/

var pillowHelper = {};

//==============================================================================
pillowHelper.Run = function(pillowID, appID, fkt, callback)
{
	//--------------------------------------------------------------------------
	// Get function string to use (supplied function object or string )
	var fktString = '';
	if( fkt && {}.toString.call(fkt) === '[object Function]' )
		fktString = fkt.toString();
	else
		fktString = "function(){" + fkt + "}";
		
	//--------------------------------------------------------------------------
	// Empty function, exit
	if( fktString === undefined || fktString.length <= 0 ) return;
	
	//--------------------------------------------------------------------------
	// Get a (at least a little bit) unique key
	var cmdKey = Math.floor((Math.random()*10000000000)).toString();

	//--------------------------------------------------------------------------
	// Build the command we send to pillow
	var cmdVal=	"nativeBridge.setLipcProperty('"+appID+"','"+cmdKey+"'," +
					"function(){" +
						"try{" +
							"return " + fktString + "().toString();" + 
						"}" +
						"catch(err){" + 
							"return err;" + 
						"}" +
					"}()" +
				");";
	
	//--------------------------------------------------------------------------
	// Strip all non-wanted whitespace characters from command
	//cmdVal = cmdVal.replace(/[\t\r\n]+/g, "");

	//--------------------------------------------------------------------------
	// Register event handler for the callback if callback is defined
	if( callback && {}.toString.call(callback) === '[object Function]' )
	{
		kindle.messaging.receiveMessage(cmdKey, function(message, value) 
		{ 
			callback(value); 
		});					
	}
	
	//--------------------------------------------------------------------------
	// Send pillow the message to execute supplied code
	kindle.messaging.sendMessage(
		'com.lab126.pillow', 
		'interrogatePillow', 
		{
			"pillowId": pillowID, 
			"function": cmdVal
		}
	);
}

//==============================================================================
pillowHelper.RegisterStatusBarEventCallback = function(appID, callback)
{
	kindle.messaging.receiveMessage(
		'persistantCallback', 
		function(message, value) 
		{
			callback(JSON.parse(value));
		}
	);
	
	pillowHelper.Run(
		'default_status_bar',
		appID,
		"\
			if( document.body.persistantCallback !== undefined ) \n\
				return; \n\
			\n\
			document.body.persistantCallback = function(a)\n\
			{\n\
				StatusBar.eventsCallback(a);\n\
				nativeBridge.setLipcProperty(\n\
					'" + appID + "',\n\
					'persistantCallback',\n\
					JSON.stringify(a)\n\
				);\n\
			};\n\
			nativeBridge.registerEventsWatchCallback(\n\
				document.body.persistantCallback\n\
			);\n\
		"
	);	
}

//==============================================================================
pillowHelper.UnRegisterStatusBarEventCallback = function(appID)
{
	pillowHelper.Run(
		'default_status_bar',
		appID,
		function()
		{
            // Set back to default handler 
            nativeBridge.registerEventsWatchCallback(StatusBar.eventsCallback); 	
			
			// Undefine our persistantCallback
			document.body.persistantCallback = undefined;
		}
	);	
}

//==============================================================================
pillowHelper.RequestStatusBarEvent = function(appID, eventAppID, eventID)
{
	pillowHelper.Run(
		'default_status_bar',
		appID,
		"nativeBridge.subscribeToEvent('" + eventAppID + "', '" + eventID + "');"
	);
}
