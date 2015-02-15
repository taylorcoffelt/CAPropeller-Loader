/*global Int8Array:   false,
         Array:       false,
         ArrayBuffer: false
*/

// Requires don't work.
// var SerialPort = require("serialport").SerialPort;
// var Gpio = require('onoff').Gpio;
// var hexy = require('hexy');

// TODO: We should not need this
function concat(a, b) {
    var c = new Array(),
        i;
    for (i = 0; i < a.length; i += 1) {
        c.push(a[i]);
    }
    for (i = 0; i < b.length; i += 1) {
        c.push(b[i]);
    }
    return new Int8Array(c);
}

function Propeller(options) {
//    var inBuffer = new Int8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12 ]),
    var inBuffer = new Int8Array([]),
        readCallBack,
        readLength = 0,
        readTimeout,
        options = options;

    ChromeSerialPort.init();

    this.open = function (openCallback) {
        console.log("Connecting to "+options.port);
        ChromeSerialPort.options.port = options.port;
        return ChromeSerialPort.open();
    };

    this.close = function () {
        ChromeSerialPort.close();
    };

    this.write = function (buffer) {
        //console.log(buffer);
        //console.log(hexy(new Int8Array(buffer), {format : "twos", caps: "lower", annotate: "none"}));
        ChromeSerialPort.write(buffer);
    };

    this.read = function (length, timeOut, callBack) {
        ChromeSerialPort.read(length, timeOut, callBack);
    };

    this.flush = function (callback) {
        ChromeSerialPort.flush(callback);
        // TODO: Also empty inBuffer.
    };

    this.reset = function (callback) {
        ChromeSerialPort.reset(callback);
    }
}

var propeller = {
  Propeller: Propeller
};
// Exports don't work.
//exports.Propeller = Propeller;
