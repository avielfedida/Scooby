export class SocketHelper {
    private _io = io;
    private _socket;
    private _connectionReconnectionLimit = 10;
    private _resetConnectionReconectionLimitTimer = null;
    private _communicationEnabled: boolean = false;
    constructor() {}
    private attachEvents(): void {
        if(this._socket && this._socket.on) {
            this._socket.on('connect', () => {
                console.log('Communication enabled.');
                this._resetConnectionReconectionLimitTimer = setTimeout(() => {
                    this._connectionReconnectionLimit = 10;
                }, 20000); // If for 20 seconds reconnect_attempt wasn't called, reset the limit.
                this._communicationEnabled = true;
            })
            // The reason I use reconnect_attempt is that when the server is down it will still be called why reconnect is only good when io.close is called on the server upon db error.
            this._socket.on('reconnect_attempt', attempts => {
                clearTimeout(this._resetConnectionReconectionLimitTimer); // Don't reset
                this._communicationEnabled = false;
                this._connectionReconnectionLimit -= 1;
                console.log("Reconnection attempt...", this._connectionReconnectionLimit, " attempts were left.");
                if(this._connectionReconnectionLimit === 0) {
                    window.location.reload(true);
                }
            });
        }
    }
    connect(url = '/') {
        if(this._socket) return this; // When already connected.
        if(this._io) {
            this._socket = this._io(url, {
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000
            });
            // Attach events:
            this.attachEvents();
        }
        return this;
    }
    
    getSocket() {
        this.connect(); // Making sure connectivity. 
        return this._socket ? this._socket : null;
    }
    pullRandom() {
        this._socket.emit('pullRandom');
    }
    send(txt) {
        if(this._communicationEnabled) {
            this._socket.emit('message', txt);
        }
    }
    end() {
        this._socket.disconnect();
    }
}
