// src/types/event-source-polyfill.d.ts
declare module 'event-source-polyfill' {
    // 기본 EventSource 옵션에 헤더 등 몇 가지 확장 옵션을 추가
    export interface ExtendedEventSourceInit extends EventSourceInit {
      headers?: Record<string, string>;
      heartbeatTimeout?: number;
      withCredentials?: boolean;
    }
  
    // 브라우저 EventSource를 상속하는 Polyfill 클래스
    export class EventSourcePolyfill extends EventSource {
      constructor(url: string, eventSourceInitDict?: ExtendedEventSourceInit);
    }
  
    // 원래의 네이티브 EventSource를 함께 export
    export const NativeEventSource: typeof EventSource;
  }
  