import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  IInvitationMail,
  IResetPasswordMail,
  IResetPasswordSuccessMail,
  IVerificationMail,
} from './shared.types';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false, // Use SSL
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendResetPasswordMail(input: IResetPasswordMail) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
        to: input.email,
        subject: 'Reset Password',
        html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Password Reset</title>
    <!-- Google Fonts for Lora and Roboto -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Roboto', Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1
                  style="
                    color: #ffffff;
                    margin: 0;
                    font-size: 26px;
                    font-family: 'Lora', serif;
                    font-weight: 700;
                  "
                >
                  <svg
                    width="112"
                    height="52"
                    viewBox="0 0 112 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.2193 43.6459C13.3397 43.6459 10.8368 43.0807 8.71064 41.9504C6.58452 40.7931 4.94283 39.1649 3.78558 37.0657C2.65524 34.9396 2.09007 32.4501 2.09007 29.5974C2.09007 27.4443 2.45339 25.4528 3.18004 23.6227C3.90669 21.7926 4.91592 20.1913 6.20774 18.8188C7.52647 17.4462 9.06051 16.3832 10.8098 15.6296C12.5592 14.876 14.4565 14.4993 16.5019 14.4993C17.7937 14.4993 19.099 14.6204 20.4177 14.8626C21.7365 15.0779 22.9745 15.4008 24.1317 15.8314C25.289 16.2351 26.2444 16.7061 26.9979 17.2444L24.0914 22.0887H23.3647L18.48 15.8314H22.5977L22.7592 19.4243C22.0056 18.5631 21.104 17.9306 20.0544 17.527C19.0317 17.1233 17.8072 16.9214 16.3808 16.9214C14.5776 16.9214 12.9763 17.4193 11.5769 18.4151C10.1774 19.4109 9.07396 20.7969 8.26658 22.5731C7.4861 24.3225 7.09587 26.3409 7.09587 28.6285C7.09587 31.0507 7.51302 33.1903 8.34732 35.0472C9.18161 36.9042 10.3389 38.3575 11.8191 39.4071C13.2993 40.4298 15.0217 40.9412 16.9864 40.9412C19.2201 40.9412 20.956 40.4836 22.194 39.5686C23.432 38.6267 24.1183 37.281 24.2528 35.5317L25.7061 36.3391C25.2755 38.7343 24.2528 40.5509 22.6381 41.7889C21.0502 43.0269 18.9106 43.6459 16.2193 43.6459ZM26.7961 43.6459L22.7188 40.4164V32.8673L19.2067 30.2433V29.5166H29.9449V30.2433L27.3209 32.6251V43.6459H26.7961ZM46.5537 43.4844L45.4638 40.3356H45.0601V30.7681C45.0601 28.9649 44.6564 27.6058 43.849 26.6908C43.0416 25.7758 41.844 25.3182 40.2561 25.3182C39.4218 25.3182 38.6144 25.4932 37.834 25.843C37.0804 26.1929 36.4614 26.6639 35.977 27.256L36.1788 23.9053H39.5295L35.21 29.557H34.4833L32.3437 24.9549C33.0435 24.5512 33.8374 24.2013 34.7255 23.9053C35.6136 23.6093 36.5556 23.3805 37.5514 23.219C38.5471 23.0306 39.5429 22.9364 40.5387 22.9364C43.4722 22.9364 45.6656 23.5285 47.1189 24.7127C48.5991 25.8699 49.3392 27.6193 49.3392 29.9607V39.5686L47.6841 37.1061L51.9632 40.3356V41.0219L47.3208 43.4844H46.5537ZM37.834 43.5248C36.0577 43.5248 34.6044 43.0404 33.4741 42.0715C32.3706 41.0757 31.8189 39.7974 31.8189 38.2364C31.8189 34.6301 34.6448 32.356 40.2965 31.414L46.4326 30.4451V32.181L42.1131 33.2306C39.9332 33.742 38.3991 34.3206 37.511 34.9665C36.6498 35.5855 36.2192 36.4467 36.2192 37.5501C36.2192 38.4383 36.5152 39.138 37.1073 39.6493C37.6994 40.1607 38.5202 40.4164 39.5698 40.4164C42.0458 40.4164 44.0777 39.5821 45.6656 37.9135V40.3356H45.1004C44.0777 41.4121 42.9743 42.2195 41.7902 42.7578C40.606 43.2691 39.2873 43.5248 37.834 43.5248ZM61.9493 43.4037L52.8662 24.8742H54.3195V27.3367L51.2514 24.0668V23.4612H60.7786V24.0668L57.9123 27.0541H57.4683V24.9145L64.4522 39.1245H63.4833L68.4084 24.4301V26.8523H68.0047L65.2596 24.0668V23.4612H73.7775V24.0668L70.7094 27.3367V24.8742H72.1627L63.0392 43.4037H61.9493ZM74.7385 43V42.3945L78.2506 39.5282L77.6047 40.6586V27.256L79.3406 29.88L74.6981 26.2871V25.6008L80.8746 23.2594H81.8838V40.7393L81.2783 39.5686L84.7501 42.3945V43H74.7385ZM79.825 20.3932C78.883 20.3932 78.1295 20.124 77.5643 19.5858C76.9991 19.0475 76.7166 18.3478 76.7166 17.4866C76.7166 16.6523 76.9991 15.966 77.5643 15.4277C78.1295 14.8895 78.883 14.6204 79.825 14.6204C80.74 14.6204 81.4801 14.8895 82.0453 15.4277C82.6105 15.966 82.8931 16.6523 82.8931 17.4866C82.8931 18.3478 82.6105 19.0475 82.0453 19.5858C81.4801 20.124 80.74 20.3932 79.825 20.3932ZM100.85 43V42.3945L104.321 39.5282L103.675 40.6586V31.2929C103.675 29.4897 103.352 28.1979 102.707 27.4174C102.061 26.637 100.984 26.2467 99.477 26.2467C98.2928 26.2467 97.2163 26.4889 96.2474 26.9734C95.2786 27.4578 94.3232 28.2248 93.3812 29.2744V26.6908H93.9464C96.4224 24.1879 98.8984 22.9364 101.374 22.9364C103.554 22.9364 105.196 23.5554 106.299 24.7934C107.403 26.0045 107.955 27.8077 107.955 30.2029V40.7393L107.309 39.5686L110.821 42.3945V43H100.85ZM86.8414 43V42.3945L90.3535 39.5282L89.7076 40.7393V27.0137L91.4435 29.9203L86.801 26.2871V25.6008L92.9775 23.2594H93.9868L93.7445 26.6908H93.9868V40.7393L93.3812 39.5686L96.8126 42.3945V43H86.8414Z"
                      fill="#171717"
                    />
                  </svg>
                </h1>
              </td>
            </tr>

            <!-- Message Card -->
            <tr>
              <td style="padding: 30px 40px;">
                <h2 style="margin-top: 0; color: #333; font-family: 'Lora', serif; font-weight: 700;">
                  🔐 Reset Your Password
                </h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  We've received a request to reset your password. If this was you, please use the PIN below to complete your
                  request.
                </p>
              </td>
            </tr>

            <!-- PIN Card -->
            <tr>
              <td style="padding: 0 40px 30px;">
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="background-color: #f1f3f5; border-radius: 8px; padding: 20px; text-align: center;"
                >
                  <tr>
                    <td>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
                        alt="PIN Icon"
                        width="50"
                        style="margin-bottom: 15px;"
                      />
                      <p style="margin: 0 0 10px; color: #555; font-size: 18px;">Your Reset PIN:</p>
                      <div
                        style="
                          letter-spacing: 10px;
                          font-size: 32px;
                          color: #2f3542;
                          font-weight: 700;
                          background-color: #ffffff;
                          padding: 15px;
                          border-radius: 8px;
                          display: inline-block;
                          font-family: 'Lora', serif;
                        "
                      >
                        ${input.token}
                      </div>
                      <p style="color: #999; font-size: 14px; margin-top: 15px;">
                        This PIN will expire in 10 minutes
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security Tip -->
            <tr>
              <td style="padding: 0 40px 30px;">
                <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
                  🚫 Never share this code with anyone. If you didn’t request a password reset, you can ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #f9f9f9;
                  padding: 20px 40px;
                  text-align: center;
                  border-radius: 0 0 10px 10px;
                  font-family: 'Roboto', Arial, sans-serif;
                "
              >
                <p style="color: #bbb; font-size: 12px;">© ${new Date().getFullYear()} Gavin . All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
       });
    } catch (error) {
      throw new Error(error);
    }
  }

  async sendResetPasswordSuccessMail(input: IResetPasswordSuccessMail) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      to: input.email,
      
      subject: 'Password Changed',
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Password Reset</title>
    <!-- Google Fonts for Lora and Roboto -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Roboto', Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1
                  style="
                    color: #ffffff;
                    margin: 0;
                    font-size: 26px;
                    font-family: 'Lora', serif;
                    font-weight: 700;
                  "
                >
                  <svg
                    width="112"
                    height="52"
                    viewBox="0 0 112 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.2193 43.6459C13.3397 43.6459 10.8368 43.0807 8.71064 41.9504C6.58452 40.7931 4.94283 39.1649 3.78558 37.0657C2.65524 34.9396 2.09007 32.4501 2.09007 29.5974C2.09007 27.4443 2.45339 25.4528 3.18004 23.6227C3.90669 21.7926 4.91592 20.1913 6.20774 18.8188C7.52647 17.4462 9.06051 16.3832 10.8098 15.6296C12.5592 14.876 14.4565 14.4993 16.5019 14.4993C17.7937 14.4993 19.099 14.6204 20.4177 14.8626C21.7365 15.0779 22.9745 15.4008 24.1317 15.8314C25.289 16.2351 26.2444 16.7061 26.9979 17.2444L24.0914 22.0887H23.3647L18.48 15.8314H22.5977L22.7592 19.4243C22.0056 18.5631 21.104 17.9306 20.0544 17.527C19.0317 17.1233 17.8072 16.9214 16.3808 16.9214C14.5776 16.9214 12.9763 17.4193 11.5769 18.4151C10.1774 19.4109 9.07396 20.7969 8.26658 22.5731C7.4861 24.3225 7.09587 26.3409 7.09587 28.6285C7.09587 31.0507 7.51302 33.1903 8.34732 35.0472C9.18161 36.9042 10.3389 38.3575 11.8191 39.4071C13.2993 40.4298 15.0217 40.9412 16.9864 40.9412C19.2201 40.9412 20.956 40.4836 22.194 39.5686C23.432 38.6267 24.1183 37.281 24.2528 35.5317L25.7061 36.3391C25.2755 38.7343 24.2528 40.5509 22.6381 41.7889C21.0502 43.0269 18.9106 43.6459 16.2193 43.6459ZM26.7961 43.6459L22.7188 40.4164V32.8673L19.2067 30.2433V29.5166H29.9449V30.2433L27.3209 32.6251V43.6459H26.7961ZM46.5537 43.4844L45.4638 40.3356H45.0601V30.7681C45.0601 28.9649 44.6564 27.6058 43.849 26.6908C43.0416 25.7758 41.844 25.3182 40.2561 25.3182C39.4218 25.3182 38.6144 25.4932 37.834 25.843C37.0804 26.1929 36.4614 26.6639 35.977 27.256L36.1788 23.9053H39.5295L35.21 29.557H34.4833L32.3437 24.9549C33.0435 24.5512 33.8374 24.2013 34.7255 23.9053C35.6136 23.6093 36.5556 23.3805 37.5514 23.219C38.5471 23.0306 39.5429 22.9364 40.5387 22.9364C43.4722 22.9364 45.6656 23.5285 47.1189 24.7127C48.5991 25.8699 49.3392 27.6193 49.3392 29.9607V39.5686L47.6841 37.1061L51.9632 40.3356V41.0219L47.3208 43.4844H46.5537ZM37.834 43.5248C36.0577 43.5248 34.6044 43.0404 33.4741 42.0715C32.3706 41.0757 31.8189 39.7974 31.8189 38.2364C31.8189 34.6301 34.6448 32.356 40.2965 31.414L46.4326 30.4451V32.181L42.1131 33.2306C39.9332 33.742 38.3991 34.3206 37.511 34.9665C36.6498 35.5855 36.2192 36.4467 36.2192 37.5501C36.2192 38.4383 36.5152 39.138 37.1073 39.6493C37.6994 40.1607 38.5202 40.4164 39.5698 40.4164C42.0458 40.4164 44.0777 39.5821 45.6656 37.9135V40.3356H45.1004C44.0777 41.4121 42.9743 42.2195 41.7902 42.7578C40.606 43.2691 39.2873 43.5248 37.834 43.5248ZM61.9493 43.4037L52.8662 24.8742H54.3195V27.3367L51.2514 24.0668V23.4612H60.7786V24.0668L57.9123 27.0541H57.4683V24.9145L64.4522 39.1245H63.4833L68.4084 24.4301V26.8523H68.0047L65.2596 24.0668V23.4612H73.7775V24.0668L70.7094 27.3367V24.8742H72.1627L63.0392 43.4037H61.9493ZM74.7385 43V42.3945L78.2506 39.5282L77.6047 40.6586V27.256L79.3406 29.88L74.6981 26.2871V25.6008L80.8746 23.2594H81.8838V40.7393L81.2783 39.5686L84.7501 42.3945V43H74.7385ZM79.825 20.3932C78.883 20.3932 78.1295 20.124 77.5643 19.5858C76.9991 19.0475 76.7166 18.3478 76.7166 17.4866C76.7166 16.6523 76.9991 15.966 77.5643 15.4277C78.1295 14.8895 78.883 14.6204 79.825 14.6204C80.74 14.6204 81.4801 14.8895 82.0453 15.4277C82.6105 15.966 82.8931 16.6523 82.8931 17.4866C82.8931 18.3478 82.6105 19.0475 82.0453 19.5858C81.4801 20.124 80.74 20.3932 79.825 20.3932ZM100.85 43V42.3945L104.321 39.5282L103.675 40.6586V31.2929C103.675 29.4897 103.352 28.1979 102.707 27.4174C102.061 26.637 100.984 26.2467 99.477 26.2467C98.2928 26.2467 97.2163 26.4889 96.2474 26.9734C95.2786 27.4578 94.3232 28.2248 93.3812 29.2744V26.6908H93.9464C96.4224 24.1879 98.8984 22.9364 101.374 22.9364C103.554 22.9364 105.196 23.5554 106.299 24.7934C107.403 26.0045 107.955 27.8077 107.955 30.2029V40.7393L107.309 39.5686L110.821 42.3945V43H100.85ZM86.8414 43V42.3945L90.3535 39.5282L89.7076 40.7393V27.0137L91.4435 29.9203L86.801 26.2871V25.6008L92.9775 23.2594H93.9868L93.7445 26.6908H93.9868V40.7393L93.3812 39.5686L96.8126 42.3945V43H86.8414Z"
                      fill="#171717"
                    />
                  </svg>
                </h1>
              </td>
            </tr>

            <!-- Message Card -->
            <tr>
              <td style="padding: 30px 40px;">
                <h2 style="margin-top: 0; color: #333; font-family: 'Lora', serif; font-weight: 700;">
                  Your Password Reset Succesfully
                </h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  if you have not reset your password, contact@gavinai.com
                </p>
              </td>
            </tr>

           

           

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #f9f9f9;
                  padding: 20px 40px;
                  text-align: center;
                  border-radius: 0 0 10px 10px;
                  font-family: 'Roboto', Arial, sans-serif;
                "
              >
                <p style="color: #bbb; font-size: 12px;">© ${new Date().getFullYear()} Gavin . All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
      });
  }

  async sendVerificationMail(input: IVerificationMail) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      to: input.email,
      subject: 'Verify Your Email',
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Password Reset</title>
    <!-- Google Fonts for Lora and Roboto -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Roboto', Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1
                  style="
                    color: #ffffff;
                    margin: 0;
                    font-size: 26px;
                    font-family: 'Lora', serif;
                    font-weight: 700;
                  "
                >
                  <svg
                    width="112"
                    height="52"
                    viewBox="0 0 112 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.2193 43.6459C13.3397 43.6459 10.8368 43.0807 8.71064 41.9504C6.58452 40.7931 4.94283 39.1649 3.78558 37.0657C2.65524 34.9396 2.09007 32.4501 2.09007 29.5974C2.09007 27.4443 2.45339 25.4528 3.18004 23.6227C3.90669 21.7926 4.91592 20.1913 6.20774 18.8188C7.52647 17.4462 9.06051 16.3832 10.8098 15.6296C12.5592 14.876 14.4565 14.4993 16.5019 14.4993C17.7937 14.4993 19.099 14.6204 20.4177 14.8626C21.7365 15.0779 22.9745 15.4008 24.1317 15.8314C25.289 16.2351 26.2444 16.7061 26.9979 17.2444L24.0914 22.0887H23.3647L18.48 15.8314H22.5977L22.7592 19.4243C22.0056 18.5631 21.104 17.9306 20.0544 17.527C19.0317 17.1233 17.8072 16.9214 16.3808 16.9214C14.5776 16.9214 12.9763 17.4193 11.5769 18.4151C10.1774 19.4109 9.07396 20.7969 8.26658 22.5731C7.4861 24.3225 7.09587 26.3409 7.09587 28.6285C7.09587 31.0507 7.51302 33.1903 8.34732 35.0472C9.18161 36.9042 10.3389 38.3575 11.8191 39.4071C13.2993 40.4298 15.0217 40.9412 16.9864 40.9412C19.2201 40.9412 20.956 40.4836 22.194 39.5686C23.432 38.6267 24.1183 37.281 24.2528 35.5317L25.7061 36.3391C25.2755 38.7343 24.2528 40.5509 22.6381 41.7889C21.0502 43.0269 18.9106 43.6459 16.2193 43.6459ZM26.7961 43.6459L22.7188 40.4164V32.8673L19.2067 30.2433V29.5166H29.9449V30.2433L27.3209 32.6251V43.6459H26.7961ZM46.5537 43.4844L45.4638 40.3356H45.0601V30.7681C45.0601 28.9649 44.6564 27.6058 43.849 26.6908C43.0416 25.7758 41.844 25.3182 40.2561 25.3182C39.4218 25.3182 38.6144 25.4932 37.834 25.843C37.0804 26.1929 36.4614 26.6639 35.977 27.256L36.1788 23.9053H39.5295L35.21 29.557H34.4833L32.3437 24.9549C33.0435 24.5512 33.8374 24.2013 34.7255 23.9053C35.6136 23.6093 36.5556 23.3805 37.5514 23.219C38.5471 23.0306 39.5429 22.9364 40.5387 22.9364C43.4722 22.9364 45.6656 23.5285 47.1189 24.7127C48.5991 25.8699 49.3392 27.6193 49.3392 29.9607V39.5686L47.6841 37.1061L51.9632 40.3356V41.0219L47.3208 43.4844H46.5537ZM37.834 43.5248C36.0577 43.5248 34.6044 43.0404 33.4741 42.0715C32.3706 41.0757 31.8189 39.7974 31.8189 38.2364C31.8189 34.6301 34.6448 32.356 40.2965 31.414L46.4326 30.4451V32.181L42.1131 33.2306C39.9332 33.742 38.3991 34.3206 37.511 34.9665C36.6498 35.5855 36.2192 36.4467 36.2192 37.5501C36.2192 38.4383 36.5152 39.138 37.1073 39.6493C37.6994 40.1607 38.5202 40.4164 39.5698 40.4164C42.0458 40.4164 44.0777 39.5821 45.6656 37.9135V40.3356H45.1004C44.0777 41.4121 42.9743 42.2195 41.7902 42.7578C40.606 43.2691 39.2873 43.5248 37.834 43.5248ZM61.9493 43.4037L52.8662 24.8742H54.3195V27.3367L51.2514 24.0668V23.4612H60.7786V24.0668L57.9123 27.0541H57.4683V24.9145L64.4522 39.1245H63.4833L68.4084 24.4301V26.8523H68.0047L65.2596 24.0668V23.4612H73.7775V24.0668L70.7094 27.3367V24.8742H72.1627L63.0392 43.4037H61.9493ZM74.7385 43V42.3945L78.2506 39.5282L77.6047 40.6586V27.256L79.3406 29.88L74.6981 26.2871V25.6008L80.8746 23.2594H81.8838V40.7393L81.2783 39.5686L84.7501 42.3945V43H74.7385ZM79.825 20.3932C78.883 20.3932 78.1295 20.124 77.5643 19.5858C76.9991 19.0475 76.7166 18.3478 76.7166 17.4866C76.7166 16.6523 76.9991 15.966 77.5643 15.4277C78.1295 14.8895 78.883 14.6204 79.825 14.6204C80.74 14.6204 81.4801 14.8895 82.0453 15.4277C82.6105 15.966 82.8931 16.6523 82.8931 17.4866C82.8931 18.3478 82.6105 19.0475 82.0453 19.5858C81.4801 20.124 80.74 20.3932 79.825 20.3932ZM100.85 43V42.3945L104.321 39.5282L103.675 40.6586V31.2929C103.675 29.4897 103.352 28.1979 102.707 27.4174C102.061 26.637 100.984 26.2467 99.477 26.2467C98.2928 26.2467 97.2163 26.4889 96.2474 26.9734C95.2786 27.4578 94.3232 28.2248 93.3812 29.2744V26.6908H93.9464C96.4224 24.1879 98.8984 22.9364 101.374 22.9364C103.554 22.9364 105.196 23.5554 106.299 24.7934C107.403 26.0045 107.955 27.8077 107.955 30.2029V40.7393L107.309 39.5686L110.821 42.3945V43H100.85ZM86.8414 43V42.3945L90.3535 39.5282L89.7076 40.7393V27.0137L91.4435 29.9203L86.801 26.2871V25.6008L92.9775 23.2594H93.9868L93.7445 26.6908H93.9868V40.7393L93.3812 39.5686L96.8126 42.3945V43H86.8414Z"
                      fill="#171717"
                    />
                  </svg>
                </h1>
              </td>
            </tr>

            <!-- Message Card -->
            <tr>
              <td style="padding: 30px 40px;">
                <h2 style="margin-top: 0; color: #333; font-family: 'Lora', serif; font-weight: 700;">
                  🔐 Verify your email
                </h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  We've received a request to reset your password. If this was you, please use the PIN below to complete your
                  request.
                </p>
              </td>
            </tr>

            <!-- PIN Card -->
            <tr>
              <td style="padding: 0 40px 30px;">
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="background-color: #f1f3f5; border-radius: 8px; padding: 20px; text-align: center;"
                >
                  <tr>
                    <td>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
                        alt="PIN Icon"
                        width="50"
                        style="margin-bottom: 15px;"
                      />
                      <p style="margin: 0 0 10px; color: #555; font-size: 18px;">Your Reset PIN:</p>
                      <div
                        style="
                          letter-spacing: 10px;
                          font-size: 32px;
                          color: #2f3542;
                          font-weight: 700;
                          background-color: #ffffff;
                          padding: 15px;
                          border-radius: 8px;
                          display: inline-block;
                          font-family: 'Lora', serif;
                        "
                      >
                        ${input.token}
                      </div>
                      <p style="color: #999; font-size: 14px; margin-top: 15px;">
                        This PIN will expire in 10 minutes
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security Tip -->
            <tr>
              <td style="padding: 0 40px 30px;">
                <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
                  🚫 Never share this code with anyone. If you didn’t request a password reset, you can ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #f9f9f9;
                  padding: 20px 40px;
                  text-align: center;
                  border-radius: 0 0 10px 10px;
                  font-family: 'Roboto', Arial, sans-serif;
                "
              >
                <p style="color: #bbb; font-size: 12px;">© ${new Date().getFullYear()} Gavin . All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });
  }

  
}
