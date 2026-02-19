import axios from 'axios';

interface SignInData {
  username: string;
  password: string;
}

interface SignUpData extends SignInData {
  email: string;
}

export const signIn = async (data: SignInData) => {
  const response = await axios.post('/api/v1/signin', {
    username: data.username,
    password: data.password,
  });
  return response.data;
};

export const signUp = async (data: SignUpData) => {
  const response = await axios.post('/api/v1/signup', {
    email: data.email,
    username: data.username,
    password: data.password,
  });
  return response.data;
};

export const signOut = async () => {
  const response = await axios.get('/api/v1/signout', { withCredentials: true });
  return response.data;
}; 

export const me = async () =>{
  const response = await axios.get('/api/v1/me', { withCredentials: true });
  return response.data
}