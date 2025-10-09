export default {
  placeholder: {
    note: "Start writing your note ...",
    search: "Search",
    searchWorkspace: "Search / Add Workspace"
  },
  menu: {
    notes: "Notes",
    createWithName: "Create workspace：{{name}}",
    workspaceSettings: "Workspace Settings",
    workspace: "Workspace",
    user: "User",
    models: "AI Models",
    preferences: "Preferences",
    gencommands: "Gen Commands",
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
    },
    genCommands: {
      name: "Command Name",
      containerType: "Container Type",
      prompt: "Prompt",
      model: "Model",
      genType: "Generative Type",
      searchPlaceholder: "Search gen command",
      createNew: "Create New Command",
      editing: "Editing Command",
      namePlaceholder: "Enter command name",
      promptPlaceholder: "Enter prompt template (use {{input}} for user input)",
      createSuccess: "Command created successfully",
      createError: "Failed to create command",
      updateSuccess: "Command updated successfully",
      updateError: "Failed to update command",
      deleteSuccess: "Command deleted successfully",
      deleteError: "Failed to delete command",
      confirmDelete: "Are you sure you want to delete this command?",
      fillRequired: "Please fill in all required fields",
      noResults: "No commands found",
      empty: "No commands yet. Create your first one!",
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
    new: "New",
    newNote: "New Note",
    rename: "Rename",
    filter: "Filter",
    toggleTheme: "Toggle theme",
    selectFileToUpload: "Select file to upload",
    makePublic: "Make Public",
    makeWorkspace: "Make Workspace",
    makePrivate: "Make Private",
  },
  messages: {
    signInFailed: "Sign in failed, please check your username and password",
    signUpFailed: "Sign up failed, {{error}}",
    passwordDoNotMatch: "Passwords do not match",
    deleteTheNote: "Delete the note?",
    noMoreNotes: "No more notes",
    preferencesUpdated: "Preferences updated",
    preferencesUpdateFailed: "Could not update preferences",
    networkError: "Network error. Please try again"
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
  common: {
    loading: "Loading..."
  }
} as const;