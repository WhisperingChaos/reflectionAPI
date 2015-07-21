#!/usr/bin/env node

debugger
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
 *  
 */
function AssertSpecList () {
  this.assertExpressSpecList=[]
  this.assertMessageSpecList=[]  
  this.amalgamTypeName = ''
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
  }
  /**
   * Apply assert expressions defined by the Assertion Specification within the given {{#crossLink "Context"}}{{/crossLink}}.
   * 
   * @method apply
   * @param {Object} context    An object whose property and prototype trees can be used to resolve the variables 
   * specified by the Assertion Specification and Compile Specification.
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
  }
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
	   * @method concatenate
	   * @param  {Context} context     Specify a javascript object whose property and prototype linkages will become
	   * a link in the resultant chain.  The object's __proto__ chain must ultimately derive from
	   * an instance of the javascript *Object*.
	   * @param  {Context} [...]       N additional Contexts.
	   * @return {Context}  Resultant aggregated chained Context.
	   * 
	   */
	ContextChain.prototype.concatenate = function( context){
		var contextChain = arguments
		Array.prototype.forEach.call( arguments, function (context, index){
			if ( index + 1 < contextChain.length){
				// index + 1 apply the follow to all but the last element 
				var contextCur = findEnd( context)
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
	   * @method disconnect
	   * @chainable 
	   * 
	   */
	ContextChain.prototype.disconnect = function(){
		this.contextLastProtoList.forEach( function ( contextElem, index){
			Object.setPrototypeOf( contextElem.contextLast, contextElem.lastObject)
		});
		//  delete restore state
		this.contextLastProtoList.length = 0
		return this
	}
	  /**
	   * Provide a wrapping function to atomically construct a Context chain,
	   * run the provided callback using this Context, and then disconnect 
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
		callback.call(this.concatenate.apply(this, contextChain))
		this.disconnect()
	}
	  /**
	   * Given a javascript object ({{#crossLink "Context"}}{{/crossLink}}) walk
	   * its *__proto__* chain until detecting it's javascript *Object* reference.  Remember 
	   * the *__proto__* location that referred to *Object*, as well as the reference to
	   * this *Object* instance. As this becomes the location to splice/append a desired
	   * Context.
	   *  
	   * @static findEnd
	   * @param  {Context} context A javascript Object whose *__proto__* chain must ultimately derive from
	   * an instance of the javascript *Object*.
	   * @return {Object}          Contains an object reference to the last non-Object *__proto__* and
	   * a reference to the originally associated *Object* instance. 
	   * 
	   */
	function findEnd( context){
		var contextLast      = Object.getPrototypeOf( context)
		var contextLastProto = contextLast
		var lastObject       = new Object()
		while ( contextLastProto != null) {
			if ( contextLastProto.isPrototypeOf(lastObject)){
				return { contextLast: contextLast, lastObject: contextLastProto}
			}
			contextLast = contextLastProto
			contextLastProto = Object.getPrototypeOf( contextLast);
		}
		throw new Error('A context must ultimately be prototyped from Object.  Context: \'' + context + '\' lacks Object prototype.')
	}
}
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
  this.compileSpec
  /**
   * Assertion Specification defines an Assert Expression and a Message to issue when the assertion fails.
   * See: {{#crossLink "AssertSpecList"}}{{/crossLink}}
   * 
   * @method assertSpec
   * @param {String} assertExpr  js conditional expression encapsulated within a String. 
   * @param {String} message     js expression, that when evaluated, returns a String. Encapsulated within a Sting. 
   * @param {String} [...]       N additional pairs of the above parameters.
   * @example
   *     cmmdElemHTTP.assertSpec( 'context.hostRestServer.IPAddress != null' ,'Required IPAddress missing.',...)
   */
  CmmdElem.prototype.assertSpec = function ( expression, message) {
	  this.assertSpecComp.specify( this.constructor.name, arguments)
  }
  /**
   * Compile Specification defines an expression, containing any number of variables, that generates
   * a String representing some slice of a command string.  The variables are resolved within the
   * specified {{#crossLink "Context"}}{{/crossLink}} object and replaced by their values.
   * 
   * @method compileSpec
   * @param {String} compSpec    js expression containing variables, that when evaluated, returns a String.  Also encapsulated in a Sting. 
   * @example
   *     cmmdElemHTTP.compileSpec( '\'HTTP://\' + context.hostRestServer.IPAddress + \':\' + context.hostRestServer.port')
   */
  CmmdElem.prototype.compileSpec = function ( expressionString ) {
      this.compileSpec = expressionString
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
	  var withFun = function ( compileSpec){
		  with (this) {
		      return eval( compileSpec)
		  }
	  }.bind(context)
	  return withFun( this.compileSpec)
  }
}
/**
 * HTTP Command Element validates and produces the protocol, host name server address and port needed to communicate with the
 * Meta Service Rest server embedded in a container.
 * 
 * @class CmmdElemHTTP
 * @constructor
 * @extends CmmdElem
 * 
 */
CmmdElemHTTP.prototype = new CmmdElem()
function CmmdElemHTTP(){
}
CmmdElemHTTP.prototype.constructor=CmmdElemHTTP

var Q = require('q')

/**
 * Command compiles one or more Command Elements {{#crossLink "CmmdElem"}}{{/crossLink}} to produce a command.
 * The command is then executed within a {{#crossLink "Context"}}{{/crossLink}}.  
 * Once the command completes, its captured output can be examined by
 * asserts to ensure it emits the expected values.
 * 
 * @class Cmmd
 * @constructor
 * @param {cmmdElem} cmmdElemEntry    
 * @param {cmmdElem} [...]           N additional ones needed to fully define the command.
 * 
 */
function Cmmd (){
  this.cmmdElemList     = []
  this.assertSpecOutput = new AssertSpecList()  
  /**
   * Assertion Specification defines an Assert Expression and a Message to issue when the assertion fails.
   * See: {{#crossLink "AssertSpecList"}}{{/crossLink}}
   * 
   * @method assertSpec
   * @param {String} assertExpr  js conditional expression encapsulated within a String. 
   * @param {String} message     js expression, that when evaluated, returns a String. Encapsulated within a Sting. 
   * @param {String} [...]       N additional pairs of the above parameters.
   * @example
   *     cmmdElemHTTP.assertSpec( 'context.hostRestServer.IPAddress != null' ,'Required IPAddress missing.',...)
   */
  Cmmd.prototype.assertOutputSpec = function ( expression, message) {
	  this.assertSpecOutput.specify( this.constructor.name, arguments)
  }
  /**
   * Provide the list of {{#crossLink "CmmdElem"}}{{/crossLink}} needed to generate the full
   * command.  The initial list element represents the leftmost command fragment while the tail ones 
   * produce the rightmost fragments.
   * 
   * @method cmmdElemSpec
   * @param  {CmmdElem} cmmdElem  Leftmost command fragment.
   * @param  {CmmdElem} [...]     N additional fragments required to produce entire command.
   *   
   *
   */
  Cmmd.prototype.cmmdElemSpec = function( cmmdElem){
	  Array.prototype.forEach.call( arguments, function ( cmmdElem, index){
		  this.cmmdElemList.push( cmmdElem)
	  }.bind(this))
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
    var cmmdStr=''
    	this.cmmdElemList.forEach( function (cmmdElem, index, arrayobj){
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
	  var promise = this.executeit( this.compile( contextIn), contextIn, telemetry)
	  return promise.then( function (telemetry) {
    	  this.assertOutput( contextIn, telemetry)
    	  }.bind(this), console.log)
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
	  this.assertSpecOutput.apply( contextChain.concatenate( telemetry, contextIn))
	  contextChain.disconnect()
  }
  /**
   * Forward command execution to the derived object that knows how to run the generated command and capture its output.
   * 
   * @protected
   * @method executeit
   * @param  {String}  cmmd        A fully formed 'command' that can be executed by a derived object.
   * Note, contextIn unnecessary because cmmd parameter produce by {{#crossLink "Cmmd/compile:method"}}{{/crossLink}} completely generates the executable string using contexIn 
   * @param  {Context} contextOut  An object recording the output generated by the command.
   *
   */
  Cmmd.prototype.executeit = function ( cmmd, contextIn, telemetry) {
      console.assert( false, 'Type: \'' + this.constructor.name + '\': Forgot to override: \'executeit\'.' )
  }
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
}
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
CmmdHTTPget.prototype = new Cmmd ()
CmmdHTTPget.prototype.constructor=CmmdHTTPget
function CmmdHTTPget() {
	this.deferred = Q.defer()
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
		var selfThis = this
		HTTP.get( cmmdstr+"/version", function ( res) { 
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
				selfThis.deferred.reject(edata)
			})
		})
		return this.deferred.promise
	}
}
var cmmdelem = new CmmdElemHTTP()
cmmdelem.assertSpec( 'inp.hostRestServer.IPAddress != null' ,'\'Required IPAddress missing.\'',
                     'inp.hostRestServer.port != null'      ,'\'Required port missing.\'')
cmmdelem.compileSpec( '\'http://\' + inp.hostRestServer.IPAddress + \':\' + inp.hostRestServer.port')

var x={ "inp" : { "hostRestServer": { "IPAddress" : '172.17.0.91', "port":'8080'}}, "exp" : { "version" : '"0.0.1"'}}

var cmmd = new CmmdHTTPget()
cmmd.cmmdElemSpec( cmmdelem)
cmmd.assertOutputSpec(	'out.CmmdHTTPget.dataReturned == exp.version' ,'\'Version doesn\\\'t match output of: \'+ out.CmmdHTTPget.dataReturned' )
var telemetry = new Telemetry()
cmmd.execute( x, telemetry).done()

function Test (){
	this.name            = null 
	this.description     = null
	this.cmmd            = null
	this.contextInput    = null
	this.contextExpected = null

	Test.prototype.commandSpec = function ( cmmdElem){
		
	}
	Test.prototype.inputSpec  = function ( context ){
		
	}
	Test.prototype.expectSpec = function ( context ) {
		
	}
	Test.prototype.informStart = function () {
		console.log( 'Inform: Test: \'' + name + '\' starting. \nDescription: \''+description + '\'');
	}
	Test.prototype.informEndSucceed = function (telemetry) {
		console.log( 'Inform: Test: \'' + name + '\' Successful.');
	}
	Test.prototype.informEndFailure = function ( except) {
		console.log( 'Inform: Test: \'' + name + '\' failed.');
		throw except;
	}
	Test.prototype.execute = function () {
		this.verify();
		this.informStart();
		return this.cmmd.execute( contextIn, contextOut)
		.then( informEndSucceed, informEndFailure);
	}
}

//Test_1.prototype = new Test ()
//function Test_1 () {}

//var test= new Test()
//test.compile(x);
*/
