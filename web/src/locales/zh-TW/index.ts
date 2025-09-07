export default {
  placeholder: {
    note: "輸入你的筆記 ...",
    search: "搜尋",
    searchWorkspace: "搜尋 / 新增工作區"
  },
  menu: {
    notes: "筆記",
    settings: "設定",
    createWithName: "新增工作區：{{name}}",
  },
  form: {
    email: "Email",
    username: "使用者名稱",
    password: "密碼",
    comfirmPassword: "再次輸入密碼",
  },
  pages: {
    signin:{
      "noAccount":"沒有帳號? 註冊"
    },
    signup:{
      "alreadyHaveAccount":"已有帳號? 登入"
    },
    settings: {
      workspaceName: "工作區名稱",
      deleteThisWorkspace: "刪除這個工作區",
      deleteThisWorkspaceMessage: "刪除這個工作區 ?"
    },
    workspaceSetup: {
      createWorkspace: "建立工作區",
      pleaseEnterYourWorkspaceName: "請輸入你的工作區名稱",
      workspaceName: "工作區名稱",
      workspaceNamePlaceholder: "工作區名稱",
    }
  },
  actions: {
    signin: "登入",
    signup: "註冊",
    signout: "登出",
    save: "保存",
    cancel: "取消",
    delete: "刪除",
    edit: "編輯",
    expand: "展開",
    collapse: "收合",
    create: "建立",
    newNote: "新增筆記",
    rename: "重新命名",
    selectFileToUpload: "選擇檔案"
  },
  message: {
    noMoreNotes: "沒有更多筆記",
  },
  button: {
    new: "新增",
    save: "保存",
    filter: "篩選",
    back: "返回",
    addTag: "新增標籤"
  },
  time: {
    just_now: "剛剛",
    minutes_ago: "{{count}} 分鐘前",
    hours_ago: "{{count}} 小時前",
    date_md: "{{month}}月{{day}}日",
    date_ymd: "{{year}}年{{month}}月{{day}}日"
  }
} as const;