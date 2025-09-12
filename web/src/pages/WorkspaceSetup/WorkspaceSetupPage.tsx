import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace } from "../../api/workspace";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../components/submitbutton/SubmitButton";
import TextInput from "../../components/textinput/TextInput";

const WorkspaceSetupPage = () => {
    const [workspaceName, setWorkspaceName] = useState("");
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleCreate = async () => {
        await createWorkspace({ name: workspaceName })

        navigate("/")
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreate();
    };

    return (
        <div className="w-full min-h-screen  flex flex-col">
            <div className="grow flex justify-center items-center">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 p-5">
                        <div className="text-3xl font-bold text-center">
                            {t("pages.workspaceSetup.createWorkspace")}
                        </div>
                        <div className="text-sm  text-center">
                            {t("pages.workspaceSetup.pleaseEnterYourWorkspaceName")}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-6 w-80">
                        <label className="text-sm font-medium" htmlFor="workspace-name">
                            {t("pages.workspaceSetup.workspaceName")}
                        </label>
                        <TextInput
                            id="workspace-name"
                            value={workspaceName}
                            title={"workspace-name"}
                            onChange={e => setWorkspaceName(e.target.value)}
                            placeholder={t("pages.workspaceSetup.workspaceNamePlaceholder")}
                        />
                        <SubmitButton
                            disabled={!workspaceName.trim()}
                        >
                            {t("actions.create")}
                        </SubmitButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceSetupPage;