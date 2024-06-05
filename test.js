let Client = require("./HackChat-BotLib.js");
let client = new Client("wss://hack.chat/chat-ws"); //104.131.138.176
let join_channel = "lounge";

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
  client.chat("Hello, World!");
}

client.onmessage = (raw, json) => {
  if (json.cmd == "chat" && json.text.includes("6") && json.nick !== client.nick) {
    let id = client.getcustomId()
    client.chat(client.reply(json),id);
    ["我注意到","你说了", "一句“6”","，","最近你", "过得如何？"].forEach((t,i)=>{
      setTimeout(()=>{
        client.updatemessage(id,'append',t);
      },i*3000)
    })
  }
}