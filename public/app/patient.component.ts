import {Component, Input, Output, Inject, forwardRef, EventEmitter, ElementRef} from 'angular2/core';
import {Control, FORM_DIRECTIVES}                                               from 'angular2/common';
import {SocketHelper}                                                           from './socket.service';
import {Observable}                                                             from 'rxjs/Rx';

import {Vald} from './vald.service';

@Component({
  selector: '.patient-form',
  directives: [FORM_DIRECTIVES],
  providers: [Vald],
  template: `
    <div [ngStyle]="{'opacity': (patientText.value && !vald.message(patientText.value)) ? '1' : '0'}" class="tooltip">
        Unallowed characters
    </div>
    <form novalidate>
        <input class="input" required (focus)="scrollTop()" type="text" maxlength="80" [ngFormControl]="patientText"  placeholder="Type here..." autocomplete="off" />
        <button type="submit" [disabled]="!patientText.valid" (click)="refocus($event)" [ngClass]="{ 'ongoing': ongoing }" class="send"></button>
    </form>
  `
}) // Notice that I use [disabled], I do this to unburden the number of event emitted to submittion stream
export class Patient {
    @Output() patientReady = new EventEmitter();
    public ongoing: boolean = false;
    public patientText = new Control();
    // constructor(@Inject(forwardRef(() => Treatment)) private _parent:Treatment) {
    constructor(
        private _socket: SocketHelper,
        private _element: ElementRef,
        public vald: Vald
        ) {
            Observable.merge
            (
                Observable.fromEvent(this._socket.getSocket(), 'response'),
                Observable.fromEvent(this._socket.getSocket(), 'request')
            )
            .subscribe(msg => {
                this.responseArrived();
            });
        }
    ngAfterContentInit() {
        this.patientReady.next({
            'valueChanges': this.patientText.valueChanges,
            'submittion': Observable.fromEvent(this._element.nativeElement, 'submit').map((element: Event): HTMLFormElement => {
                return element.target[0];
            })
            .filter(element => element.value.length>0)
            .filter(element => {
                // The addition of this.ongoing === false is to prevent from submittion of messages while response from server wasn't arrived yet(if I type fast 'a'=>Enter 'a'=>Enter and so on I can get responses sequence from the server and that is what this addition came to prevent).
                if(this.vald.message(element.value) && this.ongoing === false) {
                    this.ongoing = true;
                    return true;
                }
                else {
                    return false;
                }
            })
        });
    }
    responseArrived() {
        this.ongoing = false;
        // console.log(this._element.nativeElement.firstElementChild.lastElementChild);
    }
    scrollTop() {
        setTimeout(() => {
            this._element.nativeElement.previousElementSibling.scrollTop =  this._element.nativeElement.previousElementSibling.scrollHeight;
        }, 1500); // Approximately the time(safe time) it will take the keyboard to jump
    }
    refocus(evt) {
        evt.srcElement.previousElementSibling.focus();
    }
}
