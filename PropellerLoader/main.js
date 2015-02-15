var text = '';
window.onload = function() {
  // Get the text from the textarea
  text = document.getElementById("editor").value;

};



// Test the ChromeSerialPort

ChromeSerialPort.listPorts()

.then(function(ports){

  console.log("Connecting to "+ports[0].path);
  ChromeSerialPort.options.port = ports[0].path;
  return ChromeSerialPort.open();

})
.then(function(){
  // We want to have it automatically convert strings for us.
  return ChromeSerialPort.write("Hello, World!", true);
})
.then(function(){
 //return ChromeSerialPort.close();
})
.then(
  function(){
    //console.log("Disconnected!");
  },
  function(err){
    console.log(err);
  }
);