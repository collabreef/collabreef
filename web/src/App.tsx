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
import ExploreCalendarListPage from './pages/explore/ExploreCalendarListPage';
import ExploreMapListPage from './pages/explore/ExploreMapListPage';
import ExploreKanbanListPage from './pages/explore/ExploreKanbanListPage';
import ExploreCalendarPage from './pages/explore/ExploreCalendarPage';
import ExploreCalendarSlotDetailPage from './pages/explore/ExploreCalendarSlotDetailPage';
import ExploreMapPage from './pages/explore/ExploreMapPage';
import ExploreMapMarkerDetailPage from './pages/explore/ExploreMapMarkerDetailPage';
import ExploreKanbanPage from './pages/explore/ExploreKanbanPage';
import ExploreWhiteboardListPage from './pages/explore/ExploreWhiteboardListPage';
import ExploreWhiteboardPage from './pages/explore/ExploreWhiteboardPage';
import ExploreSpreadsheetListPage from './pages/explore/ExploreSpreadsheetListPage';
import ExploreSpreadsheetPage from './pages/explore/ExploreSpreadsheetPage';
import FilesPage from './pages/workspace/files/FilesPage';
import CalendarListPage from './pages/workspace/views/CalendarListPage';
import MapListPage from './pages/workspace/views/MapListPage';
import KanbanListPage from './pages/workspace/views/KanbanListPage';
import WhiteboardListPage from './pages/workspace/views/WhiteboardListPage';
import ViewSettingsPage from './pages/workspace/views/ViewSettingsPage';
import CalendarPage from './pages/workspace/calendar/CalendarPage';
import CalendarSlotDetailPage from './pages/workspace/calendar/CalendarSlotDetailPage';
import MapPage from './pages/workspace/map/MapPage';
import MapMarkerDetailPage from './pages/workspace/map/MapMarkerDetailPage';
import KanbanPage from './pages/workspace/kanban/KanbanPage';
import WhiteboardPage from './pages/workspace/whiteboard/WhiteboardPage';
import SpreadsheetListPage from './pages/workspace/views/SpreadsheetListPage';
import SpreadsheetPage from './pages/workspace/spreadsheet/SpreadsheetPage';
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
        <Route path='/share' element={<PublicLayout />}>
          <Route path='notes' element={<ExploreNotesPage />}>
            <Route path=':noteId' element={<ExploreNoteDetailPage />} />
          </Route>
          <Route path='calendar' element={<ExploreCalendarListPage />} />
          <Route path='calendar/:calendarId' element={<ExploreCalendarPage />}>
            <Route path='slot/:slotId' element={<ExploreCalendarSlotDetailPage />} />
          </Route>
          <Route path='map' element={<ExploreMapListPage />} />
          <Route path='map/:mapId' element={<ExploreMapPage />}>
            <Route path='marker/:markerId' element={<ExploreMapMarkerDetailPage />} />
          </Route>
          <Route path='kanban' element={<ExploreKanbanListPage />} />
          <Route path='kanban/:kanbanId' element={<ExploreKanbanPage />} />
          <Route path='whiteboard' element={<ExploreWhiteboardListPage />} />
          <Route path='whiteboard/:whiteboardId' element={<ExploreWhiteboardPage />} />
          <Route path='spreadsheet' element={<ExploreSpreadsheetListPage />} />
          <Route path='spreadsheet/:spreadsheetId' element={<ExploreSpreadsheetPage />} />
        </Route>
        <Route path='signin' element={<SignIn />}></Route>
        <Route path='signup' element={<SignUp />}></Route>
        <Route path='/' element={<RequireAuth />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path='/workspace-setup' element={<Setup />} />
          <Route path='workspaces' element={<WorkspaceLoader />} />
          <Route path='workspaces/:workspaceId' element={<WorkspaceLayout />}>
            <Route path='notes' element={<NotesPage />}>
              <Route path=':noteId' element={<NoteDetailPage />} ></Route>
            </Route>
            <Route path='files' element={<FilesPage />}></Route>
            <Route path='calendar' element={<CalendarListPage />}></Route>
            <Route path='calendar/:calendarId' element={<CalendarPage />}>
              <Route path='slot/:slotId' element={<CalendarSlotDetailPage />} />
            </Route>
            <Route path='calendar/:viewId/settings' element={<ViewSettingsPage />} />
            <Route path='map' element={<MapListPage />}></Route>
            <Route path='map/:mapId' element={<MapPage />}>
              <Route path='marker/:markerId' element={<MapMarkerDetailPage />} />
            </Route>
            <Route path='map/:viewId/settings' element={<ViewSettingsPage />} />
            <Route path='kanban' element={<KanbanListPage />}></Route>
            <Route path='kanban/:kanbanId' element={<KanbanPage />} />
            <Route path='kanban/:viewId/settings' element={<ViewSettingsPage />} />
            <Route path='whiteboard' element={<WhiteboardListPage />}></Route>
            <Route path='whiteboard/:whiteboardId' element={<WhiteboardPage />} />
            <Route path='whiteboard/:viewId/settings' element={<ViewSettingsPage />} />
            <Route path='spreadsheet' element={<SpreadsheetListPage />}></Route>
            <Route path='spreadsheet/:spreadsheetId' element={<SpreadsheetPage />} />
            <Route path='spreadsheet/:viewId/settings' element={<ViewSettingsPage />} />
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
