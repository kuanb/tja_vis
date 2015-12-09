String.prototype.replaceAll = function (search, replace) {
  if (replace === undefined)
    return this.toString();
  return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};



var fs = require('fs');

var placed = 0;

fs.readFile('tabe_res.csv', 'utf-8', function (err, data) {
	if (err) {
		throw err;
	} else {


		fs.readFile('responses.json', 'utf-8', function (err, ppl) {
			if (err) {
				throw err;
			} else {

				ppl = JSON.parse(ppl);
				data = data.split('\r\n');
				var cols = data.shift().split(',');

				data.forEach(function (row, i) {
					row = row.split(',');

					var first = row[0] || '';
					var last = row[1] || '';
					var tabe = {
						read: row[2] || '',
						math: row[3] || '',
						date: row[4] || ''
					};
					var mta = {
						score: row[5] || '',
						retest: row[6] || ''
					};
					var interview = row[7] || '';


					if (first !== '' && last !== '') {
						first = first.toLowerCase();
						last = last.toLowerCase();

						var hit = false;

						ppl.forEach(function (p, i) {
							var n = p.name.toLowerCase();

							// janky - we assume that no two users have the same name (is this valid?)
							if (n.indexOf(first) > -1 && n.indexOf(last) > -1 ) {  //&& ppl[i].hasOwnProperty('tabe') == false
								ppl[i]['tabe'] = tabe;
								ppl[i]['mta'] = mta;
								ppl[i]['interview'] = interview;
								hit = true;
								placed += 1;
							}

							if (ppl[i].hasOwnProperty('tabe')) {
								var m = isNaN(Number(ppl[i]['tabe'].math.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')));
								var r = isNaN(Number(ppl[i]['tabe'].read.replaceAll(' ', '').replaceAll('*', '').replaceAll('+', '')));
								if (m || r) {
									delete ppl[i]['tabe'];
								}
							}
						});

						if (hit == false) {
							console.log('Failed to place: ', first, last);
						}
					} else {
						console.log('The following name is missing either a first of last portion: ' + first + ' ' + last);
					}
				});

				ppl = JSON.stringify(ppl);
				fs.writeFile('responses.json', ppl, function (err) {
					if (err) {
						throw err;
					} else {
						console.log('Done. Number placed: ' + placed + ' out of ' + data.length + '. Writing to results disk.');
					}
				});

			}
		});



	}
});




