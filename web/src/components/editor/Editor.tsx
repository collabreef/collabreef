import React, { useEffect, useRef } from "react";
import EditorJS, { ToolConstructable } from "@editorjs/editorjs";
import Paragraph from "@editorjs/paragraph";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import ImageTool from '@editorjs/image';
import AttachesTool from '@editorjs/attaches';
import Table from '@editorjs/table'
import Embed from '@editorjs/embed';
import useCurrentWorkspaceId from "../../hooks/useCurrentworkspaceId";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getEditorI18n } from "../../locales/getEditorI18n";

interface Props {
  value?: any;
  onChange: (value: any) => void;
}

const Editor: React.FC<Props> = ({ value, onChange }) => {
  const ejInstance = useRef<EditorJS | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const currentWorkspaceId = useCurrentWorkspaceId()
  const { t } = useTranslation()
  const { t: tEditor } = useTranslation("editor")

  useEffect(() => {
    if (!holder.current || ejInstance.current) return;
    ejInstance.current = new EditorJS({
      holder: holder.current,
      placeholder: t("placeholder.note"),
      i18n: getEditorI18n(tEditor),
      data: value,
      autofocus: true,
      tools: {
        paragraph:{
          class: Paragraph as ToolConstructable,
          config: {
            preserveBlank: true
          }
        },
        header: Header,
        list: List,
        quote: Quote,
        code: Code,
        embed: {
          class: Embed,
          inlineToolbar: true,
          config: {
            services: {
              Tiktok: {
                regex: /https?:\/\/www.tiktok.com\/@(?:.+)\/video\/(\d+)(?:.+)*/,
                embedUrl: 'https://www.tiktok.com/player/v1/<%= remote_id %>?music_info=1&description=1',
                html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                id: (groups: any) => groups[0]
              }
            }
          }
        },
        attaches: {
          class: AttachesTool,
          config: {
            buttonText: t("actions.selectFileToUpload"),
            uploader: {
              async uploadByFile(file: any) {
                const formData = new FormData();
                formData.append("file", file)
                const response = await axios.post(`/api/v1/workspaces/${currentWorkspaceId}/files`, formData, {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });

                return {
                  success: 1,
                  file: {
                    url: `/api/v1/workspaces/${currentWorkspaceId}/files/${response.data.filename}`
                  }
                }
              }
            },
          }
        },
        image: {
          class: ImageTool,
          config: {
            features: {
              border: false,
              caption: false,
              stretch: false,
              background: false
            },
            uploader: {
              async uploadByFile(file: any) {
                const formData = new FormData();
                formData.append("file", file)
                const response = await axios.post(`/api/v1/workspaces/${currentWorkspaceId}/files`, formData, {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });

                return {
                  success: 1,
                  file: {
                    url: `/api/v1/workspaces/${currentWorkspaceId}/files/${response.data.filename}`
                  }
                }
              },
              async uploadByUrl(url: any) {
                const formData = new FormData();
                formData.append("url", url)
                const fetchedFile = await axios.post(`/api/v1/workspaces/${currentWorkspaceId}/tools/fetchfile`, { url: url }, {
                  responseType: 'blob',
                  withCredentials: true,
                });

                if (fetchedFile.data) {
                  const formData = new FormData();
                  formData.append("file", fetchedFile.data)
                  const response = await axios.post(`/api/v1/workspaces/${currentWorkspaceId}/files`, formData, {
                    withCredentials: true,
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });

                  return {
                    success: 1,
                    file: {
                      url: `/api/v1/workspaces/${currentWorkspaceId}/files/${response.data.filename}`
                    }
                  }
                }

                return {
                  success: 0
                }
              }
            }
          }
        },
        table: Table
      },
      onChange: async () => {
        if (ejInstance.current) {
          const outputData = await ejInstance.current.save();
          console.log(outputData)
          onChange(outputData);
        }
      },
    });
    return () => {
      if (ejInstance.current && ejInstance.current.destroy) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={holder} />
};

export default Editor;

