# Google Cloud Functions - Logging and Monitoring sample
I copied this code from the Google Cloud Functions sample Github repository and then modified it to update the Google DNS.
It works this way:
* use Stackdriver uptime check to check that the target server is healthy.
* the uptime check sends log requests to Stackdrive logging.
* The logging component sends the logs to Google Cloud Pub/Sub trigger-topic
* The Cloud Function listens for messages on that topic and responds by removing the IP.

The issue with this approach is that the function executes every time there is an error logged, but what we want is to define a threshold, so that the function or the messages are only sent if that threshold is exceeded.  


* [Writing and Viewing Logs from Cloud Functions documentation][docs]
* [Viewing Cloud Functions monitored metrics documentation][docs2]
* [Background functions sample source code][code]

[docs]: https://cloud.google.com/functions/docs/monitoring/logging
[docs2]: https://cloud.google.com/functions/docs/monitoring/metrics
[code]: index.js

## Deploy and run the sample

See the [Writing and Viewing Logs from Cloud Functions documentation][docs].

Deploy a new Google Cloud function
```
gcloud deploy processLogEntry --runtime nodejs8 --trigger-topic gke-logs-topic
```

Update an existing Google Cloud function
```
gcloud functions update processLogEntry --runtime nodejs8 --trigger-topic gke-logs-topic
```

## Run the tests

1. Read and follow the [prerequisites](../../#how-to-run-the-tests).

1. Install dependencies:

        npm install

1. Run the tests:

        npm test

## Stackdriver setup

### Uptime check
Configure an uptime check in Stackdriver
1) Hostname or IP
2) Check Type: HTTP
3) Path: /hello
4) check every: 15 minutes
5) check the box "log check failures"
6) Advanced Options
  * include a host header: hello.example.com
  * Port 31080
  * Locations should be US only.  

### Stackdriver Logging
Enter the following into the query box:
```
resource.type="cloud_function"
resource.labels.function_name="processLogEntry"
resource.labels.region="us-central1"
```

Then click Create Export, to export the query to a Cloud Pub/Sub sink.  

## TODO
* Complete this example and test it.
* Determine if an Google Cloud Alert can be used to trigger a cloud function instead. An alert can be configured with a threshold.  
