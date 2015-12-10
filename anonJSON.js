fs = require('fs');

String.prototype.replaceAll = function (search, replace) {
	if (replace === undefined)
		return this.toString();
	return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};


var commonWords = ["word","the","be","to","of","and","a","in","that","have","I","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us"];

function isCommon (word) {
	if (commonWords.indexOf(word) > -1) {
		return true;
	} else {
		return false;
	}
};

function uniq(a) {
	return a.sort().filter(function(item, pos, ary) {
	  return !pos || item != ary[pos - 1];
	})
}


function shuffle(array) {
	array = array.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	array = array.replace(/\s{2,}/g," ");
	array = array.split(" ");
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  array = array.filter(function (ea) {
  	return !isCommon(ea) && ea.length > 4;
  });

  array = array.map(function (ea) {
  	return ea.toLowerCase();
  });

  array = uniq(array);

  return array.join(" ");
}

fs.readFile('responses.json', 'utf-8', function (err, data) {
	if (err) {
		throw err;
	} else {
		data = JSON.parse(data);
		data = data.map(function (d) {

			var textBlob  = shuffle([shuffle(d.experience), shuffle(d.plans_post), shuffle(d.problem_solving_essay)].join(" "))

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
				tabe: d.tabe,
				mta: d.mta,
				interview: d.interview,
				status: d.status,
				textBlob: textBlob
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