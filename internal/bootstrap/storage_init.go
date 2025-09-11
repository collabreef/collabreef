package bootstrap

import (
	"fmt"

	"github.com/pinbook/pinbook/internal/config"
	"github.com/pinbook/pinbook/internal/storage"
	"github.com/pinbook/pinbook/internal/storage/localfile"
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
