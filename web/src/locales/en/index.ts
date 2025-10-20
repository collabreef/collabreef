export default {
  placeholder: {
    note: "Start writing your note ...",
    search: "Search",
    searchWorkspace: "Search / Add Workspace"
  },
  menu: {
    notes: "Notes",
    genTemplates: "Gen Templates",
    genHistory: "Generation History",
    createWithName: "Create workspace：{{name}}",
    workspaceSettings: "Workspace Settings",
    workspace: "Workspace",
    user: "User",
    models: "AI Models",
    preferences: "Preferences",
    explore: "Explore",
  },
  form: {
    email: "Email",
    username: "Username",
    password: "Password",
    comfirmPassword: "Confirm Password",
  },
  pages: {
    signin:{
      "noAccount":"Don't have an account? Sign up"
    },
    signup:{
      "alreadyHaveAccount":"Already have an account? Log in."
    },
    settings: {
      workspaceSettings: "Worksapce Settings",
      workspaceName: "Workspace name",
      deleteThisWorkspace: "Delete this workspace",
      deleteThisWorkspaceMessage : "Delete this workspace ?"
    },
    workspaceSetup: {
      createYourFirstWorkspace: "Create your first workspace",
      pleaseEnterYourWorkspaceName:"Please enter your workspace name",
      workspaceName: "Workspace name",
      workspaceNamePlaceholder: "workspace name",
    },
    noteEdit: {
      newNote: "New Note",
      editNote: "Edit Note",
    },
    noteDetail: {
      note: "Note",
    },
    preferences: {
      language: "Langueage",
      theme: "Theme",
    }
  },
  actions: {
    signin: "Sign in",
    signup: "Sign up",
    signout: "Sign out",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    expand: "Expand",
    collapse: "Collapse",
    create: "Create",
    update: "Update",
    newNote: "New Note",
    rename: "Rename",
    filter: "Filter",
    toggleTheme: "Toggle theme",
    selectFileToUpload: "Select file to upload",
    makePublic: "Make Public",
    makeWorkspace: "Make Workspace",
    makePrivate: "Make Private",
    copy: "Copy",
    showMore: "Show more",
    showLess: "Show less",
  },
  messages: {
    signInFailed: "Sign in failed, please check your username and password",
    signUpFailed: "Sign up failed, {{error}}",
    passwordDoNotMatch: "Passwords do not match",
    deleteTheNote: "Delete the note?",
    noMoreNotes: "No more notes",
    noMore: "No more items",
    preferencesUpdated: "Preferences updated",
    preferencesUpdateFailed: "Could not update preferences",
    networkError: "Network error. Please try again",
    fileUploaded: "File uploaded successfully",
    fileUploadFailed: "File upload failed",
    copied: "Copied to clipboard",
    copyFailed: "Failed to copy"
  },
  button: {
    new: "New",
    save: "Save",
    filter: "Filter",
    back: "Back",
    addTag: "Add Tag"
  },
  time: {
    just_now: "just now",
    minutes_ago: "{{count}} minutes ago",
    hours_ago: "{{count}} hours ago",
    date_md: "{{month}}/{{day}}",
    date_ymd: "{{year}}/{{month}}/{{day}}"
  },
  genTemplates: {
    title: "Generation Templates",
    new: "New Template",
    edit: "Edit Template",
    empty: "No templates yet. Create your first template!",
    fields: {
      name: "Name",
      prompt: "Prompt",
      provider: "Provider",
      model: "Model",
      modality: "Modality",
      imageUrls: "Default Images (URLs)"
    },
    addImageUrl: "Add Image URL",
    imageUrlPlaceholder: "https://example.com/image.jpg",
    additionalImages: "Additional Images",
    promptPlaceholder: "Enter your prompt. Use {{parameter}} for dynamic values.",
    detectedParameters: "Detected parameters",
    fillParameters: "Fill in Parameters",
    assembledPrompt: "Assembled Prompt",
    generate: "Generate",
    generating: "Generating...",
    generateSuccess: "Generated successfully",
    generateError: "Generation failed",
    createSuccess: "Template created successfully",
    createError: "Failed to create template",
    updateSuccess: "Template updated successfully",
    updateError: "Failed to update template",
    deleteSuccess: "Template deleted successfully",
    deleteError: "Failed to delete template",
    deleteConfirm: "Are you sure you want to delete this template?",
    generatePlaceholder: "AI generation feature coming soon!",
    historyDeleteSuccess: "History deleted successfully",
    historyDeleteError: "Failed to delete history",
    selectProvider: "Select a provider",
    selectModel: "Select a model",
    noProvidersAvailable: "No providers available for this modality",
    noModelsAvailable: "No models available for this provider and modality"
  },
  genHistory: {
    title: "Generation History",
    empty: "No generation history yet",
    emptyHint: "Your AI generation results will appear here",
    noHistory: "No generation history yet",
    generateToSee: "Generate content to see history here",
    model: "Model",
    prompt: "Prompt",
    response: "Response",
    error: "Error",
    images: "Images",
    viewTemplate: "View Template",
    deleteSuccess: "History deleted successfully",
    deleteError: "Failed to delete history",
    deleteConfirm: "Are you sure you want to delete this history?"
  }
} as const;