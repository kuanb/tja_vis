var fs = require('fs');
var http = require('http');
var creds = require('./creds.js');


fs.readFile('responses.json', 'utf-8', function (err, res) {
  if (err) {
    throw err;
  } else {
  	res = JSON.parse(res);

		fs.readFile('base_tja.csv', 'utf-8', function (err, data) {
		  if (err) {
		    throw err;
		  } else {
		  	console.log('base_tja.csv has been loaded, getting location for each...');
		  	var rows = [];
		  	data = data.split('\r\n');

		  	var cols = data.shift().split(','); // drop first row

		  	data.forEach(function (row, rowInd) {
					var arr = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
					arr = arr || [];
					if (arr.length > 0) {
		        var name = arr[2];
		        var status = arr[4];
		        var found_match = false;

		        if (name.indexOf("George Llanes") > -1) {
		        	console.log("Fixing/adjusting this name: ", name);
		        	name = "George Llanes";
		        }

		        res.forEach(function(ea) {
		        	if (ea.name == name) {
		        		ea.status = status;
		        		found_match = true;
		        	}
		        });

		        if (found_match == false) {
		        	console.log("Could not find match for " + name);
		        }
					}
		  	});
        res.forEach(function(ea) {
        	if (ea.status == undefined) {
        		console.log("WTF");
        		throw Error("Can't complete because not all persons have a status.")
        	}
        });
        writeFile(res);
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



