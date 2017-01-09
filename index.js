var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port:8080});

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});

var utils = require('./lib/utils');

winston.info('Starting T38T WebSocketServer');

wss.on('connection', function connection(ws) {
  var name;
  var remoteAddress = ws.upgradeReq.connection.remoteAddress;
  var tile38Websockets = [];

  ws.on('message', function incomming(message) {
    // check if message is JSON
    var data = JSON.parse(message);
    if (data.message === 'init') {
      var ship = utils.createShip();
      winston.info("%s Hello Ship %s", remoteAddress, ship.name);
      name = ship.name;
      ws.send(JSON.stringify({
        message: "init", name: ship.name, lat:ship.lat, lng:ship.lng
      }));
    }
    if (data.message === 'set position') {
      name = data.name;
      var lat = data.lat;
      var lng = data.lng;
      if (name && lat && lng)
        utils.updatePosition(name, lat, lng);
    }
    if (data.message === 'scan rocks') {
      utils.scanCollection('rocks', function(data){
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"rocks", data:data[1]}));
      });
    }
    if (data.message === 'scan ships') {
      utils.scanCollection('ships', function(data){
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"ships", data:data[1]}));
      });
    }
    if (data.message === 'scan bullets') {
      utils.scanCollection('bullets', function(data){
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"bullets", data:data[1]}));
      });
    }

    if (data.message === 'show collitions') {
      var rocksWs = utils.fenceRoamObj("ships", data.name, "rocks", function(data) {
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"show collitions", data:data}));
      });
      tile38Websockets.push(rocksWs);

      var bulletsWs = utils.fenceRoamObj("ships", data.name, "bullets", function(data) {
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"show collitions", data:data}));
      });
      tile38Websockets.push(bulletsWs);
    }

    if (data.message === 'new ships') {
      var detectWs = utils.fenceDetect('ships', 'set', 'enter', function(data) {
        if ( ws.readyState === 1 )
          ws.send(JSON.stringify({message:"new ships", data:data}));
      });
      tile38Websockets.push(detectWs);
    }

    if ( data.message === "bullet" ) {
      utils.createBullet(data);
    }

  });
  ws.on('close', function close() {
    if (name) {
      utils.shipToRock(name);
      winston.info('%s Bye bye Ship %s, hello rock %s', remoteAddress, name, name);

      for (var tile38ws of tile38Websockets)
        tile38ws.close();
    }
  });
});
