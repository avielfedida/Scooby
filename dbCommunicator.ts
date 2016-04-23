'use strict';
export default class dbCommunicator {
    private _requestTypesRatio = [1,1,1,1,1,2,2];
    private _emptyArraysForceRatio = [0,0,0,0,0,0,0,1,1,1];
    /*
    To allow the bot to remain actual to time period, what I say is that it will always response with the 3(currently) 
    recently updated responses, for example for the question "Where are you from?" the 3 latest responses were "America", 
    "England" and "Israel", so instead of picking for ["America", "England", "Israel", "Greek", "Turky"], it will use 
    the recently unshifted elements(notice I use $unshift to update the responses array).
    */
    private recentLimit = 3; // The latest newest responses
    constructor(
        public db,
        private _model,
        private _qWords,
        private _mqWords
    ) {}
    // Usage deprecated for now(usage is like: this.flattedMostRecent(possibleResponses, 'at', 'id'))
    flattedMostRecent(arrayToSort, sortBy, flatBy) {
        if(!flatBy) throw "missing parameter: flatBy";
        var arr = arrayToSort.slice(0).sort((a,b) => {
            return a[sortBy] - b[sortBy];
        });
        return arr.slice(0, this.recentLimit).map( el => {
            return el[flatBy];
        });
    }
    getType(msg) {
        let type = msg.slice(-1);
        switch(type) { // 0 for quatations, 1 for dots, 2 for exclamations
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
        return type
    }
    getFirstWord(str) {
        if (str.indexOf(' ') === -1)
            return str;
        else
            return str.substr(0, str.indexOf(' '));
    }
    rand(arr: Array<any>): any {
        let len = arr.length;
        return arr[Math.floor(Math.random() * len)];
    }
    exists(typeEmittedMsg, callback): void {
        this._model.find({ message: typeEmittedMsg }).limit(1).exec((err, responses) => {
            if(err) throw err;
            callback(
                (responses && responses.length) ? responses[0] : false
            );
        });
    }
    save(typeEmittedMsg, callback) {
        let newModel = new this._model({ message: typeEmittedMsg, responses: [] });
        newModel.save((err, created) => {
            if(err) throw err;
            callback(created);
        });
    }
    // ei stands for exsists/inserted, basically just an inserted object
    updateRequestWith(ie, QueryRegExpObj, type, locals, callback) {
        /*
        The reason for the if(locals.requestKeeper) is due to a case where the database is totally empty and the 
        user type the first message(asking something), but locals.requestKeeper isn't set yet, so if 
        I use locals.requestKeeper.reqRes._id without checking locals.requestKeeper first and error will break the server.
        */
        if(locals.requestKeeper) {
            console.log('About to update enty...');
            // The use of unshift is explained near this.recentLimit
            this._model.findByIdAndUpdate(locals.requestKeeper.reqRes._id, {"$push": {
                "responses": {
                    "$each": [{
                        reqResType: locals.requestKeeper.reqResType,
                        resType: type,
                        id: ie._id
                    }],
                    "$position": 0 // Small trick as mongodb don't implement $unshift
                }
            }}, err => {
                if(err) throw err;
                console.log('Entry updated, looking for response...');
                this.getResponse(QueryRegExpObj, type, callback);
            });
        }
        else {
            this.getResponse(QueryRegExpObj, type, callback);
        }
    }
    getResponse(QueryRegExpObj, type, callback) {
        // I was thinking it could be interesting to both use the regExp and the limit with the number of layer so :)
        this._model.find(
            { 
                message: QueryRegExpObj.regExp
            })
            .limit(QueryRegExpObj.layers.length)
            .exec((err, responses) => {
                if(err) throw err;
                let possibleResponses = [], i = responses.length;
                // flatten responses, rare need due to the fact that the numbers of layers is 1(can be more but not suggested)
                while(i--) { possibleResponses = possibleResponses.concat(responses[i].responses); }
                // Filter by type
                possibleResponses = possibleResponses.filter(ob => {
                    return (ob.reqResType === type);
                });
                if(possibleResponses && possibleResponses.length) {
                    console.log('Found responses:', possibleResponses);
                    // The use of slice is explained near this.recentLimit
                    let randomResponse = this.rand(possibleResponses.slice(0, this.recentLimit));
                    this._model.findById(randomResponse.id, (err, res) => {
                        if(err) throw err;
                        if(res) {
                            console.log('<<<<<<<<<<<<<<<<<<<<<<<<<< Updating internal keeper >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
                            callback({
                                reqRes: res,
                                reqResType: randomResponse.resType
                            });
                        }
                        else {
                            // There is an id within arrays for entry that no longed exists.
                            console.log('Id within arrays for entry that no longed exists!');      
                            // I return a request, later I should add some code that removes those ids from all database arrays.
                            this.getRequest(callback);
                        }
                    }) 
                }
                else {
                    console.log('Wanted to response with something but no possibleResponses so let me request something');
                    // If no responses then at least request.
                    this.getRequest(callback);
                }
        });
    }
    getRequest(callback, noQuestion?: boolean) { // noQuestion is optional
        let regExp = new RegExp("^(" + this._qWords.join('|') + "|[\\s\\S]+" + this._mqWords.join("[\\s\\S]+|[\\s\\S]+") + "[\\s\\S]+)", 'i');
        // For start, get a question
        let queryObj: any = { "message": { $regex: regExp } };
        
        // From time to time I want to promote learning by forcing empty arrays questions.
        if(this.rand(this._emptyArraysForceRatio) === 1) queryObj = { "responses": [], "message": { $regex: regExp } };
        
        // Sometimes there might be no questions at all, so I want to get something...
        if(noQuestion) {
            queryObj = { "message": { $not: regExp } };
        }
        
        console.log('Someone need\'s a request.', noQuestion);
        /*
        The if -> else if -> else mechanism in here is used to say something like: I will try to fetch 
        empty arrays as default so if my response is already inlogic the least I can do is learn from it.
        The thing is that in a rare case I may already learned all(not really because not empty arrays will 
        not likely to contain request-responses pairs for all types ?->! !->. .->! .-> ? you get the idea) so 
        in that kind of case just fetch questions with already known responses(at least partially as state above).
        */
        this._model.find(queryObj)
            .exec((err, requests) => {
                if(err) throw err;
                if(requests && requests.length) {
                    let pulledRequest = this.rand(requests);
                    callback({
                        reqRes: pulledRequest,
                        reqResType: noQuestion ? this.rand(this._requestTypesRatio) : 0 // 0 for quatation mark(?)
                    });
                // No questions?, well get something...
                } else if(!noQuestion) {
                    this.getRequest(callback, true);
                }
                else { // noQuestion === true, so it means I couldn't find questions nor answers, WHAT!
                    callback(false);
                }
        });
    }
}