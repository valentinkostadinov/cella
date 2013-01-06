var fs = require('fs');
var path = require('path');

var validExtensions = {
    '.rle' : true,
    '.lif' : true
}

function listing(root) {
    return fs.readdirSync(root).map(function(filename) {
        var filepath = path.join(root, filename);
        var stats = fs.statSync(filepath)
        if (stats.isFile()) {
            return filename
        }
        return [filename, listing(filepath)]
    }).filter(function(filename) {
        return Array.isArray(filename) || (path.extname(filename).toLowerCase() in validExtensions)
    });
}

fs.writeFile('index.json', JSON.stringify(listing(process.cwd())));

