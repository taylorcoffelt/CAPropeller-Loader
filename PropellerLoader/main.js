window.onload = function() {
  document.querySelector('#Load').addEventListener("click",function(){
    load();
  });
  document.querySelector('#Clear').addEventListener("click",function(){
    document.querySelector('#log').innerText = "";
  });
  document.querySelector('#Port').addEventListener("change",function(){
    log("port change");
    serial.options.port = document.querySelector('#Port').value;
  });

  // Load up serial ports
  serial.listPorts()
  .then(function(ports){
    var select = document.querySelector('#Port');
    select.innerHTML = '';
    for(var i = 0; i<ports.length; i++){
      option = document.createElement( 'option' );
      option.value = option.text = ports[i].path;
      select.add( option );
    }
    select.value = ports[0].path;
  })
  .catch(function(err){
    log(err.message);
  });
};
