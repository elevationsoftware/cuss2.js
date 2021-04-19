import { EnvironmentComponent } from './environmentComponent';
export interface ValidationResponse {
  completed: boolean;
  requiredComponentPresent?: boolean;
  platformComponentList?: EnvironmentComponent[];
}
