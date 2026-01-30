const unauthorizedListeners = new Set();

export const onUnauthorized = handler => {
  unauthorizedListeners.add(handler);
  return () => unauthorizedListeners.delete(handler);
};

export const emitUnauthorized = () => {
  unauthorizedListeners.forEach(handler => handler());
};
