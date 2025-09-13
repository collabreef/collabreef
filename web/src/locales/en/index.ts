export default {
  placeholder: {
    note: "Start writing your note ...",
    search: "Search",
    searchWorkspace: "Search / Add Workspace"
  },
  menu: {
    notes: "Notes",
    workspaceSettings: "Worksapce Settings",
    createWithName: "Create workspace：{{name}}",
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
      workspaceName: "Workspace name",
      deleteThisWorkspace: "Delete this workspace",
      deleteThisWorkspaceMessage : "Delete this workspace ?"
    },
    workspaceSetup: {
      createWorkspace: "Create Workspace",
      pleaseEnterYourWorkspaceName:"Please enter your workspace name",
      workspaceName: "Workspace name",
      workspaceNamePlaceholder: "workspace name",
    },
    noteEdit: {
      newNote: "New Note",
      editNote: "Edit Note",
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
    newNote: "New Note",
    rename: "Rename",
    filter: "Filter",
    selectFileToUpload: "Select file to upload",
    makePublic: "Make Public",
    makeWorkspace: "Make Workspace",
    makePrivate: "Make Private",
  },
  message: {
    deleteTheNote: "Delete the note?",
    enterNewTag: "Enter new tag",
    noMoreNotes: "No more notes",
    noMoreViews: "No more views"
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
  }
} as const;