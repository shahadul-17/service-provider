import { IMap } from "@shahadul-17/collections";
import { ServiceCreateCallback } from "./service-create-callback.t";
import { ServiceScope } from "./service-scope.e";
import { ServiceType } from "./service-type.t";

export type ServiceData<Type> = {
  name: string,
  scope: ServiceScope,
  serviceType: ServiceType<Type>,
  singletonInstance?: Type,
  scopedInstanceMap?: IMap<string, Type>,
  createCallback?: ServiceCreateCallback<Type>,
};
