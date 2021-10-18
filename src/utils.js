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

  try {
    module.exports = exports = {
        permutator, median, id_cleanup
    };
 } catch (e) {}