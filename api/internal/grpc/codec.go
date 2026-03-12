package grpcserver

import (
	"encoding/json"

	"google.golang.org/grpc/encoding"
)

// jsonCodec replaces the default protobuf codec with JSON encoding.
// It is registered under the name "proto" so that requests sent by
// @grpc/grpc-js (Content-Type: application/grpc+proto) are decoded
// with JSON on the Go side. Both sides must use JSON serialization.
type jsonCodec struct{}

func (jsonCodec) Marshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

func (jsonCodec) Unmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

func (jsonCodec) Name() string {
	return "proto"
}

func init() {
	encoding.RegisterCodec(jsonCodec{})
}
