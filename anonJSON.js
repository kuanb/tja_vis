fs = require('fs');

fs.readFile('responses.json', 'utf-8', function (err, data) {
	if (err) {
		throw err;
	} else {
		data = JSON.parse(data);
		data = data.map(function (d) {
			return {
				race: d.race,
				ethnicity: d.ethnicity,
				sex: d.sex,
				prior_training: d.prior_training,
				pipeline: d.pipeline,
				other_commitments: d.other_commitments,
				employment: d.employment,
				education: d.education,
				dob: d.dob,
				veteran: d.veteran,
				veteran_spouse: d.veteran_spouse,
				avg_score: d.avg_score,
				loc: d.loc,
				exposure: d.exposure,
				legal: d.legal,
				wages: d.wages,
				exposure: d.exposure,
				home_computer: d.home_computer,
				home_internet: d.home_internet,
				submitted: d.submitted,
				tabe: d.tabe
			}
		});
		data = JSON.stringify(data);
		fs.writeFile('anonResp.json', data, function (err) {
			if (err) {
				throw err;
			} else {
				console.log('Done.')
			}
		});
	}
});