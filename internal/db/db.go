package db

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
)

type DB interface {
	Uow
	UserRepository
	UserSettingsRepository
	NoteRepository
	FileRepository
	WorkspaceRepository
	WorkspaceUserRepository
	GenTemplateRepository
	GenHistoryRepository
}
type Uow interface {
	Begin(ctx context.Context) (DB, error)
	Commit() error
	Rollback() error
}
type UserRepository interface {
	CreateUser(u model.User) error
	FindUsers(f model.UserFilter) ([]model.User, error)
	FindUserByID(id string) (model.User, error)
	UpdateUser(u model.User) error
	DeleteUser(id string) error
}
type UserSettingsRepository interface {
	SaveUserSettings(u model.UserSettings) error
	FindUserSettingsByID(id string) (model.UserSettings, error)
}
type NoteRepository interface {
	CreateNote(n model.Note) error
	UpdateNote(n model.Note) error
	DeleteNote(n model.Note) error
	FindNote(n model.Note) (model.Note, error)
	FindNotes(f model.NoteFilter) ([]model.Note, error)
}
type FileRepository interface {
	CreateFile(u model.File) error
	FindFiles(f model.FileFilter) ([]model.File, error)
	FindFileByID(id string) (model.File, error)
	UpdateFile(f model.File) error
	DeleteFile(f model.FileFilter) error
}
type WorkspaceRepository interface {
	FindWorkspaces(f model.WorkspaceFilter) ([]model.Workspace, error)
	FindWorkspaceByID(id string) (model.Workspace, error)
	UpdateWorkspace(w model.Workspace) error
	CreateWorkspace(w model.Workspace) error
	DeleteWorkspace(id string) error
}
type WorkspaceUserRepository interface {
	FindWorkspaceUsers(f model.WorkspaceUserFilter) ([]model.WorkspaceUser, error)
	CreateWorkspaceUser(w model.WorkspaceUser) error
	UpdateWorkspaceUser(w model.WorkspaceUser) error
	DeleteWorkspaceUser(w model.WorkspaceUser) error
}
type GenTemplateRepository interface {
	CreateGenTemplate(g model.GenTemplate) error
	UpdateGenTemplate(g model.GenTemplate) error
	DeleteGenTemplate(g model.GenTemplate) error
	FindGenTemplate(g model.GenTemplate) (model.GenTemplate, error)
	FindGenTemplates(f model.GenTemplateFilter) ([]model.GenTemplate, error)
}
type GenHistoryRepository interface {
	CreateGenHistory(h model.GenHistory) error
	DeleteGenHistory(h model.GenHistory) error
	FindGenHistory(h model.GenHistory) (model.GenHistory, error)
	FindGenHistories(f model.GenHistoryFilter) ([]model.GenHistory, error)
}
