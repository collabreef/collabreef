package grpcserver

import (
	"context"
	"errors"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/model"
)

// ---------- Request / Response types (JSON-serialized) ----------

type GetUserRequest struct {
	ID string `json:"id"`
}
type GetUserResponse struct {
	Found    bool   `json:"found"`
	ID       string `json:"id"`
	Name     string `json:"name"`
	Disabled bool   `json:"disabled"`
}

type IsWorkspaceMemberRequest struct {
	UserID      string `json:"user_id"`
	WorkspaceID string `json:"workspace_id"`
}
type IsWorkspaceMemberResponse struct {
	IsMember bool `json:"is_member"`
}

type GetNoteRequest struct {
	ID string `json:"id"`
}
type GetNoteResponse struct {
	Found       bool   `json:"found"`
	ID          string `json:"id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Visibility  string `json:"visibility"`
	WorkspaceID string `json:"workspace_id"`
	CreatedBy   string `json:"created_by"`
}

type GetViewRequest struct {
	ID string `json:"id"`
}
type GetViewResponse struct {
	Found       bool   `json:"found"`
	ID          string `json:"id"`
	Data        string `json:"data"`
	Visibility  string `json:"visibility"`
	WorkspaceID string `json:"workspace_id"`
	CreatedBy   string `json:"created_by"`
}

type UpdateNoteRequest struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}
type UpdateNoteResponse struct{}

type UpdateViewDataRequest struct {
	ID        string `json:"id"`
	Data      string `json:"data"`
	UpdatedAt string `json:"updated_at"`
}
type UpdateViewDataResponse struct{}

type ViewObjectData struct {
	ID        string `json:"id"`
	ViewID    string `json:"view_id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Data      string `json:"data"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}

type GetViewObjectsRequest struct {
	ViewID string `json:"view_id"`
}
type GetViewObjectsResponse struct {
	Objects []ViewObjectData `json:"objects"`
}

type CreateViewObjectRequest struct {
	Object ViewObjectData `json:"object"`
}
type CreateViewObjectResponse struct{}

type UpdateViewObjectRequest struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Data      string `json:"data"`
	UpdatedBy string `json:"updated_by"`
	UpdatedAt string `json:"updated_at"`
}
type UpdateViewObjectResponse struct{}

type DeleteViewObjectRequest struct {
	ID string `json:"id"`
}
type DeleteViewObjectResponse struct{}

// ---------- Service interface ----------

type CollabServiceServer interface {
	GetUser(ctx context.Context, req *GetUserRequest) (*GetUserResponse, error)
	IsWorkspaceMember(ctx context.Context, req *IsWorkspaceMemberRequest) (*IsWorkspaceMemberResponse, error)
	GetNote(ctx context.Context, req *GetNoteRequest) (*GetNoteResponse, error)
	GetView(ctx context.Context, req *GetViewRequest) (*GetViewResponse, error)
	UpdateNote(ctx context.Context, req *UpdateNoteRequest) (*UpdateNoteResponse, error)
	UpdateViewData(ctx context.Context, req *UpdateViewDataRequest) (*UpdateViewDataResponse, error)
	GetViewObjects(ctx context.Context, req *GetViewObjectsRequest) (*GetViewObjectsResponse, error)
	CreateViewObject(ctx context.Context, req *CreateViewObjectRequest) (*CreateViewObjectResponse, error)
	UpdateViewObject(ctx context.Context, req *UpdateViewObjectRequest) (*UpdateViewObjectResponse, error)
	DeleteViewObject(ctx context.Context, req *DeleteViewObjectRequest) (*DeleteViewObjectResponse, error)
}

// ---------- Unary handler wrappers ----------

func makeHandler[Req any](fullMethod string, impl func(context.Context, *Req) (interface{}, error)) grpc.MethodDesc {
	name := fullMethod[len("/collab.CollabService/"):]
	return grpc.MethodDesc{
		MethodName: name,
		Handler: func(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
			in := new(Req)
			if err := dec(in); err != nil {
				return nil, err
			}
			if interceptor == nil {
				return impl(ctx, in)
			}
			info := &grpc.UnaryServerInfo{Server: srv, FullMethod: fullMethod}
			handler := func(ctx context.Context, req interface{}) (interface{}, error) {
				return impl(ctx, req.(*Req))
			}
			return interceptor(ctx, in, info, handler)
		},
	}
}

// ---------- Service descriptor ----------

func registerCollabServiceServer(s *grpc.Server, srv CollabServiceServer) {
	desc := grpc.ServiceDesc{
		ServiceName: "collab.CollabService",
		HandlerType: (*CollabServiceServer)(nil),
		Methods: []grpc.MethodDesc{
			makeHandler("/collab.CollabService/GetUser", func(ctx context.Context, req *GetUserRequest) (interface{}, error) {
				return srv.GetUser(ctx, req)
			}),
			makeHandler("/collab.CollabService/IsWorkspaceMember", func(ctx context.Context, req *IsWorkspaceMemberRequest) (interface{}, error) {
				return srv.IsWorkspaceMember(ctx, req)
			}),
			makeHandler("/collab.CollabService/GetNote", func(ctx context.Context, req *GetNoteRequest) (interface{}, error) {
				return srv.GetNote(ctx, req)
			}),
			makeHandler("/collab.CollabService/GetView", func(ctx context.Context, req *GetViewRequest) (interface{}, error) {
				return srv.GetView(ctx, req)
			}),
			makeHandler("/collab.CollabService/UpdateNote", func(ctx context.Context, req *UpdateNoteRequest) (interface{}, error) {
				return srv.UpdateNote(ctx, req)
			}),
			makeHandler("/collab.CollabService/UpdateViewData", func(ctx context.Context, req *UpdateViewDataRequest) (interface{}, error) {
				return srv.UpdateViewData(ctx, req)
			}),
			makeHandler("/collab.CollabService/GetViewObjects", func(ctx context.Context, req *GetViewObjectsRequest) (interface{}, error) {
				return srv.GetViewObjects(ctx, req)
			}),
			makeHandler("/collab.CollabService/CreateViewObject", func(ctx context.Context, req *CreateViewObjectRequest) (interface{}, error) {
				return srv.CreateViewObject(ctx, req)
			}),
			makeHandler("/collab.CollabService/UpdateViewObject", func(ctx context.Context, req *UpdateViewObjectRequest) (interface{}, error) {
				return srv.UpdateViewObject(ctx, req)
			}),
			makeHandler("/collab.CollabService/DeleteViewObject", func(ctx context.Context, req *DeleteViewObjectRequest) (interface{}, error) {
				return srv.DeleteViewObject(ctx, req)
			}),
		},
		Streams:  []grpc.StreamDesc{},
		Metadata: "collab.proto",
	}
	s.RegisterService(&desc, srv)
}

// ---------- Implementation ----------

type collabServer struct {
	db db.DB
}

func (s *collabServer) GetUser(ctx context.Context, req *GetUserRequest) (*GetUserResponse, error) {
	user, err := s.db.FindUserByID(req.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &GetUserResponse{Found: false}, nil
		}
		return nil, status.Errorf(codes.Internal, "find user: %v", err)
	}
	return &GetUserResponse{
		Found:    true,
		ID:       user.ID,
		Name:     user.Name,
		Disabled: user.Disabled,
	}, nil
}

func (s *collabServer) IsWorkspaceMember(ctx context.Context, req *IsWorkspaceMemberRequest) (*IsWorkspaceMemberResponse, error) {
	members, err := s.db.FindWorkspaceUsers(model.WorkspaceUserFilter{
		UserID:      req.UserID,
		WorkspaceID: req.WorkspaceID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "find workspace users: %v", err)
	}
	return &IsWorkspaceMemberResponse{IsMember: len(members) > 0}, nil
}

func (s *collabServer) GetNote(ctx context.Context, req *GetNoteRequest) (*GetNoteResponse, error) {
	note, err := s.db.FindNote(model.Note{ID: req.ID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &GetNoteResponse{Found: false}, nil
		}
		return nil, status.Errorf(codes.Internal, "find note: %v", err)
	}
	return &GetNoteResponse{
		Found:       true,
		ID:          note.ID,
		Title:       note.Title,
		Content:     note.Content,
		Visibility:  note.Visibility,
		WorkspaceID: note.WorkspaceID,
		CreatedBy:   note.CreatedBy,
	}, nil
}

func (s *collabServer) GetView(ctx context.Context, req *GetViewRequest) (*GetViewResponse, error) {
	view, err := s.db.FindView(model.View{ID: req.ID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &GetViewResponse{Found: false}, nil
		}
		return nil, status.Errorf(codes.Internal, "find view: %v", err)
	}
	return &GetViewResponse{
		Found:       true,
		ID:          view.ID,
		Data:        view.Data,
		Visibility:  view.Visibility,
		WorkspaceID: view.WorkspaceID,
		CreatedBy:   view.CreatedBy,
	}, nil
}

func (s *collabServer) UpdateNote(ctx context.Context, req *UpdateNoteRequest) (*UpdateNoteResponse, error) {
	// Fetch current note to preserve visibility and workspace_id
	note, err := s.db.FindNote(model.Note{ID: req.ID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "note not found")
		}
		return nil, status.Errorf(codes.Internal, "find note: %v", err)
	}
	note.Title = req.Title
	note.Content = req.Content
	note.UpdatedAt = req.UpdatedAt
	note.UpdatedBy = req.UpdatedBy
	if err := s.db.UpdateNote(note); err != nil {
		return nil, status.Errorf(codes.Internal, "update note: %v", err)
	}
	return &UpdateNoteResponse{}, nil
}

func (s *collabServer) UpdateViewData(ctx context.Context, req *UpdateViewDataRequest) (*UpdateViewDataResponse, error) {
	// UpdateView with struct uses GORM Updates which skips zero-value fields,
	// so only Data and UpdatedAt are changed.
	if err := s.db.UpdateView(model.View{ID: req.ID, Data: req.Data, UpdatedAt: req.UpdatedAt}); err != nil {
		return nil, status.Errorf(codes.Internal, "update view: %v", err)
	}
	return &UpdateViewDataResponse{}, nil
}

func (s *collabServer) GetViewObjects(ctx context.Context, req *GetViewObjectsRequest) (*GetViewObjectsResponse, error) {
	objs, err := s.db.FindViewObjects(model.ViewObjectFilter{ViewID: req.ViewID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "find view objects: %v", err)
	}
	result := make([]ViewObjectData, len(objs))
	for i, o := range objs {
		result[i] = ViewObjectData{
			ID:        o.ID,
			ViewID:    o.ViewID,
			Name:      o.Name,
			Type:      o.Type,
			Data:      o.Data,
			CreatedAt: o.CreatedAt,
			CreatedBy: o.CreatedBy,
			UpdatedAt: o.UpdatedAt,
			UpdatedBy: o.UpdatedBy,
		}
	}
	return &GetViewObjectsResponse{Objects: result}, nil
}

func (s *collabServer) CreateViewObject(ctx context.Context, req *CreateViewObjectRequest) (*CreateViewObjectResponse, error) {
	o := req.Object
	if err := s.db.CreateViewObject(model.ViewObject{
		ID:        o.ID,
		ViewID:    o.ViewID,
		Name:      o.Name,
		Type:      o.Type,
		Data:      o.Data,
		CreatedAt: o.CreatedAt,
		CreatedBy: o.CreatedBy,
		UpdatedAt: o.UpdatedAt,
		UpdatedBy: o.UpdatedBy,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "create view object: %v", err)
	}
	return &CreateViewObjectResponse{}, nil
}

func (s *collabServer) UpdateViewObject(ctx context.Context, req *UpdateViewObjectRequest) (*UpdateViewObjectResponse, error) {
	if err := s.db.UpdateViewObject(model.ViewObject{
		ID:        req.ID,
		Name:      req.Name,
		Type:      req.Type,
		Data:      req.Data,
		UpdatedBy: req.UpdatedBy,
		UpdatedAt: req.UpdatedAt,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "update view object: %v", err)
	}
	return &UpdateViewObjectResponse{}, nil
}

func (s *collabServer) DeleteViewObject(ctx context.Context, req *DeleteViewObjectRequest) (*DeleteViewObjectResponse, error) {
	if err := s.db.DeleteViewObject(model.ViewObject{ID: req.ID}); err != nil {
		return nil, status.Errorf(codes.Internal, "delete view object: %v", err)
	}
	return &DeleteViewObjectResponse{}, nil
}

// ---------- Start ----------

func Start(database db.DB, port string) {
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("[gRPC] listen on :%s failed: %v", port, err)
	}
	srv := grpc.NewServer()
	registerCollabServiceServer(srv, &collabServer{db: database})
	log.Printf("[gRPC] ColabService listening on :%s", port)
	if err := srv.Serve(lis); err != nil {
		log.Fatalf("[gRPC] serve failed: %v", err)
	}
}
