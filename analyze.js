String.prototype.replaceAll = function (search, replace) {
  if (replace === undefined)
    return this.toString();
  return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

var data = '';
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function(){
  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
    data = JSON.parse(xmlhttp.responseText);
    parseLocs(data);
  }
};
xmlhttp.open("GET", "anonResp.json", true);
xmlhttp.send();

// globals
var chart, ctx;
// var markers = new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18});

function parseLocs (data) {
  data.forEach(function (d, i) {
    if (d.loc.geocode !== null) {
      var m = L.circle(d.loc.geocode, 10);
      m.addTo(map);
      // markers.addLayer(m);
    }
    if (data.length - 1 == i) {
      buildChart('race');
    }
  });
}


function buildData (arg) {
  var runFilter = $('#tabeFilter')[0].checked

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
      res = 2016 - yr;
      if (res == 116)
        console.log(d.dob.split('/'));
    } else if (arg == 'tabe_math' || arg == 'tabe_read') {
      if (d.hasOwnProperty('tabe')) {
        if (arg == 'tabe_math') {
          res = String(d.tabe.math);
        } else {
          res = String(d.tabe.read);
        }
        res = res.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '');
        if (isNaN(Number(res))) {
          console.log(i, d);
        }
      } else {
        res = 'No Score';
      }
    } else {
      res = d[arg];
      if (res == '') res = 'No Answer';
    }
    return res;
  });
  
  var counts = {};
  dd.forEach(function (x) { counts[x] = (counts[x] || 0)+1; });
  var keys = Object.keys(counts);

  if (arg == 'dob') {
    keys = Array.apply(null, {length: 70}).map(Number.call, Number)
  } else if (arg == 'avg_score') {
    keys = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
  } else if (arg == 'tabe_math' || arg == 'tabe_read') {
    keys = keys.sort(function (a, b) {
      if (a == 'No Score') { a = "100"; }
      if (b == 'No Score') { b = "100"; }
      console.log(Number(a), Number(b));
      return Number(a) - Number(b);
    });
  }

  var c = [];
  keys.forEach(function (k, ki) { 
    c.push(counts[k] || 0);
  });

  keys = keys.map(function (k) {
    if (k.length > 30) {
      k = k.substring(0, 30) + '...';
    }
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