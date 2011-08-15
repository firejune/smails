
/**
 * Smails.IO Server
 */

var http = http = require("http")
  , fs = require('fs')
  , url = require('url')
  , path = require('path')
  , ios = require('socket.io')
  , users = {}, sockets = {};

var server = http.createServer(function(req, res) {

  var requrl = url.parse(req.url, true);
  if (requrl.pathname == '/') requrl.pathname = '/index.html';
  var reqpath = './public' + requrl.pathname;

  path.exists(reqpath, function(exists) {
    if (exists) {
      var ext = path.extname(reqpath).toLowerCase();
      var ctype = 'text/plain';
      if (ext == '.jpg' || ext == '.jpeg') ctype = 'image/jpeg';
      else if (ext == '.ico') ctype = 'image/x-icon';
      else if (ext == '.gif') ctype = 'image/gif';
      else if (ext == '.png') ctype = 'image/png';
      else if (ext == 'htm' || ext == '.html') ctype = 'text/html';

      fs.readFile(reqpath, "binary", function(err, file) {
        if (err) {
          res.writeHead(500, {'Content-Type':'text/plain'});
          res.end(err + '\n');
          return;
        }
        res.writeHead(200, {'Content-Type':ctype});
        res.write(file, "binary");
        res.end();
      });
    } else {
      res.writeHead(404, {'Content-Type':'text/plain'});
      res.end(requrl.pathname + ' FILE NOT FOUND');
    }

  });
});


var io = ios.listen(server);
io.configure(function () {
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.set('log level', 2);                    // reduce logging
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
  //io.enable('log');
});


io.sockets.on('connection', function(socket) {

  socket.on('message', function (event, fn) {
    var data = event.data
      , action = event.action
      , key = socket.key || data.key;

    action = ({
      'join': onjoin,
      'chat': onchat,
      'move': onmove,
      'idle': onidle
    })[action];

    if (!action) return console.log('unknown action:' + action);
    if (!key) return console.log('missing user key');

    action(key, data, fn);
  });

  socket.on('disconnect', function () {
    var key = socket.key;
    if (!key) return;
    delete users[key];
    delete sockets[key]
    socket.broadcast.emit('message', 'leave', key);
  });

  function onmove(key, data) {
    users[key].idle = false;
    users[key].event = data;
    socket.broadcast.emit('message', 'move', key, data);
  }

  function onjoin(key, data, fn) {
    if (!users[key]) {
      fn(true);
      sockets[key] = socket;
      users[socket.key = key] = data;
      io.sockets.emit('message', 'join', key, users); // public
    } else {
      fn(false);
      console.warn('already use a key');
    }
  }

  function onchat(key, data, fn) {
    if (data.toAll) {
      fn(true);
      socket.broadcast.emit('message', 'chat', key, data); // broadcast
    }  else if (users[data.to]) {
      fn(true);
      sockets[data.to].emit('message', 'chat', key, data); // privat
    } else
      fn(false);
  }

  function onidle(key, data) {
    users[key].idle = data;
    socket.broadcast.emit('message', 'idle', key, data);    
  }
});

server.listen(8080);