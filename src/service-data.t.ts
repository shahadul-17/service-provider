import { ServiceCreateCallback } from "./service-create-callback.t";
import { ServiceScope } from "./service-scope.e";
import { ServiceType } from "./service-type.t";

export type ServiceData = {
  key: string,
  scopeName: string,
  scope: ServiceScope,
  serviceType: ServiceType<any>,
  instance: any,
  createCallback?: ServiceCreateCallback<any>,
};
