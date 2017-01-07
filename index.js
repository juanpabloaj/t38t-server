var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port:8080});

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});

var utils = require('./lib/utils');

winston.info('Starting T38T WebSocketServer');

wss.on('connection', function connection(ws) {
  var name;
  ws.on('message', function incomming(message) {
    var data = JSON.parse(message);
    if (data.message == 'init') {
      var ship = utils.createShip();
      winston.info("Hello Ship %s", ship.name);
      name = ship.name;
      ws.send(JSON.stringify({
        message: "init", name: ship.name, lat:ship.lat, lng:ship.lng
      }));
    }
    if (data.message == 'set position') {
      // check if message is JSON
      name = data.name;
      var lat = data.lat;
      var lng = data.lng;
      if (name && lat && lng)
        utils.updatePosition(name, lat, lng);
    }
    if (data.message == 'scan rocks') {
      utils.scanCollection('rocks', function(data){
        ws.send(JSON.stringify({message:"rocks", data:data[1]}));
      });
    }
    if (data.message == 'scan ships') {
      utils.scanCollection('ships', function(data){
        ws.send(JSON.stringify({message:"ships", data:data[1]}));
      });
    }
    if (data.message === 'show collitions') {
      utils.fenceRoamObj("ships", data.name, "rocks", function(data) {
        if ( data && data !== "OK" && ws.readyState === 1 )
          ws.send(JSON.stringify({message:"show collitions", data:data}));
      });
    }
  });
  ws.on('close', function close() {
    if (name) {
      utils.shipToRock(name);
      winston.info('Bye bye Ship %s, hello rock %s', name, name);
    }
  });
});
