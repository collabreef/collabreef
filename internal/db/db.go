package db

import (
	"context"

	"github.com/collabreef/collabreef/internal/model"
)

type DB interface {
	Uow
	UserRepository
	NoteRepository
	FileRepository
	WorkspaceRepository
	WorkspaceUserRepository
	ViewRepository
	ViewObjectRepository
	ViewObjectNoteRepository
	WidgetRepository
	APIKeyRepository
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
	UpdateUserWithDisabled(u model.User) error
	DeleteUser(id string) error
}
type NoteRepository interface {
	CreateNote(n model.Note) error
	UpdateNote(n model.Note) error
	DeleteNote(n model.Note) error
	FindNote(n model.Note) (model.Note, error)
	FindNotes(f model.NoteFilter) ([]model.Note, error)
	GetNoteCountsByDate(workspaceID string, startDate string, timezoneOffsetMinutes int) (map[string]int, error)
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
type ViewRepository interface {
	CreateView(v model.View) error
	UpdateView(v model.View) error
	DeleteView(v model.View) error
	FindView(v model.View) (model.View, error)
	FindViews(f model.ViewFilter) ([]model.View, error)
}
type ViewObjectRepository interface {
	CreateViewObject(v model.ViewObject) error
	UpdateViewObject(v model.ViewObject) error
	DeleteViewObject(v model.ViewObject) error
	FindViewObject(v model.ViewObject) (model.ViewObject, error)
	FindViewObjects(f model.ViewObjectFilter) ([]model.ViewObject, error)
}
type ViewObjectNoteRepository interface {
	AddNoteToViewObject(v model.ViewObjectNote) error
	RemoveNoteFromViewObject(v model.ViewObjectNote) error
	FindNotesForViewObject(viewObjectID string) ([]model.Note, error)
	FindViewObjectsForNote(noteID string) ([]model.ViewObject, error)
}
type WidgetRepository interface {
	CreateWidget(w model.Widget) error
	UpdateWidget(w model.Widget) error
	DeleteWidget(w model.Widget) error
	FindWidget(w model.Widget) (model.Widget, error)
	FindWidgets(f model.WidgetFilter) ([]model.Widget, error)
}
type APIKeyRepository interface {
	CreateAPIKey(k model.APIKey) error
	FindAPIKeys(f model.APIKeyFilter) ([]model.APIKey, error)
	FindAPIKeyByID(id string) (model.APIKey, error)
	FindAPIKeyByPrefix(prefix string) (model.APIKey, error)
	UpdateAPIKey(k model.APIKey) error
	DeleteAPIKey(id string) error
}
