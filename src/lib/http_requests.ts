import { State } from "./state";
import axios from "axios";
import { ApplicationActivation, ApplicationStates } from "./interfaces/models";
import { PlatformData } from "./interfaces/platformData";
import { logger } from "./helper";

export type PromiseFn<T> = (rs: any, rj: any) => T;
export interface TokenResponse {
  access_token: string;
}

export class HttpRequests extends State {
  headers = () => {
    return {
      Authorization: `Bearer ${this.token.getValue()}`,
      "Content-Type": "application/json"
    };
  };

  INIT_ERROR = "Needs to call init methods first";

  GlobalCall(fn: PromiseFn<any>): Promise<any> {
    return new Promise((rs, rj) => {
      if (!this.initCompleted.getValue()) {
        return rj(this.INIT_ERROR);
      }
      return fn(rs, rj);
    });
  }

  post(url: string, data: any): any {
    return axios({
      method: "POST",
      data,
      headers: this.headers(),
      url
    });
  }

  get(url: string): any {
    return axios({
      method: "GET",
      headers: this.headers(),
      url
    });
  }

  /**
   * Retrieve a token from the CUSS Oauth Server using a client
   * id and client secret
   */
  getToken(): Promise<string> {
    return this.GlobalCall((rs, rj) => {
      this.post(`${this.baseURL}/oauth/token`, {
        client_id: this.clientId.getValue(),
        client_secret: this.clientSecret.getValue()
      })
        .then(({ data: { access_token } }: any) => {
          this.token.next(access_token);
          this.tokenReceived.next(true);
          logger("Token acquired", access_token);
          rs(access_token);
        })
        .catch((err: any) => rj(err));
    });
  }

  /**
   * Connects the application to the CUSS Webocket server and generate listeners
   * for: Errors, Open, Message, Close
   */
  getListener(access_token: string) {
    return new Promise((rs, rj) => {
      let wsURL = "ws";
      if (/https/.test(this.baseURL)) {
        wsURL += "s";
      }
      const socketURL = this.baseURL
        .replace("https", "")
        .replace("http", "")
        .replace("://", "");
      this.socket = new WebSocket(
        `${wsURL}://${socketURL}/subscribe`
      );
      this.socket.addEventListener("open", () => {
        logger("Socket open");
        this.socket.send(JSON.stringify({ access_token }));
        rs("");
      });
      this.socket.addEventListener("error", (err: any) => {
        logger("Socket error", err);
        this.closeSocket.next(true);
        rs("");
      });
      this.socket.addEventListener("close", (evnt: any) => {
        logger("Socket closed", evnt.reason);
        this.closeSocket.next(true);
        rs("");
      });
      this.socket.addEventListener("message", (evnt: any) => {
        //console.log("Socket data", evnt);
        const data = JSON.parse(evnt.data);
        if (data.returnCode) {
          logger("Token Received");
          this.listenerCreated.next(true);
        } else {
          this.cussEvents.next(data as PlatformData);
        }
        rs("");
      });
    });
  }

  /**
   * Request the cuss environment after stablishing the appropiate listener
   */
  getEnvironment(): any {
    return this.get(`${this.baseURL}/platform/environment`);
  }

  /**
   * Retrieve the cuss component list
   */
  getComponents(): any {
    return this.get(`${this.baseURL}/platform/components`);
  }

  /**
   * Query all the components returned from the get component call
   */
  queryComponents() {
    const calls: any[] = [];
    this.components$.getValue().forEach((c) => {
      const url = `${this.baseURL}/peripherals/query/${c.componentID}`;
      logger("URL", url);
      calls.push(this.get(url));
    });
  }

  /**
   * Request an application state transfer to the cuss platform
   * @param state desire state from the application to the platform
   * @param activation Application required state
   */
  stateRequest(state: ApplicationStates, activation: ApplicationActivation) {
    return this.post(
      `${this.baseURL}/platform/applications/staterequest/${state}`,
      activation
    );
  }

  moveToState(
    state: ApplicationStates,
    activation: ApplicationActivation = {
      applicationBrand: this.defaultApplicationBrand,
      executionMode: this.defaultExecutionMode,
      accessibleMode: this.defaultAccessibleMode,
      executionOptions: this.defaultExecutionOptions,
      languageID: this.defaultLanguageID,
      transferData: this.defaultTransferData
    }
  ) {
    return this.post(
      `${this.baseURL}/platform/applications/staterequest/${state}`,
      activation
    );
  }
}
