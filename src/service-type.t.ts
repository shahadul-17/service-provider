export type ServiceType<Type> = {
  new(...args: any[]): Type;
};
