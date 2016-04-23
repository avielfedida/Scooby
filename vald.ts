'use strict';
const MESSAGE = /^[\w\s\,\?\.\!\'\"]{1,81}$/; // Until 81 and not 80 because I might add extra dot(.), btw user maxlength is 80
export function message(txt: string) {
    // This line was coppied from the client side class and with NodeJS could be removed, I should check that.
    if(txt === null) return false; // If nothing was typed yet txt will be null, test(null) will be true for some reason I need to explore
    return MESSAGE.test(txt);
}
