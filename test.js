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
  console.log(json);
}

client.cmdstart = ":";
client.command = {
  test: {
    run: function(args, info, back, whisper) {
      back(`用户信息:\n\`\`\`\n${JSON.stringify(info)}\n\`\`\`\n是私信调用：${whisper}\n命令参数：${args.join(" ")} （长度：${args.length}）`);
    }
  }
}