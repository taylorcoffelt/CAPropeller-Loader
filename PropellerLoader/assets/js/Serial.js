var serial = {
  options: {
    baud: "115200",
    port: "/dev/ttyUSB1",
    connectionId: null,
    timeout: 5000
  },
  inBuffer: new Int8Array([]),
  readTimeout: null,
  readInterval: null,

  init: function(){
    // Only needs to be called once.
    return new Promise(function(resolve, reject){
      try{
        chrome.serial.onReceive.addListener(serial.onReceive);
        chrome.serial.onReceiveError.addListener(function(err){
          // For now, if we recieve an error, we want to hear about it.
          console.log(err);
        });

        resolve();
      }
      catch(err){
        reject(Error(err));
      }
    });
  },
  listPorts: function(){
    return new Promise(function(resolve,reject){
      chrome.serial.getDevices(function(devices){
        if(devices.length > 0){
          resolve(devices);
        }
        else{
          reject(Error("listPorts(): You have no detected serial ports."));
        }
      });
    });
  },
  open: function(){
    // Opens the serial port
    return new Promise(function(resolve, reject){
      //check if there's already a connection
      if(serial.options.connectionId!=null){
        reject(Error("open(): A serial connection already exists."));
      }
      try{
       chrome.serial.connect(serial.options.port, {
          bitrate: parseInt(serial.options.baud)
        },function(connID){

          // check to see if we didn't get the port
          if(connID==undefined){
            reject(Error("open(): Couldn't connect to port."));
          }

          // We're good to go
          serial.options.connectionId = connID.connectionId;
          resolve(connID.connectionId);
        });
      }
      catch(err){
        reject(Error(err));
      }
    });
  },
  close: function(){
    return new Promise(function(resolve, reject){
      // Check to make sure that we have a connection
      if(serial.options.connectionId==null){
        reject(Error("close(): Not connected to any port."));
      }
      try{
        chrome.serial.disconnect(serial.options.connectionId, function(result){
          if(result){
            serial.options.connectionId = null;
            resolve(true);
          }
          else{
            reject(Error("close(): Disconnect Failed."));
          }
        });
      }
      catch(err){
        reject(Error(err));
      }
    });
  },
  write: function(buffer, isString){
    log("Writing:\n "+hexy(new Buffer(buffer), {format : "twos", caps: "upper", annotate: "none"}));
    return new Promise(function(resolve, reject){

      // Private method to convert strings
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

      // Private method to convert objects
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
      if(serial.options.connectionId==null){
        reject(Error("write(): No serial connection active."));
      }
      // Check for input
      if(buffer==undefined || buffer.length<1){
        reject(Error("write(): Send buffer is empty."));
      }

      // Sending Timeout
      // If resolve gets called before the timer goes off, then the timer's
      // rejection gets ignored.
      setTimeout(function(){
        reject(Error("Connection Timeout"));
      }, serial.options.timeout);

      if(isString==true){
        buffer = convertStringToArrayBuffer(buffer);
      }
      else{
        buffer = convertObjectToArrayBuffer(buffer);
      }

      chrome.serial.send(serial.options.connectionId, buffer, function(){
        resolve(true);
      });

    });
  },
  writeByte: function(byte){
    var buffer = new ArrayBuffer(1),
    bytes = new Int8Array(buffer);
    bytes[0] = byte;
    return serial.write(bytes);
  },
  read: function(length, timeout){
    return new Promise(function(resolve,reject){
      // Check that the connection is active
      if(serial.options.connectionId==null){
        reject(Error("read(): No serial connection active."));
      }

      // If no timeout was specified, use the one from the options.
      if(timeout==undefined){
        timeout = serial.options.timeout;
      }

      // Set a timeout timer for reading
      serial.readTimeout = setTimeout(function(){
        // Reading Timed Out. Clear the read interval
        clearInterval(serial.readInterval);
        serial.readInterval = null;
        serial.readTimeout = null;

        reject(Error("read(): Port read timed out."));

      }, timeout);

      serial.readInterval = setInterval(function(){
        // If the data we're looking for is there, then pass it.
        if (serial.inBuffer.length >= length) {
            // Clear Interval timers and Timeout timers.
            clearTimeout(serial.readTimeout);
            clearInterval(serial.readInterval);
            serial.readTimeout = null;
            serial.readInterval = null;

            // Take the FIFO data from the buffer, and pass it along.
            var outBuffer = new Int8Array(serial.inBuffer.subarray(0, length));
            serial.inBuffer = new Int8Array(serial.inBuffer.subarray(length));
            resolve(outBuffer);
        }
      },
      1 // Check for new data every millisecond
      );

    });
  },
  onReceive: function(data){
    //console.log(hexy(new Buffer(new Int8Array(data.data)), {format : "twos", caps: "lower", annotate: "none"}));
    //console.log("data");
    // Needed to add the new data to the buffer
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

    // Add the new data to the inBuffer
    serial.inBuffer = concat(serial.inBuffer, new Int8Array(data.data));
  },
  flush: function(){
    return new Promise(function(resolve,reject){
      serial.inBuffer =  new Int8Array([]);
      chrome.serial.flush(serial.options.connectionId,function(){
        resolve();
      });
    });
  },
  controlSignals: function(obj){
    return new Promise(function(resolve,reject){
      // Sets the control signals to boolean values
      // use like this: controlSignals({rts:true,dtr:false});
      // each value is optional

      chrome.serial.setControlSignals(serial.options.connectionId, obj, function(){
        resolve();
      });
    });
  },
  wait: function(ms){
    return new Promise(function(resolve, reject){
      // provided to allow for timing adjustments

      setTimeout(function(){
        resolve();
      },ms)
    });
  }
};