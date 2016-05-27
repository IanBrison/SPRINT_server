var server = require('http').createServer();
var port_num = 3000;

var express = require('express');
var app = express();

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });

var twitter_re = require('twitter');
var twitter = new twitter_re({
  consumer_key: 'M9dPLyxFJbnrNROpsIwY8UJWO',
  consumer_secret: 'uARS8SUkICqbBXHR7hDdetr1OZ8Ec0TLn3MRAEaIAkZTjTvzbw',
  access_token_key: '734757680053551105-nUxLBqNEd81TwCZj0cL9J0hsvz5YqFg',
  access_token_secret: 'rHaaE3WOrrLDMt5tuS8RGv5sWBiz89lydf7bwo6lM4o4p'
})


app.use(express.static('sprint'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/client.js', function(req, res){
  res.sendFile(__dirname + '/client.js');
});
app.get('/index.css', function(req, res){
  res.sendFile(__dirname + '/index.css');
});

var connectedClients = [];

wss.on('connection', function(ws){

  connectedClients.push(ws);
  console.log(connectedClients.length + " clients connected");

  var todo_list = [];

  ws.on('message', function(message){
    console.log(message);

    var jsonObject = {};

    jsonObject.data = message;
    broadcast(JSON.stringify(jsonObject));

    var message_split_array = message.split(' ');
    if(message_split_array[0] == "bot"){
      if(message_split_array[1] == "ping"){
        jsonObject.data = 'pong';
        broadcast(JSON.stringify(jsonObject));
      }
      else if(message_split_array[1] == "todo"){
        switch (message_split_array[2]) {
          case "add":
            if(message_split_array[3] != null && message_split_array[3] != ""){
              var todo_json = {};
              todo_json.name = message_split_array[3];
              todo_json.detail = message_split_array[4];
              todo_list.push(todo_json);
              jsonObject.data = 'todo added';
              broadcast(JSON.stringify(jsonObject));
            }
            break;
          case "delete":
            if(message_split_array[3] != null && message_split_array[3] != ""){
              todo_list.forEach(function(obj, i){
                if(obj.name == message_split_array[3]){
                  todo_list.splice(i, 1);
                }
              });
              jsonObject.data = 'todo deleted';
              broadcast(JSON.stringify(jsonObject));
            }
            break;
          case "list":
            jsonObject.data = "";
            var list_num = 0;
            todo_list.forEach(function(obj, i){
              jsonObject.data += obj.name + " " + obj.detail + "\n";
              list_num++;
            });
            if(list_num == 0){
              jsonObject.data = "todo empty";
            }
            broadcast(JSON.stringify(jsonObject));
            break;
        }
      }else if(message_split_array[1] == "talk"){
        var tweetjson = {};
        var tweet_message =message_split_array[2];
        tweetjson.status = "@ms_rinna " + tweet_message;
        twitter.__request('post', '/statuses/update', tweetjson, function(error, data, response){
          console.log("1");
          console.log(data);
          console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
          console.log(error);
          if(error == null){
            console.log(data.id);
            var tweet_id = data.id;
            setTimeout(function(){
              twitter.__request('get', '/statuses/mentions_timeline', {include_entities:true}, function(error2, tweets, response2) {
                for(var n = 0; n < 3; n++){
                  if(tweets[n].in_reply_to_status_id == tweet_id){
                    console.log(tweets[n]);
                    jsonObject.data = tweets[n].text.substr(14);
                    jsonObject.id = "JK : ";
                    broadcast(JSON.stringify(jsonObject));
                    tweet_id = 0;
                  }
                }
                if(tweet_id != 0){
                  var no_reply = "だまれ";
                  console.log(no_reply);
                  jsonObject.data = no_reply;
                  jsonObject.id = "JK : ";
                  broadcast(JSON.stringify(jsonObject));
                }
              });
            }, 3000);
          }else{
            jsonObject.data = "その話つまんない！話変えてよ！";
            jsonObject.id = "JK : ";
            broadcast(JSON.stringify(jsonObject));
          }
        });
      }

    }

  });

  ws.on('close', function (){
    connectedClients = connectedClients.filter(function(con,i){
      return (con === ws) ? false : true;
    });
  });

});

function wait(time){

}

function broadcast(message){
  connectedClients.forEach(function(con, i){
    con.send(message);
  });
}

server.on('request', app);
server.listen(port_num, function(){console.log('Listening on ' + server.address().port)});
