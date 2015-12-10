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
		var to = 0;
		if (map.addLayer == undefined) to = 1000;
		setTimeout(function () {
			parseLocs(data);
			
			canvas2Analysis(data, false);
			canvas2Analysis_bc(data, false);

			canvas4Analysis();
			buildCorrAnalysis(90);
		}, to);
	}
};
xmlhttp.open("GET", "anonResp.json", true);
xmlhttp.send();

// globals
var chart, chart3, chart4;
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
	var tr = Number($('#threshRead')[0].value);

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
		} else if (arg == 'submitted') {
			res = new Date(d.submitted);
			var mo = res.getMonth();
			if (mo < 10) mo = '0' + String(mo);
			var da = res.getDate();
			if (da < 10) da = '0' + String(da);
			res = mo + '-' + da;
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
			if (res.indexOf("Other") > -1) res = "Other";
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
	} else if (arg == 'submitted') {
		var ks_temp = getDatesRangeArray(moment(new Date('Sep 29 2015')), moment(new Date('Oct 31 2015')), 'days', 1);
		keys = ks_temp.map(function (ks) {
			var mo = ks.month();
			if (mo < 10) mo = '0' + String(mo);
			var da = ks.date();
			if (da < 10) da = '0' + String(da);
			return mo + '-' + da;
		});
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

function roundToHalf(number) {
  var value = (number * 2).toFixed() / 2;
  return value;
}

function buildChart (arg) {
	if (typeof chart == 'object') {
		chart.destroy();
	}
	var dd = buildData(arg);
	var ctx = document.getElementById("chart").getContext("2d");
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

function canvas2Analysis (dd, mtaonly) {

	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshRead')[0].value);

	var keys = [];
	var aa = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
	aa.forEach(function (val) {
		keys.push(val);
	});

	var replace = [];
	dd.forEach(function (d, i) {
		var has_tabes = d.hasOwnProperty('tabe') && d.tabe.hasOwnProperty('math') && d.tabe.hasOwnProperty('read');
		var has_mta = d.hasOwnProperty('mta') && d.mta.hasOwnProperty('score') && d.mta.hasOwnProperty('retest');
		if (has_tabes && has_mta) {
			var m = Number(d.tabe.math);
			var r = Number(d.tabe.read);
			
			if (!isNaN(m) && !isNaN(r)) {
				if (mtaonly) {
					if (d.mta.score !== "" && d.mta.score !== 0) replace.push(d);
				} else {
					if (d.mta.score == "") d.mta.score = 0;
					if (d.mta.retest == "") d.mta.retest = 0;
					replace.push(d);
				}
			}
		} else {
			console.log("Missing tabe or MTA components...", d)
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


	var countsBo = {};
	var cBo = [];
	if (dm.length == dr.length) {		
		var allKeys = [];
		var foo = new Array(30);
		for (var i=0; i<foo.length; i++) {
			var k = (i/2);
		  countsBo[k] = 0;
		  allKeys.push(Number(k));
		}

		for (var i = 0; i < dm.length; i++) {
			var base = Math.min(dr[i], dm[i]);
			countsBo[base] += 1;
		}

		keys.forEach(function (k, ki) { 
			cBo.push(countsBo[k] || 0);
		});

	} else {
		console.log("ERROR: Tabe Math and Reading results are not of same length... So there is bad data in user Tabe scores.")
	}


	var mta = dd.map(function (d, i) {
		var first = Number(roundHalf(Number(
			String(d.mta.score).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));
		var retest = Number(roundHalf(Number(
			String(d.mta.retest).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));

		var highest = Math.max(first, retest);
		if (highest > 0) {
			highest = Math.min((highest/100*14.5), 14.5);
			highest = roundToHalf(highest);
		}
		return highest;
	});

	var countsMTA = {};
	var cMTA = [];
	mta.forEach(function (x) { countsMTA[x] = (countsMTA[x] || 0) + 1; });
	keys.forEach(function (k, ki) { 
		cMTA.push(countsMTA[k] || 0);
	});

	keys = keys.map(function(k) { return k.toString() + " (~" + Math.min(k*(100/14.5), 100).toFixed(0) + "%)"; });

	var data = {
		labels: keys,
		datasets: [
			{
				fillColor: "rgba(28,228,48,0.2)",
				strokeColor: "rgba(28,228,48,1)",
				pointColor: "rgba(28,228,48,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(28,228,48,1)",
				data: cR
			},
			{
				fillColor: "rgba(0,94,255,0.2)",
				strokeColor: "rgba(0,94,255,1)",
				pointColor: "rgba(0,94,255,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(0,94,255,1)",
				data: cM
			},
			{
				fillColor: "rgba(128,128,128, 0.2)",
				strokeColor: "rgba(128,128,128, 0.25)",
				pointColor: "rgba(128,128,128, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(128,128,128, 0.25)",
				data: cAS
			},
			{
				fillColor: "rgba(255,0,255, 0.2)",
				strokeColor: "rgba(255,0,255, 0.25)",
				pointColor: "rgba(255,0,255, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(255,0,255, 0.25)",
				data: cBo
			},
			{
				fillColor: "rgba(200,119,3, 0.2)",
				strokeColor: "rgba(200,119,3, 0.25)",
				pointColor: "rgba(200,119,3, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(200,119,3, 0.25)",
				data: cMTA
			}
		]
	};

	var ctx = document.getElementById("chart2a").getContext("2d");
	var myLineChart = new Chart(ctx).Line(data, {});

};

function canvas2Analysis_bc (dd, mtaonly) {

	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshRead')[0].value);

	var keys = [];
	var aa = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
	aa.forEach(function (val) {
		if (val > 2 && !mtaonly) keys.push(val);
		if (val > 4 && mtaonly) keys.push(val);
	});

	var replace = [];
	dd.forEach(function (d, i) {
		var has_tabes = d.hasOwnProperty('tabe') && d.tabe.hasOwnProperty('math') && d.tabe.hasOwnProperty('read');
		var has_mta = d.hasOwnProperty('mta') && d.mta.hasOwnProperty('score') && d.mta.hasOwnProperty('retest');
		if (has_tabes && has_mta) {
			var m = Number(d.tabe.math);
			var r = Number(d.tabe.read);
			
			if (!isNaN(m) && !isNaN(r)) {
				if (mtaonly) {
					if (d.mta.score !== "" && d.mta.score !== 0) replace.push(d);
				} else {
					if (d.mta.score == "") d.mta.score = 0;
					if (d.mta.retest == "") d.mta.retest = 0;
					replace.push(d);
				}
			}
		} else {
			console.log("Missing tabe or MTA components...", d)
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

	var countsBo = {};
	var cBo = [];
	if (dm.length == dr.length) {		
		var allKeys = [];
		var foo = new Array(30);
		for (var i=0; i<foo.length; i++) {
			var k = (i/2);
		  countsBo[k] = 0;
		  allKeys.push(Number(k));
		}

		for (var i = 0; i < dm.length; i++) {
			var base = Math.min(dr[i], dm[i]);
			countsBo[base] += 1;
		}

		keys.forEach(function (k, ki) { 
			cBo.push(countsBo[k] || 0);
		});

	} else {
		console.log("ERROR: Tabe Math and Reading results are not of same length... So there is bad data in user Tabe scores.")
	}


	var mta = dd.map(function (d, i) {
		var first = Number(roundHalf(Number(
			String(d.mta.score).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));
		var retest = Number(roundHalf(Number(
			String(d.mta.retest).replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')
		)));

		var highest = Math.max(first, retest);
		if (highest > 0) {
			highest = Math.min((highest/100*14.5), 14.5);
			highest = roundToHalf(highest);
		}
		return highest;
	});

	var countsMTA = {};
	var cMTA = [];
	mta.forEach(function (x) { countsMTA[x] = (countsMTA[x] || 0) + 1; });
	keys.forEach(function (k, ki) { 
		cMTA.push(countsMTA[k] || 0);
	});

	keys = keys.map(function(k) { return k.toString() + " (~" + Math.min(k*(100/14.5), 100).toFixed(0) + "%)"; });

	var data = {
		labels: keys,
		datasets: [
			{
				fillColor: "rgba(28,228,48,0.2)",
				strokeColor: "rgba(28,228,48,1)",
				pointColor: "rgba(28,228,48,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(28,228,48,1)",
				data: cR
			},
			{
				fillColor: "rgba(0,94,255,0.2)",
				strokeColor: "rgba(0,94,255,1)",
				pointColor: "rgba(0,94,255,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(0,94,255,1)",
				data: cM
			},
			{
				fillColor: "rgba(128,128,128, 0.2)",
				strokeColor: "rgba(128,128,128, 0.25)",
				pointColor: "rgba(128,128,128, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(128,128,128, 0.25)",
				data: cAS
			},
			{
				fillColor: "rgba(255,0,255, 0.2)",
				strokeColor: "rgba(255,0,255, 0.25)",
				pointColor: "rgba(255,0,255, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(255,0,255, 0.25)",
				data: cBo
			},
			{
				fillColor: "rgba(200,119,3, 0.2)",
				strokeColor: "rgba(200,119,3, 0.25)",
				pointColor: "rgba(200,119,3, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(200,119,3, 0.25)",
				data: cMTA
			}
		]
	};

	var ctx = document.getElementById("chart2b").getContext("2d");
	var myLineChart = new Chart(ctx).Line(data, {});

	cR = cR.reverse();
	cM = cM.reverse();
	cAS = cAS.reverse();
	cBo = cBo.reverse();
	cMTA = cMTA.reverse();

	for (var i = 1; i < cM.length; i++) {
		cR[i] += cR[i-1];
		cM[i] += cM[i-1];
		cAS[i] += cAS[i-1];
		cBo[i] += cBo[i-1];
		cMTA[i] += cMTA[i-1];
	}
	
	cR = cR.reverse();
	cM = cM.reverse();
	cAS = cAS.reverse();
	cBo = cBo.reverse();
	cMTA = cMTA.reverse();

	var data = {
		labels: keys,
		datasets: [
			{
				fillColor: "rgba(28,228,48,0.2)",
				strokeColor: "rgba(28,228,48,1)",
				pointColor: "rgba(28,228,48,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(28,228,48,1)",
				data: cR
			},
			{
				fillColor: "rgba(0,94,255,0.2)",
				strokeColor: "rgba(0,94,255,1)",
				pointColor: "rgba(0,94,255,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(0,94,255,1)",
				data: cM
			},
			{
				fillColor: "rgba(128,128,128, 0.2)",
				strokeColor: "rgba(128,128,128, 0.25)",
				pointColor: "rgba(128,128,128, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(128,128,128, 0.25)",
				data: cAS
			},
			{
				fillColor: "rgba(255,0,255, 0.2)",
				strokeColor: "rgba(255,0,255, 0.25)",
				pointColor: "rgba(255,0,255, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(255,0,255, 0.25)",
				data: cBo
			},
			{
				fillColor: "rgba(200,119,3, 0.2)",
				strokeColor: "rgba(200,119,3, 0.25)",
				pointColor: "rgba(200,119,3, 0.25)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(200,119,3, 0.25)",
				data: cMTA
			}
		]
	};

	var ctx = document.getElementById("chart2c").getContext("2d");
	var myLineChart = new Chart(ctx).Line(data, {bezierCurve : false});


};

function getDatesRangeArray (startDate, endDate, interval, total) {
  var config = {
      interval: interval || 'days',
      total: total || 1
    },
    dateArray = [],
    currentDate = startDate.clone();
  while (currentDate < endDate) {
    dateArray.push(currentDate);
    currentDate = currentDate.clone().add(config.total, config.interval);
  }
  return dateArray;
};


function buildCorrAnalysis (compareScore) {
	var d = data;
	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshRead')[0].value);
	var tmta = Number($('#threshMTA')[0].value);

	if (compareScore == undefined)
		compareScore = Number($('#threshScreendoor')[0].value)

	d = d.filter(function (ea) {
		var hasVals = (ea.hasOwnProperty('tabe') && ea.tabe.hasOwnProperty('math') && ea.tabe.hasOwnProperty('read'));
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return hasVals && !isNaN(Number(nn));
	});
	
	var dUnder = d.filter(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return nn < compareScore;
	});
	var dEqual = d.filter(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return nn == compareScore;
	});
	var dOver = d.filter(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		return nn > compareScore;
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
	
	var DEmathAgg = {pass: 0, fail: 0};
	var DEreadAgg = {pass: 0, fail: 0};
	dEqual.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm) DEmathAgg.pass += 1;
		else DEmathAgg.fail += 1;

		if (r >= tr) DEreadAgg.pass += 1;
		else DEreadAgg.fail += 1;
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

	var fails = [DUmathAgg.fail, DUreadAgg.fail, DEmathAgg.fail, DEreadAgg.fail, DOmathAgg.fail, DOreadAgg.fail];
	var passes = [DUmathAgg.pass, DUreadAgg.pass, DEmathAgg.pass, DEreadAgg.pass, DOmathAgg.pass, DOreadAgg.pass];

	var compareBars = {
	  labels: ["UNDER (Math)", "UNDER (Read)", "EQUAL (Math)", "EQUAL (Read)", "OVER (Math)", "OVER (Read)"],
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


	if (chart3 !== undefined && typeof chart3 == 'object') {
		chart3.destroy();
	}

	var ctx = document.getElementById("chart3").getContext("2d");
	chart3 = new Chart(ctx).Bar(compareBars, {});


	// Part 2: Include MTA results as well alone

	d = d.filter(function (ea) {
		var hasVals = (ea.hasOwnProperty('mta') && ea.mta.hasOwnProperty('score') && ea.mta.hasOwnProperty('retest'));
		return hasVals && !isNaN(Number(Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''))));
	});
	var dUnder = d.filter(function (ea) {return Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', '')) < compareScore;});
	var dEqual = d.filter(function (ea) {return Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', '')) == compareScore;});
	var dOver = d.filter(function (ea) {return Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', '')) > compareScore;});

	var DUmta_sc = {pass: 0, fail: 0};
	var DUmta_rt = {pass: 0, fail: 0};
	dUnder.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta) DUmta_sc.pass += 1;
		else if (Number(m) !== 0) DUmta_sc.fail += 1;

		if (r >= tmta) DUmta_rt.pass += 1;
		else if (Number(r) !== 0) DUmta_rt.fail += 1;
	});
	
	var DEmta_sc = {pass: 0, fail: 0};
	var DEmta_rt = {pass: 0, fail: 0};
	dEqual.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta) DEmta_sc.pass += 1;
		else if (Number(m) !== 0) DEmta_sc.fail += 1;

		if (r >= tmta) DEmta_rt.pass += 1;
		else if (Number(r) !== 0) DEmta_rt.fail += 1;
	});
	
	var DOmta_sc = {pass: 0, fail: 0};
	var DOmta_rt = {pass: 0, fail: 0};
	dOver.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));

		if (m >= tmta) DOmta_sc.pass += 1;
		else if (Number(m) !== 0) DOmta_sc.fail += 1;

		if (r >= tmta) DOmta_rt.pass += 1;
		else if (Number(r) !== 0) DOmta_rt.fail += 1;
	});


	var fails = [DUmta_sc.fail, DUmta_rt.fail, DEmta_sc.fail, DEmta_rt.fail, DOmta_sc.fail, DOmta_rt.fail];
	var passes = [DUmta_sc.pass, DUmta_rt.pass, DEmta_sc.pass, DEmta_rt.pass, DOmta_sc.pass, DOmta_rt.pass];

	var compareBars = {
	  labels: ["UNDER (First)", "UNDER (Retest)", "EQUAL (First)", "EQUAL (Retest)", "OVER (First)", "OVER (Retest)"],
	  datasets: [
	      {
          fillColor: "rgba(216, 128, 26, 0.15)",
          strokeColor: "rgba(216, 128, 26, 0.25)",
          highlightFill: "rgba(216, 128, 26, 0.75)",
          highlightStroke: "rgba(216, 128, 26, 1)",
          data: fails
	      },
	      {
          fillColor: "rgba(6,192,162,0.5)",
          strokeColor: "rgba(6,192,162,0.8)",
          highlightFill: "rgba(6,192,162,0.75)",
          highlightStroke: "rgba(6,192,162,1)",
          data: passes
	      }
	  ]
	};


	if (chart3 !== undefined && typeof chart3 == 'object') {
		chart3.destroy();
	}

	var ctx = document.getElementById("chart3b").getContext("2d");
	chart3 = new Chart(ctx).Bar(compareBars, {});



	// Now for the join version Chart 3c

	var DU_tabe = {pass: 0, fail: 0};
	dUnder.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm && r >= tr) DU_tabe.pass += 1;
		else DU_tabe.fail += 1;
	});
	
	var DE_tabe = {pass: 0, fail: 0};
	dEqual.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm && r >= tr) DE_tabe.pass += 1;
		else DE_tabe.fail += 1;
	});
	
	var DO_tabe = {pass: 0, fail: 0};
	dOver.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm && r >= tr) DO_tabe.pass += 1;
		else DO_tabe.fail += 1;
	});

	fails_tabe = [DU_tabe.fail, DE_tabe.fail, DO_tabe.fail, DE_tabe.fail + DO_tabe.fail];
	passes_tabe = [DU_tabe.pass, DE_tabe.pass, DO_tabe.pass, DE_tabe.pass + DO_tabe.pass];


	tabe_sum = 0;
	fails_tabe.forEach(function (ea) {
		tabe_sum += ea;
	});
	passes_tabe.forEach(function (ea) {
		tabe_sum += ea;
	});
	fails_tabe = fails_tabe.map(function (ea) {
		ea = Number((100*ea/tabe_sum).toFixed(1));
		return ea;
	});
	passes_tabe = passes_tabe.map(function (ea) {
		ea = Number((100*ea/tabe_sum).toFixed(1));
		return ea;
	});



	var DU_mta = {pass: 0, fail: 0};
	dUnder.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta || r >= tmta) DU_mta.pass += 1;
		else if (m !== 0) DU_mta.fail += 1;
	});
	
	var DE_mta = {pass: 0, fail: 0};
	dEqual.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta || r >= tmta) DE_mta.pass += 1;
		else if (m !== 0) DE_mta.fail += 1;
	});
	
	var DO_mta = {pass: 0, fail: 0};
	dOver.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta || r >= tmta) DO_mta.pass += 1;
		else if (m !== 0) DO_mta.fail += 1;
	});

	fails_mta = [DU_mta.fail, DE_mta.fail, DO_mta.fail, DE_mta.fail + DO_mta.fail];
	passes_mta = [DU_mta.pass, DE_mta.pass, DO_mta.pass, DE_mta.pass + DO_mta.pass];

	var compareBars = {
	  labels: ["UNDER", "EQUAL", "OVER", "EQUAL/OVER"],
	  datasets: [
	      {
          fillColor: "rgba(255, 0, 0, 0.15)",
          strokeColor: "rgba(255, 0, 0, 0.25)",
          highlightFill: "rgba(255, 0, 0, 0.75)",
          highlightStroke: "rgba(255, 0, 0, 1)",
          data: fails_tabe
	      },
	      {
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: passes_tabe
	      },
	      {
          fillColor: "rgba(216, 128, 26, 0.15)",
          strokeColor: "rgba(216, 128, 26, 0.25)",
          highlightFill: "rgba(216, 128, 26, 0.75)",
          highlightStroke: "rgba(216, 128, 26, 1)",
          data: fails_mta
	      },
	      {
          fillColor: "rgba(6,192,162,0.5)",
          strokeColor: "rgba(6,192,162,0.8)",
          highlightFill: "rgba(6,192,162,0.75)",
          highlightStroke: "rgba(6,192,162,1)",
          data: passes_mta
	      }
	  ]
	};


	if (chart3 !== undefined && typeof chart3 == 'object') {
		chart3.destroy();
	}

	var ctx = document.getElementById("chart3c").getContext("2d");
	chart3 = new Chart(ctx).Bar(compareBars, {});


	// Now for the join version with PERCENTAGES Chart 3d

	mta_sum = 0;
	fails_mta.forEach(function (ea) {
		mta_sum += ea;
	});
	passes_mta.forEach(function (ea) {
		mta_sum += ea;
	});
	fails_mta = fails_mta.map(function (ea) {
		ea = Number((100*ea/mta_sum).toFixed(1));
		return ea;
	});
	passes_mta = passes_mta.map(function (ea) {
		ea = Number((100*ea/mta_sum).toFixed(1));
		return ea;
	});

	var compareBars = {
	  labels: ["UNDER", "EQUAL", "OVER", "EQUAL/OVER"],
	  datasets: [
	      {
          fillColor: "rgba(255, 0, 0, 0.15)",
          strokeColor: "rgba(255, 0, 0, 0.25)",
          highlightFill: "rgba(255, 0, 0, 0.75)",
          highlightStroke: "rgba(255, 0, 0, 1)",
          data: fails_tabe
	      },
	      {
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: passes_tabe
	      },
	      {
          fillColor: "rgba(216, 128, 26, 0.15)",
          strokeColor: "rgba(216, 128, 26, 0.25)",
          highlightFill: "rgba(216, 128, 26, 0.75)",
          highlightStroke: "rgba(216, 128, 26, 1)",
          data: fails_mta
	      },
	      {
          fillColor: "rgba(6,192,162,0.5)",
          strokeColor: "rgba(6,192,162,0.8)",
          highlightFill: "rgba(6,192,162,0.75)",
          highlightStroke: "rgba(6,192,162,1)",
          data: passes_mta
	      }
	  ]
	};


	if (chart3 !== undefined && typeof chart3 == 'object') {
		chart3.destroy();
	}

	var ctx = document.getElementById("chart3d").getContext("2d");
	chart3 = new Chart(ctx).Bar(compareBars, {});




	// Now for the join version Chart 3E - Comparing men v women

	var DU_tabe = {"male": {pass: 0, fail: 0}, "female": {pass: 0, fail: 0}};
	dUnder.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		if (m >= tm && r >= tr) DU_tabe[ea.sex.toLowerCase()].pass += 1;
		else if (DU_tabe[ea.sex.toLowerCase()]) DU_tabe[ea.sex.toLowerCase()].fail += 1;
	});
	
	var DO_tabe = {"male": {pass: 0, fail: 0}, "female": {pass: 0, fail: 0}};
	dEqual.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm && r >= tr) DO_tabe[ea.sex.toLowerCase()].pass += 1;
		else if (DO_tabe[ea.sex.toLowerCase()]) DO_tabe[ea.sex.toLowerCase()].fail += 1;
	});
	dOver.forEach(function (ea) {
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tm && r >= tr) DO_tabe[ea.sex.toLowerCase()].pass += 1;
		else if (DO_tabe[ea.sex.toLowerCase()]) DO_tabe[ea.sex.toLowerCase()].fail += 1;
	});

	fails_tabe = [DU_tabe.male.fail, DO_tabe.male.fail, DU_tabe.female.fail, DO_tabe.female.fail];
	passes_tabe = [DU_tabe.male.pass, DO_tabe.male.pass, DU_tabe.female.pass, DO_tabe.female.pass];


	tabe_sum = 0;
	fails_tabe.forEach(function (ea) {
		tabe_sum += ea;
	});
	passes_tabe.forEach(function (ea) {
		tabe_sum += ea;
	});
	fails_tabe = fails_tabe.map(function (ea) {
		ea = Number((100*ea/tabe_sum).toFixed(1));
		return ea;
	});
	passes_tabe = passes_tabe.map(function (ea) {
		ea = Number((100*ea/tabe_sum).toFixed(1));
		return ea;
	});



	var DU_mta = {"male": {pass: 0, fail: 0}, "female": {pass: 0, fail: 0}};
	dUnder.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta || r >= tmta) DU_mta[ea.sex.toLowerCase()].pass += 1;
		else if (m !== 0 && DU_mta[ea.sex.toLowerCase()]) DU_mta[ea.sex.toLowerCase()].fail += 1;
	});
	
	var DO_mta = {"male": {pass: 0, fail: 0}, "female": {pass: 0, fail: 0}};
	dOver.forEach(function (ea) {
		var m = ea.mta.score == "" ? 0 : Number(ea.mta.score.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = ea.mta.retest == "" ? 0 : Number(ea.mta.retest.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		
		if (m >= tmta || r >= tmta) DO_mta[ea.sex.toLowerCase()].pass += 1;
		else if (m !== 0 && DU_mta[ea.sex.toLowerCase()]) DO_mta[ea.sex.toLowerCase()].fail += 1;
	});


	fails_mta = [DU_mta.male.fail, DO_mta.male.fail, DU_mta.female.fail, DO_mta.female.fail];
	passes_mta = [DU_mta.male.pass, DO_mta.male.pass, DU_mta.female.pass, DO_mta.female.pass]

	mta_sum = 0;
	fails_mta.forEach(function (ea) {
		mta_sum += ea;
	});
	passes_mta.forEach(function (ea) {
		mta_sum += ea;
	});
	fails_mta = fails_mta.map(function (ea) {
		ea = Number((100*ea/mta_sum).toFixed(1));
		return ea;
	});
	passes_mta = passes_mta.map(function (ea) {
		ea = Number((100*ea/mta_sum).toFixed(1));
		return ea;
	});

	var compareBars = {
	  labels: ["UNDER(MEN)", "EQUAL+OVER(MEN)", "UNDER(WOMEN)", "EQUAL+OVER(WOMEN)"],
	  datasets: [
	      {
          fillColor: "rgba(255, 0, 0, 0.15)",
          strokeColor: "rgba(255, 0, 0, 0.25)",
          highlightFill: "rgba(255, 0, 0, 0.75)",
          highlightStroke: "rgba(255, 0, 0, 1)",
          data: fails_tabe
	      },
	      {
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: passes_tabe
	      },
	      {
          fillColor: "rgba(216, 128, 26, 0.15)",
          strokeColor: "rgba(216, 128, 26, 0.25)",
          highlightFill: "rgba(216, 128, 26, 0.75)",
          highlightStroke: "rgba(216, 128, 26, 1)",
          data: fails_mta
	      },
	      {
          fillColor: "rgba(6,192,162,0.5)",
          strokeColor: "rgba(6,192,162,0.8)",
          highlightFill: "rgba(6,192,162,0.75)",
          highlightStroke: "rgba(6,192,162,1)",
          data: passes_mta
	      }
	  ]
	};


	if (chart3 !== undefined && typeof chart3 == 'object') {
		chart3.destroy();
	}

	var ctx = document.getElementById("chart3e").getContext("2d");
	chart3 = new Chart(ctx).Bar(compareBars, {});

};




function canvas4Analysis (gender) {
	var d = data;
	var tm = Number($('#threshMath')[0].value);
	var tr = Number($('#threshRead')[0].value);
	var tmta = Number($('#threshMTA')[0].value);

	d = d.filter(function (ea) {
		var hasVals = (ea.hasOwnProperty('tabe') && ea.tabe.hasOwnProperty('math') && ea.tabe.hasOwnProperty('read'));
		var hasMTA = (ea.hasOwnProperty('mta') && ea.mta.hasOwnProperty('score') && ea.mta.hasOwnProperty('retest'));
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		var gender_ok = false;
		if (gender !== undefined) {
			if (gender == "female") {
				gender_ok = ea.sex == "Female";
			} else {
				gender_ok = ea.sex == "Male";
			}
		} else {
			gender_ok = true;
		}
		return hasVals && gender_ok && hasMTA && !isNaN(nn);
	}).map(function (ea) {
		var nn = Number(ea.avg_score.replaceAll('%', '').replaceAll(' ', '').replaceAll('"', ''));
		var m = Number(ea.tabe.math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var r = Number(ea.tabe.read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', ''));
		var pt = (m >= tm) && (r >= tr);

		var m_s = Number(ea.mta.score);
		var m_r = Number(ea.mta.retest);
		var m_high = Math.max(m_s, m_r);
		var mta_pass = (m_high >= tmta);

		return {avg: nn, pass: pt, mta_pass: mta_pass};
	});

	var counts = {};
	d.forEach(function (x) { 
		if (counts[x.avg] == undefined) {
			counts[x.avg] = { n: 0, p: 0, f: 0 };
		}
		if (x.pass) counts[x.avg].p += 1;
		else counts[x.avg].f += 1;
	});

	var cts_mta = {};
	d.forEach(function (x) { 
		if (cts_mta[x.avg] == undefined) {
			cts_mta[x.avg] = { n: 0, p: 0, f: 0 };
		}
		if (x.mta_pass) cts_mta[x.avg].p += 1;
		else cts_mta[x.avg].f += 1;
	});

	var cts_both = {};
	d.forEach(function (x) { 
		if (cts_both[x.avg] == undefined) {
			cts_both[x.avg] = { n: 0, p: 0, f: 0 };
		}
		if (x.pass && x.mta_pass) cts_both[x.avg].p += 1;
		else cts_both[x.avg].f += 1;
	});

	var keys = ['0','10','20','30','40','50','60','70','80','90','100'];

	var pct = [];
	keys.forEach(function (k) {
		if (counts[k] == undefined) {
			pct.push(0);
		} else {
			var all = counts[k].f + counts[k].p;
			var pass = counts[k].p/all * 100;
			pass = Number(pass.toFixed(1));
			pct.push(pass);
		}
	});

	var mta_pct = [];
	keys.forEach(function (k) {
		if (cts_mta[k] == undefined) {
			mta_pct.push(0);
		} else {
			var all = cts_mta[k].f + cts_mta[k].p;
			var pass = cts_mta[k].p/all * 100;
			pass = Number(pass.toFixed(1));
			mta_pct.push(pass);
		}
	});

	var both_pct = [];
	keys.forEach(function (k) {
		if (cts_both[k] == undefined) {
			both_pct.push(0);
		} else {
			var all = cts_both[k].f + cts_both[k].p;
			var pass = cts_both[k].p/all * 100;
			pass = Number(pass.toFixed(1));
			both_pct.push(pass);
		}
	});

	var ct = [];
	keys.forEach(function (k) {
		if (counts[k] == undefined) {
			ct.push(0);
		} else {
			var all = counts[k].f + counts[k].p;
			ct.push(all);
		}
	});

	keys = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

	var line = {
		labels: keys,
		datasets: [{
				fillColor: "rgba(151,187,205,0.05)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(151,187,205,1)",
				data: pct
		}, {
				fillColor: "rgba(220,220,220,0.05)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: ct
		}, {
				fillColor: "rgba(255,0,0,0.05)",
				strokeColor: "rgba(255,0,0,1)",
				pointColor: "rgba(255,0,0,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(255,0,0,1)",
				data: both_pct
		}, {
				fillColor: "rgba(0,153,0,0.05)",
				strokeColor: "rgba(0,153,0,1)",
				pointColor: "rgba(0,153,0,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(0,153,0,1)",
				data: mta_pct
		}]
	};

	if (chart4 !== undefined && typeof chart4 == 'object') {
		chart4.destroy();
	}

	var ctx = document.getElementById("chart4").getContext("2d");
	chart4 = new Chart(ctx).Line(line, {});
};

function rerunChart2Graphs () {
	var mtaonly = false;
	var btns = $(".rerunWithMTAOnly");
	btns.each(function (e) {
		ea = btns[e];
		if (ea.innerText == "Rerun With Only MTA Test Takers") {
			$(".rerunWithMTAOnly")[e].innerText = "Rerun With All Individuals"
			mtaonly = true;
		} else {
			$(".rerunWithMTAOnly")[e].innerText = "Rerun With Only MTA Test Takers"
			mtaonly = false;
		}
	});
	console.log("Running with mtaonly: " + mtaonly);
	canvas2Analysis(data, mtaonly);
	canvas2Analysis_bc(data, mtaonly);
};


