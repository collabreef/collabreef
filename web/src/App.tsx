import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage'
import NotFound from './pages/errors/NotFoundPage';
import RequireAuth from './components/requireauth/RequireAuth';
import NotesPage from './pages/workspace/notes/NotesPage';
import Setup from './pages/workspacesetup/WorkspaceSetupPage';
import NoteDetailPage from './pages/workspace/notes/NoteDetailPage';
import Settings from './pages/workspace/settings/SettingsPage';
import { Toast } from './components/toast/Toast'
import { useToastStore } from './stores/toast';
import WorkspaceLayout from './components/workspacelayout/WorkspaceLayout';
import WorkspaceLoader from './components/workspaceloader/WorkspaceLoader';
import PublicLayout from './components/publiclayout/PublicLayout';
import ExploreNotesPage from './pages/explore/ExploreNotesPage';
import ExploreNoteDetailPage from './pages/explore/ExploreNoteDetailPage';
import ExploreViewsPage from './pages/explore/ExploreViewsPage';
import ExploreViewDetailPage from './pages/explore/ExploreViewDetailPage';
import ExploreViewObjectsList from './pages/explore/ExploreViewObjectsList';
import ExploreViewObjectDetailPage from './pages/explore/ExploreViewObjectDetailPage';
import FilesPage from './pages/workspace/files/FilesPage';
import ViewsPage from './pages/workspace/views/ViewsPage';
import ViewDetailPage from './pages/workspace/views/ViewDetailPage';
import ViewObjectsList from './pages/workspace/views/ViewObjectsList';
import ViewObjectDetailPage from './pages/workspace/views/ViewObjectDetailPage';
import WorkspaceHomePage from './pages/workspace/home/WorkspaceHomePage';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function App() {
  const location = useLocation();
  const toasts = useToastStore((s) => s.toasts);
  const { i18n } = useTranslation();

  useEffect(() => {
    const rtlLanguages = ['ar'];
    const currentLang = i18n.language;
    const direction = rtlLanguages.includes(currentLang) ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLang);
  }, [i18n.language]);

  return (
    <>
      <Routes location={location}>
        <Route path='/explore' element={<PublicLayout />}>
          <Route path='notes' element={<ExploreNotesPage />} />
          <Route path='notes/:noteId' element={<ExploreNoteDetailPage />} />
          <Route path='views' element={<ExploreViewsPage />} />
          <Route path='views/:viewId' element={<ExploreViewDetailPage />}>
            <Route index element={<ExploreViewObjectsList />} />
            <Route path='objects/:objectId' element={<ExploreViewObjectDetailPage />} />
          </Route>
        </Route>
        <Route path='signin' element={<SignIn />}></Route>
        <Route path='signup' element={<SignUp />}></Route>
        <Route path='/' element={<RequireAuth />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path='/workspace-setup' element={<Setup />} />
          <Route path='workspaces' element={<WorkspaceLoader />} />
          <Route path='workspaces/:workspaceId' element={<WorkspaceLayout />}>
            <Route path='notes/:noteId' element={<NoteDetailPage />} ></Route>
            <Route path='notes' element={<NotesPage />}></Route>
            <Route path='files' element={<FilesPage />}></Route>
            <Route path='views' element={<ViewsPage />}></Route>
            <Route path='views/:viewId' element={<ViewDetailPage />}>
              <Route index element={<ViewObjectsList />} />
              <Route path='objects/:objectId' element={<ViewObjectDetailPage />} />
            </Route>
            <Route path='settings' element={<Settings />}></Route>
            <Route path='home' element={<WorkspaceHomePage />}></Route>
            <Route path='' element={<WorkspaceHomePage />}></Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {
        toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))
      }
    </>
  )
}

export default App
