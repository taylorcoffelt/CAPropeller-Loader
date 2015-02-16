/*
● Reset the Propeller
  ○ Set DTR/RTS (which drives Propeller RESn low) > 10 μs, then clear DTR/RTS

● Wait for Post-Reset Delay
  ○ 90 to 100 ms recommended

● Transmit Calibration Pulses
  ○ 2-bits encoded in 1 byte ($F9; %11111001)

● Transmit Handshake Pattern
  ○ 250-bits encoded into multiple bytes

● Receive Connection Response
  ○ 250 iterations of: transmit 2-bit Calibration Pulse as 1 byte ($F9), receive 1-bit Connection Response Bit as
    byte ($FE or $FF); see Appendix A

  ○ If Propeller does not respond to any Calibration Pulse, or Connection Response bit is invalid, abort
    communication, connection error

● Receive Version
  ○ 8 iterations of: transmit 2-bit Calibration Pulse as 1 byte ($F9), receive 1-bit Version Pulse as byte ($FE or
    $FF)

  ○ If Propeller does not respond to any Calibration Pulse, or if Version is bad, transmit Shutdown Command,
    abort communication; version error

  ○ Valid Propeller Version = 1 (8-bit value, received LSB-first)

*/



function load(){
  // Start the loading proccess
  log("Loading started.");
  log("Initializing Port");

  serial.init()

  .then(function(ports){
    log("Opening Port "+serial.options.port);

    // This takes ~300-380 ms. :-/
    // Very unreliable timing.
    return serial.open();
  })

  // Reset the propeller
  .then(function(){
    timerStart();
    return serial.controlSignals({
      rts: true,
      dtr: true
    });
  })
  .then(function(){
    return serial.controlSignals({
      rts: false,
      dtr: false
    });
  })
  .then(function(){
    // Takes 3 ms.
    // Flush the input buffer
    return serial.flush();
  })

  // Wait for the post-reset delay
  // 90-100ms
  // (Waiting for 80 here, as previous functions take ~10ms)
  .then(function(){
    return serial.wait(80);
  })

  // Transmit first Calibration pulse
  .then(function(){
    return serial.writeByte(0xF9);
  })

  // Transmit magic LSFR
  .then(function(){
    return serial.write(magicLFSR());
  })

  // Transmit rest of the 258 calibration pulses
  .then(function(){
    return serial.write(F9s());
  })

  // Receive a single byte
  /*.then(function(){
    timerEnd();
    reportTime();
    console.log("Reading a Single Byte");
    timerStart();
    return serial.read(10,5000);
  })*/
  .then(function(){
    return serial.wait(100);
  })
  .then(function(byte){
   // timerEnd();
   // reportTime();
    log("Got:\n"+hexy(new Buffer(serial.inBuffer), {format : "twos", caps: "upper", annotate: "none"}));

    log("Closing port.");
    return serial.close();
  })

  .then(
    function(){
      // Completed all steps successfully
      log("Loading Finished.");
    },
    function(err){
      // dump errors to the console
      log(err.message);
      serial.close();
    }
  );
}



// For operations
function magicLFSR(){
  var LFSR = 0x50; // P for Propeller, or P-Nut

  var iterateLfsr = function() {
      /*jslint bitwise: true */
      var bit = LFSR & 1;
      LFSR = ((LFSR << 1) | (((LFSR >> 7) ^ (LFSR >> 5) ^ (LFSR >> 4) ^ (LFSR >> 1)) & 1)) & 0xff;
      /*jslint bitwise: false */
      return bit;
  }
  var buffer = new ArrayBuffer(250),
  bytes = new Int8Array(buffer),
  n;
  for (n = 0; n < 250; n += 1) {
      /*jslint bitwise: true */
      bytes[n] = iterateLfsr() | 0xfe;
      /*jslint bitwise: false */
  }
  return bytes;
}

function F9s() {
    var buffer = new ArrayBuffer(258),
    bytes = new Int8Array(buffer),
    n;

    for (n = 0; n < 258; n += 1) {
        bytes[n] = 0xF9;
    }
   return bytes;
}



// For timing
var startTime = null;
var endTime = null;
function timerStart(){
  startTime = new Date().getTime();
}
function timerEnd(){
  endTime = new Date().getTime();
}
function reportTime(){
  console.log("Function took "+(endTime-startTime)+" ms");
}


// Just for testing...

function hexDump(buffer){
  var newBuffer = "";
  for(var i =0; i<buffer.length; i++){
    if(buffer[i]<0){
      newBuffer += (0xFF + buffer[i] + 1).toString(16).toUpperCase()+ " ";
    }
    else{
      newBuffer +=  buffer[i].toString(16).toUpperCase()+ " ";
    }
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

function log(data){
  console.log(data);
  document.getElementById("log").innerText += data+"\r\n\r\n";
  document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight;
}
