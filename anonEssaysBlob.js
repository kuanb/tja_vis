fs = require('fs');

var commonWords = ["word","the","be","to","of","and","a","in","that","have","I","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us"];

function isCommon (word) {
	if (commonWords.indexOf(word) > -1) {
		return true;
	} else {
		return false;
	}
}

fs.readFile('responses.json', 'utf-8', function (err, data) {
	if (err) {
		throw err;
	} else {
		var superText = {experience: {}, plans_post: {}, problem_solving_essay: {}};

		data = JSON.parse(data);
		data = data.forEach(function (d) {
			d.experience.split(" ").forEach(function (x) {
				x = x.replace("\r", "")
				x = x.replace("\n", "")
				if (x.length > 4 && !isCommon(x)) {
					superText["experience"][x] = (superText["experience"][x] || 0) + 1;
				}
			});

			d.plans_post.split(" ").forEach(function (x) {
				x = x.replace("\r", "")
				x = x.replace("\n", "")
				if (x.length > 4 && !isCommon(x)) {
					superText["plans_post"][x] = (superText["plans_post"][x] || 0) + 1;
				}
			});

			d.problem_solving_essay.split(" ").forEach(function (x) {
				x = x.replace("\r", "")
				x = x.replace("\n", "")
				if (x.length > 4 && !isCommon(x)) {
					superText["problem_solving_essay"][x] = (superText["problem_solving_essay"][x] || 0) + 1;
				}
			});
		});

		var finalOut = {experience: [], plans_post: [], problem_solving_essay: []};

		Object.keys(superText).forEach(function (key) {
			Object.keys(superText[key]).forEach(function (txt) {
				var add = {text: txt, weight: superText[key][txt]};
				finalOut[key].push(add);
			});
		});

		finalOut = JSON.stringify(finalOut);

		fs.writeFile('anonEssaysBlob.json', finalOut, function (err) {
			if (err) {
				throw err;
			} else {
				console.log('Done.')
			}
		});
	}
});