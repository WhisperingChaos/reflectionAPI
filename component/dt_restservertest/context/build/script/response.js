#!/usr/bin/env node
debugger;



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
		contextChain.concatenate( telemetry, car)
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after concatenation.')
		console.assert( telemetry.color == 'color', 'Context \'telemetry\' should contain \'color\' after concatenation.')
	    var contextChain2 = new ContextChain()
		contextChain2.disconnect()
		contextChain.disconnect()
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after disconnection.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' after disconnection.')
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
			contextChain.concatenate( telemetry, car)
		}
		catch (errMsg){
			if ( errMsg != 'Error: Cyclic __proto__ value'){
				throw errMsg
			}
		}
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
		console.assert( telemetry.contextProp.embeded == 'value', 'Context \'telemetry\' should contain \'contextProp.embeded\' after disconnection.')
		console.assert( typeof telemetry.color === 'undefined', 'Context \'telemetry\' should not contain \'color\' after disconnection.')
	}
	test_ConcatenateSeparateContexts()
	test_ConcatenateIntersectingContexts()
	test_runWithChain()
	
	//var contextObjNot = new ContextChain()
	//contextObjNot.concatenate( String("ab"))
}
ContextChainTest()

/*
	Telemetry.prototype.referenceCreate = function( objectThis, propertyName){
		if ( typeof objectThis[propertyName] == 'undefined'){
			objectThis[propertyName] = new Object()
		}
		return objectThis[propertyName]
	}
	Telemetry.prototype.record = function( objName, propName, value){
		this[objName] = new Object()
		var objectSub = this[objName]
		objectSub[propName] = value
		return this
	}
	Telemetry.prototype.contextCreate = function(){
		return this
	}
}
var telemetry = new Telemetry()
telemetry.record('HTTP', 'data', 'this is it!')
var context = telemetry.contextCreate()
*/

/* namespaces
function Context(){
	this.Global = 'global'

	Context.prototype.nameSpaceReserve = function( parentObj, nameSpace) {
		nameSpace = typeof nameSpace !== 'undefined' ? nameSpace : this.constructor.name
		if ( parentObj[String(nameSpace)]){ 
			throw 'Name Space: \''+ nameSpace + '\' already exists.';
		}
		parentObj[String(nameSpace)] = this
	}
}
var contextGlobal= new Context ()
//HostServer.prototype             = contextGlobal 
//HostServer.prototype.constructor = HostServer
function HostServer( contextParent){
	this.IPAddress = '172.17.0.91'
    this.port = '8080'
	//this.nameSpaceReserve( contextParent)
}

var hostServer = new HostServer() //( contextGlobal)
var portit = function () { var portlocal; with ( contextGlobal, hostServer) { portlocal = port + Global;}; return portlocal; }
console.log(portit())
console.log(hostServer.Global);
*/








/* promises
var Q = require('q');


function Async(){
	var deferred = Q.defer()
	this.promiseCreate = function () {
		return deferred.promise
	}
	this.promiseFill = function () {
		return deferred.resolve('success')
	}
	this.promiseReject = function () {
		return deferred.reject('reject')
	}
}

var Xit = {exit: 'exit'};

function LOGIT(){
	this.stuff='stuff'
	LOGIT.prototype.log = function (){
		console.log(this.stuff);
	}
}

function ASSET(){
	var asset='asset'
	this.hello='hello'
	ASSET.prototype.log = function (){
		console.log(asset+this.hello);
	}
}

var logit = new LOGIT () 

function LOCO(){
	var async = new Async()
	this.asset = new ASSET()
	this.goHome = 'goHome'
    var promise = async.promiseCreate()    
    promise.then( function ( x) {
    	console.log( this.goHome)
        logit.log()
        asset.log()
    	console.log( Xit.exit)
    }, console.log)
    async.promiseFill()
    console.log('end')
    return promise
}
var promisekeep = LOCO()
*/










/*

function TEST(){
	this.list=[]
	TEST.prototype.listSpecPriv = function ( argumentList) {
		arguments = arguments["0"]
		console.log('here')
	}
}
TEST.prototype.listSpec = function ( expression, message) {
	arguments = arguments["0"]
	console.log('here')
}

function TEST2(){
	this.test0 = new TEST()
	TEST2.prototype.listSpec = function ( expression, message) {
		this.test0.listSpec( arguments)
	}
	TEST2.prototype
}

function TEST3( param1, param2){
	param2.exhaust = { seeit: "seeit"};
}

var car = new TEST2()
car.exhaust = { beit: "beit"}
TEST3( 'test3', car);
car.listSpec( 'hi', 'there')

*/