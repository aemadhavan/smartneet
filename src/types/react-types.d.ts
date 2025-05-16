declare namespace React {
  interface FormEvent<T = Element> {
    preventDefault(): void;
    target: EventTarget & T;
  }
  
  // Add this interface
  interface FormEventInterface<T = Element> {
    preventDefault(): void;
    target: EventTarget & T;
  }
}