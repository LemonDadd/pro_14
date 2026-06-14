export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/stats/index',
    'pages/growth/index',
    'pages/babies/index',
    'pages/settings/index',
    'pages/log-new/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFF7F9',
    navigationBarTitleText: '宝宝记录',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF8FB1',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计'
      },
      {
        pagePath: 'pages/growth/index',
        text: '生长'
      },
      {
        pagePath: 'pages/babies/index',
        text: '宝宝'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置'
      }
    ]
  }
})
