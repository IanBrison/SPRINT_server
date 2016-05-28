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
});


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

  var message_obj = {};
  var first_message = "こんにちは！私の名前は、かんな。女子高生です（＾◇＾）一緒にお話ししましょ";
  var second_message = "bot talk xxxって打ってくれたらxxxの内容が私のところに届くよ♡♡";
  message_obj.data = first_message;
  ws.send(JSON.stringify(message_obj));
  message_obj.data = second_message;
  ws.send(JSON.stringify(message_obj));

  var todo_list = [];

  ws.on('message', function(message){
    console.log(message);

    var jsonObject = {};

    jsonObject.data = message;
    broadcast(JSON.stringify(jsonObject));

    var message_split_array = message.split(' ');
    if(message_split_array[0] == "bot"){//最初にbotがあるもの以外無視

      if(message_split_array[1] == "ping"){//pingが来た場合
        jsonObject.data = 'pong';
        broadcast(JSON.stringify(jsonObject));
      }

      else if(message_split_array[1] == "todo"){//todoが来た場合
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
            var list_num = todo_list.length;
            for(var i = 0; i < list_num; i++){
              jsonObject.data += todo_list[i].name + " " + todo_list[i].detail;
              if(i != list_num - 1)
                jsonObject.data += "\n";
            }
            if(list_num == 0){
              jsonObject.data = "todo empty";
            }
            broadcast(JSON.stringify(jsonObject));
            break;
          }
      }

      else if(message_split_array[1] == "talk"){//オリジナルコマンドのtalkが来た場合
        var tweetjson = {};
        var tweet_message =message_split_array[2].replace("かんな", "りんな");
        tweetjson.status = "@ms_rinna " + tweet_message;
        twitter.__request('post', '/statuses/update', tweetjson, function(error, data, response){
          console.log(data);
          console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
          console.log(error);
          if(error == null){
            console.log(data.id);
            var tweet_id = data.id;
            setTimeout(function(){
              twitter.__request('get', '/statuses/mentions_timeline', {include_entities:true}, function(error2, tweets, response2) {
                if(tweets[0].in_reply_to_status_id == tweet_id){
                  console.log(tweets[0]);
                  jsonObject.data = tweets[0].text.substr(14).replace("りんな", "かんな").replace("bot_for_SPRINTさん", "あなた");
                  jsonObject.id = "JK : ";
                  broadcast(JSON.stringify(jsonObject));
                  tweet_id = 0;
                }
                if(tweet_id != 0){
                  var no_reply = "うーん、よくわかんない";
                  console.log(no_reply);
                  jsonObject.data = no_reply;
                  jsonObject.id = "JK : ";
                  broadcast(JSON.stringify(jsonObject));
                }
              });
            }, 3000);
          }else{
            jsonObject.data = "はいはい。その話いいからもっとおもしろい話してよ！";
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

function broadcast(message){//全員に送るメソッド
  connectedClients.forEach(function(con, i){
    con.send(message);
  });
}

server.on('request', app);
server.listen(port_num, function(){console.log('Listening on ' + server.address().port)});
