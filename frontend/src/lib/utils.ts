import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {EventSource} from 'eventsource'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserInfo() {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("userData");
  if (token && userData) {
    try {
      const decodedJWT = JSON.parse(userData);
      return decodedJWT;
    }
    catch {
      return null;
    }
  }
  return null;
}

export function updateUserInfo({companyName, ...userInfo}: any) {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("userData");
  if (token && userData) {
    try {
      const decodedJWT = JSON.parse(userData);
      Object.assign(decodedJWT, {
        ...userInfo,
        organization: {
          ...decodedJWT.organization,
          name: companyName
        }
      })
      localStorage.setItem("userData", JSON.stringify(decodedJWT))
      return decodedJWT;
    }
    catch {
      return null;
    }
  }
  return null;
}

export function SSE(url: string) {
  const token = localStorage.getItem("authToken");

  const eventSource = new EventSource(url, {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      }),
  });

  return eventSource;
}
