type ApiError = Error | string | number | unknown;
type ApiResponse = { status: number };

type Handler<T> = {
  next?: (value: T) => void;
  error?: (error: ApiError) => void;
  complete?: () => void;
};

class Observer<T> {
  private handlers: Handler<T>;
  private isUnsubscribed: boolean;
  _unsubscribe?: () => void;

  constructor(handlers: Handler<T>) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: T): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: ApiError): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }
      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }
      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable<T> {
  private _subscribe: (observer: Observer<T>) => () => void;

  constructor(subscribe: (observer: Observer<T>) => () => void) {
    this._subscribe = subscribe;
  }

  static from<U>(values: U[]): Observable<U> {
    return new Observable<U>((observer) => {
      values.forEach((value) => observer.next(value));
      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(handlers: Handler<T>): { unsubscribe: () => void } {
    const observer = new Observer<T>(handlers);
    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const HTTP_POST_METHOD = "POST" as const;
const HTTP_GET_METHOD = "GET" as const;

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

type RequestMethod = typeof HTTP_POST_METHOD | typeof HTTP_GET_METHOD;

interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleated: boolean;
}

interface CustomRequest {
  method: RequestMethod;
  host: string;
  path: string;
  body?: User;
  params: Record<string, string | number | boolean>;
}

const userMock: User = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: CustomRequest[] = [
  {
    method: HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: { id: "3f5h67s4s" },
  },
];

const handleRequest = (request: CustomRequest): ApiResponse => {
  // handling of request
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: ApiError): ApiResponse => {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }

  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
