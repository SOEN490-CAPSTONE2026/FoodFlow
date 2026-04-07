import { onUnauthorized, emitUnauthorized } from '../authEvents';

describe('authEvents', () => {
  describe('onUnauthorized', () => {
    it('should add handler to listeners', () => {
      const handler = jest.fn();

      onUnauthorized(handler);
      emitUnauthorized();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call multiple handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      onUnauthorized(handler1);
      onUnauthorized(handler2);
      emitUnauthorized();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const handler = jest.fn();

      const unsubscribe = onUnauthorized(handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove handler when unsubscribe is called', () => {
      const handler = jest.fn();

      const unsubscribe = onUnauthorized(handler);
      unsubscribe();
      emitUnauthorized();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove specific handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const unsubscribe1 = onUnauthorized(handler1);
      onUnauthorized(handler2);

      unsubscribe1();
      emitUnauthorized();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitUnauthorized', () => {
    it('should not throw when no handlers registered', () => {
      expect(() => emitUnauthorized()).not.toThrow();
    });

    it('should call handler each time it is emitted', () => {
      const handler = jest.fn();

      onUnauthorized(handler);
      emitUnauthorized();
      emitUnauthorized();

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
});
