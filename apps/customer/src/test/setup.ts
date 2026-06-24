import "@testing-library/jest-dom/vitest";

class ResizeObserverMock implements ResizeObserver {
  constructor(_callback?: ResizeObserverCallback) {}
  observe(_target: Element, _options?: ResizeObserverOptions) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly scrollMargin = "0px";
  readonly thresholds = [];

  constructor(_callback?: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverMock;
globalThis.IntersectionObserver = globalThis.IntersectionObserver ?? IntersectionObserverMock;
globalThis.CSS =
  globalThis.CSS ??
  ({
    supports: () => true,
  } as unknown as typeof CSS);

globalThis.CSS.supports =
  globalThis.CSS.supports ??
  (() => true);

const localStorageStore = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    clear: () => {
      localStorageStore.clear();
    },
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    removeItem: (key: string) => {
      localStorageStore.delete(key);
    },
    setItem: (key: string, value: string) => {
      localStorageStore.set(key, String(value));
    },
  },
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value:
    window.matchMedia ??
    ((query: string): MediaQueryList => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    })),
  writable: true,
});

const svgElementPrototype = SVGElement.prototype as SVGGraphicsElement;

svgElementPrototype.getBBox =
  svgElementPrototype.getBBox ??
  (() => ({
    height: 12,
    width: 24,
    x: 0,
    y: 0,
  }) as DOMRect);

Element.prototype.scrollTo =
  Element.prototype.scrollTo ??
  function scrollTo() {
    return undefined;
  };
