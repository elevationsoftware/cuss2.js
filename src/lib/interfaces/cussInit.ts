import { RequiredDevices } from "./requiredDevices";
export interface CussInit {
    clientId: string;
    clientSecret: string;
    baseURL: string;
    requiredComponents?: RequiredDevices[];
    oauthURL?: string;
    autoStart?: boolean;
    debugEnabled?: boolean;

}