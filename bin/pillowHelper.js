/*##############################################################################
// Run functions in the scope of a pillow application 
//##############################################################################

//------------------------------------------------------------------------------
// Arguments
//------------------------------------------------------------------------------

* appID has to be the id of the mesquite app currently running 
* fkt can be a string with javascript expressions or a real javascript function
* callback has one argument which is the return value of the supplied function

//------------------------------------------------------------------------------
// Warnings
//------------------------------------------------------------------------------

* Return values will be automatically converted to strings
* You can not access external variables inside the function supplied to fkt

//------------------------------------------------------------------------------
// Example
//------------------------------------------------------------------------------

runAsPillow(
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

// Pillow specific
* showMe() - Set the supplied pillow visible (useful for default_status_bar)
* hideMe() - Set the supplied pillow invisible (useful for default_status_bar)
* showKb() - Show the keyboard
* hideKb() - Hide the keyboard

// General
* getIntLipcProperty(appID, propertyName) 			- Returns a integer property
* getStringLipcProperty(appID, propertyName) 		- Returns a string property
* setLipcProperty(appID, propertyName, valueString) - Set property with string
* setIntLipcProperty(appID, propertyName, valueInt) - Set proprety with int

// Special
* dbgCmd(command)									- Execute command

//------------------------------------------------------------------------------
// Notes
//------------------------------------------------------------------------------
Special thanks go to mobileread.com, especially silver18 and eureka for 
discovering a lot of the functionality I'm using

##############################################################################*/

//==============================================================================
function runAsDefaultStatusBar(appID, fkt, callback)
{
	runAsPillow('default_status_bar', appID, fkt, callback);
}

//==============================================================================
function runAsPillow(pillowID, appID, fkt, callback)
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
