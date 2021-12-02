function median(values){
    if(values.length === 0) return 0;

    values.sort(function(a,b){
        return a-b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

function id_cleanup(groupfullname){
    let charsToReplace = [" ", "(", ")", ",", "'", ".", "ö", "ü", "ā", , "&", "é", "è", "/", "’", "É", "-", "ã"]
    let tmp = groupfullname;
    for (let char of charsToReplace) tmp = tmp.replaceAll(char, "")
    return tmp;
}

function id_cleanup_no_space(groupfullname){
  let charsToReplace = ["'", ".", "ö", "ü", "ā", , "&", "é", "è", "/", "’", "É", "-", "ã"]
  let tmp = groupfullname;
  for (let char of charsToReplace) tmp = tmp.replaceAll(char, "")
  return tmp;
}

const asc = arr => arr.sort((a, b) => a - b);

const sum = arr => arr.reduce((a, b) => a + b, 0);

const mean = arr => sum(arr) / arr.length;

// sample standard deviation
const std = (arr) => {
    const mu = mean(arr);
    const diffArr = arr.map(a => (a - mu) ** 2);
    return Math.sqrt(sum(diffArr) / (arr.length - 1));
};

const quantile = (arr, q) => {
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

function permutator(inputArr) {
    var results = [];
  
    function permute(arr, memo) {
      var cur, memo = memo || [];
  
      for (var i = 0; i < arr.length; i++) {
        cur = arr.splice(i, 1);
        if (arr.length === 0) {
          results.push(memo.concat(cur));
        }
        permute(arr.slice(), memo.concat(cur));
        arr.splice(i, 0, cur[0]);
      }
  
      return results;
    }
  
    return permute(inputArr);
  }

function textWrap(text, params) {

}

  try {
    module.exports = exports = {
        permutator, median, id_cleanup
    };
 } catch (e) {}