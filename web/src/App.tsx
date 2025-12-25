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
import ExploreCalendarPage from './pages/explore/ExploreCalendarPage';
import ExploreCalendarSlotDetailPage from './pages/explore/ExploreCalendarSlotDetailPage';
import ExploreMapPage from './pages/explore/ExploreMapPage';
import ExploreMapMarkerDetailPage from './pages/explore/ExploreMapMarkerDetailPage';
import ExploreKanbanPage from './pages/explore/ExploreKanbanPage';
import FilesPage from './pages/workspace/files/FilesPage';
import ViewsPage from './pages/workspace/views/ViewsPage';
import CalendarPage from './pages/workspace/calendar/CalendarPage';
import CalendarSlotDetailPage from './pages/workspace/calendar/CalendarSlotDetailPage';
import MapPage from './pages/workspace/map/MapPage';
import MapMarkerDetailPage from './pages/workspace/map/MapMarkerDetailPage';
import KanbanPage from './pages/workspace/kanban/KanbanPage';
import WorkspaceHomePage from './pages/workspace/home/WorkspaceHomePage';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useScrollToTop from '@/hooks/use-scrolltotop';
import { useAuth } from '@/hooks/use-auth';
import { LoaderCircle } from 'lucide-react';

function App() {
  const location = useLocation();
  const toasts = useToastStore((s) => s.toasts);
  const { i18n } = useTranslation();

  // Load user information and preferences globally
  const { isLoading } = useAuth();

  useScrollToTop();

  useEffect(() => {
    const rtlLanguages = ['ar'];
    const currentLang = i18n.language;
    const direction = rtlLanguages.includes(currentLang) ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLang);
  }, [i18n.language]);

  // Show loading screen while user information is being loaded
  if (isLoading) {
    return (
      <div className='w-screen h-dvh flex justify-center items-center'>
        <LoaderCircle className='animate-spin' />
      </div>
    );
  }

  return (
    <>
      <Routes location={location}>
        <Route path='/explore' element={<PublicLayout />}>
          <Route path='notes' element={<ExploreNotesPage />} />
          <Route path='notes/:noteId' element={<ExploreNoteDetailPage />} />
          <Route path='views' element={<ExploreViewsPage />} />
          <Route path='calendar/:calendarId' element={<ExploreCalendarPage />}>
            <Route path='slot/:slotId' element={<ExploreCalendarSlotDetailPage />} />
          </Route>
          <Route path='map/:mapId' element={<ExploreMapPage />}>
            <Route path='marker/:markerId' element={<ExploreMapMarkerDetailPage />} />
          </Route>
          <Route path='kanban/:kanbanId' element={<ExploreKanbanPage />} />
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
            <Route path='calendar/:calendarId' element={<CalendarPage />}>
              <Route path='slot/:slotId' element={<CalendarSlotDetailPage />} />
            </Route>
            <Route path='map/:mapId' element={<MapPage />}>
              <Route path='marker/:markerId' element={<MapMarkerDetailPage />} />
            </Route>
            <Route path='kanban/:kanbanId' element={<KanbanPage />} />
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
