#!/usr/bin/env node
/**
 * @module TstFrmwrk
 */
var TstImpl = require('./TstFrmwrkImpl.js')
/**
 * Command Element represents either an entire command or some portion of it.  Slicing commands into smaller chunks permits 
 * assembling commands from common pieces.
 * 
 * @class CmmdElemModule
 * @constructor
 * 
 */
function CmmdElemModule ( thisOne) {
	this.cmmdElemThunk = thisOne
}
/**
 * Assertion Specification defines an Assert Expression and a Message to issue when the assertion fails.
 * See: {{#crossLink "AssertSpecList"}}{{/crossLink}}
 * 
 * @method assertSpec
 * @param {String} assertExpr  js conditional expression encapsulated within a String. 
 * @param {String} message     js expression, that when evaluated, returns a String. Encapsulated within a Sting. 
 * @param {String} [...]       N additional pairs of the above parameters.
 * @chainable
 * @example
 *     cmmdElemHTTP.assertSpec( 'context.hostRestServer.IP_URLaddress != null' ,'Required IP_URLaddress missing.',...)
 */
CmmdElemModule.prototype.assertSpec = function ( expression, message) {
	this.cmmdElemThunk.assertSpec.apply( this.cmmdElemThunk, arguments)
	return this
}
/**
 * Compile Specification defines an expression, containing any number of variables, that generates
 * a String representing some slice of a command string.  The variables are resolved within the
 * specified {{#crossLink "Context"}}{{/crossLink}} object and replaced by their values.
 * 
 * @method compileSpec
 * @param {String} compSpec    js expression containing variables, that when evaluated, returns a String.  Also encapsulated in a Sting. 
 * @chainable
 * @example
 *     cmmdElemHTTP.compileSpec( '\'HTTP://\' + context.hostRestServer.IP_URLaddress + \':\' + context.hostRestServer.port')
 */
CmmdElemModule.prototype.compileSpec = function ( jsExpr) {
	this.cmmdElemThunk.compileSpec.apply( this.cmmdElemThunk, arguments)
	return this
}

CmmdElemLiteralModule.prototype = Object.create( CmmdElemModule.prototype)
CmmdElemLiteralModule.prototype.constructor = CmmdElemLiteralModule
function CmmdElemLiteralModule ( constLiteral) {
	CmmdElemModule.call( this, new TstImpl.CmmdElemLiteral( constLiteral))
}
exports.CmmdElemLiteral = CmmdElemLiteralModule

CmmdElemVariable.prototype = Object.create( TstImpl.CmmdElem.prototype)
CmmdElemVariable.prototype.constructor=TstImpl.CmmdElemVariable
function CmmdElemVariable(){
	TstImpl.CmmdElem.call(this)
}

CmmdElemVariableModule.prototype = Object.create( CmmdElemModule.prototype)
CmmdElemVariableModule.prototype.constructor = CmmdElemVariableModule
function CmmdElemVariableModule () {
	CmmdElemModule.call( this, new TstImpl.CmmdElemVariable())
}
exports.CmmdElemVariable = CmmdElemVariableModule
/**
 * Command compiles one or more Command Elements {{#crossLink "CmmdElem"}}{{/crossLink}} to produce a command.
 * The command is then executed within a {{#crossLink "Context"}}{{/crossLink}}.  
 * Once the command completes, its captured output can be examined by
 * asserts to ensure it emits the expected values.
 * 
 * @class CmmdModule
 * @constructor
 * @param {cmmdElem} cmmdElemEntry    
 * @param {cmmdElem} [...]           N additional ones needed to fully define the command.
 * 
 */
function CmmdModule ( thisOne){
	this.cmmdThunk = thisOne
}
/**
 * Assertion Specification defines an Assert Expression and a Message to issue when the assertion fails.
 * See: {{#crossLink "AssertSpecList"}}{{/crossLink}}
 * 
 * @method assertSpec
 * @param {String} assertExpr  js conditional expression encapsulated within a String. 
 * @param {String} message     js expression, that when evaluated, returns a String. Encapsulated within a Sting. 
 * @param {String} [...]       N additional pairs of the above parameters.
 * @chainable
 * @example
 *     cmmdElemHTTP.assertSpec( 'context.hostRestServer.IP_URLaddress != null' ,'Required IP_URLaddress missing.',...)
 */
CmmdModule.prototype.assertOutputSpec = function ( expression, message) {
	return this.cmmdThunk.assertOutputSpec.apply( this.cmmdThunk, arguments)
}
/**
 * Provide the list of {{#crossLink "CmmdElem"}}{{/crossLink}} needed to generate the full
 * command.  The initial list element represents the leftmost command fragment while the tail ones 
 * produce the rightmost fragments.
 * 
 * @method cmmdElemSpec
 * @param  {CmmdElem} cmmdElem  Leftmost command fragment.
 * @param  {CmmdElem} [...]     N additional fragments required to produce entire command.
 * @chainable
 *   
 *
 */
CmmdModule.prototype.cmmdElemSpec = function( cmmdElem){
	return this.cmmdThunk.cmmdElemSpec.apply( this.cmmdThunk, arguments)
}

CmmdHTTPgetModule.prototype = Object.create( CmmdModule.prototype)
CmmdHTTPgetModule.prototype.constructor = CmmdHTTPgetModule
function CmmdHTTPgetModule(){
	CmmdModule.call( this, new TstImpl.CmmdHTTPget())	
}
exports.CmmdHTTPget = CmmdHTTPgetModule

function TestModule(){
	this.testThunk = new TstImpl.Test()
	this.name( this.constructor.name)
}
exports.Test = TestModule

TestModule.prototype.name = function ( testName){
	this.testThunk.name = testName
	return this
}
TestModule.prototype.description = function ( testDescription){
	this.testThunk.description = testDescription
	return this
}
TestModule.prototype.command = function ( cmmd){
	this.testThunk.command( cmmd.cmmdThunk)
	return this
}
TestModule.prototype.commandElemAdd = function ( cmmdElem){
	var cmmdElemlist=[]
	Array.prototype.forEach.call( arguments, function ( cmmdElemModule, index){
		cmmdElemlist.push( cmmdElemModule.cmmdElemThunk )
	})
	this.testThunk.commandElemAdd.apply( this.testThunk, cmmdElemlist)
	return this
}
TestModule.prototype.inputContext = function ( context) {
	this.testThunk.inputContext.apply( this.testThunk, arguments)
	return this
}
TestModule.prototype.execute = function (){
	return this.testThunk.execute()
}
TestModule.prototype.assertOutputSpec = function ( assertSpec) {
	this.testThunk.assertOutputSpec.apply( this.testThunk, arguments)
	return this
}