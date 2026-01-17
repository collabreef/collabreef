import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotesForViewObject, getPublicNotesForViewObject } from '../../../api/view';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { Attachment } from '../../editor/extensions/attachment/Attachment';
import { ImageNode } from '../../editor/extensions/imagenode/ImageNode';

interface NoteOverlayProps {
    viewObjectId: string;
    position: { x: number; y: number };
    width: number;
    viewport: { x: number; y: number; zoom: number };
    workspaceId?: string;
    viewId: string;
    isSelected?: boolean;
    isPublic?: boolean;
}

const NoteOverlay: React.FC<NoteOverlayProps> = ({ viewObjectId, position, width, viewport, workspaceId, viewId, isSelected = false, isPublic = false }) => {
    // Fetch linked notes via view_object_notes (use public API for explore mode)
    const { data: linkedNotes = [] } = useQuery({
        queryKey: isPublic
            ? ['public-view-object-notes', viewId, viewObjectId]
            : ['view-object-notes', workspaceId, viewId, viewObjectId],
        queryFn: () => isPublic
            ? getPublicNotesForViewObject(viewId, viewObjectId)
            : getNotesForViewObject(workspaceId!, viewId, viewObjectId),
        enabled: !!viewId && !!viewObjectId && (isPublic || !!workspaceId),
    });

    // Get the first linked note (whiteboard_note should have exactly one linked note)
    const note = linkedNotes[0];

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                blockquote: {
                    HTMLAttributes: {
                        class: "border-l-4 pl-4 italic text-gray-600"
                    }
                },
                codeBlock: {
                    HTMLAttributes: {
                        class: "rounded bg-gray-800 text-gray-100 p-4 font-mono text-sm"
                    }
                }
            }),
            TaskList.configure({
                HTMLAttributes: {
                    class: 'list-none',
                },
            }),
            TaskItem.configure({
                HTMLAttributes: {
                    class: 'pointer-events-none',
                },
            }),
            Attachment.configure({
                upload: undefined,
                workspaceId: undefined,
                listFiles: undefined
            }),
            ImageNode.configure({
                upload: undefined,
                workspaceId: undefined,
                listFiles: undefined
            }),
            TableKit,
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none',
            },
        },
        content: note?.content ? JSON.parse(note.content) : null,
        editable: false,
    }, [note?.id]);

    if (!note || !note.content || !editor) return null;

    // Null/undefined checks for position and viewport
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') return null;
    if (!viewport || typeof viewport.x !== 'number' || typeof viewport.y !== 'number') return null;

    // Calculate transformed position based on viewport
    const zoom = viewport.zoom || 1;
    const transformedX = position.x * zoom + viewport.x;
    const transformedY = position.y * zoom + viewport.y;

    return (
        <div
            className="absolute pointer-events-none origin-top-left"
            style={{
                left: `${transformedX}px`,
                top: `${transformedY}px`,
                transform: `scale(${zoom})`,
            }}
        >
            <div
                className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md p-4 select-text ${
                    isSelected
                        ? 'border-3 border-blue-500 border-dashed'
                        : 'border-2 border-yellow-400 dark:border-yellow-600'
                }`}
                style={{
                    width: `${width}px`,
                }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default NoteOverlay;
