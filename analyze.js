String.prototype.replaceAll = function (search, replace) {
	if (replace === undefined)
		return this.toString();
	return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

function roundHalf(num) {
	return Math.round(num*2)/2;
}

var data = '';
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function(){
	if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		data = JSON.parse(xmlhttp.responseText);
		parseLocs(data);
		canvas2Analysis(data);
		buildCorrAnalysis(90);
	}
};
xmlhttp.open("GET", "anonResp.json", true);
xmlhttp.send();

// globals
var chart, ctx;
var markers = {
	all: new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18}),
	f: new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18})
};

function parseLocs (data) {
	data.forEach(function (d, i) {
		if (d.loc.geocode !== null) {
			var m = L.circle(d.loc.geocode, 15, {
				color: '#FF0000',
				fillOpacity: 1,
			});
			d.props = d;
			markers.all.addLayer(m);
			markers.f.addLayer(m);
		}
		if (data.length - 1 == i) {
			map.addLayer(markers.all);
			buildChart('race');
		}
	});
}


function buildData (arg) {
	var runFilter = $('#tabeFilter')[0].checked;
	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshMath')[0].value);

	if (runFilter) {
		if (isNaN(tm) || isNaN(tr)) {
			alert('Non-number value entered for threshold value. Cannot run analysis.');
			return false;
		};

		var replace = [];
		data.forEach(function (d, i) {
			if (d.hasOwnProperty('tabe') && d.tabe.hasOwnProperty('math') && d.tabe.hasOwnProperty('read')) {
				var m = Number(d.tabe.math);
				var r = Number(d.tabe.read);
				if (!isNaN(m) && !isNaN(r)) {
					replace.push(d);
				}
			}
		});
		data = replace;
	};

	var dd = data.map(function (d, i) {
		var res;
		if (arg == 'race') {
			res = d.race.split(',')[0].split(' (')[0].replaceAll('"', '');
			if (res == "") res = 'Other';
		} else if (arg == 'employment') {
			if (d.employment.indexOf('Other') > -1) {
				res = 'Other';
			} else {
				res = d.employment;
			}
		} else if (arg == 'dob') {
			var yr = Number(d.dob.split('/').pop());
			if (yr < 100)
				yr = 1900 + yr;
			res = String(2016 - yr);
		} else if (arg == 'tabe_math' || arg == 'tabe_read') {
			if (d.hasOwnProperty('tabe')) {
				if (arg == 'tabe_math') {
					res = String(d.tabe.math);
				} else {
					res = String(d.tabe.read);
				}
				res = res.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '');
				res = roundHalf(Number(res));
			} else {
				res = 'No Score';
			}
		} else if (arg == 'pipeline') {
			res = d.pipeline.split(',')[0].split('(')[0].replaceAll('"', '');
		} else {
			res = d[arg];
			if (res == '') {
				res = 'No Answer';
			}
		}

		if (runFilter) {
			var m = Number(d.tabe.math);
			var r = Number(d.tabe.read);
			if (m >= tm && r >= tr) {
				res += ' (Passed)';
			} else {
				res += ' (Failed)';
			}
		}

		return res;
	});
	
	var counts = {};
	dd.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
	var keys = Object.keys(counts);

	if (arg == 'dob') {
		keys = Array.apply(null, {length: 50}).map(Number.call, Number);
		keys = keys.map(function (k) {return k + 18; });
		if (runFilter) keys = passFailDouble(keys);
	} else if (arg == 'avg_score') {
		keys = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
		if (runFilter) keys = passFailDouble(keys);
	} else if (arg == 'tabe_math' || arg == 'tabe_read') {
		keys = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
		if (runFilter) {
			keys = passFailDouble(keys);
		} else {
			keys.push('No Score');
		}
	}

	function passFailDouble (keys) {
		var k1 = [];
		var k2 = [];
		keys.forEach(function (k) {
			k1.push(k + ' (Passed)');
			k2.push(k + ' (Failed)');
		});
		keys = k1.concat(k2);
		return keys;
	};

	var c = [];
	keys.forEach(function (k, ki) { 
		c.push(counts[k] || 0);
	});

	keys = keys.map(function (k) {
		if (k.length > 30) k = k.substring(0, 30) + '...';
		return k;
	});

	return {
		labels: keys,
		datasets: [{
			data: c,
			fillColor: randCol(),
		}]
	};
}

function buildChart (arg) {
	if (typeof chart == 'object') {
		chart.destroy();
	}
	var dd = buildData(arg);
	ctx = document.getElementById("chart").getContext("2d");
	chart = new Chart(ctx).Bar(dd, { barShowStroke: false });
};

function randCol() {
		var letters = 'ABCDE'.split('');
		var color = '#';
		for (var i=0; i<3; i++ ) {
				color += letters[Math.floor(Math.random() * letters.length)];
		}
		return color;
}

function canvas2Analysis (dd) {

	var keys = [];
	var aa = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
	aa.forEach(function (val) {
		keys.push(val);
	});

	var replace = [];
	dd.forEach(function (d, i) {
		if (d.hasOwnProperty('tabe') && d.tabe.hasOwnProperty('math') && d.tabe.hasOwnProperty('read')) {
			var m = Number(d.tabe.math);
			var r = Number(d.tabe.read);
			if (!isNaN(m) && !isNaN(r)) {
				replace.push(d);
			}
		}
	});
	dd = replace;

	var as = dd.map(function (d, i) {
		var as = Number(d.avg_score.replaceAll('%', ''));
		if (isNaN(as)) {
			as = 0;
		}
		as = Math.min((as/100*14.5), 14.5);
		return Number(roundHalf(as));
	});
	var countsAS = {};
	var cAS = [];
	as.forEach(function (x) { countsAS[x] = (countsAS[x] || 0) + 1; });
	keys.forEach(function (k, ki) { 
		cAS.push(countsAS[k] || 0);
	});

	var dm = dd.map(function (d, i) {
		return Number(roundHalf(Number(
			String(d.tabe.math).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));
	});
	var countsM = {}; 
	var cM = [];
	dm.forEach(function (x) { countsM[x] = (countsM[x] || 0) + 1; });
	keys.forEach(function (k, ki) { 
		cM.push(countsM[k] || 0);
	});

	var dr = dd.map(function (d, i) {
		return Number(roundHalf(Number(
			String(d.tabe.read).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));
	});
	var countsR = {};
	var cR = [];
	dr.forEach(function (x) { countsR[x] = (countsR[x] || 0) + 1; });
	keys.forEach(function (k, ki) { 
		cR.push(countsR[k] || 0);
	});


	var data = {
		labels: keys,
		datasets: [
			{
				fillColor: "rgba(220,220,220,0.2)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: cM
			},
			{
				fillColor: "rgba(151,187,205,0.2)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(151,187,205,1)",
				data: cR
			},
			{
				fillColor: "rgba(255, 0, 0, 0.2)",
				strokeColor: "rgba(255, 0, 0, 0.25)",
				pointColor: "rgba(255, 0, 0, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(255, 0, 0, 0.25)",
				data: cAS
			}
		]
	};

	ctx = document.getElementById("chart2").getContext("2d");
	var myLineChart = new Chart(ctx).Line(data, {});
}


function buildCorrAnalysis (compareScore) {
	var d = data;
	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshMath')[0].value);

	if (compareScore == undefined)
		compareScore = Number($('#threshScreendoor')[0].value)

	d = d.filter(function (ea) {
		var hasVals = (ea.hasOwnProperty('tabe') && ea.tabe.hasOwnProperty('math') && ea.tabe.hasOwnProperty('read'));
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return hasVals && !isNaN(Number(nn));
	});
	
	var dUnder = d.filter(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return compareScore <= nn;
	});
	var dOver = d.filter(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return compareScore > nn;
	});
	
	var DUmathAgg = {pass: 0, fail: 0};
	var DUreadAgg = {pass: 0, fail: 0};
	dUnder.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm) DUmathAgg.pass += 1;
		else DUmathAgg.fail += 1;

		if (r >= tr) DUreadAgg.pass += 1;
		else DUreadAgg.fail += 1;
	});
	
	var DOmathAgg = {pass: 0, fail: 0};
	var DOreadAgg = {pass: 0, fail: 0};
	dOver.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm) DOmathAgg.pass += 1;
		else DOmathAgg.fail += 1;

		if (r >= tr) DOreadAgg.pass += 1;
		else DOreadAgg.fail += 1;
	});

	var fails = [DUmathAgg.fail, DUreadAgg.fail, DOmathAgg.fail, DUreadAgg.fail];
	var passes = [DUmathAgg.pass, DUreadAgg.pass, DOmathAgg.pass, DUreadAgg.pass];

	var compareBars = {
	  labels: ["UNDER (Math)", "UNDER (Read)", "(OVER) Math", "(OVER) Read"],
	  datasets: [
	      {
          fillColor: "rgba(255, 0, 0, 0.15)",
          strokeColor: "rgba(255, 0, 0, 0.25)",
          highlightFill: "rgba(255, 0, 0, 0.75)",
          highlightStroke: "rgba(255, 0, 0, 1)",
          data: fails
	      },
	      {
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: passes
	      }
	  ]
	};


	if (chart3Bars !== undefined && typeof chart3Bars == 'object') {
		chart3Bars.destroy();
	}

	ctx = document.getElementById("chart3").getContext("2d");
	var chart3Bars = new Chart(ctx).Bar(compareBars, {});
};



