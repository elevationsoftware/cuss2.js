export const logConfig = {
    enable: false
};
export const logger = (...args: any[]) => {
  if (logConfig.enable)  {
      console.log(...args);
  }
}