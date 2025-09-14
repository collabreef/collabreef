export default {
  placeholder: {
    note: "輸入你的筆記 ...",
    search: "搜尋",
    searchWorkspace: "搜尋 / 新增工作區"
  },
  menu: {
    notes: "筆記",
    createWithName: "新增工作區：{{name}}",
    workspaceSettings: "工作區設定",
    user: "使用者",
    preferences: "偏好設定",
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
      workspaceSettings: "工作區設定",
      workspaceName: "工作區名稱",
      deleteThisWorkspace: "刪除這個工作區",
      deleteThisWorkspaceMessage: "刪除這個工作區 ?"
    },
    workspaceSetup: {
      createWorkspace: "建立工作區",
      pleaseEnterYourWorkspaceName: "請輸入你的工作區名稱",
      workspaceName: "工作區名稱",
      workspaceNamePlaceholder: "工作區名稱",
    },
    noteEdit: {
      newNote: "新增筆記",
      editNote: "編輯筆記",
    },
    preferences: {
      language: "語言"
    }
  },
  actions: {
    signin: "登入",
    signup: "註冊",
    signout: "登出",
    save: "存檔",
    cancel: "取消",
    delete: "刪除",
    edit: "編輯",
    expand: "展開",
    collapse: "收合",
    create: "建立",
    newNote: "新增筆記",
    rename: "重新命名",
    filter: "篩選",
    selectFileToUpload: "選擇檔案",
    makePublic: "設為公開",
    makeWorkspace: "設為工作區可見",
    makePrivate: "設為私人",
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