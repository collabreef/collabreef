import { Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

export const PasteHandler = Extension.create({
  name: 'paste-handler',

  addProseMirrorPlugins() {
    return [
      new this.editor.view.Plugin({
        props: {
          handlePaste: async (view, event) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const html = clipboardData.getData('text/html');
            const text = clipboardData.getData('text/plain');

            event.preventDefault();

            if (html) {
              const div = document.createElement('div');
              div.innerHTML = html;

              const imgs = div.querySelectorAll('img');
              for (const img of imgs) {
                const src = img.getAttribute('src');
                if (src) {
                  const uploadedUrl = await fetchImageFromAPI(src);
                  if (uploadedUrl) {
                    insertImage(view, uploadedUrl);
                  }
                }
              }

              const clonedDiv = div.cloneNode(true) as HTMLElement;
              clonedDiv.querySelectorAll('img').forEach(i => i.remove());
              const textContent = clonedDiv.innerHTML.trim();
              if (textContent) {
                insertHTML(view, textContent);
              }

              return true;
            } else if (text) {
              insertText(view, text);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

function insertImage(view: any, src: string) {
  const { schema, state, dispatch } = view;
  const node = schema.nodes.image.create({ src });
  const transaction = state.tr.replaceSelectionWith(node);
  dispatch(transaction.scrollIntoView());
}

function insertHTML(view: any, html: string) {
  const { state, dispatch } = view;
  const div = document.createElement('div');
  div.innerHTML = html;
  const fragment = ProseMirrorNode.fromHTML(state.schema, div.innerHTML);
  if (fragment) {
    const transaction = state.tr.replaceSelectionWith(fragment);
    dispatch(transaction.scrollIntoView());
  }
}

function insertText(view: any, text: string) {
  const { state, dispatch } = view;
  const transaction = state.tr.insertText(text);
  dispatch(transaction.scrollIntoView());
}

async function fetchImageFromAPI(src: string): Promise<string | null> {
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: src }),
    });
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error(err);
    return null;
  }
}