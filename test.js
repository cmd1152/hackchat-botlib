let Client = require("./HackChat-BotLib.js");
let client = new Client("wss://hack.chat/chat-ws");
let join_channel = "your-channel";

client.onjoin = () => { 
  client.join({
    channel: join_channel,
    nick: 'my_bot',
    password: '123456'
  })
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
client.onchangechannel = (channel) => {
  client.close("被踢出或者移动到了"+channel);
}

client.onclose = (reason) => {
  console.log(`连接断开`,reason)
}