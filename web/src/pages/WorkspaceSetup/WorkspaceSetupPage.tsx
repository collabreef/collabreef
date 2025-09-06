import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace } from "../../api/workspace";
import { useTranslation } from "react-i18next";

const WorkspaceSetupPage = () => {
    const [workspaceName, setWorkspaceName] = useState("");
    const {t} = useTranslation()
    const navigate = useNavigate()

    const handleCreate = async () => {
        await createWorkspace({ name: workspaceName })

        navigate("/")
    };

    return (
        <div className="w-full min-h-dvh  flex flex-col">
            <div className="grow flex justify-center items-center">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 p-5">
                        <div className="text-3xl font-bold text-center">
                            {t("pages.workspaceSetup.createWorkspace")}
                        </div>
                        <div className="text-sm  text-center">
                            {t("pages.workspaceSetup.pleaseEnterYourWorkspaceName")}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-6 shadow-xl rounded-xl dark:border">
                        <label className="text-sm font-medium" htmlFor="workspace-name">
                            {t("pages.workspaceSetup.workspaceName")}
                        </label>
                        <input
                            id="workspace-name"
                            value={workspaceName}
                            onChange={e => setWorkspaceName(e.target.value)}
                            placeholder={t("pages.workspaceSetup.workspaceNamePlaceholder")}
                            className="appearance-none border rounded-lg w-64 max-w-full p-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <button
                            className=" bg-amber-600 hover:bg-amber-700 text-white text-base font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50"
                            onClick={handleCreate}
                            disabled={!workspaceName.trim()}
                        >
                            {t("actions.create")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceSetupPage;