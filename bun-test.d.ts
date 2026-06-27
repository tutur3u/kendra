declare module "bun:test" {
  type MaybePromise<T> = T | Promise<T>;
  type TestCallback = () => MaybePromise<void>;
  type TestRegistrar = (
    name: string,
    callback: TestCallback,
    timeout?: number
  ) => void;

  interface Expect {
    (actual: unknown): any;
    any(expected: unknown): any;
    anything(): any;
    arrayContaining(expected: unknown[]): any;
    objectContaining(expected: Record<string, unknown>): any;
    stringContaining(expected: string): any;
  }

  interface MockFactory {
    (implementation?: (...args: any[]) => any): any;
    module(moduleId: string, factory: () => unknown): void;
  }

  export const afterEach: (callback: TestCallback) => void;
  export const beforeEach: (callback: TestCallback) => void;
  export const describe: TestRegistrar;
  export const expect: Expect;
  export const mock: MockFactory;
  export const test: TestRegistrar;
}
