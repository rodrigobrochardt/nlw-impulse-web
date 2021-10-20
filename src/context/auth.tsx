import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
};
type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};
type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  };
};
export const AuthContext = createContext({} as AuthContextData);

type AuthProvider = {
  children: ReactNode;
};

export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=891533e57cfe556b8243&redirect_uri=http://localhost:3000`;

  async function signIn(gitHubCode: string) {
    const response = await api.post<AuthResponse>("/authenticate", {
      code: gitHubCode,
    });

    const { token, user } = response.data;
    localStorage.setItem("@nlw:token", token); //armazenar localmente
    api.defaults.headers.common.authorization = `Bearer ${token}`;
    setUser(user);
  }
  function signOut() {
    localStorage.removeItem("@nlw:token");
    setUser(null);
  }
  useEffect(() => {
    const token = localStorage.getItem("@nlw:token");
    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      api.get<User>("profile").then((response) => {
        setUser(response.data);
      });
    }
  },[]);
  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes("?code=");
    if (hasGithubCode) {
      const [urlWithoutCode, gitHubCode] = url.split("?code=");
      window.history.pushState({}, "", urlWithoutCode); //força o estado da pagina e remove o code da url

      signIn(gitHubCode);
    }
  },[]);
  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}
