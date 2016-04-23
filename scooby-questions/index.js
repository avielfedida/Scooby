var htmlparser = require("htmlparser2");
var fs = require("fs");
var mongoose = require('mongoose');
var spanOn = false;
const mongoPASS = new Buffer('BASE64_ENCODED_PASSWORD', 'base64');
const dbURI = "mongodb://USERNAME:" + mongoPASS + "@127.0.0.1:27017/DATABASE_NAME";
mongoose.connect(dbURI, {server:{auto_reconnect:false}});
var Schema = mongoose.Schema;
var resScheme = new Schema({
    reqResType: Number,
    resType: Number,
    id: String
},{ _id : false })
var stackScheme = new Schema({
  message:  String,
  // 0 type for quatations, 1 for dots, 2 for exclamations
  responses: [resScheme]
},{
    versionKey: false // http://aaronheckmann.tumblr.com/post/48943525537/mongoose-v3-part-1-versioning
});

var spanCount = 0;
var IntertedCount = 0;

// MongoDB will take the names of the models and treat them as collections without the Uppercase, for example Stack as stack
var Stack = mongoose.model('Stack', stackScheme);

function save(typeEmittedMsg, type, callback) {
    var newModel = new Stack({ message: typeEmittedMsg, responses: [], type: type });
    newModel.save((err, created) => {
        if(err) throw err;
        callback(created);
    });
}

var parser = new htmlparser.Parser({
    onopentag: function(name) {
        if(name === 'span') {
            spanCount++;
            spanOn = true;
        }
    },
	ontext: function(text) {
		if(spanOn === false) return;
        
        var withoutQuatationMark = text.slice(0, -1);
        save(withoutQuatationMark, 0, function() { IntertedCount++; })
        
        spanOn = false;
	},
    onend: function() {
        console.log("Finished, please check database size to ensure success");
        setInterval(function() {
            console.log('There are ' + spanCount + ' questions, ' + IntertedCount + ' inserted.');
            if(spanCount === IntertedCount) process.exit(0);
        }, 200);
    }
}, {decodeEntities: true});
mongoose.connection.on('error', console.error.bind(console, 'Connection error:'));
mongoose.connection.once('open', () => {
    fs.readFile('1868-questions.html', function(err, jsonBuf) {
        parser.write(jsonBuf.toString());
        parser.end();
    });
})

