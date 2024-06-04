let Client = require("./HackChat-BotLib.js");
let client = new Client("wss://hack.chat/chat-ws");
let join_channel = "your-channel";

client.onjoin = () => { 
  client.join({  //发送加入数据包
    channel: join_channel,
    nick: 'my_bot',
    password: '123456'
  })
  //也可以读取 client.joined 判断有没有加入频道
}

client.onmessage = (raw, json) => {
  console.log(json);
}

client.onjoined = () => {
  client.chat("Hello, world!");
  let id = client.getcustomId();
  client.chat("UpdateMessage Test",id);
  setTimeout(()=>{
    client.updatemessage(id,'overwrite','good')
  },3000);
  console.log("加入成功");
}

client.ping = 10000;

