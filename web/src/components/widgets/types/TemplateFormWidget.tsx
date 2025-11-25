import { FC, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { getGenTemplate, generateFromTemplate } from '@/api/gen-template';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { useToastStore } from '@/stores/toast';
import { TemplateFormWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';

interface TemplateFormWidgetProps {
  config: TemplateFormWidgetConfig;
}

const TemplateFormWidget: FC<TemplateFormWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { addToast } = useToastStore();

  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');

  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['gen-template', workspaceId, config.templateId],
    queryFn: () => getGenTemplate(workspaceId, config.templateId),
    enabled: !!workspaceId && !!config.templateId,
  });

  const generateMutation = useMutation({
    mutationFn: (prompt: string) =>
      generateFromTemplate(workspaceId, {
        template_id: config.templateId,
        prompt,
      }),
    onSuccess: (data) => {
      setGeneratedContent(data.content || '');
      addToast({ type: 'success', title: t('genTemplates.generateSuccess') });
    },
    onError: () => {
      addToast({ type: 'error', title: t('genTemplates.generateError') });
    },
  });

  if (!config.templateId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noTemplateSelected')}
      </div>
    );
  }

  if (isLoadingTemplate) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.templateNotFound')}
      </div>
    );
  }

  // Extract variables from template prompt (e.g., {{variable}})
  const extractedVars = template.prompt?.match(/\{\{([\p{L}\p{N}_]+)\}\}/gu)?.map((v: string) => v.slice(2, -2)) || [];
  const uniqueVars = [...new Set(extractedVars)];

  const handleGenerate = () => {
    // Build the final prompt by replacing variables
    let finalPrompt = template.prompt || '';
    Object.entries(variables).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    generateMutation.mutate(finalPrompt);
  };

  return (
    <Widget>
      <div className="h-full flex flex-col gap-2 overflow-auto">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {template.name}
        </div>

        {uniqueVars.length > 0 && (
          <div className="space-y-2">
            {uniqueVars.map((varName) => (
              <div key={varName}>
                <label className="text-xs text-gray-500">{varName}</label>
                <input
                  type="text"
                  value={variables[varName] || ''}
                  onChange={(e) =>
                    setVariables((prev) => ({ ...prev, [varName]: e.target.value }))
                  }
                  className="w-full px-2 py-1 text-sm rounded border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  placeholder={varName}
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
        >
          {generateMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {t('genTemplates.generate')}
        </button>

        {generatedContent && (
          <div className="flex-1 p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
            {generatedContent}
          </div>
        )}
      </div>
    </Widget>
  );
};

export default TemplateFormWidget;