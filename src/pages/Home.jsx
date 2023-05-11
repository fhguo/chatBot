import '../App.css';

import '@chatui/core/es/styles/index.less';
// 引入组件
import Chat, { Bubble, useMessages, Modal, Input, toast, Radio, RadioGroup, Popup, Image, Icon } from '@chatui/core';
// 引入样式
import '@chatui/core/dist/index.css';
import axios from "axios";
// import { Link } from 'react-router-dom'
import { useState } from 'react';
const initialMessages = [
  {
    type: 'text',
    content: { text: '主人好，我是基于chatGPT的智能助理，可以回答问题、翻译、写作等，欢迎随时与我交流~' },
    user: { avatar: './ChatGPT_logo.png' },
  },
  // {
  //   type: 'image',
  //   content: {
  //     picUrl: '//img.alicdn.com/tfs/TB1p_nirYr1gK0jSZR0XXbP8XXa-300-300.png',
  //   },
  //   user: { avatar: './ChatGPT_logo.png' },
  // },
];

// 默认快捷短语，可选
const defaultQuickReplies = [
  {
    icon:"keyboard-circle",
    name: '奇思妙想',
    isNew: true
  },
  {
    name: '你有意识吗',
  },
  {
    name: '从1加到100等于多少',
  },
  {
    name: '推荐一部科幻电影',
  },
  // {
  //   icon: "check-circle",
  //   name: '下载APP',
  // },
  {
    icon: "folder",
    name: '前端笔记',
  },
];

const options = [
  { label: 'openAI官方', value: 'https://api.openai.com' },
  { label: '代理A', value: 'https://open.aiproxy.xyz' },
  { label: '代理B', value: 'https://Inkcast.com', disabled: true },
];

export default function () {
  // 消息列表
  const { messages, appendMsg, setTyping } = useMessages(initialMessages);
  // 输入Key
  const [open, setOpen] = useState(false);
  var [keyValue, setValue1] = useState(localStorage.getItem('apiKey') || "");
  function handleSetValue(val) {
    setValue1(val)
    keyValue = localStorage.getItem('apiKey');
  }

  // 请求URL
  // var [baseUrl, setValue] = useState("https://open.aiproxy.xyz");
  var localUrl = localStorage.getItem('baseUrl')
  var [baseUrl, setValue] = useState(localUrl || "https://open.aiproxy.xyz");
  var [hotList, sethotList] = useState([]);
  function handleChange(val) {
    setValue(val);
  }
  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  const [openPop, setOpenPop] = useState(false);

  function handleOpenPop() {
    setOpenPop(true);
  }

  function handleClosePop() {
    setOpenPop(false);
  }
  function handleConfirm() {
    if (keyValue.length < 20) {
      toast.fail("格式不正确")
      return
    }
    // console.log(2, baseUrl);
    // 将输入信息存储本地
    localStorage.setItem('apiKey', keyValue)
    localStorage.setItem('baseUrl', baseUrl);
    toast.success("操作成功")
    setOpen(false);
  }

  // 判断红点
  if (localStorage.getItem('clickFlag')) {
    defaultQuickReplies[0].isNew = false
  } else {
    defaultQuickReplies[0].isNew = true
  }

  const [chatMessage, setChatMessage] = useState([]);
  // 知乎热榜
  function zhihuSend() {
    axios.get('/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true')
      .then((res) => {
        // console.log(res.data.data);
        sethotList(res.data.data.slice(0, 20))
      })
      .catch((err) => {
        console.log(err)
        toast.fail("出错啦！请稍后再试")
      })
  }

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
          baseUrl + '/v1/chat/completions', // 基本地址
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
    if (item.name == "奇思妙想") {
      defaultQuickReplies[0].isNew = false
      localStorage.setItem('clickFlag', false)
      zhihuSend()
      handleOpenPop()
      return
    }
    if (item.name == "下载APP") {
      window.location.href = "https://gitee.com/gfh_he/chat-robot/releases"
      return
    }
    if (item.name == "前端笔记") {
      window.location = "https://gfh_he.gitee.io/vue-note/"
      return
    }
    handleSend('text', item.name);
  }

  function handleHot(type, target) {
    setOpenPop(false);
    // var content = target.excerpt + "  " +target.title
    handleSend(type, target.title);
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

  // 打开模态框
  function setOption() {
    // setValue("")
    handleOpen()
  }

  function clear() {
    window.location.reload();
  }
  return (
    [
      <div className='head'>
        <div className='head-set' onClick={() => setOption()}><img src={process.env.PUBLIC_URL + '/set.png'} alt="设置" /></div>
        <div className='head-title'>chatBot</div>
        <div className='head-clear' onClick={() => clear()}><img src={process.env.PUBLIC_URL + '/clear.png'} alt="清空" /></div>
      </div>,
      <Chat
        // navbar={{ title: 'chatBot' }}
        placeholder="有问题尽管问我~"
        messages={messages}
        renderMessageContent={renderMessageContent}
        quickReplies={defaultQuickReplies}
        onQuickReplyClick={handleQuickReplyClick}
        onSend={handleSend}
      />,
      <Modal
        active={open}
        title="openAI"
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
          <Input value={keyValue} onChange={val => handleSetValue(val)} placeholder="请输入API Key" />
          <p>API Server</p>
          {/* 单选 */}
          <RadioGroup value={baseUrl} options={options} onChange={handleChange} />
        </div>
      </Modal>,
      <div>
        <Popup
          active={openPop}
          title="选择以下话题 快速与我对话"
          onClose={handleClosePop}
        >
          <div className='pop-outer'>
            <h3>知乎热榜</h3>
            <div className='zhihu-list'>
              {/* 
                1.在列表遍历时一定要绑定key
                2.key值必须绑定在遍历的直接子元素上
                3.key的做用:a:唯一标识 b.对元素进行添加,修改或者删除的唯一标识
            */}
              {hotList.map(item => { 
                return <div className='zhihu-item' onClick={() => handleHot('text', item.target)}><div key={item.card_id}>{item.target.title}</div><Icon className='search-icon' type="chevron-right" /></div>
              })}
            </div>
          </div>
        </Popup>
      </div>

    ]
  );
}