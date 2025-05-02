Page({
  data: {
    // 聊天列表相关
    showSidebar: false,
    chatHistory: [],
    filteredChatHistory: [],
    searchKeyword: '',
    
    // 当前聊天相关
    currentChatId: null,
    currentChat: {},
    messages: [],
    
    // UI状态
    inputMessage: '', // 用户输入的消息
    isLoading: false,
    sendButtonDisabled: false,  // 新增状态变量
    apiKey: '',  // 新增API密钥变量
    scrollToView: '',  // 新增滚动到指定消息的变量
    currentChatTitle: '', // 新增当前聊天标题变量
    inputFocus: false, // 新增输入框聚焦状态
    isRecording: false, // 语音输入状态
  },
  
  onLoad() {
    // 加载保存的API密钥（如果有）
    const savedKey = wx.getStorageSync('deepseek_api_key');
    if (savedKey) {
      this.setData({ apiKey: savedKey });
    } else {
      // 首次使用，提示用户设置API密钥
      this.showApiKeyDialog();
    }
    
    // 从本地存储加载聊天历史
    const chatHistory = wx.getStorageSync('chatHistory') || [];
    
    // 如果没有聊天历史记录，才创建一个新的对话
    let updatedHistory = chatHistory;
    let newChatId = '';
    
    if (chatHistory.length === 0) {
      newChatId = Date.now().toString();
      const newChat = {
        id: newChatId,
        title: '新对话',
        messages: [],
        timestamp: Date.now()
      };
      
      updatedHistory = [newChat];
    } else {
      // 使用已有历史记录中的第一个作为当前对话
      newChatId = chatHistory[0].id;
    }
    
    this.setData({
      chatHistory: updatedHistory,
      filteredChatHistory: updatedHistory,
      currentChatId: newChatId,
      currentChatTitle: updatedHistory[0]?.title || '新对话',
      messages: updatedHistory[0]?.messages || []
    });
    
    // 保存到本地存储
    wx.setStorageSync('chatHistory', updatedHistory);
    
    // 监听页面渲染完成
    this.onReady = function() {
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    };
  },
  
  // 将时间戳格式化为可读时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                       date.getMonth() === yesterday.getMonth() && 
                       date.getFullYear() === yesterday.getFullYear();
    
    let formattedDate;
    if (isToday) {
      formattedDate = '今天';
    } else if (isYesterday) {
      formattedDate = '昨天';
    } else {
      formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${formattedDate} ${hours}:${minutes}`;
  },
  
  // 聊天历史相关
  toggleSidebar() {
    this.setData({
      showSidebar: !this.data.showSidebar
    });
  },
  
  // 创建新对话
  createNewChat() {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: '新对话',
      messages: [],
      timestamp: Date.now()
    };
    
    const updatedHistory = [newChat, ...this.data.chatHistory];
    
    this.setData({
      chatHistory: updatedHistory,
      filteredChatHistory: updatedHistory,
      currentChatId: newChatId,
      currentChatTitle: '新对话',
      messages: [],
      showSidebar: false // 创建新对话后关闭侧边栏
    });
    
    // 保存到本地存储
    wx.setStorageSync('chatHistory', updatedHistory);
  },
  
  // 选择对话
  selectChat(e) {
    const chatId = e.currentTarget.dataset.id;
    const selectedChat = this.data.chatHistory.find(chat => chat.id === chatId);
    
    if (selectedChat) {
      this.setData({
        currentChatId: chatId,
        currentChatTitle: selectedChat.title || '新对话',
        messages: selectedChat.messages || [],
        showSidebar: false // 选择对话后关闭侧边栏
      });
      
      // 滚动到底部
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    }
  },
  
  // 搜索对话历史
  searchHistory(e) {
    const keyword = e.detail.value.toLowerCase();
    
    if (!keyword.trim()) {
      this.setData({
        filteredChatHistory: this.data.chatHistory,
        searchKeyword: ''
      });
      return;
    }
    
    const filtered = this.data.chatHistory.filter(chat => 
      (chat.title && chat.title.toLowerCase().includes(keyword)) ||
      (chat.messages && chat.messages.some(msg => 
        msg.content.toLowerCase().includes(keyword)
      ))
    );
    
    this.setData({
      filteredChatHistory: filtered,
      searchKeyword: keyword
    });
  },
  
  // 更新当前对话的标题
  updateChatTitle(title) {
    // 更新状态
    this.setData({
      currentChatTitle: title
    });
    
    // 更新聊天历史中的标题
    const updatedHistory = this.data.chatHistory.map(chat => {
      if (chat.id === this.data.currentChatId) {
        return { ...chat, title };
      }
      return chat;
    });
    
    this.setData({
      chatHistory: updatedHistory,
      filteredChatHistory: this.data.searchKeyword ? 
        this.data.filteredChatHistory.map(chat => {
          if (chat.id === this.data.currentChatId) {
            return { ...chat, title };
          }
          return chat;
        }) : 
        updatedHistory
    });
    
    // 更新本地存储
    wx.setStorageSync('chatHistory', updatedHistory);
  },
  
  // 监听输入变化
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value,
      // 根据输入内容自动启用/禁用发送按钮
      sendButtonDisabled: !e.detail.value.trim() || this.data.isLoading
    });
  },
  
  // 使用提示模板
  usePromptTemplate(e) {
    const prompt = e.currentTarget.dataset.prompt;
    this.setData({
      inputMessage: prompt,
      inputFocus: true // 设置输入框聚焦
    });
  },
  
  // 语音输入功能
  activateVoiceInput() {
    // 检查是否支持录音
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.startRecording();
            },
            fail: () => {
              wx.showToast({
                title: '需要录音权限',
                icon: 'none'
              });
            }
          });
        } else {
          this.startRecording();
        }
      }
    });
  },
  
  // 开始录音
  startRecording() {
    const recorderManager = wx.getRecorderManager();
    
    recorderManager.onStart(() => {
      this.setData({
        isRecording: true
      });
      
      wx.showToast({
        title: '录音中...',
        icon: 'none',
        duration: 60000
      });
    });
    
    recorderManager.onStop((res) => {
      wx.hideToast();
      
      this.setData({
        isRecording: false
      });
      
      if (res.duration < 1000) {
        wx.showToast({
          title: '录音时间太短',
          icon: 'none'
        });
        return;
      }
      
      // 这里可以添加语音识别功能，将语音转换为文字
      // 示例:
      wx.showLoading({
        title: '识别中...',
      });
      
      // 模拟语音识别过程
      setTimeout(() => {
        wx.hideLoading();
        
        // 假设已经识别出文字
        const recognizedText = "这是语音识别的结果";
        
        this.setData({
          inputMessage: recognizedText
        });
      }, 1000);
    });
    
    recorderManager.onError((res) => {
      wx.hideToast();
      
      this.setData({
        isRecording: false
      });
      
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
    });
    
    // 配置录音参数
    const options = {
      duration: 60000, // 最长录音时间，单位ms
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 64000, // 编码码率
      format: 'mp3' // 音频格式
    };
    
    // 开始录音
    recorderManager.start(options);
  },
  
  // 发送消息
  sendMessage() {
    const { inputMessage, currentChatId, chatHistory, isLoading } = this.data;
    if (!inputMessage.trim() || isLoading) return;
    
    // 设置发送按钮状态
    this.setData({
      sendButtonDisabled: true,
      isLoading: true
    });
    
    // 获取当前聊天
    const currentChat = chatHistory.find(chat => chat.id === currentChatId);
    
    // 仅当这是对话的第一条消息时，将其设为标题
    if (currentChat && (!currentChat.messages || currentChat.messages.length === 0)) {
      // 限制标题长度，太长的问题会被截断
      const title = inputMessage.length > 20 
        ? inputMessage.substring(0, 20) + '...' 
        : inputMessage;
      
      // 更新聊天历史中的标题
      this.updateChatTitle(title);
    }
    
    // 创建用户消息对象
    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().getTime()
    };
    
    // 更新消息列表和输入框
    const updatedMessages = [...this.data.messages, userMessage];
    this.setData({
      messages: updatedMessages,
      inputMessage: ''
    }, () => {
      // 滚动到底部
      this.scrollToBottom();
    });
    
    // 更新当前聊天记录
    this.updateCurrentChat(updatedMessages);
    
    // 调用AI API获取回复
    this.receiveAIResponse(inputMessage);
  },
  
  // 更新当前聊天记录
  updateCurrentChat(messages) {
    // 查找当前聊天在历史中的索引
    const currentChatIndex = this.data.chatHistory.findIndex(
      chat => chat.id === this.data.currentChatId
    );
    
    if (currentChatIndex === -1) return;
    
    // 创建更新后的聊天历史
    const updatedChat = {
      ...this.data.chatHistory[currentChatIndex],
      messages: messages,
      timestamp: Date.now() // 更新时间戳
    };
    
    // 将当前聊天移到最前面
    let updatedHistory = [...this.data.chatHistory];
    updatedHistory.splice(currentChatIndex, 1);
    updatedHistory = [updatedChat, ...updatedHistory];
    
    // 更新状态
    this.setData({
      chatHistory: updatedHistory,
      filteredChatHistory: this.data.searchKeyword ? 
        this.data.filteredChatHistory.map(chat => 
          chat.id === this.data.currentChatId ? updatedChat : chat
        ) : 
        updatedHistory
    });
    
    // 保存到本地存储
    wx.setStorageSync('chatHistory', updatedHistory);
  },
  
  // 滚动到底部
  scrollToBottom() {
    // 使用选择器获取消息列表的高度
    wx.createSelectorQuery()
      .select('#messageScroll')
      .node()
      .exec((res) => {
        if (res && res[0] && res[0].node) {
          const scrollView = res[0].node;
          scrollView.scrollTo({
            top: scrollView.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
  },
  
  // 接收AI回复
  receiveAIResponse(userMessage) {
    // 调用DeepSeek API
    wx.request({
      url: 'https://api.deepseek.com/v1/chat/completions', // 请替换为实际的DeepSeek API端点
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.apiKey}` // 从小程序数据中获取API密钥
      },
      data: {
        model: "deepseek-chat", // 或其他您想使用的DeepSeek模型
        messages: [
          { role: "system", content: "你是一位职业规划AI助手，擅长提供职业发展建议、学习路径规划和职业选择指导。" },
          // 添加历史消息上下文
          ...this.data.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      success: (res) => {
        // 从API响应中提取AI回复
        const aiResponse = res.data.choices[0].message.content;
        
        // 创建AI消息对象
        const aiMessage = {
          id: Date.now().toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date().getTime()
        };
        
        // 更新UI和存储
        const updatedMessages = [...this.data.messages, aiMessage];
        this.setData({
          messages: updatedMessages,
          isLoading: false,
          sendButtonDisabled: false
        }, () => {
          // 等待DOM更新后滚动到底部
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
        
        // 保存到本地存储
        this.updateCurrentChat(updatedMessages);
      },
      fail: (error) => {
        console.error('DeepSeek API调用失败:', error);
        
        // 处理错误情况
        const errorMessage = {
          id: Date.now().toString(),
          content: "抱歉，我暂时无法回应。请稍后再试。",
          sender: 'ai',
          timestamp: new Date().getTime()
        };
        
        const updatedMessages = [...this.data.messages, errorMessage];
        this.setData({
          messages: updatedMessages,
          isLoading: false,
          sendButtonDisabled: false
        }, () => {
          // 等待DOM更新后滚动到底部
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
        
        this.updateCurrentChat(updatedMessages);
      }
    });
  },
  
  // 保存聊天记录到本地存储
  saveChatsToStorage() {
    wx.setStorageSync('aiPlanChatHistory', this.data.chatHistory);
  },
  
  // 可添加一个设置API密钥的函数
  setApiKey(key) {
    this.setData({ apiKey: key });
    // 可以选择保存到本地存储
    wx.setStorageSync('deepseek_api_key', key);
  },
  
  // API密钥设置对话框
  showApiKeyDialog() {
    wx.showModal({
      title: 'DeepSeek API配置',
      content: '请输入您的DeepSeek API密钥',
      editable: true,
      placeholderText: '在此输入API密钥',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setApiKey(res.content);
        }
      }
    });
  },
  
  // 给消息提供反馈
  giveFeedback(e) {
    const feedbackType = e.currentTarget.dataset.type;
    const messageId = e.currentTarget.dataset.id;
    
    // 显示用户反馈提示
    wx.showToast({
      title: feedbackType === 'like' ? '感谢您的反馈！' : '感谢您的反馈，我们会继续改进',
      icon: 'none',
      duration: 1500
    });
    
    // 这里可以添加反馈记录到服务器的功能
    console.log(`用户给消息 ${messageId} 提供了 ${feedbackType} 反馈`);
  },
  
  // 复制消息内容
  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },
  
  // 处理自定义返回按钮点击
  handleBackButton() {
    // 判断当前是否有消息
    if(this.data.messages.length > 0) {
      // 清空消息，回到AI助手首页
      this.createNewChat();
    } else {
      // 如果已经在首页，则返回到上一级页面
      wx.navigateBack({
        delta: 1
      });
    }
  },
  
  // 删除对话
  deleteChat(e) {
    // 微信小程序不支持stopPropagation方法
    // 使用catchtap在wxml中实现阻止冒泡
    
    const chatId = e.currentTarget.dataset.id;
    console.log('准备删除对话', chatId, '类型:', typeof chatId);
    console.log('当前聊天历史记录数量:', this.data.chatHistory.length);
    
    // 对chatId进行验证
    if (!chatId) {
      console.error('chatId无效:', chatId);
      wx.showToast({
        title: '删除失败',
        icon: 'error',
        duration: 1500
      });
      return;
    }
    
    // 获取要删除的聊天记录
    const chatToDelete = this.data.chatHistory.find(chat => String(chat.id) === String(chatId));
    if (!chatToDelete) {
      console.error('找不到要删除的聊天记录:', chatId);
      console.log('所有ID:', this.data.chatHistory.map(chat => chat.id));
      wx.showToast({
        title: '找不到对话',
        icon: 'error',
        duration: 1500
      });
      return;
    }
    
    console.log('要删除的对话标题:', chatToDelete.title);
    
    // 显示确认对话框
    wx.showModal({
      title: '删除对话',
      content: '确定要删除这个对话吗？',
      confirmColor: '#ff5252',
      cancelColor: '#333333',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        console.log('模态框响应:', res);
        
        if (res.confirm) {
          console.log('用户确认删除');
          // 复制一份历史记录，避免直接修改原数组
          const history = [...this.data.chatHistory];
          
          // 用户点击确定，执行删除操作
          const updatedHistory = history.filter(chat => {
            // 确保比较的是字符串
            const result = String(chat.id) !== String(chatId);
            console.log('比较:', chat.id, chatId, result);
            return result;
          });
          
          console.log('原始历史记录长度:', history.length);
          console.log('更新后的历史记录长度:', updatedHistory.length);
          
          if (history.length === updatedHistory.length) {
            console.error('警告：过滤后的历史记录长度没有变化，没有找到ID为', chatId, '的对话');
            wx.showToast({
              title: '删除失败',
              icon: 'error',
              duration: 1500
            });
            return;
          }
          
          // 如果删除的是当前聊天，则创建一个新的聊天
          let newCurrentChatId = this.data.currentChatId;
          let newMessages = this.data.messages;
          let newTitle = this.data.currentChatTitle;
          
          if (String(chatId) === String(this.data.currentChatId)) {
            console.log('删除的是当前对话');
            if (updatedHistory.length > 0) {
              // 选择列表中的第一个聊天
              newCurrentChatId = updatedHistory[0].id;
              newMessages = updatedHistory[0].messages || [];
              newTitle = updatedHistory[0].title || '新对话';
              console.log('切换到第一个对话:', newCurrentChatId);
            } else {
              // 如果没有其他聊天了，创建一个新的
              const newChatId = Date.now().toString();
              const newChat = {
                id: newChatId,
                title: '新对话',
                messages: [],
                timestamp: Date.now()
              };
              
              updatedHistory.push(newChat);
              newCurrentChatId = newChatId;
              newMessages = [];
              newTitle = '新对话';
              console.log('创建新对话:', newCurrentChatId);
            }
          }
          
          try {
            console.log('执行setData前');
            // 首先保存到本地存储，确保数据已更新
            wx.setStorageSync('chatHistory', updatedHistory);
            console.log('本地存储更新完成');
            
            // 更新状态
            this.setData({
              chatHistory: updatedHistory,
              filteredChatHistory: this.data.searchKeyword ? 
                this.data.filteredChatHistory.filter(chat => String(chat.id) !== String(chatId)) : 
                updatedHistory,
              currentChatId: newCurrentChatId,
              messages: newMessages,
              currentChatTitle: newTitle
            }, () => {
              console.log('状态更新完成');
              console.log('更新后的历史记录数量:', this.data.chatHistory.length);
              
              // 显示删除成功提示
              wx.showToast({
                title: '已删除',
                icon: 'success',
                duration: 1500
              });
            });
          } catch (error) {
            console.error('删除操作失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error',
              duration: 1500
            });
          }
        } else {
          console.log('用户取消删除');
        }
      },
      fail: (err) => {
        console.error('显示模态框失败:', err);
      }
    });
  },
  
  // 创建新对话数据（仅返回数据，不修改状态）
  createNewChatData() {
    return {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      timestamp: Date.now()
    };
  },
});