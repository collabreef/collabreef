package textgen

type Model struct {
	ID       string
	Name     string
	Provider string
}

type GenerateRequest struct {
	Model  string
	Prompt string
}

type GenerateResponse struct {
	Text string
}
