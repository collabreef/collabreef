
export interface SignInData {
  username: string;
  password: string;
}

export interface SignUpData extends SignInData {
  email: string;
}