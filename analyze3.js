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
			qs_setup();
		} catch (e) {
			console.log("Error when loading data: ", e);
		}
	}
};
xmlhttp.open("GET", "anonResp.json", true);
xmlhttp.send();


// FUNCTIONS

function qs_setup () {
	var stat_cts = {};
	data.forEach(function (ea) {
		var stars = (Number(ea.avg_score.replace("%", ""))*5/100).toFixed(1);
		if (stat_cts[stars] == undefined) stat_cts[stars] = []; 
		stat_cts[stars].push(ea);
	});
	data = stat_cts;
	stat_cts = null;

	draw_graphs();
};

function draw_graphs () {
	var pass_vals = {
		tabe_math: Number($("#tabe_math")[0].value),
		tabe_read: Number($("#tabe_read")[0].value),
		mta: Number($("#mta")[0].value),
	};
	
	var res = {men: [], women: [], all: []};
	var keys = Object.keys(data).sort(function(a, b) {return Number(a) - Number(b)});

	// Q1 GRAPHS
	keys.forEach(function (key) {
		var men = []; women = []; all = [];
		data[key].forEach(function (ea) {
			all.push(ea);
			if (ea.sex == "Male") men.push(ea);
			else if (ea.sex == "Female") women.push(ea);
		});
		res.all.push(all);
		res.men.push(men);
		res.women.push(women);
		men = women = all = [];
	});

	var cts = {
		all: res.all.map(function (ea) { return ea.length }),
		men: res.men.map(function (ea) { return ea.length }),
		women: res.women.map(function (ea) { return ea.length })
	};

	var graph_info_1a = {labels: keys, datasets: [{fillColor: "orange", data: cts.all}]};
	var ctx = document.getElementById("chart_q1a").getContext("2d");
	try { q1a_chart.destroy(); } catch (e) {}
	q1a_chart = new Chart(ctx).Bar(graph_info_1a, {});

	var graph_info_1b = {labels: keys, datasets: [{fillColor: "blue", data: cts.men}]};
	var ctx = document.getElementById("chart_q1b").getContext("2d");
	try { q1b_chart.destroy(); } catch (e) {}
	q1b_chart = new Chart(ctx).Bar(graph_info_1b, {});

	var graph_info_1c = {labels: keys, datasets: [{fillColor: "red", data: cts.women}]};
	var ctx = document.getElementById("chart_q1c").getContext("2d");
	try { q1c_chart.destroy(); } catch (e) {}
	q1c_chart = new Chart(ctx).Bar(graph_info_1c, {});

	var graph_info_1d = {labels: keys, datasets: [{fillColor: "blue", data: cts.men}, {fillColor: "red", data: cts.women}, {fillColor: "orange", data: cts.all}]};
	var ctx = document.getElementById("chart_q1d").getContext("2d");
	try { q1d_chart.destroy(); } catch (e) {}
	q1d_chart = new Chart(ctx).Bar(graph_info_1d, {});

	// Q2 GRAPHS
	var pass_tabe = {all: [], men: [], women: []};

	for (var gender in pass_tabe) {
		res[gender].forEach(function (ea) {
			var passed = 0;
			ea.forEach(function (prsn) {
				var pass = true;
				try {
					if (Number(prsn.tabe.math.replace(/[^\d.-]/g, '')) < pass_vals.tabe_math) pass = false;
					if (Number(prsn.tabe.read.replace(/[^\d.-]/g, '')) < pass_vals.tabe_read) pass = false;
					if (pass) passed += 1;
				} catch (e) {
					console.log("Failed to parse: ", prsn);
				}
			});
			pass_tabe[gender].push(passed);
		});
	};

	var graph_info_2a = {labels: keys, datasets: [{fillColor: "blue", data: pass_tabe.men}, {fillColor: "red", data: pass_tabe.women}, {fillColor: "orange", data: pass_tabe.all}]};
	var ctx = document.getElementById("chart_q2a").getContext("2d");
	try { q1d_chart.destroy(); } catch (e) {}
	q2a_chart = new Chart(ctx).Bar(graph_info_2a, {});

	var pct_pass_tabe = {all: [], men: [], women: []};
	for (var gender in pass_tabe) {
		var pctg = [];
		pass_tabe[gender].forEach(function (ea, i) {
			pctg.push(Number((ea/cts[gender][i]*100).toFixed(2)));
		})
		pct_pass_tabe[gender] = pctg;
	};

	var pct_pass_tabe_all_based_on_tot_pop = {all: [], men: [], women: []};
	for (var gender in pass_tabe) {
		var pctg = [];
		pass_tabe[gender].forEach(function (ea, i) {
			pctg.push(Number((ea/cts.all[i]*100).toFixed(2)));
		})
		pct_pass_tabe_all_based_on_tot_pop[gender] = pctg;
	};

	var graph_info_2b = {labels: keys, datasets: [{fillColor: "orange", data: pct_pass_tabe.all}]};
	var ctx = document.getElementById("chart_q2b").getContext("2d");
	try { q2b_chart.destroy(); } catch (e) {}
	q2b_chart = new Chart(ctx).Line(graph_info_2b, {bezierCurve:false});

	var graph_info_2c = {labels: keys, datasets: [{fillColor: "blue", data: pct_pass_tabe.men}]};
	var ctx = document.getElementById("chart_q2c").getContext("2d");
	try { q2c_chart.destroy(); } catch (e) {}
	q2c_chart = new Chart(ctx).Line(graph_info_2c, {bezierCurve:false});

	var graph_info_2d = {labels: keys, datasets: [{fillColor: "red", data: pct_pass_tabe.women}]};
	var ctx = document.getElementById("chart_q2d").getContext("2d");
	try { q2d_chart.destroy(); } catch (e) {}
	q2d_chart = new Chart(ctx).Line(graph_info_2d, {bezierCurve:false});

	var graph_info_2e = {labels: keys, datasets: [{fillColor: "blue", data: pct_pass_tabe_all_based_on_tot_pop.men}, {fillColor: "red", data: pct_pass_tabe_all_based_on_tot_pop.women}, {fillColor: "orange", data: pct_pass_tabe_all_based_on_tot_pop.all}]};
	var ctx = document.getElementById("chart_q2e").getContext("2d");
	try { q2e_chart.destroy(); } catch (e) {}
	q2e_chart = new Chart(ctx).Bar(graph_info_2e, {});


	// Q3 MTA
	var pass_mta = {all: [], men: [], women: []};

	for (var gender in pass_mta) {
		res[gender].forEach(function (ea) {
			var passed = 0;
			ea.forEach(function (prsn) {
				try {
					var pass = true;
					if (Number(prsn.tabe.math.replace(/[^\d.-]/g, '')) < pass_vals.tabe_math) pass = false;
					if (Number(prsn.tabe.read.replace(/[^\d.-]/g, '')) < pass_vals.tabe_read) pass = false;

					if (pass) {
						var mta = false, retest = false;
						if (Number(prsn.mta.score.replace(/[^\d.-]/g, '')) >= pass_vals.mta) mta = true;
						if (Number(prsn.mta.retest.replace(/[^\d.-]/g, '')) >= pass_vals.mta) retest = true;
						if (mta || retest) passed += 1;
					}
				} catch (e) {
					console.log("Failed to parse: ", prsn);
				}
			});
			pass_mta[gender].push(passed);
		});
	};

	var pct_pass_mta = {all: [], men: [], women: []};
	for (var gender in pass_mta) {
		var pctg = [];
		pass_mta[gender].forEach(function (ea, i) {
			pctg.push(Number((ea/cts[gender][i]*100).toFixed(2)));
		})
		pct_pass_mta[gender] = pctg;
	};

	var pct_pass_mta_all_based_on_tot_pop = {all: [], men: [], women: []};
	for (var gender in pass_mta) {
		var pctg = [];
		pass_mta[gender].forEach(function (ea, i) {
			pctg.push(Number((ea/cts.all[i]*100).toFixed(2)));
		})
		pct_pass_mta_all_based_on_tot_pop[gender] = pctg;
	};

	var graph_info_3a = {labels: keys, datasets: [{fillColor: "blue", data: pass_mta.men}, {fillColor: "red", data: pass_mta.women}, {fillColor: "orange", data: pass_mta.all}]};
	var ctx = document.getElementById("chart_q3a").getContext("2d");
	try { q3a_chart.destroy(); } catch (e) {}
	q3a_chart = new Chart(ctx).Bar(graph_info_3a, {});

	var graph_info_3b = {labels: keys, datasets: [{fillColor: "orange", data: pct_pass_mta.all}]};
	var ctx = document.getElementById("chart_q3b").getContext("2d");
	try { q3b_chart.destroy(); } catch (e) {}
	q3b_chart = new Chart(ctx).Line(graph_info_3b, {bezierCurve:false});

	var graph_info_3c = {labels: keys, datasets: [{fillColor: "blue", data: pct_pass_mta.men}]};
	var ctx = document.getElementById("chart_q3c").getContext("2d");
	try { q3c_chart.destroy(); } catch (e) {}
	q3c_chart = new Chart(ctx).Line(graph_info_3c, {bezierCurve:false});

	var graph_info_3d = {labels: keys, datasets: [{fillColor: "red", data: pct_pass_mta.women}]};
	var ctx = document.getElementById("chart_q3d").getContext("2d");
	try { q3d_chart.destroy(); } catch (e) {}
	q3d_chart = new Chart(ctx).Line(graph_info_3d, {bezierCurve:false});

	var graph_info_3e = {labels: keys, datasets: [{fillColor: "blue", data: pct_pass_mta_all_based_on_tot_pop.men}, {fillColor: "red", data: pct_pass_mta_all_based_on_tot_pop.women}, {fillColor: "orange", data: pct_pass_mta_all_based_on_tot_pop.all}]};
	var ctx = document.getElementById("chart_q3e").getContext("2d");
	try { q3e_chart.destroy(); } catch (e) {}
	q3e_chart = new Chart(ctx).Bar(graph_info_2e, {});





	console.log("pass_mta", pass_mta);

};






