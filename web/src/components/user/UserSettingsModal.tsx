import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useTheme, Theme } from "@/providers/Theme"
import { useCurrentUserStore } from "@/stores/current-user"
import { toast } from "@/stores/toast"
import { useState, useEffect } from "react"
import { updatePreferences } from "@/api/user"
import { listAPIKeys, createAPIKey, deleteAPIKey, APIKey, CreateAPIKeyRequest } from "@/api/apikey"
import { listUsers, createUser, deleteUser, updateUserPassword, disableUser, enableUser, AdminUser, CreateUserRequest, UpdateUserPasswordRequest } from "@/api/admin"
import Card from "@/components/card/Card"
import Select from "@/components/select/Select"
import { Trash2, Plus, Copy, AlertTriangle, Edit, UserX, UserCheck, Check } from "lucide-react"

interface UserSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const UserSettingsModal = ({ open, onOpenChange }: UserSettingsModalProps) => {
    const { user } = useCurrentUserStore()
    const { t, i18n } = useTranslation()
    const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme()!

    // Tab state
    const [activeTab, setActiveTab] = useState<'preferences' | 'apiKeys' | 'users'>('preferences')
    const isOwner = user?.role === 'owner'

    // Preferences state
    const themes: Theme[] = ["light", "dark"]
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || []

    // Language native names mapping
    const languageNativeNames: Record<string, string> = {
        'en': 'English',
        'zh-TW': '繁體中文',
        'zh-CN': '简体中文',
        'es': 'Español',
        'fr': 'Français',
        'ar': 'العربية',
        'pt-BR': 'Português (Brasil)',
        'de': 'Deutsch',
        'ja': '日本語',
        'ko': '한국어',
        'ru': 'Русский',
        'it': 'Italiano'
    }

    const PRESET_COLORS = [
        { name: 'Orange', value: '#f97316' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Purple', value: '#a855f7' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Teal', value: '#14b8a6' },
    ]

    // API Keys state
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreationDialog, setShowCreationDialog] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [newKeyExpiresAt, setNewKeyExpiresAt] = useState("")
    const [createdKey, setCreatedKey] = useState<string | null>(null)

    // User Management state
    const [users, setUsers] = useState<AdminUser[]>([])
    const [usersLoading, setUsersLoading] = useState(false)
    const [showUserDialog, setShowUserDialog] = useState(false)
    const [userFormData, setUserFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user"
    })
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [passwordFormData, setPasswordFormData] = useState({
        userId: "",
        newPassword: "",
        confirmPassword: ""
    })

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
            preferences: {
                lang: i18n.language,
                theme: theme,
                primaryColor: primaryColor
            }
        }

        try {
            await updatePreferences(updatedUser)
        } catch (err) {
            toast.error(t("messages.settingsUpdateFailed"))
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

    // User Management handlers
    const loadUsers = async () => {
        if (!isOwner) return

        setUsersLoading(true)
        try {
            const usersList = await listUsers()
            setUsers(usersList)
        } catch (err) {
            toast.error(t("messages.userLoadFailed"))
        } finally {
            setUsersLoading(false)
        }
    }

    const handleCreateUser = async () => {
        if (!userFormData.name.trim()) {
            toast.error(t("messages.userNameRequired"))
            return
        }
        if (!userFormData.email.trim()) {
            toast.error(t("messages.userEmailRequired"))
            return
        }
        if (!userFormData.password) {
            toast.error(t("messages.userPasswordRequired"))
            return
        }
        if (userFormData.password !== userFormData.confirmPassword) {
            toast.error(t("messages.passwordMismatch"))
            return
        }

        try {
            const request: CreateUserRequest = {
                name: userFormData.name.trim(),
                email: userFormData.email.trim(),
                password: userFormData.password,
                role: userFormData.role
            }
            await createUser(request)
            setUserFormData({ name: "", email: "", password: "", confirmPassword: "", role: "user" })
            setShowUserDialog(false)
            await loadUsers()
            toast.success(t("messages.userCreated"))
        } catch (err) {
            toast.error(t("messages.userCreateFailed"))
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm(t("pages.preferences.deleteUserConfirm"))) {
            return
        }

        try {
            await deleteUser(userId)
            await loadUsers()
            toast.success(t("messages.userDeleted"))
        } catch (err) {
            toast.error(t("messages.userDeleteFailed"))
        }
    }

    const handleDisableUser = async (userId: string) => {
        if (!confirm(t("pages.preferences.disableUserConfirm"))) {
            return
        }

        try {
            await disableUser(userId)
            await loadUsers()
            toast.success(t("messages.userDisabled"))
        } catch (err) {
            toast.error(t("messages.userUpdateFailed"))
        }
    }

    const handleEnableUser = async (userId: string) => {
        if (!confirm(t("pages.preferences.enableUserConfirm"))) {
            return
        }

        try {
            await enableUser(userId)
            await loadUsers()
            toast.success(t("messages.userEnabled"))
        } catch (err) {
            toast.error(t("messages.userUpdateFailed"))
        }
    }

    const handleChangePassword = async () => {
        if (!passwordFormData.newPassword) {
            toast.error(t("messages.userPasswordRequired"))
            return
        }
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            toast.error(t("messages.passwordMismatch"))
            return
        }

        try {
            const request: UpdateUserPasswordRequest = {
                password: passwordFormData.newPassword
            }
            await updateUserPassword(passwordFormData.userId, request)
            setPasswordFormData({ userId: "", newPassword: "", confirmPassword: "" })
            setShowPasswordDialog(false)
            toast.success(t("messages.userUpdated"))
        } catch (err) {
            toast.error(t("messages.userUpdateFailed"))
        }
    }

    const openPasswordDialog = (userId: string) => {
        setPasswordFormData({ userId, newPassword: "", confirmPassword: "" })
        setShowPasswordDialog(true)
    }

    useEffect(() => {
        if (!user || !open) return
        savePreferences()
    }, [theme, i18n.language, primaryColor])

    useEffect(() => {
        if (open && activeTab === 'apiKeys') {
            loadAPIKeys()
        }
        if (open && activeTab === 'users' && isOwner) {
            loadUsers()
        }
    }, [open, activeTab, isOwner])

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[800px] max-h-[85vh] z-[1001] flex flex-col">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t("menu.settings")}
                        </Dialog.Title>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-700 mb-4">
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'preferences'
                                        ? 'text-primary dark:text-primary border-b-2 border-primary dark:border-primary'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                {t("pages.preferences.language")} & {t("pages.preferences.theme")}
                            </button>
                            <button
                                onClick={() => setActiveTab('apiKeys')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'apiKeys'
                                        ? 'text-primary dark:text-primary border-b-2 border-primary dark:border-primary'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                {t("pages.preferences.apiKeys")}
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'users'
                                            ? 'text-primary dark:text-primary border-b-2 border-primary dark:border-primary'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {t("pages.preferences.userManagement")}
                                </button>
                            )}
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
                                                            {languageNativeNames[lng] || lng}
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
                                        <div className="flex flex-col">
                                            <div className="text-xs font-semibold text-gray-500 mb-2">
                                                {t("pages.preferences.primaryColor")}
                                            </div>

                                            {/* Preset colors grid */}
                                            <div className="flex gap-2 mb-3">
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => setPrimaryColor(color.value)}
                                                        className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                                        style={{
                                                            backgroundColor: color.value,
                                                            borderColor: primaryColor === color.value ? '#000' : 'transparent'
                                                        }}
                                                        title={color.name}
                                                    >
                                                        {primaryColor === color.value && (
                                                            <Check className="absolute inset-0 m-auto text-white" size={16} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom color picker */}
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t("pages.preferences.customColor")}
                                                </label>
                                                <input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="w-12 h-8 rounded border cursor-pointer"
                                                />
                                                <span className="text-sm font-mono text-gray-500">
                                                    {primaryColor.toUpperCase()}
                                                </span>
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
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
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
                                                                <div className="font-semibold">{key.name}</div>
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

                            {/* Users Tab */}
                            {activeTab === 'users' && isOwner && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t("pages.preferences.userList")}
                                        </p>
                                        <button
                                            onClick={() => setShowUserDialog(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                        >
                                            <Plus size={16} />
                                            {t("pages.preferences.createUser")}
                                        </button>
                                    </div>

                                    {usersLoading ? (
                                        <div className="text-center py-8">{t("common.loading")}</div>
                                    ) : users.length === 0 ? (
                                        <Card className="p-8 text-center text-gray-500">
                                            {t("pages.preferences.noUsers")}
                                        </Card>
                                    ) : (
                                        <div className="space-y-2">
                                            {users.map((u) => (
                                                <Card key={u.id} className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-semibold">{u.name}</div>
                                                                <span className={`text-xs px-2 py-1 rounded ${
                                                                    u.role === 'owner'
                                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                                                        : u.role === 'admin'
                                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                    {u.role === 'owner' && t("pages.preferences.roleOwner")}
                                                                    {u.role === 'admin' && t("pages.preferences.roleAdmin")}
                                                                    {u.role === 'user' && t("pages.preferences.roleUser")}
                                                                </span>
                                                                {u.disabled && (
                                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                                        {t("pages.preferences.disabled")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {u.email}
                                                            </p>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span>{t("pages.preferences.created")}: {formatDate(u.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        {u.role !== 'owner' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openPasswordDialog(u.id)}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                                    title={t("pages.preferences.changePassword")}
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                {u.disabled ? (
                                                                    <button
                                                                        onClick={() => handleEnableUser(u.id)}
                                                                        className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                                        title={t("pages.preferences.enableUser")}
                                                                    >
                                                                        <UserCheck size={18} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDisableUser(u.id)}
                                                                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                                                        title={t("pages.preferences.disableUser")}
                                                                    >
                                                                        <UserX size={18} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                    title={t("actions.delete")}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        )}
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
                                            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
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
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
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

            {/* Create User Dialog */}
            <Dialog.Root open={showUserDialog} onOpenChange={setShowUserDialog}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1002]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1003]">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t("pages.preferences.createUser")}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("pages.preferences.userName")}</label>
                                <input
                                    type="text"
                                    value={userFormData.name}
                                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                                    placeholder={t("form.username")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("pages.preferences.userEmail")}</label>
                                <input
                                    type="email"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                    placeholder={t("form.email")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("form.password")}</label>
                                <input
                                    type="password"
                                    value={userFormData.password}
                                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                    placeholder={t("form.password")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("form.comfirmPassword")}</label>
                                <input
                                    type="password"
                                    value={userFormData.confirmPassword}
                                    onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                                    placeholder={t("form.comfirmPassword")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("pages.preferences.userRole")}</label>
                                <Select
                                    value={userFormData.role}
                                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                >
                                    <option value="user">{t("pages.preferences.roleUser")}</option>
                                    <option value="admin">{t("pages.preferences.roleAdmin")}</option>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateUser}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                >
                                    {t("actions.create")}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUserDialog(false)
                                        setUserFormData({ name: "", email: "", password: "", confirmPassword: "", role: "user" })
                                    }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    {t("actions.cancel")}
                                </button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Change Password Dialog */}
            <Dialog.Root open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1002]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1003]">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t("pages.preferences.changePassword")}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("pages.preferences.newPassword")}</label>
                                <input
                                    type="password"
                                    value={passwordFormData.newPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                                    placeholder={t("pages.preferences.newPassword")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">{t("pages.preferences.confirmNewPassword")}</label>
                                <input
                                    type="password"
                                    value={passwordFormData.confirmPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                                    placeholder={t("pages.preferences.confirmNewPassword")}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleChangePassword}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                >
                                    {t("actions.save")}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPasswordDialog(false)
                                        setPasswordFormData({ userId: "", newPassword: "", confirmPassword: "" })
                                    }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    {t("actions.cancel")}
                                </button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}

export default UserSettingsModal
