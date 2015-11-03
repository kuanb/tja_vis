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
      res = 2016 - yr;
    } else if (arg == 'tabe_math' || arg == 'tabe_read') {
      if (d.hasOwnProperty('tabe')) {
        if (arg == 'tabe_math') {
          res = String(d.tabe.math);
        } else {
          res = String(d.tabe.read);
        }
        res = res.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '');
        res = roundHalf(Number(res));
        console.log(res);
      } else {
        res = 'No Score';
      }
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
  var keys = Object.keys(counts).sort();

  if (arg == 'dob') {
    keys = Array.apply(null, {length: 70}).map(Number.call, Number)
  } else if (arg == 'avg_score') {
    keys = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
    if (runFilter) {
      var kk = [];
      keys.forEach(function (val) {
        kk.push(val + ' (Failed)');
      });
      keys.forEach(function (val) {
        kk.push(val + ' (Passed)');
      });
      var keys = kk;
    }
  } else if (arg == 'tabe_math' || arg == 'tabe_read') {
    // keys = keys.sort(function (a, b) {
    //   if (a == 'No Score') { a = "100"; }
    //   else if (b == 'No Score') { b = "100"; }
    //   else {
    //     a = a.replaceAll(' ()', '').replaceAll(' (Passed)', '');
    //     b = b.replaceAll(' (Failed)', '').replaceAll(' (Passed)', '');
    //   }
    //   return Number(a) - Number(b);
    // });

    if (runFilter) {
      keys1 = [];
      keys2 = [];
      var aa = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
      aa.forEach(function (val) {
        keys1.push(val + ' (Failed)');
        keys2.push(val + ' (Passed)');
      });
      keys = keys1.concat(keys2);
      keys.push('No Score');
    } else {
      keys = [];
      var aa = Array.apply(null, {length: 30}).map(function (n, i) {  return 0.5*i; });
      aa.forEach(function (val) {
        keys.push(val);
      });
      keys.push('No Score');
    }
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