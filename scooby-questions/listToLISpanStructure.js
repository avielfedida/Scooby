/*
If you find any other questions on the internet(like a really big list) you can copy the list into a 
variable called bigString and it will convert the list into <li> that you can past into x-questions.html file.
To adjust different sources(list with numbers or some other list) play with the pattern.
*/
var bigString = 'Past here a list';
bigString.replace(/([ \s\S]+?)\n/g, function(str, match1) {return '\n<li><span>'+match1+'</span></li>';});
console.log(bigString);