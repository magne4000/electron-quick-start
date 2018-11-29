namespace RPC {
  export type RequestOrNotificationMethod<T extends any[], R> =
    (...args: T) => Promise<R> | R;

  export type ClientMethod<T extends any[], R> =
    (...args: T) => R extends void ? void : Promise<R>;

  export type EventReceiverInterface = {
    events?: Record<string, any[]>,
  };

  export type EventReceiverClientInterface<T extends EventReceiverInterface> = {
    on?: <N extends keyof T['events']>(eventName: N, callback: (...args: Extract<T['events'][N], any[]>) => void) => void,
  };

  export type Interface<T> = EventReceiverInterface & {
    [key in Exclude<Extract<keyof T, string>, keyof EventReceiverInterface>]:
    T[key] extends RequestOrNotificationMethod<any[], any> ? T[key] : never;
  };

  export type Node<T extends Interface<any>> = EventReceiverClientInterface<T> & {
    [key in keyof T]:
      T[key] extends RequestOrNotificationMethod<infer Y, infer Z> ? ClientMethod<Y, Z> :
        T[key];
  };

  export type Server<T extends Interface<any>> = {
    [key in Exclude<keyof T, 'events'>]: T[key];
  };
}
