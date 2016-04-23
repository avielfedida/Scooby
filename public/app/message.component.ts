import {Component, ElementRef, Input} from 'angular2/core';
@Component({
  selector: '.message-wrapper',
  template: `
    <div class="text-wrapper">{{txt}}</div>
  `
})
export class Message {
    @Input() txt;
    constructor(
        private _element: ElementRef
        ) {
        }
    ngAfterViewInit() {
        this._element.nativeElement.parentElement.parentElement.scrollTop =  this._element.nativeElement.parentElement.parentElement.scrollHeight;
        this._element.nativeElement.style.opacity = 1;
    }
}
