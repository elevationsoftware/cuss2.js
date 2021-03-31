import { RequiredDevices } from "./requiredDevices";
export interface ValidationResponse {
  completed: boolean;
  requiredComponents?: RequiredDevices[];
}
