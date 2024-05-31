let Client = require("./HackChat-BotLib.js");
let client = new Client("wss://hack.chat/chat-ws"); //创建一个客户端，连接到服务器
let join_channel = "lounge"

/*** 连接断开处理 ***/
client.onclose = (reason) => {
  //你可以手动使用 client.close(reason) 断开
  console.log(`连接断开`,reason) //重新创建客户端或者提示内容
  process.exit(0);
}

/*** 发现机器人被移动或者踢出了处理 ***/
client.onchangechannel = (channel) => {
  client.close("被踢出或者移动到了"+channel)
}


/*** 加入成功后 ***/
client.onjoined = () => {
  client.chat("Hello, world!");
  //你可以使用 client.chat(text,customId) 来发送一个带有customID的消息，这可以让你通过
  // client.updatemessage(customId,mode,text) 来修改你的消息
  // mode 支持4种： overwrite         append         prepend             complete
  //                 覆盖文本     添加文本到末尾   添加文本到前面      完成更新（这会让这个消息不能再被upDateMessage）
  // customId建议使用 client.getcustomId() 来生成一个不重复的id
  console.log("加入成功");
  //client.updatemessage和client.chat都返回一个布尔值代表这个操作是否初步执行成功（如果出现了RL导致不能执行，那么还是会返回true）
}

/*** 加入失败 ***/
client.joinfailed = (reason) => {
  console.log("加入失败",reason);
  client.close();
}
/*** 验证码 ***/
client.oncaptcha = () => {
  console.log("频道要求验证码！");
  //你可以使用 client._send({cmd:'chat',text:'验证码'}) 来通过验证码，但这一般不常用
  client.close()
}



/*** 加入频道 ***/
client.onjoin = () => { 
  client.join({  //发送加入数据包，这个返回一个 Promise ，告诉你是否加入成功
    channel: join_channel,
    nick: 'my_bot',
    password: '123456'
  })
  //也可以读取 joined 判断有没有加入频道
}

client.ping = 10000 //检测频率（单位ms），可以检测是否被踢出，设置为0不检查，越大越久才检测到，越小越容易rl，最小为1000


//你可以读取 client.users 和 client.nicks ，包含了详细的在线列表
//client.nick 是机器人的名称（理论上实时更新）


/*** client.onmessage 才是重头戏！ ***/
client.onmessage = (raw,data) => {
  //raw为服务器发送的原始json，data为经过优化并解析的json
  //data优化了名称修改和emote识别
  //添加 changeNick 的cmd：
  /*
    if (data.cmd == "changeNick") {
      client.chat(`${data.nick}刚刚改名为${data.to_nick}`)
    }
  */
  //修改了 emote 的cmd，添加了个 msg参数，显示用户原内容
  /*
    if (data.cmd == "emote") {
      client.chat(`${data.nick}刚刚用emote说${data.msg}`)
    }
  */
  //修改了 whisper 的cmd，添加了个 msg参数，显示用户私信的内容，如果是机器人私信用户，就没有这个
  //还添加了nick
  /*
    if (data.cmd == "emote") {
      client.chat(`${data.nick}刚刚私信我说${data.msg}`)
    }
  */
  console.log(raw);
}