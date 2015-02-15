// Chrome Serialport
var ChromeSerialPort = {
  options: {
    baud: "115200",
    port: null,
    timeOut: 1000,
    connectionId: null
  },
  inBuffer: new Int8Array([]),
  readCallback: undefined,
  readInterval: null,
  readTimeout: null,

  listPorts: function(){
     return new Promise(function(resolve, reject){
      chrome.serial.getDevices(function(devices){
        if(devices.length > 0){
          resolve(devices);
        }
        else{
          reject(Error("You have no detected serial ports."));
        }
      });
    });
  },
  init: function(){
      chrome.serial.onReceive.addListener(ChromeSerialPort.onReceive);
      chrome.serial.onReceiveError.addListener(function(err){
        console.log(err);
        if(err.error == "system_error"){
          // Hoo-boy. Now you've done it.
          ChromeSerialPort.close().then(function(){
            console.log("Do this fast!");
            ChromeSerialPort.open().then(function(){
              console.log("Recovered?");
            });
          });
        }
      });
  },
  open: function(){
    return new Promise(function(resolve, reject){

      if(ChromeSerialPort.options.port === null){
        reject(Error("The port must be set."));
      }
      // If we don't connect, time out
      setTimeout(function(){
        reject(Error("Connection Timeout"));
      }, ChromeSerialPort.options.timeOut);

      try{
        chrome.serial.connect(ChromeSerialPort.options.port, {
          bitrate: parseInt(ChromeSerialPort.options.baud)
        },
        function(connection){

          ChromeSerialPort.options.connectionId = connection.connectionId;
          if(ChromeSerialPort.options.connectionId){

            // We're connected. Now setup listening

            resolve(ChromeSerialPort.options.connectionId);

          }
          else{
            reject(Error("Failed to connect."));
          }
        });
      }
      catch(err){
        reject(Error(err));
      }
    });
  },
  close: function(){
     return new Promise(function(resolve, reject){
      if(ChromeSerialPort.options.connectionId==null){
        reject(Error("Not connected to any port."));
      }
      chrome.serial.disconnect(ChromeSerialPort.options.connectionId, function(result){
        if(result){
          ChromeSerialPort.options.connectionId = null;
          resolve(true);
        }
        else{
          reject(Error("Disconnect Failed."));
        }
      });
    });
  },
  write: function(buffer, convertFromString){
    console.log(hexDump(buffer));
    a = buffer;
    return new Promise(function(resolve, reject){

      var convertStringToArrayBuffer = function(str){
        try{
          var buf=new ArrayBuffer(str.length);
          var bufView=new Int8Array(buf);
          for (var i=0; i<str.length; i++) {
            bufView[i]=str.charCodeAt(i);
          }
          return buf;
        }
        catch(err){
          reject(Error(err));
        }
      };

      var convertObjectToArrayBuffer = function(obj){
        try{
          var buf=new ArrayBuffer(obj.length);
          var bufView=new Int8Array(obj);
          for (var i=0; i<obj.length; i++) {
            bufView[i]=obj[i];
          }
          return buf;
        }
        catch(err){
          reject(Error(err));
        }
      };

      // Check for a connection first
      if(ChromeSerialPort.options.connectionId==null){
        reject(Error("No serial connection active."));
      }
      // Check for input
      if(buffer==undefined || buffer.length<1){
        reject(Error("Send buffer is empty."));
      }

      // Sending Timeout
      setTimeout(function(){
        reject(Error("Connection Timeout"));
      }, ChromeSerialPort.options.timeOut);

      if(convertFromString==true){
        buffer = convertStringToArrayBuffer(buffer);
      }
      else{
        buffer = convertObjectToArrayBuffer(buffer);
      }

      chrome.serial.send(ChromeSerialPort.options.connectionId, buffer, function(){
        resolve(true);
      });

    });
  },
  read:  function (length, timeOut, callBack) {

    //TODO: Convert this to a promise?

    // TEST: Interval & Clear?
    ChromeSerialPort.readCallback = callBack;

    ChromeSerialPort.readTimeout = setTimeout(function(){
      // Reading Timed Out. Clear the read interval
      clearInterval(ChromeSerialPort.readInterval);
      ChromeSerialPort.readCallback("Serial time out");
    }, timeOut);

    ChromeSerialPort.readInterval = setInterval(function(){
      if (ChromeSerialPort.inBuffer.length >= length) {
          console.log("Got Data!");
          // We have data, better return it through callback.
          // Also, clear interval timers and Timeout timers.
          clearTimeout(ChromeSerialPort.readTimeout);
          clearInterval(ChromeSerialPort.readInterval);
          var outBuffer = new Int8Array(ChromeSerialPort.inBuffer.subarray(0, length));
          ChromeSerialPort.inBuffer = new Int8Array(ChromeSerialPort.inBuffer.subarray(length));
          ChromeSerialPort.readCallback(null, outBuffer);
      }
    },
    1 // Check for new data every millisecond
    );

    // Old Method:

      // ChromeSerialPort.readCallback = callBack;
      // if (ChromeSerialPort.inBuffer.length >= length) {
      //     // We have data better return it through callback on next tick
      //     //console.log("Got here");
      //     setTimeout(function () {
      //         var outBuffer = new Int8Array(ChromeSerialPort.inBuffer.subarray(0, length));
      //         ChromeSerialPort.inBuffer = new Int8Array(ChromeSerialPort.inBuffer.subarray(length));
      //         ChromeSerialPort.readCallback(null, outBuffer);
      //     }, 1);
      // } else {
      //     // No enough data yet
      //     readTimeout = setTimeout(function () {
      //         ChromeSerialPort.readCallback("Serial time out");
      //     }, timeOut);
      // }
  },
  onReceive: function(data){
    console.log(new Int8Array(data.data));
    console.log(stringDump(new Int8Array(data.data)));
    var concat = function (a, b) {
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

    ChromeSerialPort.inBuffer = concat(ChromeSerialPort.inBuffer, new Int8Array(data.data));
    //if (ChromeSerialPort.inBuffer.length >= ChromeSerialPort.readLength) {
    //    if (ChromeSerialPort.readCallBack) {
            //var outBuffer = new Int8Array(inBuffer.subarray(0, ChromeSerialPort.readLength));
           // ChromeSerialPort.inBuffer = new Int8Array(ChromeSerialPort.inBuffer.subarray(ChromeSerialPort.readLength));
           // ChromeSerialPort.readCallBack(null, outBuffer);
    //    }
    //}
  },
  flush: function (callback) {

    callback();
    return false;
    // TODO: Convert this to a promise?
    // Try to empty InputBuffer
    ChromeSerialPort.inBuffer =  new Int8Array([]);
    chrome.serial.flush(ChromeSerialPort.options.connectionId,callback);

  },
  reset: function (callback) {
    // TODO: Convert this to a promise?
    console.log("Resetting.");
    // Resets RTS *and* DTS. Some USB<->Serial plugs only support one

      //rst.write (1);
      chrome.serial.setControlSignals(ChromeSerialPort.options.connectionId, {rts:true, dtr:true}, function(){
        setTimeout(function () {
            //rst.write(0);
            chrome.serial.setControlSignals(ChromeSerialPort.options.connectionId, {rts:false, dtr: false}, function(){
              setTimeout(function () {
                  ChromeSerialPort.flush(callback);
              }, 90);
            });
        }, 10);
      });
  }


};



// Just for testing...

function hexDump(buffer){
  var newBuffer = "";
  for(var i =0; i<buffer.length; i++){
    newBuffer += (0xFF + buffer[i] + 1).toString(16)+ " ";
  }
  return newBuffer;
}
function stringDump(buffer){
  a = buffer;
  var newBuffer = "";
  for(var i =0; i<buffer.length; i++){
    newBuffer += String.fromCharCode(parseInt(buffer[i],10));
  }
  return newBuffer;
}