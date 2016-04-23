'use strict';
function getTypeChar(type) {
    switch (type) {
        case 0:
            return '?';
            break;
        case 1:
            return '.';
            break;
        case 2:
            return '!';
            break;
    }
}
exports.getTypeChar = getTypeChar;
function getType(msg) {
    var type = msg.slice(-1);
    switch (type) {
        case '?':
            type = 0;
            break;
        case '.':
            type = 1;
            break;
        case '!':
            type = 2;
            break;
    }
    return type;
}
exports.getType = getType;
function getFirstWord(str) {
    if (str.indexOf(' ') === -1)
        return str;
    else
        return str.substr(0, str.indexOf(' '));
}
exports.getFirstWord = getFirstWord;
function getMessage(msg) {
    return msg.slice(msg, msg.length - 1);
}
exports.getMessage = getMessage;
function createRegExp(typeEmmitedMsg, loa) {
    var splitted = typeEmmitedMsg.split(' ');
    var layers = []; // For 'Aviel went home' -> ['Aviel went home', 'Aviel went', 'Aviel', 'went', 'home']
    // Number of layers = ( splitted(length) + splitted(length-1) )
    // For start, cover the splitted(length) from above equation.
    // Notice that I skip the first one because the last below iteration will insert it. 
    layers = splitted.slice(1);
    var i = splitted.length;
    var iterationLayers = [];
    while (i--) {
        var splittedClone = splitted.slice(0);
        // I'm using iterationLayers to temporarily hold the pushed data, I can't just drop it into the layers array due to 
        // ordering problem(layers = splitted.slice(1)), layers.push will insert them last and unshift will insert them first 
        // reversed order ->  ['Aviel', 'Aviel went', 'Aviel went home', , 'went', 'home'].
        iterationLayers.push(splittedClone.join(' '));
        splitted.pop();
    }
    layers = iterationLayers.concat(layers);
    // loa stands for level of accuracy, used to limit the number of layers.
    // Instead of below example ['Aviel went home', 'Aviel went', 'Aviel', 'went', 'home'], for loa 2 will results with:
    // ['Aviel went home', 'Aviel went']
    // The default is no accuracy at all if loa isn't specified or set to 0
    if (loa)
        layers = layers.slice(0, loa);
    return {
        regExp: new RegExp(layers.join('|'), 'i'),
        layers: layers,
        numberOfLayers: layers.length
    };
}
exports.createRegExp = createRegExp;
