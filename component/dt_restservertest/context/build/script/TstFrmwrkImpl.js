#!/usr/bin/env node
/**
 * @module TrtFrmwrkImpl
 */
/**
 * 
 *@class Context
 */

/**
 * Assertion Specification List maintains an array of Assert Specifications.  An Assert Specification 
 * consist of an Assert Expression and corresponding Message to issue when the assertion fails.
 * An Assertion Expression typically compares a variable's value, using a conditional operator, to either
 * a constant or other variable value. To acquire a variable's value, the variable expressions reference
 * a {{#crossLink "Context"}}{{/crossLink}} object.
 * 
 * Since an Assertion Specification List typically validates the expected variable values of either
 * a concrete or conceptual object type, it usually exists embedded in this object type.  Therefore,
 * invocation to its methods are forwarded by 'thunk' functions defined by the object that includes it.  
 * 
 * @class AssertSpecList
 * @constructor
 * @private
 *  
 */
function AssertSpecList () {
  this.assertExpressSpecList=[]
  this.assertMessageSpecList=[]  
  this.amalgamTypeName = ''
}
exports.AssertSpecList = AssertSpecList
/**
 * Validate the elements of Assertion Specification List to ensure they contain complete 
 * Assert Specifications.  Once validated retain this list for use by the
 * {{#crossLink "AssertSpecList/apply:method"}}{{/crossLink}} function.
 * 
 * Assumes caller simply forwards its arguments.  Therefore, the arguments["0"] contains forwarded
 * Assertion Specification List.
 * 
 * @method specify
 * @param {String} typeName     Name of the object providing the Assert Specification.
 * @param {arguments} argList   Pass the original arguments array as second argument. 
 * @example
 * @chainable
 *     specify( 'cmmdElemHTTP', arguments)
 */
AssertSpecList.prototype.specify = function ( typeName, argList) {
  this.amalgamTypeName=typeName
  console.assert( argList.length % 2 == 0, 'Type: \'' + this.amalgamTypeName + '\': Assert spec missing message for expression: \'' + argList[argList.length-1] + "'." )
  Array.prototype.forEach.call( argList, function (assertElem, index){
      if ( (( index + 1) % 2) != 0) { 
    	  this.assertExpressSpecList.push( assertElem)
      } else {
    	  this.assertMessageSpecList.push( assertElem)
      }
  }.bind(this))
  return this
}
/**
 * Apply assert expressions defined by the Assertion Specification within the given {{#crossLink "Context"}}{{/crossLink}}.
 * 
 * @method apply
 * @param {Object} context    An object whose property and prototype trees can be used to resolve the variables 
 * specified by the Assertion Specification and Compile Specification.
 * @chainable
 * 
 */
AssertSpecList.prototype.apply = function ( context) {
  var assertExpress = ''
  Array.prototype.forEach.call( this.assertExpressSpecList, function (assertElem, index){
	  //assertExpress += 'console.assert('+ assertElem + ',"Type: \'' + this.amalgamTypeName + "': " + this.assertMessageSpecList[index] + '"); '
	  var typeNameEx='\'Type: ' + this.amalgamTypeName + ': \''
	  assertExpress += 'console.assert('+ assertElem + ',' + typeNameEx + ' + ' + this.assertMessageSpecList[index] + ');'
	  }.bind(this))
  var withFun = function (){
	  with (this) {
		  eval( assertExpress)			  
	  }
  }.bind(context)
  withFun()
  return this
}
/**
 * Manage the creation of a single {{#crossLink "Context"}}{{/crossLink}} from multiple independent
 * ones and the reversion of this single aggregate, back to its constituent independent
 * Context instances. To produce the single context, the initially independent ones are linked
 * together by manipulating their *Object __proto__* properties forging individual context chains
 * into a single one. This chain can then be used by javascript's Context resolution mechanism to
 * locate properties (data and associated methods).
 * 
 * @class ContextChain
 * @constructor
 *  
 */
function ContextChain(){
	this.contextLastProtoList=[]

}
/**
 * Create a single resolution Context by chaining the supplied independent Contexts.
 * The position of an independent Context within the produced chain mirrors
 * it's location in the argument list and determines the order in which javascript
 * visits each link when attempting to resolve a property name.  The leftmost or
 * first Context argument represents the first link in the chain and is also the
 * first object searched by javascript's name resolution mechanism while 
 * the rightmost Context argument represents the last chain link/final context 
 * inspected by javascript.
 * 
 * **Note the supplied Context arguments must not share an identical *__proto__* instance,
 * However, if they do, the V8 engine will detect a cycle and throw an error.**
 *  
 * @method couple
 * @param  {Context} context     Specify a javascript object whose property and prototype linkages will become
 * a link in the resultant chain.  The object's __proto__ chain must ultimately derive from
 * an instance of the javascript *Object*.
 * @param  {Context} [...]       N additional Contexts.
 * @return {Context}  Resultant aggregated chained Context.
 * 
 */
ContextChain.prototype.couple = function( context){
	var contextChain = arguments
	Array.prototype.forEach.call( arguments, function (context, index){
		if ( index + 1 < contextChain.length){
			// index + 1 apply the follow to all but the last element 
			var contextCur = rootContextFind( context)
			this.contextLastProtoList.push( contextCur)
			// add the next context to the end of the prior's chain
			Object.setPrototypeOf(contextCur.contextLast, contextChain[String(index + 1)]);
		}
	}.bind(this))
	return context
}
/**
 * Sever the links between the individual Contexts restoring their 
 * original *__proto__* link.  Also, delete the restore state, so this
 * same object can be used to manage another chain.
 * 
 * @method decouple
 * @chainable 
 * 
 */
ContextChain.prototype.decouple = function(){
	this.contextLastProtoList.forEach( function ( contextElem, index){
		Object.setPrototypeOf( contextElem.contextLast, contextElem.lastObject)
	});
	//  delete restore state
	this.contextLastProtoList.length = 0
	return this
}
/**
 * Provide a wrapping function to atomically construct a Context chain,
 * run the provided callback using this Context, and then decouple 
 * the links forged between these contexts restoring them to their 
 * original state.
 *  
 * @method runWithChain
 * @param  {function} callback   A function expecting the chained Context as its *this*.
 * @param  {Context} context     Specify a javascript object whose property and prototype linkages will become
 * a link in the resultant chain.  The object's *__proto__* chain must ultimately derive from
 * an instance of the javascript *Object*.
 * @param  {Context} [...]       N additional Contexts.
 * @chainable
 * 
 */
ContextChain.prototype.runWithChain = function ( callback, context){
	var contextChain = Array.prototype.slice.call( arguments, 1)
	callback.call(this.couple.apply(this, contextChain))
	this.decouple()
}
/**
 * Given a javascript object ({{#crossLink "Context"}}{{/crossLink}}) walk
 * its *__proto__* chain until detecting it's javascript *Object* reference.  Remember 
 * the *__proto__* location that referred to *Object*, as well as the reference to
 * this *Object* instance. As this becomes the location to splice/append a desired
 * Context.
 *  
 * @static rootContextFind
 * @param  {Context} context A javascript Object whose *__proto__* chain must ultimately derive from
 * an instance of the javascript *Object*.
 * @return {Object}          Contains an object reference to the last non-Object *__proto__* and
 * a reference to the originally associated *Object* instance. 
 * 
 */
function rootContextFind( context){
	var contextLast= context
	var protoCur   = Object.getPrototypeOf( context)
	var objectRoot = new Object()
	while ( protoCur != null) {
		var protoNext  = Object.getPrototypeOf( protoCur)
		if ( protoCur.isPrototypeOf(objectRoot)){
			return { contextLast: contextLast, lastObject: protoCur}
		}
		contextLast = protoCur
		protoCur    = protoNext
	}
	throw new Error('A context must ultimately be prototyped from Object.  Context: \'' + context + '\' lacks Object prototype.')
}

/*
function ContextChainTest(){
	function test_ConcatenateSeparateContexts(){
		function Context(){
			this.contextProp = { embeded: 'value'}
		}
		Telemetry.prototype = new Context()
		Telemetry.prototype.constructor = Telemetry
		function Telemetry() {}
		
		CAR.prototype.constructor = CAR
		function CAR(){
			this.color='color'
		}
		var telemetry    = new Telemetry ()
		var car          = new CAR()
		var contextChain = new ContextChain()
	    //  Contexts are separated :: should be undefined
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' before concatenation.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' before concatenation.')
		contextChain.couple( telemetry, car)
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after concatenation.')
		console.assert( telemetry.color == 'color', 'Context \'telemetry\' should contain \'color\' after concatenation.')
	    var contextChain2 = new ContextChain()
		contextChain2.decouple()
		contextChain.decouple()
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after decoupling.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' after decoupling.')
		}
	function test_ConcatenateIntersectingContexts(){
		function Context(){
			this.contextProp = { embeded: 'value'}
		}
		Telemetry.prototype = new Context()
		Telemetry.prototype.constructor = Telemetry
		function Telemetry() {}

		// Share same Context prototype
		CAR.prototype = Telemetry.prototype
		CAR.prototype.constructor = CAR
		function CAR(){
			this.color='color'
		}
		var telemetry    = new Telemetry ()
		var car          = new CAR()
		var contextChain = new ContextChain()
	    //  Contexts are separated :: should be undefined
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' before concatenation.')
		console.assert( car.contextProp.embeded == 'value', 'Context \'car\' should contain \'contextProp.embeded\' before concatenation.')
		try {
			contextChain.couple( telemetry, car)
		}
		catch (errMsg){
			if ( errMsg != 'Error: Cyclic __proto__ value'){
				throw errMsg
			}
		}
	}
	function test_ConcatenateObjectLiterals(){
		var contextChain = new ContextChain()
	    //  Contexts are separated :: should be undefined
		contextChain.couple( { literalObj1 : 'literalObj1'}, { literalObj2 : 'literalObj2'} )
		contextChain.decouple()
	}
	function test_runWithChain(){
		function Context(){
			this.contextProp = { embeded: 'value'}
		}
		Telemetry.prototype = new Context()
		Telemetry.prototype.constructor = Telemetry
		function Telemetry() {}
		
		CAR.prototype.constructor = CAR
		function CAR(){
			this.color='color'
		}
		var telemetry    = new Telemetry ()
		var car          = new CAR()
		var contextChain = new ContextChain()
	    //  Contexts are separated :: should be undefined
		
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' before concatenation.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' before concatenation.')
		contextChain.runWithChain( function () {
			with (this) {
				console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after concatenation.')
				console.assert( telemetry.color == 'color', 'Context \'telemetry\' should contain \'color\' after concatenation.')
				}
			}, telemetry, car)
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after decoupling.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' after decoupling.')
	}
	test_ConcatenateSeparateContexts()
	test_ConcatenateIntersectingContexts()
	test_ConcatenateObjectLiterals()
	test_runWithChain()
	
	//var contextObjNot = new ContextChain()
	//contextObjNot.couple( String("ab"))
}
ContextChainTest()
*/
/**
 * Command Element represents either an entire command or some portion of it.  Slicing commands into smaller chunks permits 
 * assembling commands from common pieces.
 * 
 * @class CmmdElem
 * @constructor
 * 
 */
function CmmdElem () {
	this.assertSpecComp = new AssertSpecList()
	this.compileExpr    = ''
	this.cmmdElemName   = ''
}
exports.CmmdElem = CmmdElem
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
CmmdElem.prototype.assertSpec = function ( expression, message) {
	CmmdElemImpl.prototype.assertSpec.apply(this, arguments)
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
CmmdElem.prototype.compileSpec = function ( jsExpr ) {
	CmmdElemImpl.prototype.compileSpec.apply(this, arguments)
	return this
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
CmmdElem.prototype.assertSpec = function ( expression, message) {
this.assertSpecComp.specify( this.constructor.name, arguments)
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
CmmdElem.prototype.compileSpec = function ( jsExpr ) {
this.compileExpr = jsExpr
return this
}
/**
* First, validate variables referenced by the Compile Specification using the assert expressions
* defined by the Assertion Specification (see: {{#crossLink "AssertSpecList"}}{{/crossLink}}).
* Next, generate a command slice by resolving and replacing the variables that exist in the
* Compile Specification.
* 
* @method compile
* @param {Context} context An object whose property tree can be used to resolve the variables 
* specified by the Assertion Specification and Compile Specification.
* @return {String}         A string representing all or part of a command. 
* 
*/
CmmdElem.prototype.compile = function ( context) {
this.assertSpecComp.apply( context)
var withFun = function ( compileExpr){
	with (this) {
		return eval( compileExpr)
	}
}.bind(context)
return withFun( this.compileExpr)
}


/**
 * Command Element that's a simple constant literal.
 * 
 * @class CmmdElemConstLit
 * @constructor
 * 
 */
CmmdElemLiteral.prototype = Object.create( CmmdElem.prototype) 
CmmdElemLiteral.prototype.constructor=CmmdElemLiteral
function CmmdElemLiteral ( constLiteral) {
	CmmdElem.call(this)
	this.compileSpec( constLiteral)
}
exports.CmmdElemLiteral = CmmdElemLiteral
/**
 * Assertion Specification unnecessary for constant literal values.
 * 
 * @method assertSpec
 * @private 
 */
CmmdElemLiteral.prototype.assertSpec = function ( expression, message) {
  throw new Error( 'Assertions not supported for constant literals.')
}
/**
  * Constant literals do not require validation nor evaluation :: the
  * semantics of 'compile' simply reflect the value of the string.
  * 
  * @method compile
  * @param {Context} context In the case of a literal string, 'context' has
  * no meaning.
  * @return {String}         Return the provided literal string. 
  * 
  */
CmmdElemLiteral.prototype.compile = function ( context) {
	return this.compileExpr
}
/**
 * HTTP Command Element validates and produces the protocol, host name server address and port needed to communicate with the
 * Meta Service Rest server embedded in a container.
 * 
 * @class CmmdElemVariable
 * @constructor
 * @extends CmmdElem
 * 
 */


CmmdElemVariable.prototype = Object.create( CmmdElem.prototype)
CmmdElemVariable.prototype.constructor=CmmdElemVariable
function CmmdElemVariable(){
	CmmdElem.call(this)
}
exports.CmmdElemVariable = CmmdElemVariable

function Cmmd (){
	this.cmmdElemList     = []
	this.assertSpecOutput = new AssertSpecList()
}
exports.Cmmd = Cmmd
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
Cmmd.prototype.assertOutputSpec = function ( expression, message) {
	this.assertSpecOutput.specify( this.constructor.name, arguments)
	return this
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
Cmmd.prototype.cmmdElemSpec = function( cmmdElem){
	Array.prototype.forEach.call( arguments, function ( cmmdElem, index){
		this.cmmdElemList.push( cmmdElem)
	}.bind(this))
	return this
}
/**
 * Run the compile function for each {{#crossLink "CmmdElem"}}{{/crossLink}} used to generate the full
 * command.  The initial list element represents the leftmost command fragment while the tail ones 
 * produce the rightmost fragments.
 * 
 * @private
 * @method compile
 * @param  {Context} context 
 * @return {String}  A complete command. 
 *
 */
Cmmd.prototype.compile = function ( contextIn) {
	var cmmdStr = ''
	this.cmmdElemList.forEach( function ( cmmdElem, index, arrayobj){
		cmmdStr = cmmdStr + cmmdElem.compile( contextIn);
	})
  return cmmdStr
}
/**
 * Run the command within the provided {{#crossLink "Context"}}{{/crossLink}}.  Running the command
 * compiles each {{#crossLink "CmmdElem"}}{{/crossLink}}, executes the command capturing its
 * output, and runs a set of asserts on the outputs.  Promises are used to coordinate the 
 * potentially asynchronous command execution with application of asserts applied to the outputs.
 * 
 * Promises are also returned by this method to permit coordination between other potentially 
 * asynchronous processes known to the caller. 
 *  
 * @method execute
 * @param  {Context}   contextIn   An object whose this context will be used to resolve command variables.
 * @param  {Telemetry} contextOut  An object recording the output generated by the command.
 * @return {Promise}             A means of coordinating other actions dependent on the successfull execution of the command. 
 *
 */
Cmmd.prototype.execute = function ( contextIn, telemetry) {
	return this.executeit( this.compile( contextIn), contextIn, telemetry)
	.then( function (telemetry) {
		this.assertOutput( contextIn, telemetry)
		return telemetry
	}.bind(this), console.log)
}
/**
 * Forward command execution to the derived object that knows how to run the generated command and capture its output.
 * 
 * @protected
 * @method executeit
 * @param  {String}  cmmd        A fully formed 'command' that can be executed by a derived object.
 * Note, contextIn unnecessary because cmmd parameter produce by {{#crossLink "Cmmd/compile:method"}}{{/crossLink}} completely generates the executable string using contexIn 
 * @param  {Context} contextOut  An object recording the output generated by the command.
 * @return {Promise}             Use to initiate execution of dependent functions.
 */
Cmmd.prototype.executeit = function ( cmmd, contextIn, telemetry) {
  console.assert( false, 'Type: \'' + this.constructor.name + '\': Forgot to override: \'executeit\'.' )		  
}
/**
 * Run one or more asserts on the command's recorded output.
 * 
 * @private
 * @method assertOutput
 * @param  {Context} contextIn   An object whose this context will be used to resolve command variables.
 * @param  {Context} contextOut  An object recording the output generated by the command.
 *
 */
Cmmd.prototype.assertOutput = function( contextIn, telemetry) {
	var contextChain = new ContextChain()
	this.assertSpecOutput.apply( contextChain.couple( telemetry, contextIn))
	contextChain.decouple()
}
/**
 * Records object context at moment of measurement, along with metric name and its value.  This data
 * can itself be converted into an object ({{#crossLink "Context"}}{{/crossLink}}) for further processing.
 * 
 * @class Telemetry
 * @constructor
 * 
 */
function Telemetry(){
}
/**
 * Record the execution context, metric name, and metric value of one or more activities.
 * 
 * The implementation of this method obtains the passed context's
 * constructor name and creates an object within ```Telemetry's``` context using this name.
 * It will then create a new or overlay an existing property of this sub object
 * that corresponds to the provided ```metricName``` with the reading assigned to ```value```. 
 * 
 * Suggest extending object using [Chain-of-responsibility pattern](https://en.wikipedia.org/wiki/Chain-of-responsibility_pattern)
 * when the following simple default behavior becomes insufficient.
 * 
 * @method record
 * @chainable
 * @param  {Context} contextThis The current Context used when running this command.
 * @param  {String}  metricName  Label assigned to the captured data.
 * @param  {mixed}   value       The metric's value at the moment of invocation.
 * @return {Telemetry}           Updated ```Telemetry``` context.
 *
 */
Telemetry.prototype.record = function( contextThis, metricName, value){
	// establish out namespace in Context
	this.out = typeof this.out == 'undefined' ? new Object() : this.out
	var nameSpace = this.out
	var typeName  = contextThis.constructor.name
	nameSpace[typeName] = typeof nameSpace[typeName] == 'undefined' ? new Object() : nameSpace[typeName]
	var objectSub = nameSpace[typeName]
	objectSub[metricName] = value
	return this
}
/**
 * Produce a {{#crossLink "Context"}}{{/crossLink}} with the recorded ```Telemetry```.
 * 
 * @method contextCreate
 * @return {Context}        This implementation returns an updated ```Telemetry``` context.
 * **Note: Since this is only a reference, the returned Context will change if
 * additional ```Telemetry``` is recorded.**  
 * 
 *
 */
Telemetry.prototype.contextCreate = function(){
	return this
}

var Q = require('q')

var HTTP = require( 'http')
/**
 * Performs an HTTP get operation and records the data generated in response
 * to it.
 * 
 * @class CmmdHTTPget
 * @constructor
 * @extends Cmmd
 * 
 */
CmmdHTTPget.prototype = Object.create( Cmmd.prototype)
CmmdHTTPget.prototype.constructor = CmmdHTTPget
function CmmdHTTPget() {
	Cmmd.call(this)
	this.deferred = Q.defer()
}
exports.CmmdHTTPget = CmmdHTTPget
/**
 * Performs an HTTP get operation and records the data generated in response
 * to it.
 * 
 * @private
 * @method executeit
 * @param {String}     cmmdstr     Represents a complete http get request.
 * @param {Telemetry}  telemetry   Object that records response generated by the get request.
 * 
 */
CmmdHTTPget.prototype.executeit = function ( cmmdstr, contextIn, telemetry) {
	try {
	var selfThis = this
	HTTP.get( cmmdstr, function ( res) { 
		var dataReturned = ''
		res.on( 'data', function ( chunk) {
			dataReturned += chunk
		})
		res.on( 'end',  function () {
			telemetry.record( selfThis, 'dataReturned', dataReturned)
			selfThis.deferred.resolve( telemetry)
		})
		res.on( 'error',function ( edata) {
			console.assert( false, 'Type: \'' + selfThis.constructor.name + '\': ' + edata)
			selfThis.deferred.reject( edata)
		})
	})
	} catch ( err){
		selfThis.deferred.reject( err)		
	}
	return this.deferred.promise
}

function Test (){
	this.name              = null 
	this.description       = null
	this.cmmd              = null
	this.contextInput      = null
	this.assertOutput      = null
}
exports.Test = Test

Test.prototype.command = function ( cmmd){
	this.cmmd = cmmd
	return this
}
Test.prototype.commandElemAdd = function ( cmmdElem){
	this.cmmd.cmmdElemSpec.apply( this.cmmd, arguments)
	return this
}
Test.prototype.inputContext = function ( context) {
	if ( this.contextInput == null){
		this.contextInput = []
	}
	Array.prototype.forEach.call( arguments, function (context, index){
			this.contextInput.push( context)
		}.bind(this))
	return this
}
Test.prototype.assertOutputSpec = function ( assertSpec) {
	this.assertOutput = Array.prototype.slice.call( arguments, 0)
	return this
}
Test.prototype.inputContextChainForge = function ( context){
	if ( this.contextInput.length > 1){
		//  something to chain.
		this.contextChain = new ContextChain()
		return this.contextChain.couple.apply( this.contextChain, this.contextInput)
	}
	//  nothing to chain simply return original context.
	return this.contextInput
}
Test.prototype.inputContextChainDecouple = function (){
	if ( this.contextInput.length > 1){
		//  a chain that needs decoupling
		this.contextChain.decouple()
	}
}
Test.prototype.informStart = function () {
	this.inform( 'Starting','Description: \''+this.description + '\'')
	return this
}
Test.prototype.informEndSucceed = function () {
	this.inform( 'Successful');
}
Test.prototype.informEndFailure = function ( err) {
	this.inform( 'Failed', err.stack);
	throw err;
}
Test.prototype.inform = function ( status, other) {
	var mess = 'Inform: Test: \'' + this.name + '\' Status: \''+ status + '\'.'
	if ( typeof other != 'undefined') { mess += ' ' + other;}
	console.log( mess);
}	
Test.prototype.verify = function () {
	console.assert( this.name != null						, 'Supply Test name.')
	console.assert( this.description != null				, 'Supply Test description.')
	console.assert( this.cmmd instanceof Cmmd				, 'Supplied command is of type: \'' + typeof this.cmmd  + '\' must be derived from: \'Cmmd\'')
	console.assert( this.contextInput instanceof Object		, 'Supplied input context is of type: \'' + typeof this.contextInput    + '\' must be derived from: \'Object\'')
	console.assert( Array.isArray(this.assertOutput)		, 'Supply assertions applied to Test command\'s output')
	this.cmmd.assertOutputSpec.apply(this.cmmd, this.assertOutput)
}
Test.prototype.execute = function () {
	this.informStart()
	this.verify();
	var contextInput = this.inputContextChainForge()
	var telemetry = new Telemetry()
	return this.cmmd.execute( contextInput, telemetry)
		.then( function ( telemetry) {
			this.inputContextChainDecouple()
			this.informEndSucceed()
			return telemetry;
		}.bind(this), function ( err){
			this.informEndFailure( err)
		}.bind(this))
}