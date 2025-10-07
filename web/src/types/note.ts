export type Visibility = "public" | "private" | "workspace"

export interface NoteData {
  id?: string;
  created_at?: string;
  updated_at?: string;
  blocks: Block[] | null;
  visibility?: Visibility;
}

interface Block {
  type: string;
  data: any;
}
