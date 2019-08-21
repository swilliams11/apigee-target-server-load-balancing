/*
This is an synchronous health check program.
*/
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
const request = require('sync-request');
const sleep = require('sleep');

var requestCustom;
var checkIntervalInMillis;
var config = {"host": "httpbin.org",
              "baseUrl": "https://httpbin.org"};
var context = {"check_interval": "10s",
              "timeout": "5s",
              "healthy_threshold": 5,
            "unhealthy_threshold": 5,
            "path": "/status/500"};
var isServerDown = false;
var uri = config.baseUrl + context.path;

/** Start Program **/
init();
console.log('Starting health check server.');
sendHealthChecks();

/** Function Declaration **/
function init(){
    console.log('initializing...');
    console.log(context);
    checkIntervalInMillis = convertToMilliseconds(context['check_interval']);
    console.log('checkIntervalInMillis:' + checkIntervalInMillis);
    initCache();
    requestOptions = options(config);
}

/**
Initilizae the cache.
**/
function initCache(){
  setCounter('errorCounter', 0);
  setCounter('successCounter', 0);
}

/**
Create the options.
**/
function options(configObject){
  var config = { };

  if(configObject.host !== undefined && configObject.host !== null && configObject.host != ''){
    config.headers = { 'Host': configObject.host };
  }
  if(configObject.timeout !== undefined && configObject.timeout !== null && configObject.timeout != ''){
    config.timeout = convertToMilliseconds(configObject.timeout);
  }
  console.log(config);
  return config;
}

/**
convert to milliseconds.
**/
function convertToMilliseconds(value){
  result = parseString(value);
  interval = result.interval;
  console.log('interval: ' + interval);
  period = result['period'].trim();
  console.log('period: ' + period);
  console.log(typeof period);

  switch(period) {
    case "s":
      console.log('period is seconds');
      return interval * 1000;
    case "m":
      console.log('period is minutes');
      return interval * 60 * 1000;
  }
}


/**
parse the string 5s or 5m into 5 and m seperately.
**/
function parseString(value){
    period = value.charAt(value.length - 1);
    interval = value.substring(0, value.length - 1);
    intervalNumber = parseInt(interval);
    if(intervalNumber  == NaN){
      throw Error('The provide value of ' + interval + ' is not an integer.');
    }
    if(period  === 's' || period === 'm') {
      return {'interval': intervalNumber,
              'period': String(period)};
    } else {
      throw Error('ERROR - timeout can only include s (seconds) or m (minutes)');
    }
}

/**
Calls
**/
function sendHealthChecks(){
  count = 0;
  while(count < 12){
    sendHealthCheckRequest();
    sleep.sleep(5); // sleep for ten seconds
    if(count >= 5){
      uri = config.baseUrl + '/status/200'
    }
    //setTimeout(sendRequest, checkIntervalInMillis);
    count++;
  }
}

/*
async function sendHealthCheckRequestSync() {
  console.log('INFO - sending the health check request');
  var response = await request.get('GET', uri, requestOptions);


//TODO move this code
    .catch(function (error) {
      console.log(error.response.status + ' ' + error.response.statusText + '\n' + error.response.data);
      if(!isServerDown){
        increment('errorCounter');
        actWhenThresholdIsExceeded('errorCounter');
      }
    });
      // handle success
  if(response != undefined && (response.status >= 200 || response.status <= 299)) {
      console.log('INFO - Request Success: ' + response.status + ' ' + response.statusText + ' \n' + response.data);
      if(isServerDown){
        increment('successCounter');
        actWhenThresholdIsExceeded('successCounter');
      }
    }
}*/

function sendHealthCheckRequest() {
  console.log('INFO - sending the health check request');
  var response = request('GET', uri, requestOptions);
    if(response != undefined && response.statusCode >= 200 && response.statusCode <= 299) {
      // handle success
      console.log('INFO - Request Success: ' + response.statusCode + '\n' + response.body);
      if(isServerDown){
        increment('successCounter');
        actWhenThresholdIsExceeded('successCounter');
      }

    } else if(response != undefined && response.statusCode > 399) {
      console.log(response.statusCode + '\n' + response.body);
      if(!isServerDown){
        increment('errorCounter');
        actWhenThresholdIsExceeded('errorCounter');
      }
    }
}

function increment(key){
  if(isServerDown){
    //don't increment the error counter
    if(key === 'successCounter'){
      fetchFromCacheAndIncrement(key);
    }
  } else {
    if(key === 'errorCounter'){
      fetchFromCacheAndIncrement(key);
    }
  }
}

function fetchFromCacheAndIncrement(key){
  result = myCache.get(key);
  if ( result == undefined ){
    console.log('Error: ' + key + ' is not found in cache.');
    throw Error('Error: ' + key + ' is not found in cache.')
  }
  setCounter(key, result + 1);
}

function setCounter(key, value){
  myCache.set( key, value, function( err, success ){
    if( !err && success ){
      console.log(key + ' set to ' + value + ';' + success );
    } else {
      console.log(err);
    }
  });
}

function actWhenThresholdIsExceeded(key){
  counter = myCache.get(key);
  threshold = getThreshold(key);
  if(counter >= threshold){
    console.log('INFO - ' + key + ' is ' + counter + ' and has exceeded the threshold : ' + threshold);
    resolveThreshold(key);
  }
}

function getThreshold(key){
  switch(key){
    case 'errorCounter':
      return context.unhealthy_threshold;
    case 'successCounter':
      return context.healthy_threshold;
  }
}

function resolveThreshold(key){
  switch(key){
    case 'errorCounter':
      isServerDown = true;
      successCounter = 0;
      //TODO remove server from rotation from GCP
      break;
    case 'successCounter':
      isServerDown = false;
      errorCounter = 0;
      //TODO add server back to rotation in GCP
      break;
    }
    console.log('INFO - isServerDown is set to ' + isServerDown + ' and ' + key + ' is set to zero.');
}
