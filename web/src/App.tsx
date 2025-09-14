import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SignIn from './pages/Auth/SignInPage';
import SignUp from './pages/Auth/SignUpPage'
import NotFound from './pages/Errors/NotFoundPage';
import RequireAuth from './components/requireauth/RequireAuth';
import Notes from './pages/Workspace/Notes/NotesPage';
import Setup from './pages/WorkspaceSetup/WorkspaceSetupPage';
import { AnimatePresence } from "motion/react"
import NoteDetailPage from './pages/Workspace/Notes/NoteDetailPage';
import NoteEdit from './pages/Workspace/Notes/NoteEditPage';
import Home from './pages/Home/HomePage';
import Settings from './pages/Workspace/Settings/SettingsPage';
import { Toast } from './components/toast/Toast'
import { useToastStore } from './stores/toast';
import WorkspaceLayout from './components/workspacelayout/WorkspaceLayout';
import WorkspaceLoader from './components/workspaceloader/WorkspaceLoader';
import Preferences from './pages/User/Preferences';
import UserLayout from './components/userlayout/UserLayout';

function App() {
  const location = useLocation();
  const toasts = useToastStore((s) => s.toasts);

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.key}>
        <Route path='/signin' element={<SignIn />}></Route>
        <Route path='/signup' element={<SignUp />}></Route>
        <Route path="*" element={<NotFound />} />
        <Route path='/workspace-setup' element={<Setup />} />
        <Route path='/' element={<RequireAuth />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path='workspaces' element={<WorkspaceLoader />} />
          <Route path='workspaces/:workspaceId' element={<WorkspaceLayout />}>
            <Route path='note/:noteId' element={<NoteDetailPage />} ></Route>
            <Route path='note/:noteId/edit' element={<NoteEdit />} ></Route>
            <Route path='note/new' element={<NoteEdit />} ></Route>
            <Route path='notes' element={<Notes />}></Route>
            <Route path='settings' element={<Settings />}></Route>
            <Route path='' element={<Notes />}></Route>
          </Route>
          <Route path='user' element={<UserLayout />} >

            <Route path='preferences' element={<Preferences />} />
          </Route>
        </Route>
        <Route path='' element={<Home />} />
      </Routes>

      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </AnimatePresence>
  )
}

export default App
