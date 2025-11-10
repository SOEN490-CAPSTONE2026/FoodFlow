import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import { AuthContext, AuthProvider } from "../AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Initial State", () => {
    it("should initialize with default values when no storage exists", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.role).toBe(null);
      expect(result.current.userId).toBe(null);
    });

    it("should initialize with localStorage values when they exist", () => {
      localStorage.setItem("jwtToken", "test-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userId", "123");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("admin");
      expect(result.current.userId).toBe("123");
    });

    it("should initialize with sessionStorage values when they exist", () => {
      sessionStorage.setItem("jwtToken", "session-token");
      sessionStorage.setItem("userRole", "user");
      sessionStorage.setItem("userId", "456");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("user");
      expect(result.current.userId).toBe("456");
    });

    it("should prioritize localStorage over sessionStorage when both exist", () => {
      localStorage.setItem("jwtToken", "local-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userId", "111");
      sessionStorage.setItem("jwtToken", "session-token");
      sessionStorage.setItem("userRole", "user");
      sessionStorage.setItem("userId", "222");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("admin");
      expect(result.current.userId).toBe("111");
    });
  });

  describe("login function", () => {
    it("should store values in localStorage by default", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login("test-token", "admin", "123");
      });

      expect(localStorage.getItem("jwtToken")).toBe("test-token");
      expect(localStorage.getItem("userRole")).toBe("admin");
      expect(localStorage.getItem("userId")).toBe("123");
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("admin");
      expect(result.current.userId).toBe("123");
    });

    it("should store values in sessionStorage when useSession is true", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login("session-token", "user", "456", null, true);
      });

      expect(sessionStorage.getItem("jwtToken")).toBe("session-token");
      expect(sessionStorage.getItem("userRole")).toBe("user");
      expect(sessionStorage.getItem("userId")).toBe("456");
      expect(localStorage.getItem("jwtToken")).toBe(null);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("user");
      expect(result.current.userId).toBe("456");
    });

    it("should store values in localStorage when useSession is false", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login("local-token", "moderator", "789", null, false);
      });

      expect(localStorage.getItem("jwtToken")).toBe("local-token");
      expect(localStorage.getItem("userRole")).toBe("moderator");
      expect(localStorage.getItem("userId")).toBe("789");
      expect(sessionStorage.getItem("jwtToken")).toBe(null);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("moderator");
      expect(result.current.userId).toBe("789");
    });

    it("should update state when login is called multiple times", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.login("token1", "user", "111");
      });

      expect(result.current.userId).toBe("111");

      act(() => {
        result.current.login("token2", "admin", "222");
      });

      expect(result.current.userId).toBe("222");
      expect(result.current.role).toBe("admin");
    });
  });

  describe("logout function", () => {
    it("should clear all storage and reset state", () => {
      localStorage.setItem("jwtToken", "test-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userId", "123");
      sessionStorage.setItem("jwtToken", "session-token");
      sessionStorage.setItem("userRole", "user");
      sessionStorage.setItem("userId", "456");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem("jwtToken")).toBe(null);
      expect(localStorage.getItem("userRole")).toBe(null);
      expect(localStorage.getItem("userId")).toBe(null);
      expect(sessionStorage.getItem("jwtToken")).toBe(null);
      expect(sessionStorage.getItem("userRole")).toBe(null);
      expect(sessionStorage.getItem("userId")).toBe(null);
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.role).toBe(null);
      expect(result.current.userId).toBe(null);
    });

    it("should work correctly when no data is stored", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.role).toBe(null);
      expect(result.current.userId).toBe(null);
    });
  });

  describe("storage event listener", () => {
    it("should update state when storage event is fired", () => {
      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);

      act(() => {
        localStorage.setItem("jwtToken", "new-token");
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userId", "999");
        window.dispatchEvent(new Event("storage"));
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.role).toBe("admin");
      expect(result.current.userId).toBe("999");
    });

    it("should update to logged out when storage is cleared via event", () => {
      localStorage.setItem("jwtToken", "test-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userId", "123");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);

      act(() => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        window.dispatchEvent(new Event("storage"));
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.role).toBe(null);
      expect(result.current.userId).toBe(null);
    });

    it("should clean up event listener on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Context Provider", () => {
    it("should provide all context values to children", () => {
      const TestComponent = () => {
        const { isLoggedIn, role, userId, login, logout } = React.useContext(AuthContext);
        return (
          <div>
            <span data-testid="logged-in">{String(isLoggedIn)}</span>
            <span data-testid="role">{role || "none"}</span>
            <span data-testid="user-id">{userId || "none"}</span>
            <button onClick={() => login("token", "admin", "123")}>Login</button>
            <button onClick={logout}>Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("logged-in")).toHaveTextContent("false");
      expect(screen.getByTestId("role")).toHaveTextContent("none");
      expect(screen.getByTestId("user-id")).toHaveTextContent("none");
    });
  });

  describe("Edge Cases", () => {
    it("should handle string 'null' token in initial state", () => {
      localStorage.setItem("jwtToken", "null");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
    });

    it("should handle empty string token", () => {
      localStorage.setItem("jwtToken", "");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);
    });

    it("should handle sessionStorage token without localStorage", () => {
      sessionStorage.setItem("jwtToken", "session-only");

      const { result } = renderHook(() => React.useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
    });
  });
});