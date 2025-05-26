export interface IUser {
  email: string;
  firstName: string;
  lastName: string;
}

export interface IError {
  message: string;
}

export interface IProgress {
  total?: number;
  current?: number;
  type?: string;
}