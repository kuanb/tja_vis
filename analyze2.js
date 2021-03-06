// GLOBALS
var data, chart1, chart2, chart3, chart4, chart5;


// UTILITIES

String.prototype.replaceAll = function (search, replace) {
	if (replace === undefined)
		return this.toString();
	return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

function roundHalf(num) {
	return Math.round(num*2)/2;
};

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function(){
	if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		try {
			data = JSON.parse(xmlhttp.responseText);
			q1_2_setup();
		} catch (e) {
			console.log("Error when loading data: ", e);
		}
	}
};
xmlhttp.open("GET", "anonResp.json", true);
xmlhttp.send();


// FUNCTIONS

function q1_2_setup () {
	var stat_cts = {};
	data.forEach(function (ea) {
		stat_cts[ea.status] = stat_cts[ea.status] == undefined ? 1 : stat_cts[ea.status] + 1;
	});
	var statuses = Object.keys(stat_cts);

	statuses1 = statuses.map(function (ea, ea_i) {
		return ' <span class="badge" style="cursor:pointer" ' + 
						'onclick="q1_draw(' + "'" + ea + "'" + ')">' +
						ea + ' (' + stat_cts[ea] + ')</span> ';
	}).join("");
	$("#status_types")[0].innerHTML = statuses1;

	statuses2 = statuses.map(function (ea, ea_i) {
		return ' <span class="badge" style="cursor:pointer" ' + 
						'onclick="q2_draw(' + "'" + ea + "'" + ')">' +
						ea + ' (' + stat_cts[ea] + ')</span> ';
	}).join("");
	$("#status_types_mentions")[0].innerHTML = statuses2;
	
	q1_draw("Selected Confirmed");
	q2_draw();
};

function q1_draw (key) {
	var phrase;
	if (key == undefined) {
		phrase = "Currently showing results for all statuses.";
	} else {
		phrase = "Currently showing results for: " + key;
	}
	$("#status_types_currently_showing")[0].innerText = phrase;

	var relevant_f = data.filter(function (ea) {
		return ea.status == key && ea.sex == "Female";
	}).length;
	var relevant_m = data.filter(function (ea) {
		return ea.status == key && ea.sex == "Male";
	}).length;
	var circle_data = [
	    {
	        value: relevant_f,
	        color:"#F7464A",
	        highlight: "#FF5A5E",
	        label: "Females"
	    },
	    {
	        value: relevant_m,
	        color: "#46BFBD",
	        highlight: "#5AD3D1",
	        label: "Males"
	    }
	];

	if (chart1 !== undefined && typeof chart1 == 'object') { chart1.destroy(); }
	var ctx = document.getElementById("chart_q1").getContext("2d");
	chart1 = new Chart(ctx).Doughnut(circle_data, {});
};

function q2_draw (key) {
	var phrase;
	if (key == undefined) {
		phrase = "Currently showing results for all statuses.";
	} else {
		phrase = "Currently showing results for: " + key;
	}
	$("#mentions_gender_currently_showing")[0].innerText = phrase;

	var relevant = data.filter(function (ea) {
		var to_return;
		if (key !== undefined) {
			to_return = ea.status == key;
		} else {
			to_return = true;
		}
		return to_return;
	});

	var mentioned = relevant.filter(function (ea) {
		var tb = ea.textBlob;
		var ok = false;
		if (tb.indexOf("harlem") > -1 && tb.indexOf("children") > -1 && tb.indexOf("zone") > -1) {
			ok = true;
		} else if (tb.indexOf("npower") > -1) {
			ok = true;
		}
		return ok;
	})

	relevant_f = mentioned.filter(function (ea) {
		return ea.sex == "Female";
	}).length;
	relevant_m = mentioned.filter(function (ea) {
		return ea.sex == "Male";
	}).length;
	relevant_o = mentioned.filter(function (ea) {
		return ea.sex !== "Female" && ea.sex !== "Male";
	}).length;

	var remainder_len = Number(((relevant.length - relevant_f - relevant_m - relevant_o)/relevant.length).toFixed(1));
	var remainder_len = relevant.length - relevant_f - relevant_m - relevant_o;
	// relevant_f = Number(((relevant_f)/relevant.length).toFixed(1));
	// relevant_m = Number(((relevant_m)/relevant.length).toFixed(1));
	// relevant_o = Number(((relevant_o)/relevant.length).toFixed(1));
	// console.log(remainder_len, relevant_f, relevant_m, relevant_o);
	var circle_data = [
	    {
	        value: relevant_f,
	        color:"pink",
	        highlight: "pink",
	        label: "Mentioned & Female"
	    },{
	        value: relevant_m,
	        color:"blue",
	        highlight: "blue",
	        label: "Mentioned & Male"
	    },{
	        value: relevant_o,
	        color:"green",
	        highlight: "green",
	        label: "Mentioned & Other"
	    },
	    {
	        value: remainder_len,
	        color: "grey",
	        highlight: "grey",
	        label: "No mention"
	    }
	];

	if (chart2 !== undefined && typeof chart2 == 'object') { chart2.destroy(); }
	var ctx = document.getElementById("chart_q2").getContext("2d");
	chart2 = new Chart(ctx).Doughnut(circle_data, {});
};















