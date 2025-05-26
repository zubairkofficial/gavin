export interface IResetPasswordMail {
  email: string;
  token: string;
  fullName: string;
}

export interface IResetPasswordSuccessMail {
  email: string;
  fullName: string;
}

export interface IVerificationMail {
  email: string;
  token: string;
}

export interface IInvitationMail {
  email: string;
  organizationName: string;
  token: string;
}
