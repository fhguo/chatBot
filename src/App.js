import './App.css';

import '@chatui/core/es/styles/index.less';
// 引入组件
import Chat, { Bubble, useMessages, Button, Modal, Input, Divider, toast, RichText } from '@chatui/core';
// 引入样式
import '@chatui/core/dist/index.css';
import axios from "axios";

import { useState } from 'react';
const initialMessages = [
  {
    type: 'text',
    content: { text: '主人好，我是基于chatGPT的智能机器人，可以回答问题、翻译、写作等，欢迎随时与我交流~' },
    user: { avatar: './ChatGPT_logo.png' },
  },
  // {
  //   type: 'image',
  //   content: {
  //     picUrl: '//img.alicdn.com/tfs/TB1p_nirYr1gK0jSZR0XXbP8XXa-300-300.png',
  //   },
  // },
];

// 默认快捷短语，可选
const defaultQuickReplies = [
  {
    name: '你可以做什么',
    isNew: true,
  },
  {
    name: '讲个笑话',
    // isHighlight: true,
  },
  {
    icon: "cancel",
    name: '刷新页面',
    // isHighlight: true,
  },
  {
    icon: 'plus-circle',
    name: 'openAI设置',
    // isNew: true,
    isHighlight: false,
  },
  {
    icon: "folder",
    name: '前端笔记',
    // isHighlight: true,
  },
];

export default function () {
  // 消息列表
  const { messages, appendMsg, setTyping } = useMessages(initialMessages);
  // 输入Key
  const [open, setOpen] = useState(false);
  const [value1, setValue1] = useState('');
  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleConfirm() {
    // alert(value1);
    if (value1.length < 20) {
      toast.fail("格式不正确")
      return
    }
    localStorage.setItem('apiKey', value1)
    toast.success("操作成功")
    setOpen(false);
  }

  // 判断红点
  if(localStorage.getItem('clickFlag')) {
    defaultQuickReplies[0].isNew = false
  }else {
    defaultQuickReplies[0].isNew = true
  }
  // 发送回调
  // function handleSend(type, val) {
  //   if (type === 'text' && val.trim()) {
  //     // TODO: 发送请求
  //     appendMsg({
  //       type: 'text',
  //       content: { text: val },
  //       position: 'right',
  //     });

  //     setTyping(true);

  //     // 模拟回复消息
  //     setTimeout(() => {
  //       appendMsg({
  //         type: 'text',
  //         content: { text: '亲，您遇到什么问题啦？请简要描述您的问题~' },
  //       });
  //     }, 1000);
  //   }
  // }

  const [chatMessage, setChatMessage] = useState([]);
  // 发送回调
  function handleSend(type, val) {
    var apiKey = localStorage.getItem('apiKey')
    if (!apiKey) {
      // toast.fail("请先输入你的apiKey")
      setOpen(true);
      return
    }
    if (type === 'text' && val.trim()) {
      // TODO: 发送请求
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
      });
      axios
        .post(
          // 'https://api.openai.com/v1/chat/completions',
          'https://open.aiproxy.xyz/v1/chat/completions', // 网络代理
          {
            messages: [...chatMessage, { content: val, role: 'user' }],
            max_tokens: 2048,
            n: 1,
            temperature: 0.5,
            //   stop: ['\n'],
            model: 'gpt-3.5-turbo',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + apiKey,
            },
          },
        )
        .then((res) => {
          const response = res.data.choices[0].message.content.trim();
          const newMessages = [
            ...chatMessage,
            { content: val, role: 'user' },
            { content: response, role: 'system' },
          ];
          // setChatMessage(newMessages as any);
          setChatMessage(newMessages);
          appendMsg({
            type: 'text',
            content: { text: response },
            user: { avatar: './ChatGPT_logo.png' },
          });
        })
        .catch((err) => {
          console.log(err)
          toast.fail("出错啦！请稍后再试")
        }
        );

      setTyping(true);
    }
  }

  // 快捷短语回调，可根据 item 数据做出不同的操作，这里以发送文本消息为例
  function handleQuickReplyClick(item) {
    console.log(item.name);
    if (item.name == "openAI设置") {
      handleOpen()
      return
    }
    if (item.name == "你可以做什么") {
      defaultQuickReplies[0].isNew = false
      localStorage.setItem('clickFlag', false)
    }
    if (item.name == "刷新页面") {
      window.location.reload()
      return
    }
    if (item.name == "前端笔记") {
      window.location = "https://gfh_he.gitee.io/vue-press/#/"
      return
    }
    handleSend('text', item.name);
  }

  function renderMessageContent(msg) {
    const { type, content } = msg;

    // 根据消息类型来渲染
    switch (type) {
      case 'text':
        return <Bubble content={content.text} />;
      case 'image':
        return (
          <Bubble type="image">
            <img src={content.picUrl} alt="" />
          </Bubble>
        );
      default:
        return null;
    }
  }

  return (
    [<Chat
      navbar={{ title: 'chatBot' }}
      placeholder="有问题尽管问我~"
      messages={messages}
      renderMessageContent={renderMessageContent}
      quickReplies={defaultQuickReplies}
      onQuickReplyClick={handleQuickReplyClick}
      onSend={handleSend}
    />,
    <Modal
      active={open}
      title="设置"
      showClose={false}
      onClose={handleClose}
      actions={[
        {
          label: '确认',
          color: 'primary',
          onClick: handleConfirm,
        },
        {
          label: '取消',
          onClick: handleClose,
        },
      ]}
    >
      <div>
        <p><span className='requird-span'>*</span>API Key</p>
        <Input value={value1} onChange={val => setValue1(val)} placeholder="请输入API Key" /></div>
    </Modal>
    ]
  );
}