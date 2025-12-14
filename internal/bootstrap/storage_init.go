package bootstrap

import (
	"fmt"

	"github.com/notepia/notepia/internal/config"
	"github.com/notepia/notepia/internal/storage"
	"github.com/notepia/notepia/internal/storage/localfile"
)

func NewStorage() (storage.Storage, error) {
	storageType := config.C.GetString(config.STORAGE_TYPE)
	storageRoot := config.C.GetString(config.STORAGE_ROOT)

	switch storageType {
	case "local":
		return localfile.NewLocalFileStorage(storageRoot), nil
	}

	return nil, fmt.Errorf("unsupported database driver: %s", storageType)
}
