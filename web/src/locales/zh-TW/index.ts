export default {
  placeholder: {
    search: "搜尋",
    searchWorkspace: "搜尋 / 新增工作區"
  },
  menu: {
    notes: "筆記",
    genTemplates: "生成模板",
    genHistory: "生成記錄",
    createWithName: "新增工作區：{{name}}",
    workspaceSettings: "工作區設定",
    workspace: "工作區",
    user: "使用者",
    models: "AI模型",
    preferences: "偏好設定",
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
    update: "更新",
    newNote: "新增筆記",
    rename: "重新命名",
    filter: "篩選",
    toggleTheme: "切換主題",
    selectFileToUpload: "選擇檔案",
    makePublic: "設為公開",
    makeWorkspace: "設為工作區可見",
    makePrivate: "設為私人",
    copy: "複製",
    showMore: "顯示更多",
    showLess: "顯示較少",
  },
  messages: {
    signInFailed: "登入失敗，請檢查你的帳號和密碼",
    signUpFailed: "註冊失敗，{{error}}",
    passwordDoNotMatch: "再次輸入密碼不符合",
    deleteTheNote: "刪除這個筆記?",
    noMoreNotes: "沒有更多的筆記",
    noMore: "沒有更多了",
    preferencesUpdated: "偏好設定已更新",
    preferencesUpdateFailed: "偏好設定更新失敗",
    networkError: "網路異常",
    fileUploaded: "檔案上傳成功",
    fileUploadFailed: "檔案上傳失敗",
    copied: "已複製到剪貼簿",
    copyFailed: "複製失敗"
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
  genTemplates: {
    title: "生成模板",
    new: "新增模板",
    edit: "編輯模板",
    empty: "尚無模板。建立你的第一個模板!",
    fields: {
      name: "名稱",
      prompt: "提示詞",
      provider: "提供商",
      model: "模型",
      modality: "模態",
      imageUrls: "預設圖片 (網址)"
    },
    addImageUrl: "新增圖片網址",
    imageUrlPlaceholder: "https://example.com/image.jpg",
    additionalImages: "額外圖片",
    promptPlaceholder: "輸入你的提示詞。使用 {{參數}} 來設定動態值。",
    detectedParameters: "偵測到的參數",
    fillParameters: "填寫參數",
    assembledPrompt: "組裝後的提示詞",
    generate: "生成",
    generating: "生成中...",
    generateSuccess: "生成成功",
    generateError: "生成失敗",
    createSuccess: "模板建立成功",
    createError: "模板建立失敗",
    updateSuccess: "模板更新成功",
    updateError: "模板更新失敗",
    deleteSuccess: "模板刪除成功",
    deleteError: "模板刪除失敗",
    deleteConfirm: "確定要刪除這個模板嗎?",
    generatePlaceholder: "AI 生成功能即將推出!",
    historyDeleteSuccess: "記錄已刪除",
    historyDeleteError: "記錄刪除失敗",
    selectProvider: "選擇提供商",
    selectModel: "選擇模型",
    noProvidersAvailable: "此模態沒有可用的提供商",
    noModelsAvailable: "此提供商和模態沒有可用的模型"
  },
  genHistory: {
    title: "生成記錄",
    empty: "尚無生成記錄",
    emptyHint: "您的 AI 生成結果將會顯示在這裡",
    noHistory: "尚無生成記錄",
    generateToSee: "生成內容後將會顯示在這裡",
    model: "模型",
    prompt: "提示詞",
    response: "回應",
    error: "錯誤",
    images: "圖片",
    viewTemplate: "查看模板",
    deleteSuccess: "記錄已刪除",
    deleteError: "記錄刪除失敗",
    deleteConfirm: "確定要刪除這筆記錄嗎?"
  }
} as const;