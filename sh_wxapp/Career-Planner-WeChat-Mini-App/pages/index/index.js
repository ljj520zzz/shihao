// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    refreshing: false,
    activities: [
      {
        id: 1,
        title: "第十四届全国大学生电子商务'创新、创意及创业'挑战赛",
        signupDate: "2023-04-01 - 2023-04-15",
        eventDate: "2023-05-10 - 2023-05-12",
        imageUrl: "/images/activity1.jpg" // 需要准备实际的图片
      },
      {
        id: 2,
        title: "巧手扎编绣，聪蓝染秋冬——会计学院心理协会开展4月学生活动",
        signupDate: "2023-04-10 - 2023-04-20",
        eventDate: "2023-04-25",
        imageUrl: "/images/activity2.jpg" // 需要准备实际的图片
      }
    ]
  },
  methods: {
    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs'
      })
    },
    onChooseAvatar(e) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    getUserProfile(e) {
      // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
      wx.getUserProfile({
        desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          console.log(res)
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    },
    // 菜单点击
    onMenuClick() {
      wx.showActionSheet({
        itemList: ['设置', '关于我们', '意见反馈'],
        success(res) {
          console.log(res.tapIndex)
        }
      })
    },
    
    // 下拉刷新
    onRefresh() {
      this.setData({
        refreshing: true
      })
      
      // 模拟刷新
      setTimeout(() => {
        this.setData({
          refreshing: false
        })
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      }, 1500)
    },
    
    // 功能区导航
    navigateTo(e) {
      const page = e.currentTarget.dataset.page
      
      // Special handling for careerTest to redirect to careerAssessment
      if (page === 'careerTest') {
        wx.navigateTo({
          url: '../careerAssessment/careerAssessment'
        })
      } else {
        // For other pages
        wx.navigateTo({
          url: `../${page}/${page}`
        })
      }
    },
    
    // 查看活动详情
    viewActivity(e) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `../activity-detail/activity-detail?id=${id}`
      })
    },
    
    // 分享活动
    shareActivity(e) {
      const id = e.currentTarget.dataset.id
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    },
    
    // 切换底部标签
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab
      console.log("我现在是"+tab)
      // 临时提示，实际应该切换到对应页面
      wx.showToast({
        title: `切换到${tab}标签`,
        icon: 'none'
      })
      
      // 实际切换代码
      wx.switchTab({
        url: `../${tab}/${tab}`
      })
    }
  },
})
