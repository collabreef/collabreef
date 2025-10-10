package db

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
)

type DB interface {
	Uow
	UserRepository
	UserSettingsRepository
	UserGenCommandRepository
	AIGenerationRepository
	NoteRepository
	FileRepository
	WorkspaceRepository
	WorkspaceUserRepository
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
type UserGenCommandRepository interface {
	FindUserGenCommandsByUserID(id string) ([]model.UserGenCommand, error)
	CreateUserGenCommand(c model.UserGenCommand) error
	UpdateUserGenCommand(c model.UserGenCommand) error
	DeleteUserGenCommand(id string) error
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
type AIGenerationRepository interface {
	CreateAIGeneration(g model.AIGeneration) error
	FindAIGenerationByID(id string) (model.AIGeneration, error)
	FindAIGenerationsByUserID(userID string, limit int) ([]model.AIGeneration, error)
}
