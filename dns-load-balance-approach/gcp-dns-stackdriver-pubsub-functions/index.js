/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const {DNS} = require('@google-cloud/dns');

const dns = new DNS();
var zone;
var aRecords;

// [START functions_log_helloworld]
exports.helloWorld = (req, res) => {
  console.log('I am a log entry!');
  console.error('I am an error!');
  res.end();
};
// [END functions_log_helloworld]

// [START functions_log_retrieve]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://github.com/googleapis/google-cloud-node/blob/master/docs/authentication.md
const Logging = require('@google-cloud/logging');

function getLogEntries() {
  // Instantiates a client
  const logging = Logging();

  const options = {
    pageSize: 10,
    filter: 'resource.type="cloud_function"',
  };

  // Retrieve the latest Cloud Function log entries
  // See https://googlecloudplatform.github.io/gcloud-node/#/docs/logging
  return logging.getEntries(options).then(([entries]) => {
    console.log('Entries:');
    entries.forEach(entry => console.log(entry));
    return entries;
  });
}
// [END functions_log_retrieve]

// [START functions_log_get_metrics]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://github.com/googleapis/google-cloud-node/blob/master/docs/authentication.md
const Monitoring = require('@google-cloud/monitoring');

function getMetrics(callback) {
  // Instantiates a client
  const monitoring = Monitoring.v3().metricServiceApi();

  // Create two datestrings, a start and end range
  const oneWeekAgo = new Date();
  oneWeekAgo.setHours(oneWeekAgo.getHours() - 7 * 24);

  const options = {
    name: monitoring.projectPath(process.env.GCLOUD_PROJECT),
    // There is also: cloudfunctions.googleapis.com/function/execution_count
    filter:
      'metric.type="cloudfunctions.googleapis.com/function/execution_times"',
    interval: {
      startTime: {
        seconds: oneWeekAgo.getTime() / 1000,
      },
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    view: 1,
  };

  console.log('Data:');

  let error;

  // Iterate over all elements.
  monitoring
    .listTimeSeries(options)
    .on('error', err => {
      error = err;
    })
    .on('data', element => console.log(element))
    .on('end', () => callback(error));
  // [END functions_log_get_metrics]
}

// [START functions_log_stackdriver]
exports.processLogEntry = data => {
  // Node 6: data.data === Node 8+: data
  //const dataBuffer = Buffer.from(data.data.data || data.data || data, 'base64');
  initZone();
  console.log(typeof data);
  console.log(data);
  console.log('data.data = ' + data.data);
  const dataBuffer = Buffer.from(data.data, 'base64');
  console.log(dataBuffer.toString('ascii'));
  const logEntry = JSON.parse(dataBuffer.toString('ascii'));
  console.log(`${logEntry}`); //prints undefined
  console.log(`Method: ${logEntry.httpRequest.requestMethod}`);
  const ipAndPort = logEntry.httpRequest.requestUrl;
  console.log(`Resource: ${logEntry.httpRequest.requestUrl}`);
  console.log(`Initiator: ${logEntry.httpRequest.status}`);
  getARecordsAndRemoveDownServer(ipAndPort);
};

function fetchZone(){
  if(zone === undefined){
    zone = dns.zone('tempzone');
  }
}

function getARecordsAndRemoveDownServer(ipAndPort){
  ip = parseIp(ipAndPort);
  zone.getRecords('a').then(data => {
        aRecords = data[0]; //get A records array
        firstARecord = aRecords[0];
        console.log(firstARecord.data); //Get the IPs on this A Record
        index = doesARecordContainDownServer(ip, firstARecord.data);
        updatedARecordList = removeDownServerFromList(index, firstARecord.data);
        updateZoneARecordEntry(updateZoneARecordEntry, firstARecord.data);
        //console.log(arecord.toJSON().data);
    });
}

function  parseIp(ipAndPort){
  return ipAndPort.split(':')[0];
}

function doesARecordContainDownServer(downServer, ipsInARecord){
  for (i = 0; i < ipsInARecord.length; i++){
    if(ipsInARecord[i] === downServer){
      return i;
    }
  }
}

function removeDownServerFromList(downServerIndex, ipsInARecord){
  return ipsInARecord.splice(downServerIndex, 1);
}

function updateZoneARecordEntry(updatedRecordList, originalList){

  const oldARecord = zone.record('a', {
    name: 'myzone.temp.sw.com.',
    data: originalList,
    ttl: 30
  });

  const newARecord = zone.record('a', {
    name: 'myzone.temp.sw.com.',
    data: updatedRecordList,
    ttl: 30
  });

  const config = {
    add: newARecord,
    delete: oldARecord
  };

  zone.createChange(config).then((data) => {
    const change = data[0];
    const apiResponse = data[1];
    console.log(change);
    console.log(apiResponse);
  });
}
// [END functions_log_stackdriver]

exports.getLogEntries = getLogEntries;
exports.getMetrics = getMetrics;
