import { ComponentName } from './componentNames';
export interface CussInit {
    clientId: string;
    clientSecret: string;
    baseURL: string;
    requiredComponents?: ComponentName[];
    oauthURL?: string;
    autoStart?: boolean;
    debugEnabled?: boolean;

}