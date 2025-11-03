import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage'
import NotFound from './pages/errors/NotFoundPage';
import RequireAuth from './components/requireauth/RequireAuth';
import NotesPage from './pages/workspace/notes/NotesPage';
import Setup from './pages/workspacesetup/WorkspaceSetupPage';
import { AnimatePresence } from "motion/react"
import NoteDetailPage from './pages/workspace/notes/NoteDetailPage';
import Home from './pages/home/HomePage';
import Settings from './pages/workspace/settings/SettingsPage';
import { Toast } from './components/toast/Toast'
import { useToastStore } from './stores/toast';
import WorkspaceLayout from './components/workspacelayout/WorkspaceLayout';
import WorkspaceLoader from './components/workspaceloader/WorkspaceLoader';
import PreferencesPage from './pages/user/PreferencesPage';
import UserLayout from './components/userlayout/UserLayout';
import PublicLayout from './components/publiclayout/PublicLayout';
import ExploreNotesPage from './pages/explore/ExploreNotesPage';
import ExploreNoteDetailPage from './pages/explore/ExploreNoteDetailPage';
import ExploreViewsPage from './pages/explore/ExploreViewsPage';
import ExploreViewDetailPage from './pages/explore/ExploreViewDetailPage';
import ModelsPage from './pages/user/ModelsPage';
import GenTemplatesPage from './pages/workspace/gen-templates/GenTemplatesPage';
import GenTemplateFormPage from './pages/workspace/gen-templates/GenTemplateFormPage';
import GenTemplateDetailPage from './pages/workspace/gen-templates/GenTemplateDetailPage';
import FilesPage from './pages/workspace/files/FilesPage';
import ViewsPage from './pages/workspace/views/ViewsPage';
import ViewDetailPage from './pages/workspace/views/ViewDetailPage';
import ViewObjectsList from './pages/workspace/views/ViewObjectsList';
import ViewObjectDetailPage from './pages/workspace/views/ViewObjectDetailPage';

function App() {
  const location = useLocation();
  const toasts = useToastStore((s) => s.toasts);

  return (
    <>
      <AnimatePresence mode='wait'>
        <Routes location={location}>
          <Route path='/workspace-setup' element={<Setup />} />
          <Route path='/' element={<RequireAuth />}>
            <Route index element={<Navigate to="/workspaces" replace />} />
            <Route path='workspaces' element={<WorkspaceLoader />} />
            <Route path='workspaces/:workspaceId' element={<WorkspaceLayout />}>
              <Route path='note/:noteId' element={<NoteDetailPage />} ></Route>
              <Route path='notes' element={<NotesPage />}></Route>
              <Route path='gen-templates' element={<GenTemplatesPage />}></Route>
              <Route path='gen-templates/new' element={<GenTemplateFormPage />}></Route>
              <Route path='gen-templates/:id/edit' element={<GenTemplateFormPage />}></Route>
              <Route path='gen-templates/:id' element={<GenTemplateDetailPage />}></Route>
              <Route path='files' element={<FilesPage />}></Route>
              <Route path='views' element={<ViewsPage />}></Route>
              <Route path='views/:viewId' element={<ViewDetailPage />}>
                <Route index element={<ViewObjectsList />} />
                <Route path='objects/:objectId' element={<ViewObjectDetailPage />} />
              </Route>
              <Route path='settings' element={<Settings />}></Route>
              <Route path='' element={<NotesPage />}></Route>
            </Route>
            <Route path='user' element={<UserLayout />} >
              <Route index element={<Navigate to="/user/preferences" replace />} />
              <Route path='preferences' element={<PreferencesPage />} />
              <Route path='models' element={<ModelsPage />} />
            </Route>
          </Route>
          <Route path='/' element={<PublicLayout />}>
            <Route path='explore/notes' element={<ExploreNotesPage />} />
            <Route path='explore/notes/:noteId' element={<ExploreNoteDetailPage />} />
            <Route path='explore/views' element={<ExploreViewsPage />} />
            <Route path='explore/views/:viewId' element={<ExploreViewDetailPage />} />
          </Route>
          <Route path='signin' element={<SignIn />}></Route>
          <Route path='signup' element={<SignUp />}></Route>
          <Route path="*" element={<NotFound />} />
          <Route path='' element={<Home />} />
        </Routes>
      </AnimatePresence>
      {
        toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))
      }
    </>
  )
}

export default App
