import {Observable} from 'rxjs/Rx';
import {Injectable} from 'angular2/core';

import {BurstInterval} from './burst-interval.service';

@Injectable()
export class Doctor {
    public responseDelay = {min: 2, max: 5}; // Seconds
    public inActivityResponsesLimit = 5; // Kicked out of the treatment session when reached.
    private _submittionMessages = {
        
        "food": {// Level 1 is the subject
            "want": {// Level 2 is the action
                "to": {// Level 3 is the relation to level 4
                    "take": "So just take", // Level 4, Level 2 in relation of Level 3 produces message by Level 4
                    "help": "Pick a number within your food"
                },
                "a": {
                    
                }
            },
            "got": {
                
            }
        },
        "game": {
            "play": {
                
            },
            "pay": {
                
            }
        }
    };
    private _overThinkingMessages = ['Stop thinking about fat ladies', 'Hand me your phone to type you\'r fucking message', 'I will burn this phone, just type ENTER'];
    private _burstsMessages = ['I need cash', 'Just kill me', 'I like myself', 'Let\'s flip a coin', 'When your funeral takes place?', 'I\'m all out of love'];
    constructor() {}
    randomArrayIndexes(arrayLen: number) {
        // fill(null) is used to able map iterate
        return Array(arrayLen).fill(null)
                .map(val => this.randomIntegers(0, arrayLen-1))
                .filter((val, ind, arr) => (arr.indexOf(val, ind + 1) < 0)) // Filter duplications
    }
    randomBursts(treatTime: number) { // treatTime units are seconds
        let indexes = this.randomArrayIndexes(this._burstsMessages.length)
        // Min/Max delay for each message once the brust begin
        let minDelay = 60;
        let maxDelay = 180;
        if(minDelay > maxDelay) minDelay = Math.floor(maxDelay/2);
        if(maxDelay > treatTime) maxDelay = treatTime;
        return Observable
                .from(indexes)
                .concatMap((indexVal: number, indexIndex: number) => {
                    return Observable
                            .of(this._burstsMessages[indexVal])
                            .delay(this.randomIntegers(minDelay, maxDelay) * 1000);
                });
    }
    overThinkingResponse() {
        return this._overThinkingMessages[this.randomIntegers(0, this._overThinkingMessages.length-1)];
    }
    private compondResponse(messagesArray) {
        return 'Compond response';
    }
    submittionResponse(msg): string { // The argument name was messagesArray
        // if(messagesArray.length === 1) {
        if(true) { // For now I disabled the compondResponse
            // let msg = messagesArray[0];
            for(let level_1 in this._submittionMessages) { // Level 1
                if(msg.indexOf(level_1) < 0) continue; // If no match continue
                for(let level_2 in this._submittionMessages[level_1]) { // Level 2
                    if(msg.indexOf(level_2) < 0) continue; // If no match continue
                    for(let level_3 in this._submittionMessages[level_1][level_2]) { // Level 3
                        if(msg.indexOf(level_3) < 0) continue; // If no match continue
                        for(let level_4 in this._submittionMessages[level_1][level_2][level_3]) { // Leve 4
                            if(msg.indexOf(level_4) < 0) continue; // If no match continue
                            return this._submittionMessages[level_1][level_2][level_3][level_4];
                        }
                    }
                }
            }
            return msg;
        }
        else {
            return this.compondResponse(messagesArray);
        }
    }
    typingResponse() {

    }
    randomIntegers(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
