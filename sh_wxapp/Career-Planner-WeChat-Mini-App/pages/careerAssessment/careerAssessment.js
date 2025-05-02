Page({
  data: {
    assessments: [
      {
        name: "MBTI职业性格测评(28题测试)",
        iconColor: "#FF5722",
        iconClass: "icon-doc",
        description: "最为流行的职业人格评估工具"
      },
      {
        name: "MBTI职业性格测评(93题测试)",
        iconColor: "#FF5722",
        iconClass: "icon-doc",
        description: "最为流行的职业人格评估工具"
      },
      {
        name: "舒伯职业价值观测试",
        iconColor: "#4CAF50",
        iconClass: "icon-network",
        description: "用来衡量价值观——工作中和工作以外的一切以及激励人们工作目标"
      },
      {
        name: "霍兰德职业倾向测试",
        iconColor: "#FFEB3B",
        iconClass: "icon-doc",
        description: "对于职业和兴趣的分类是最权威的测试"
      },
      {
        name: "卡特尔16PF测验",
        iconColor: "#FFEB3B",
        iconClass: "icon-doc",
        description: "通过16种性格因素反映个人独特的人格"
      },
      {
        name: "创业能力测评",
        iconColor: "#FFEB3B",
        iconClass: "icon-doc",
        description: "最新的创业能力测评"
      }
    ]
  },

  navigateToDetail(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({
      title: `即将前往${name}详情页面`,
      icon: 'none'
    });
    // Implement navigation to detail page
  },

  onTapHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  onTapProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  }
}); 

