var fs = require('fs');
var http = require('http');
var creds = require('./creds.js');

function getAddress (a, cb) {
  var go = {
    host: 'dev.virtualearth.net',
    path: '/REST/v1/Locations/' + a + '?o=json&key=' + creds.bingkey
  }
  http.get(go, function(response) {
    var body = '';
    response.on('data', function(d) {
      body += d;
    });
    response.on('end', function() {
    	try {
	      var parsed = JSON.parse(body);
	      if (parsed.hasOwnProperty('resourceSets') && 
	          Array.isArray(parsed.resourceSets) &&
	          parsed.resourceSets[0].estimatedTotal !== 0 &&
	          parsed.resourceSets[0].hasOwnProperty('resources') &&
	          Array.isArray(parsed.resourceSets[0].resources) &&
	          typeof parsed.resourceSets[0].resources[0] == 'object' &&
	          parsed.resourceSets[0].resources[0].hasOwnProperty('address') &&
	          parsed.resourceSets[0].resources[0].hasOwnProperty('geocodePoints') &&
	          Array.isArray(parsed.resourceSets[0].resources[0].geocodePoints) &&
	          parsed.resourceSets[0].resources[0].geocodePoints[0].hasOwnProperty('coordinates')) {
	        cb({
	          address: parsed.resourceSets[0].resources[0].address,
	          geocode: parsed.resourceSets[0].resources[0].geocodePoints[0].coordinates,
	        });
	      } else {
	        console.log('FAILED: ', go.host + go.path);
	        cb({address: null, geocode: null});
	      }
    	} catch (e) {
    		console.log('ERROR: ', go.host + go.path);
    		cb({address: null, geocode: null});
    	}
    });
  });
}

fs.readFile('responses.csv', 'utf-8', function (err, data) {
  if (err) {
    throw err;
  } else {
  	console.log('responses.csv has been loaded, getting location for each...');
  	var rows = [];
  	data = data.split('\r\n');
  	var cols = data.shift().split(','); // drop first row

  	data.forEach(function (row, rowInd) {

			var arr = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
			arr = arr || [];
			var prsn = {};
			if (arr.length > 0) {
        fullAdd = null;
				for (var i = 0; i < arr.length; i++) {
          if (cols[i] == 'address') {
          	var add1 = add2 = city = zip = fullAdd = "";
          	if (arr[i] !== "") {
	            var a = arr[i].split("\r");
              add1 = a[0].split(",")[0].replace('"', '') || '',
              add2 = a[0].split(",")[1] || ''; 
              city = a[1].split(",")[1].split(' '); city.pop(); city = city.join(' ' ) || '',
              zip = a[1].split(",")[1].split(' ').pop() || '';
          	}
          	fullAdd = encodeURIComponent([add1, add2, city, city, zip].join(' '));
          } else {
            prsn[cols[i]] = arr[i];
          }
				}
        if (fullAdd !== null) {

          getAddress(fullAdd, function (locData) {
            prsn['loc'] = locData;
            rows.push(prsn);

            if (data.length - 1 == rowInd) {
            	checkRows();

              function checkRows () {
                if (rows.length == data.length) {
                  writeFile(rows);
                } else {
                  console.log('Waiting for all Bing responses to be processed...');
                  console.log(data.length, rows.length);
                  setTimeout(function () { checkRows(); }, 2000);
                }
              }
            }
          });

        }
			}
  	});
  }
});

function writeFile (rows) {
  rows = JSON.stringify(rows);
  fs.writeFile('responses.json', rows, function (err) {
    if (err) {
      throw err;
    }
    console.log('Done jsonizing...');
  });
};



