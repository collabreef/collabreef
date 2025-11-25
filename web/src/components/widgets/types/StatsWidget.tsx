import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Eye } from 'lucide-react';
import { getNotes } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { StatsWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';

interface StatsWidgetProps {
  config: StatsWidgetConfig;
}

const StatsWidget: FC<StatsWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', workspaceId, 'stats'],
    queryFn: () => getNotes(workspaceId, 1, 1000, ''),
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const totalNotes = notes.length;
  const publicNotes = notes.filter((n: any) => n.visibility === 'public').length;
  const privateNotes = notes.filter((n: any) => n.visibility === 'private').length;
  const workspaceNotes = notes.filter((n: any) => n.visibility === 'workspace').length;

  // Get recent notes (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentNotes = notes.filter((n: any) => new Date(n.created_at) > sevenDaysAgo).length;

  const renderStatsByType = () => {
    switch (config.statType) {
      case 'note_count':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText size={32} className="text-blue-500 mb-2" />
            <div className="text-3xl font-bold">{totalNotes}</div>
            <div className="text-sm text-gray-500">{t('widgets.totalNotes')}</div>
          </div>
        );

      case 'recent_notes':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Clock size={32} className="text-green-500 mb-2" />
            <div className="text-3xl font-bold">{recentNotes}</div>
            <div className="text-sm text-gray-500">{t('widgets.recentNotes')}</div>
          </div>
        );

      case 'note_by_visibility':
        return (
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="flex flex-col items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Eye size={20} className="text-green-500 mb-1" />
              <div className="text-xl font-bold">{publicNotes}</div>
              <div className="text-xs text-gray-500">{t('visibility.public')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText size={20} className="text-blue-500 mb-1" />
              <div className="text-xl font-bold">{workspaceNotes}</div>
              <div className="text-xs text-gray-500">{t('visibility.workspace')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <FileText size={20} className="text-gray-500 mb-1" />
              <div className="text-xl font-bold">{privateNotes}</div>
              <div className="text-xs text-gray-500">{t('visibility.private')}</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalNotes}</div>
              <div className="text-xs text-gray-500">{t('widgets.totalNotes')}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{recentNotes}</div>
              <div className="text-xs text-gray-500">{t('widgets.recentNotes')}</div>
            </div>
          </div>
        );
    }
  };

  return <Widget>
    <div className="h-full">{renderStatsByType()}</div>
  </Widget>
};

export default StatsWidget;