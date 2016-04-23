// bigString is a line after line of questions or so..., notice that the last line must ends with \n
// The \n within the replace callback is used to make the output easy to past.
// To adjust different sources play with the pattern
bigString.replace(/([ \s\S]+?)\n/g, function(str, match1) {return '\n<li><span>'+match1+'</span></li>';});