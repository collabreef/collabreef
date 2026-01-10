import { Pen, Square, Circle, Minus, Type, FileText, LayoutGrid, Hand, Trash2, Eraser } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type Tool = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'note' | 'view';

interface WhiteboardToolbarProps {
    currentTool: Tool;
    setCurrentTool: (tool: Tool) => void;
    currentColor: string;
    setCurrentColor: (color: string) => void;
    currentStrokeWidth: number;
    setCurrentStrokeWidth: (width: number) => void;
    onClear?: () => void;
    isPublic?: boolean;
}

const WhiteboardToolbar = ({
    currentTool,
    setCurrentTool,
    currentColor,
    setCurrentColor,
    currentStrokeWidth,
    setCurrentStrokeWidth,
    onClear,
    isPublic = false
}: WhiteboardToolbarProps) => {
    const { t } = useTranslation();

    const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <Hand size={18} />, label: t('whiteboard.select') || 'Select' },
        { id: 'pen', icon: <Pen size={18} />, label: t('whiteboard.pen') || 'Pen' },
        { id: 'eraser', icon: <Eraser size={18} />, label: t('whiteboard.eraser') || 'Eraser' },
        { id: 'rectangle', icon: <Square size={18} />, label: t('whiteboard.rectangle') || 'Rectangle' },
        { id: 'circle', icon: <Circle size={18} />, label: t('whiteboard.circle') || 'Circle' },
        { id: 'line', icon: <Minus size={18} />, label: t('whiteboard.line') || 'Line' },
        { id: 'text', icon: <Type size={18} />, label: t('whiteboard.text') || 'Text' },
        { id: 'note', icon: <FileText size={18} />, label: t('whiteboard.note') || 'Note' },
        { id: 'view', icon: <LayoutGrid size={18} />, label: t('whiteboard.view') || 'View' },
    ];

    const strokeWidths = [1, 2, 4, 6, 8];
    const commonColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

    return (
        <div className="absolute top-4 left-4 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-3 z-10 border border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col gap-3">
                {/* Tools */}
                {!isPublic && (
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                            {t('whiteboard.tools') || 'Tools'}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {tools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setCurrentTool(tool.id)}
                                    className={`p-2 rounded transition-colors ${
                                        currentTool === tool.id
                                            ? 'bg-primary text-white'
                                            : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                                    title={tool.label}
                                >
                                    {tool.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Color picker */}
                {!isPublic && (currentTool === 'pen' || currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'text') && (
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                            {t('whiteboard.color') || 'Color'}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {commonColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setCurrentColor(color)}
                                    className={`w-6 h-6 rounded border-2 transition-all ${
                                        currentColor === color
                                            ? 'border-primary scale-110'
                                            : 'border-neutral-300 dark:border-neutral-600 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="w-6 h-6 rounded border-2 border-neutral-300 dark:border-neutral-600 cursor-pointer"
                                title={t('whiteboard.customColor') || 'Custom Color'}
                            />
                        </div>
                    </div>
                )}

                {/* Stroke width */}
                {!isPublic && (currentTool === 'pen' || currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') && (
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                            {t('whiteboard.strokeWidth') || 'Width'}
                        </div>
                        <div className="flex gap-1">
                            {strokeWidths.map((width) => (
                                <button
                                    key={width}
                                    onClick={() => setCurrentStrokeWidth(width)}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                        currentStrokeWidth === width
                                            ? 'bg-primary text-white'
                                            : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                                    title={`${width}px`}
                                >
                                    <div
                                        className="rounded-full bg-current"
                                        style={{ width: `${width * 2}px`, height: `${width * 2}px` }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Clear button */}
                {!isPublic && onClear && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                            onClick={onClear}
                            className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            {t('whiteboard.clear') || 'Clear All'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhiteboardToolbar;
