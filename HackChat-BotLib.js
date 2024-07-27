let modules = {
  "WebSocket" : "ws",
  "https": "https"
}

for (let module in modules) {
  let module_name = module;
  let module_path = modules[module_name];
  try {
    global[module_name] = require(module_path);
  } catch (e) {
    throw new Error(`导入${module_name}失败（位于${module_path}）`)
  }
}

class Client {
  constructor(server_ip="wss://hack.chat/chat-ws") {
    this._ws = server_ip == "wss://hack.chat/chat-ws" ? 
      new WebSocket('wss://104.131.138.176/chat-ws', {
        headers: {
          host: 'hack.chat'  // 反DNS污染
        },
        rejectUnauthorized: false
      }):
      new WebSocket(server_ip)
    this._ws.onopen = () => {
      this.onjoin();
    }
    this._ws.onclose = () => {
      this.joined = false;
      this.onclose(this._closereason);
      delete this._closereason;
    }
    this._ws.onmessage = (event) => {
      let hc = JSON.parse(event.data);
      if (hc.cmd == "onlineSet") {
        let tnick = [...hc.nicks];
        this.nick = tnick.pop();
        if (!this.joined) {
          setInterval(()=>{
            if (this.ping <= 0) return;
            let lastpingtime = this.pingtime || 0;
            if (lastpingtime + this.ping < (new Date()).getTime()) {
              this.pingtime = (new Date()).getTime();
              this.check = true;
              this._send({
                cmd: '' //rl最小
              })
            }
            
          },1000)
        }
        this.joined = true;
        this.onjoined()
      }
      if (hc.cmd == "warn") {
        setTimeout(()=>{
          if (!this.joined) this.joinfailed(hc.text)
        },500);
      }
      if (hc.channel) {
        if (hc.channel != this.channel) {
          this.channel = hc.channel;
          this.onchangechannel(hc.channel);
        }
      }
      if (hc.cmd == "warn" && hc.text.startsWith(`Command not found, did you mean: `) && this.check) {
        this.check = false;
        return;
      }
      if (hc.cmd == "onlineSet") {
        this.users = hc.users
        this.nicks = hc.nicks
      }
      if (hc.cmd == "onlineAdd") {
        let payload = {...hc}
        delete payload.cmd
        this.users.push(payload)
        this.nicks.push(hc.nick)
        this.nicks=[...new Set(this.nicks)]
      }
      if (hc.cmd == "onlineRemove") {
        this.users = this.users.filter(function (item) {
          return item.nick !== hc.nick;
        });
        let index = this.nicks.indexOf(hc.nick);
        if (index !== -1) this.nicks.splice(index, 1);
        this.nicks=[...new Set(this.nicks)]
      }
      if (hc.cmd == "updateUser") {
        let payload = {...hc}
        delete payload.cmd
        this.users = this.users.filter(function (item) {
          return item.nick !== hc.nick;
        });
        this.users.push(payload)
      }
      if (hc.cmd == "info" && /^([a-zA-Z0-9_]{1,24}) is now ([a-zA-Z0-9_]{1,24})$/.test(hc.text)) {
        let changenickuser = hc.text.match(/^([a-zA-Z0-9_]{1,24}) is now ([a-zA-Z0-9_]{1,24})$/);
        if (changenickuser[1] == this.nick) {
          this.nick = changenickuser[2];
        }
        return this.onmessage(
          event.data,
          {
            cmd: 'changeNick',
            nick: changenickuser[1],
            to_nick: changenickuser[2]
          }
        )
      }
      if (hc.cmd == "emote") hc.msg = hc.text.substring(hc.nick.length+2);
      if (hc.cmd == "info" && hc.type == "whisper" && typeof hc.from == "string") {
        hc.nick = hc.from;
        hc.msg = hc.text.substring(hc.from.length+12);
        hc.cmd = hc.type;
        delete hc.type;
      }
      if (hc.cmd == "info" && /^([a-zA-Z0-9_]{1,24}) invited you to/.test(hc.text)) {
        let inv = hc.text.match(/^([a-zA-Z0-9_]{1,24}) invited you to/);
        return this.onmessage(
          event.data,
          {
            cmd: 'invite',
            nick: inv[1],
            to: hc.text.substring(inv[1].length + 17)
          }
        )
      }
      if (hc.cmd == "updateMessage") {
        let updateBy = this.users.find((user)=>{
          return user.userid == hc.userid;
        })
        hc.nick = updateBy.nick;
        hc.trip = updateBy.trip;
      }
      if (this.cmdstart !== false) {
        let originText = hc.text;
        if (hc.cmd == "whisper") originText = hc.msg; //前面有扩展;
        if (!originText) return;
        if (originText.startsWith(this.cmdstart)) {
          let originCmd = originText.substring(this.cmdstart.length).split(" ");
          let runcmd = originCmd.shift();
          this._COMMAND(
            runcmd,
            originCmd,
            this.selNick(hc.nick),
            hc.cmd == "whisper"?(text,e=false)=>{this.whisper(hc.nick,`${e?"\x00\n":""}${text}`)}:(text,e)=>{this.chat(`${e?"":`@${hc.nick} `}${text}`)},
            hc.cmd == "whisper"
          )
        }
      }
      this.onmessage(event.data,hc);
    }
    ["onclose","onchangechannel","joinfailed","oncaptcha","onjoin","onjoined","onmessage"].forEach(func=>{
      this[func] = () => {}
    });
    ["channel","nick","joined","ping","pingtime","check","cmdstart","command"].forEach(ve=>{
      this[ve] = false
    });
    this.customId = 0;
  }
  join(pack) {
    if (this._ws.readyState !== 1) return false; //连接没有打开，加入失败
    pack.cmd = "join";
    this.channel = pack.channel;
    this._send(pack);
  }
  _send(obj) {
    this._ws.send(JSON.stringify(obj));
  }
  close(reason) {
    this._closereason = reason;
    this._ws.close();
  }
  chat(text,custom_id=false) {
    let pack = {
      cmd: 'chat',
      text: text
    }
    if (this.channel == "purgatory") pack.cmd == "emote";
    if (custom_id) pack.customId = custom_id;
    this._send(pack);
    return true;
  }
  updatemessage(custom_id,mode,text) {
    if (!custom_id.toString() || !mode) return false;
    if (!["overwrite","append","prepend","complete"].includes(mode)) return false;
    this._send({
      cmd: 'updateMessage',
      customId: custom_id.toString(),
      mode: mode,
      text: text
    })
  }
  getcustomId() {
    return this.customId.toString(36);
    this.customId += 1;
  }
  isTrip(trip) {
    return /^[a-zA-Z0-9+/]{6}$/.test(trip);
  }
  isHash(hash) {
    return /^[a-zA-Z0-9+/]{15}$/.test(hash);
  }
  isNick(nick) {
    return /^[a-zA-Z0-9_]{1,24}$/.test(nick);
  }
  selTrip(trip) {
    return this.users.filter((user)=>{
      return user.trip == trip;
    })||[]
  }
  selHash(hash) {
    return this.users.filter((user)=>{
      return user.hash == hash;
    })||[]
  }
  selNick(nick) {
    return this.users.find((user)=>{
      return user.nick == nick;
    })
  }
  invite(nick,to) {
    let pack = {
      cmd: 'invite',
      nick: nick
    }
    if (to) pack.to = to;
    this._send(pack);
  }
  whisper(to,text) {
    this._send({
      cmd: 'whisper',
      nick: to,
      text: text
    })
  }
  reply(obj) { //来源十字街，有改动
    let replyText = '';
    let originalText = args.text;
    let overlongText = false;
    if (originalText.length > 152) {
      replyText = originalText.slice(0, 152);
      overlongText = true;
    }
    if (args.trip) {
      replyText = '>' + args.trip + ' ' + args.nick + '：\n';
    } else {
      replyText = '>' + args.nick + '：\n';
    }
    originalText = originalText.split('\n');
    if (originalText.length >= 8) {
      originalText = originalText.slice(0, 8);
      overlongText = true;
    }
    for (let replyLine of originalText) {
      if (!replyLine.startsWith('>>')) replyText += '>' + replyLine + '\n';
    }
    if (overlongText) replyText += '>……\n';
    replyText += '\n';
    var nick = args.nick
    replyText += '@' + nick + ' ';
    return replyText;
  }
  _COMMAND(cmd, args, info, back, whisper) {
    if (this.command[cmd]) {
      try {
        this.command[cmd].run(args,info,back,whisper);
      } catch (e) {
        back(`命令执行出错：${e.message}`);
      }
    }
  }
}

module.exports = Client