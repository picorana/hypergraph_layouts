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