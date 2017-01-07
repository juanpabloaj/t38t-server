var WebSocket = require('ws');
var redis = require("redis");

var tile38Host = process.env.TILE38_HOST || 'localhost';
var client = redis.createClient(9851, tile38Host);

if (process.env.TILE38_PASS) {
  client.auth(process.env.TILE38_PASS);
}

var MTS = 1e7;
var PI = Math.PI;
var tile38 = "ws://" + tile38Host+ ":9851";

client.on('error', function(err) {
  console.log('Error ' + err);
});

function createShip() {
  var angle = getRandomInt(0, 36) * 5;
  var radian = angle * PI / 180;
  var name = '' + angle;

  var radius = 2000;

  lat = radius * Math.cos(radian) / MTS;
  lng = radius * Math.sin(radian) / MTS;

  removeRock(name);
  updatePosition(name, lat, lng);

  return {name:name, lat:lat, lng:lng};
}

function updatePosition(name, lat, lng) {
  setPointPosition(name, "ships", lat, lng);
}

function setPointPosition(name, collection, lat, lng) {
  client.send_command(
    "SET", [collection, name, "point", lng, lat],
    function(err, reply){
      if (err) console.log(err);
    }
  );
}

function shipToRock(name){
  client.send_command(
    "get", ["ships", name],
    function(err, reply){
      if (err) {
        console.log(err);
      } else {
        var coor = JSON.parse(reply).coordinates;
        var lat = coor[0];
        var lng = coor[1];
        setPointPosition(name, "rocks", lat, lng);
        removePoint(name, "ships");
      }
    }
  );
}

function removeRock(name) {
  removePoint(name, "rocks");
}

function removePoint(name, collection) {
  client.send_command(
    "del", [collection, name],
    function(err, reply){
      if (err) {
        console.log(err);
      }
    }
  );
}

function scanCollection(collection, callback) {
  client.send_command(
    "scan", [collection],
    function(err, reply){
      if (err) {
        console.log(err);
      }
      callback(reply);
    }
  );
}

function fenceRoamObj(collA, obj, collB, callback) {
  var url =  tile38 + "/NEARBY+"+collA+"+match+"+obj+"+fence+roam+"+collB+"+*+1";
  var fenceWs = new WebSocket(url);
  fenceWs.on('open', function open() {
    fenceWs.on('message', function open(data) {
      callback(data);
    });
  });
}

function fenceDetect(collection, command, detect, callback) {
  var url =  tile38 + "/NEARBY+"+collection+"+FENCE+DETECT+"+detect;
  url += "+POINT+0+0+6000";
  var fenceWs = new WebSocket(url);
  fenceWs.on('open', function open() {
    fenceWs.on('message', function open(data) {
      data = JSON.parse(data);
      if (data.command)
        if (data.command === command && data.detect === detect)
          callback(data);
    });
  });
}

// Mozilla developer network
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.createShip = createShip;
module.exports.updatePosition = updatePosition;
module.exports.shipToRock = shipToRock;
module.exports.removeRock = removeRock;
module.exports.scanCollection = scanCollection;
module.exports.fenceRoamObj= fenceRoamObj;
module.exports.fenceDetect= fenceDetect;
module.exports.getRandomInt = getRandomInt;
