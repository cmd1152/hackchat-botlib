let modules = {
  "WebSocket" : "ws"
}
for (let module in modules) {
  let module_name = module;
  let module_path = modules[module_name];
  try {
    require(module_path);
  } catch (e) {
    throw new Error(`导入${module_name}失败（位于${module_path}）`)
  }
  global[module_name] = require(module_path);
}

class Client {
  constructor(server_ip) {
    this._ws = new WebSocket(server_ip);
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
      }
      this.onmessage(event.data,hc);
    }
    ["onclose","onchangechannel","joinfailed","oncaptcha","onjoin","onjoined","onmessage"].forEach(func=>{
      this[func] = () => {}
    });
    ["channel","nick","joined","ping","pingtime","check"].forEach(ve=>{
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
    return this.customId.toString();
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
  whisper(to,text) {
    this._send({
      cmd: 'whisper',
      nick: to,
      text: text
    })
  }
}

module.exports = Client