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
  let id = client.getcustomId();
  client.chat("（请允许UpdateMessage）",id);
  ["我是一个基于 HackChat-BotLib.js 制作的机器人","临时运行在 Zhang 的服务器上","只是测试 :)","发送 `:test` 测试"].forEach((t,i)=>{
    setTimeout(()=>{
      client.updatemessage(id,'overwrite',t);
    },i*3000)
  })
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