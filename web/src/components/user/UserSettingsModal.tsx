import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useTheme, Theme } from "@/providers/Theme"
import { useCurrentUserStore } from "@/stores/current-user"
import { toast } from "@/stores/toast"
import { useState, useEffect } from "react"
import { updatePreferences } from "@/api/user"
import { listAPIKeys, createAPIKey, deleteAPIKey, APIKey, CreateAPIKeyRequest } from "@/api/apikey"
import Card from "@/components/card/Card"
import Select from "@/components/select/Select"
import { Trash2, Plus, Copy, AlertTriangle } from "lucide-react"

interface UserSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const UserSettingsModal = ({ open, onOpenChange }: UserSettingsModalProps) => {
    const { user } = useCurrentUserStore()
    const { t, i18n } = useTranslation()
    const { theme, setTheme } = useTheme()!

    // Tab state
    const [activeTab, setActiveTab] = useState<'preferences' | 'apiKeys'>('preferences')

    // Preferences state
    const themes: Theme[] = ["light", "dark"]
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || []

    // API Keys state
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreationDialog, setShowCreationDialog] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [newKeyExpiresAt, setNewKeyExpiresAt] = useState("")
    const [createdKey, setCreatedKey] = useState<string | null>(null)

    // Preferences handlers
    const handleSelectedLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value)
    }

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme
        setTheme(newTheme)
    }

    const savePreferences = async () => {
        if (!user) return

        const updatedUser = {
            ...user,
            preferences: { lang: i18n.language, theme: theme }
        }

        try {
            await updatePreferences(updatedUser)
        } catch (err) {
            toast.error(t("messages.preferencesUpdateFailed"))
        }
    }

    // API Keys handlers
    const loadAPIKeys = async () => {
        if (!user) return

        setLoading(true)
        try {
            const keys = await listAPIKeys(user.id)
            setApiKeys(keys)
        } catch (err) {
            toast.error(t("messages.apiKeyLoadFailed"))
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAPIKey = async () => {
        if (!user || !newKeyName.trim()) {
            toast.error(t("messages.apiKeyNameRequired"))
            return
        }

        try {
            const request: CreateAPIKeyRequest = {
                name: newKeyName.trim(),
            }

            if (newKeyExpiresAt) {
                request.expires_at = new Date(newKeyExpiresAt).toISOString()
            }

            const response = await createAPIKey(user.id, request)
            setCreatedKey(response.full_key)
            setNewKeyName("")
            setNewKeyExpiresAt("")
            await loadAPIKeys()
            toast.success(t("messages.apiKeyCreated"))
        } catch (err) {
            toast.error(t("messages.apiKeyCreateFailed"))
        }
    }

    const handleDeleteAPIKey = async (keyId: string) => {
        if (!user) return

        if (!confirm(t("pages.preferences.deleteKeyConfirm"))) {
            return
        }

        try {
            await deleteAPIKey(user.id, keyId)
            await loadAPIKeys()
            toast.success(t("messages.apiKeyDeleted"))
        } catch (err) {
            toast.error(t("messages.apiKeyDeleteFailed"))
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success(t("messages.copied"))
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return t("pages.preferences.never")
        return new Date(dateString).toLocaleDateString()
    }

    const isExpired = (expiresAt: string) => {
        if (!expiresAt) return false
        return new Date(expiresAt) < new Date()
    }

    useEffect(() => {
        if (!user || !open) return
        savePreferences()
    }, [theme, i18n.language])

    useEffect(() => {
        if (open && activeTab === 'apiKeys') {
            loadAPIKeys()
        }
    }, [open, activeTab])

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[800px] max-h-[85vh] z-[1001] flex flex-col">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t("menu.preferences")}
                        </Dialog.Title>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-700 mb-4">
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'preferences'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                {t("pages.preferences.language")} & {t("pages.preferences.theme")}
                            </button>
                            <button
                                onClick={() => setActiveTab('apiKeys')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'apiKeys'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                {t("pages.preferences.apiKeys")}
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1">
                            {/* Preferences Tab */}
                            {activeTab === 'preferences' && (
                                <Card className="w-full p-0">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col">
                                            <div className="text-xs font-semibold text-gray-500 mb-2">
                                                {t("pages.preferences.language")}
                                            </div>
                                            <div>
                                                <Select value={i18n.language} onChange={handleSelectedLangChange}>
                                                    {supportedLanguages.map((lng) => (
                                                        <option key={lng} value={lng}>
                                                            {lng}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-xs font-semibold text-gray-500 mb-2">
                                                {t("pages.preferences.theme")}
                                            </div>
                                            <div>
                                                <Select value={theme} onChange={handleThemeChange}>
                                                    {themes.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* API Keys Tab */}
                            {activeTab === 'apiKeys' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t("pages.preferences.apiKeyDescription")}
                                        </p>
                                        <button
                                            onClick={() => setShowCreationDialog(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            <Plus size={16} />
                                            {t("pages.preferences.generateNewKey")}
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-8">{t("common.loading")}</div>
                                    ) : apiKeys.length === 0 ? (
                                        <Card className="p-8 text-center text-gray-500">
                                            {t("pages.preferences.noApiKeys")}
                                        </Card>
                                    ) : (
                                        <div className="space-y-2">
                                            {apiKeys.map((key) => (
                                                <Card key={key.id} className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold">{key.name}</h3>
                                                                {isExpired(key.expires_at) && (
                                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                                        {t("pages.preferences.expired")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                                {key.prefix}...
                                                            </p>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span>{t("pages.preferences.created")}: {formatDate(key.created_at)}</span>
                                                                {key.last_used_at && (
                                                                    <span className="ml-4">
                                                                        {t("pages.preferences.lastUsed")}: {formatDate(key.last_used_at)}
                                                                    </span>
                                                                )}
                                                                {key.expires_at && (
                                                                    <span className="ml-4">
                                                                        {t("pages.preferences.expires")}: {formatDate(key.expires_at)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteAPIKey(key.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title={t("actions.delete")}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* API Key Creation Dialog */}
            <Dialog.Root open={showCreationDialog} onOpenChange={setShowCreationDialog}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1002]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1003]">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t("pages.preferences.createNewKey")}
                        </Dialog.Title>

                        {createdKey ? (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <div className="flex gap-2 items-start">
                                        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <strong>{t("pages.preferences.saveKeyWarning")}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">{t("pages.preferences.yourApiKey")}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={createdKey}
                                            readOnly
                                            className="flex-1 px-3 py-2 border rounded-md font-mono text-sm bg-gray-50 dark:bg-neutral-900"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(createdKey)}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                            title={t("actions.copy")}
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setCreatedKey(null)
                                        setShowCreationDialog(false)
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    {t("pages.preferences.done")}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">{t("pages.preferences.keyName")}</label>
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        placeholder={t("pages.preferences.keyNamePlaceholder")}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
                                        {t("pages.preferences.expirationDate")}
                                    </label>
                                    <input
                                        type="date"
                                        value={newKeyExpiresAt}
                                        onChange={(e) => setNewKeyExpiresAt(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateAPIKey}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    >
                                        {t("pages.preferences.createKey")}
                                    </button>
                                    <button
                                        onClick={() => setShowCreationDialog(false)}
                                        className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                                    >
                                        {t("actions.cancel")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}

export default UserSettingsModal
