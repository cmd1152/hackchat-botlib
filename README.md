*These documents do not have an English version because the majority of users who use them are from China*

这是一个一个用于使用Nodejs在 hack.chat 开发简单机器人的轻量框架
你可以查看[Wiki](https://github.com/cmd1152/hackchat-botlib/wiki)来了解用法

**本框架通过伪造 SNI 请求头实现防 DNS 污染**

使用这个框架，您就不必处理

- **DNS污染怎么办**
- 在线列表
- 机器人在用户手动改名（比如直接执行代码发送changeNick）后怎么知道新名称
- whisper和emote怎么提取用户原始内容
- 检查是否加入成功
- 检查是否被踢出
- 检查一个trip、hash、nick是否合法
- 在用户列表中查找用户
- ...更多...

这样子您将有更多的时间用于开发你的机器人
