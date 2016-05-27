var
  server = require('http').createServer(),
  express = require('express'),
  app = express(),
  port = 3000;
var
  WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({ server: server });

app.use(express.static('app'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var connectedClients = []; //to remember all the connections

wss.on('connection', function(ws) {

  connectedClients.push(ws); //add the connection
  console.log(connectedClients.length + " clients connected");

  ws.on('close', function(){
    connectedClients = connectedClients.filter(function(con, i){
      return (con === ws) ? false : true;
    });
  });

  ws.on('message', function(message){ //when the message comes
    console.log(message);

    var jsonObject = {}; //a temporary json to use several times
    jsonObject.data = message;
    broadcast(JSON.stringify(jsonObject)); //broadcast it first

    var bot_check_array = message.split(' '); //then check if it has bot

    if(bot_check_array[0] == "bot"){
      var hash_json = {};
      hash_json.command = bot_check_array[1];
      hash_json.data = bot_check_array[2];

      hash_bot = new Bot(hash_json);
      hash_bot.generateHash();
      jsonObject.data = hash_bot.hash;

      broadcast(JSON.stringify(jsonObject)); //broadcast the hash this time
    }

  });

});

function broadcast(message){ //send the message to all connected clients
  connectedClients.forEach(function (con, i){
    con.send(message);
  });
}

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
