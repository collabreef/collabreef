export default {
  placeholder: {
    search: "搜尋",
    searchWorkspace: "搜尋 / 新增工作區"
  },
  menu: {
    notes: "筆記",
    createWithName: "新增工作區：{{name}}",
    workspaceSettings: "工作區設定",
    workspace: "工作區",
    user: "使用者",
    models: "AI模型",
    preferences: "偏好設定",
    gencommands: "生成指令",
    explore: "探索",
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
      createYourFirstWorkspace: "建立你的第一個工作區",
      pleaseEnterYourWorkspaceName: "請輸入你的工作區名稱",
      workspaceName: "工作區名稱",
      workspaceNamePlaceholder: "工作區名稱",
    },
    noteEdit: {
      newNote: "新增筆記",
      editNote: "編輯筆記",
    },
    noteDetail: {
      note: "筆記",
    },
    preferences: {
      language: "語言",
      theme: "主題",
    },
    genCommands: {
      name: "指令名稱",
      containerType: "容器類型",
      prompt: "提示詞",
      model: "模型",
      genType: "生成方式",
      searchPlaceholder: "搜尋生成指令",
      createNew: "建立新指令",
      editing: "編輯指令",
      namePlaceholder: "輸入指令名稱",
      promptPlaceholder: "輸入提示詞範本（使用 {{input}} 代表使用者輸入）",
      createSuccess: "指令建立成功",
      createError: "指令建立失敗",
      updateSuccess: "指令更新成功",
      updateError: "指令更新失敗",
      deleteSuccess: "指令刪除成功",
      deleteError: "指令刪除失敗",
      confirmDelete: "確定要刪除這個指令嗎？",
      fillRequired: "請填寫所有必填欄位",
      noResults: "找不到符合的指令",
      empty: "還沒有指令，建立第一個吧！",
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
    new: "新增",
    newNote: "新增筆記",
    rename: "重新命名",
    filter: "篩選",
    toggleTheme: "切換主題",
    selectFileToUpload: "選擇檔案",
    makePublic: "設為公開",
    makeWorkspace: "設為工作區可見",
    makePrivate: "設為私人",
  },
  messages: {
    signInFailed: "登入失敗，請檢查你的帳號和密碼",
    signUpFailed: "註冊失敗，{{error}}",
    passwordDoNotMatch: "再次輸入密碼不符合",
    deleteTheNote: "刪除這個筆記?",
    noMoreNotes: "沒有更多的筆記",
    preferencesUpdated: "偏好設定已更新",
    preferencesUpdateFailed: "偏好設定更新失敗",
    networkError: "網路異常"
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
  },
  common: {
    loading: "載入中..."
  }
} as const;