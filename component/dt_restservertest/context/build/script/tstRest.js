#!/usr/bin/env node

debugger

var Tst = require('./TstFrmwrk.js')

Test_RESTget.prototype = Object.create( Tst.Test.prototype);
Test_RESTget.prototype.constructor = Test_RESTget
function Test_RESTget (){
	Tst.Test.call(this);
	this.inputContext( { "inp" : { "hostRestServer": { "IP_URLaddress" : '172.17.0.134', "port":'8080'}}})
	this.command( new Tst.CmmdHTTPget())
	var cmmdelem = new Tst.CmmdElemVariable()
	cmmdelem.assertSpec(  'inp.hostRestServer.IP_URLaddress != null' ,'\'Required IP_URLaddress missing.\'',
						  'inp.hostRestServer.port != null'      	 ,'\'Required port missing.\'')
	cmmdelem.compileSpec( '\'http://\' + inp.hostRestServer.IP_URLaddress + \':\' + inp.hostRestServer.port')
	this.commandElemAdd( cmmdelem)
}

Test_Version.prototype = Object.create( Test_RESTget.prototype)
Test_Version.prototype.constructor = Test_Version
function Test_Version (){
	Test_RESTget.call(this)
	this.inputContext({ exp : { version :'"0.0.1"' }})
	this.commandElemAdd( new Tst.CmmdElemLiteral('/version'))
	this.assertOutputSpec( 'out.CmmdHTTPget.dataReturned == exp.version' ,'\'Version: \' + exp.version + \' doesn\\\'t match output of: \'+ out.CmmdHTTPget.dataReturned' )
	this.description( 'Verify REST version number.')
}

Test_ServiceList.prototype = Object.create( Test_RESTget.prototype)
Test_ServiceList.prototype.constructor = Test_ServiceList
function Test_ServiceList (){
	Test_RESTget.call(this)
	this.inputContext({ exp : { serviceList :'"[\\"firefox\\"]"' }})
	this.commandElemAdd( new Tst.CmmdElemLiteral('/q/listservices'))
	this.assertOutputSpec(	'out.CmmdHTTPget.dataReturned == exp.serviceList' ,'\'Service: \' + exp.serviceList + \' doesn\\\'t match output of: \'+ out.CmmdHTTPget.dataReturned' )
	this.description( 'Verify service list.')
}

Test_SubServiceList.prototype = Object.create( Test_RESTget.prototype)
Test_SubServiceList.prototype.constructor = Test_SubServiceList
function Test_SubServiceList (){
	Test_RESTget.call(this)
	this.inputContext({ exp : { serviceList :'"[\\"firefox.download\\"]"' }})
	this.commandElemAdd( new Tst.CmmdElemLiteral('/q/listsubservices/firefox'))
	this.assertOutputSpec(	'out.CmmdHTTPget.dataReturned == exp.serviceList' ,'\'Sub Service List of: \' + exp.serviceList + \' doesn\\\'t match output of: \'+ out.CmmdHTTPget.dataReturned' )
	this.description( 'Verify sub service list for \'firefox\'')
}

new Test_Version().execute()
.then( new Test_ServiceList().execute())
.then( new Test_SubServiceList().execute())
.done()
