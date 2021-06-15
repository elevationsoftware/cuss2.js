export const logger = (...args: any[]) => {
  if (logger.enabled)  {
      console.log(...args);
  }
}

logger.enabled = false
