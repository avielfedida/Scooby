export class Vald {
    private MESSAGE = /^[\w\s\,\?\.\!\"\']{1,81}$/; // Until 81 and not 80 because I might add extra dot(.), btw user maxlength is 80
    message(txt: string) {
      if(txt === null) return false; // If nothing was typed yet txt will be null, test(null) will be true for some reason I need to explore
      return this.MESSAGE.test(txt);
    }
}
