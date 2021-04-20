import { ComponentName } from './componentNames';
export interface MissingResponse {
    missing: boolean;
    components?: ComponentName[];
}