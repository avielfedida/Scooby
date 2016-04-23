import {Component, Output, EventEmitter}    from 'angular2/core';
import {RouteParams, Router}                from 'angular2/router';
import {Observable}                         from 'rxjs/Rx';

import {Doctor}                             from './doctor.service';
import {Patient}                            from   './patient.component';
import {Message}                            from   './message.component';
import {SocketHelper}                       from './socket.service';
import {Vald}                               from './vald.service';

interface Message {
  content: string;
  className: string;
}

@Component({
  templateUrl: 'partials/treatment.component.html',
  providers: [Doctor, SocketHelper, Vald],
  directives: [Patient, Message]
})
export class Treatment {
  private randomBurstsStream: Observable<any>;
  private submittionStream: Observable<string>;
  private valChangesStream: Observable<Array<string>>;
  private reqResStream: Observable<string>;
  private inActivityLimit: number = 5;

  public messages = [];
  public deadLine: Date;
  public ready: boolean = false;
  
  constructor(
    private _socket: SocketHelper,
    private _routeParams:RouteParams,
    private _router: Router,
    private _vald: Vald,
    private _doctor: Doctor
  ) {
  }
  ngOnDestroy() {
      // Prevent memory leaks when unexpected out-of-room happened.
      this.streamsCleaner();
  }
   private streamsCleaner() {
    // Unsubscribe before exiting the route(inside a setTimeout because I'm inside operator, If I'd use just unsubscribe while inside I'd get something like "no method slice of null")
    setTimeout(()=>{
        this.valChangesStream.unsubscribe();
        this.submittionStream.unsubscribe();
        this.reqResStream.unsubscribe();
    });      
  }
  formatMessage(txt: string) {
      
      // I will later use \w so I remove unwanted underscores + trim
      let preFormat = txt.replace('_', ' ').trim();
      preFormat = preFormat.charAt(0).toUpperCase() + preFormat.slice(1);
      
      if(
        preFormat.lastIndexOf('.') === (preFormat.length-1) || // Ends with dot(.)
        preFormat.lastIndexOf('?') === (preFormat.length-1) || // Ends with quatation mark(?)  
        preFormat.lastIndexOf('!') === (preFormat.length-1) // Ends with exclamation mark(!)
        ) {
        return preFormat;
      }
      else {
          // Ends with comma(,), replace with dot(.)
          if(preFormat.lastIndexOf(',') === (preFormat.length-1)) {
              preFormat = (preFormat.slice(0,preFormat.length-1)+'.');
          }
          else { // Ends with just text, add a dot(.)
              preFormat += '.';
          }
          
          if(this._vald.message(preFormat)) {
              return preFormat;
          }
          else {
              // I need to take care about that kind of case, how should I show that to the user
              console.error('Invalid text, should not happen, take a look...')
              return 'INVALID TEXT';
          }
      }
  }

  patientReady(streams) {
    let inActivityCountes = 0;
    let prevArray = [];

    // Disable random bursts for now    
    // this.randomBurstsStream = this._doctor.randomBursts(this.treatTime) // 5min treatment
    // .subscribe(data => this.messages.push(this.basicMessage('DOCTOR', data)), err => console.log('Error: %s', err));
    
    this.valChangesStream = streams
    .valueChanges
    .debounceTime(500)
    .distinctUntilChanged()
    .bufferTime(10000)
    .map(scalarArray => {
        if(scalarArray.length === 0 && prevArray.length === 0) {
            // Generate a message only when the values are the same(both length 0)
            inActivityCountes++;
            if(this.inActivityLimit < inActivityCountes) {
                // Get something from the server
                this._socket.connect().pullRandom();
                // Reset inActivityCountes
                inActivityCountes = 0;
                // MAYBE I SHOULD LIMIT THE RESETS?, SO THAT USER WON'T GO FOR 20MIN THEN SEE TONES OF MESSAGES.
            }
        }
        else {
            prevArray = scalarArray.slice(0); // Clone, could later use Object.assign or JSON.stringify=>JSON.parse
            inActivityCountes = 0; // Start-over
        }
        return scalarArray;
    })
    .subscribe(scalarArray => {// I can later used for something...
    }, err => console.log('Error: %s', err));
    this.reqResStream =
    Observable.merge(
        Observable.fromEvent(this._socket.getSocket(), 'response'),
        Observable.fromEvent(this._socket.getSocket(), 'request')
    )
    .subscribe(msg => {
        console.log('Got req/res from botalk:' + msg);
        this.messages.push(this.basicMessage('BOTALK', msg));
    });
    this.submittionStream = streams
    .submittion
    .map(element => {
        let val = this.formatMessage(element.value);
        element.value = '';
        this.messages.push(this.basicMessage('CLIENT', val));
        return val;
    })
    .subscribe(val => {
        this._socket.connect().send(val);
    }, err => {
        console.log('Error: %s', err);
    });
  }
  
  basicMessage(type, content): Message {
    return {
      content: content,
      className: type === 'BOTALK' ? 'botalk' : 'client'
    }
  }
}