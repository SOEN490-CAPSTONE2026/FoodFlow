package com.example.foodflow.websocket;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StompPrincipalTest {

    @Test
    void testConstructorAndGetName() {
        // Arrange
        String expectedName = "testUser123";

        // Act
        StompPrincipal principal = new StompPrincipal(expectedName);

        // Assert
        assertNotNull(principal);
        assertEquals(expectedName, principal.getName());
    }

    @Test
    void testConstructorWithNull() {
        // Act
        StompPrincipal principal = new StompPrincipal(null);

        // Assert
        assertNotNull(principal);
        assertNull(principal.getName());
    }

    @Test
    void testConstructorWithEmptyString() {
        // Arrange
        String emptyName = "";

        // Act
        StompPrincipal principal = new StompPrincipal(emptyName);

        // Assert
        assertNotNull(principal);
        assertEquals(emptyName, principal.getName());
    }

    @Test
    void testConstructorWithWhitespace() {
        // Arrange
        String whitespaceName = "   ";

        // Act
        StompPrincipal principal = new StompPrincipal(whitespaceName);

        // Assert
        assertNotNull(principal);
        assertEquals(whitespaceName, principal.getName());
    }

    @Test
    void testConstructorWithNumericString() {
        // Arrange
        String numericName = "12345";

        // Act
        StompPrincipal principal = new StompPrincipal(numericName);

        // Assert
        assertNotNull(principal);
        assertEquals(numericName, principal.getName());
    }

    @Test
    void testConstructorWithSpecialCharacters() {
        // Arrange
        String specialName = "user@domain.com!#$%";

        // Act
        StompPrincipal principal = new StompPrincipal(specialName);

        // Assert
        assertNotNull(principal);
        assertEquals(specialName, principal.getName());
    }

    @Test
    void testConstructorWithLongString() {
        // Arrange
        String longName = "a".repeat(10000);

        // Act
        StompPrincipal principal = new StompPrincipal(longName);

        // Assert
        assertNotNull(principal);
        assertEquals(longName, principal.getName());
    }

    @Test
    void testConstructorWithUnicodeCharacters() {
        // Arrange
        String unicodeName = "用户123";

        // Act
        StompPrincipal principal = new StompPrincipal(unicodeName);

        // Assert
        assertNotNull(principal);
        assertEquals(unicodeName, principal.getName());
    }

    @Test
    void testMultipleInstancesWithSameName() {
        // Arrange
        String name = "duplicateUser";

        // Act
        StompPrincipal principal1 = new StompPrincipal(name);
        StompPrincipal principal2 = new StompPrincipal(name);

        // Assert
        assertNotNull(principal1);
        assertNotNull(principal2);
        assertEquals(principal1.getName(), principal2.getName());
        assertNotSame(principal1, principal2); // Different instances
    }

    @Test
    void testMultipleInstancesWithDifferentNames() {
        // Arrange
        String name1 = "user1";
        String name2 = "user2";

        // Act
        StompPrincipal principal1 = new StompPrincipal(name1);
        StompPrincipal principal2 = new StompPrincipal(name2);

        // Assert
        assertNotNull(principal1);
        assertNotNull(principal2);
        assertEquals(name1, principal1.getName());
        assertEquals(name2, principal2.getName());
        assertNotEquals(principal1.getName(), principal2.getName());
    }

    @Test
    void testGetNameCalledMultipleTimes() {
        // Arrange
        String name = "consistentUser";
        StompPrincipal principal = new StompPrincipal(name);

        // Act & Assert
        assertEquals(name, principal.getName());
        assertEquals(name, principal.getName());
        assertEquals(name, principal.getName());
    }

    @Test
    void testConstructorWithNewlineCharacters() {
        // Arrange
        String nameWithNewline = "user\nwith\nnewlines";

        // Act
        StompPrincipal principal = new StompPrincipal(nameWithNewline);

        // Assert
        assertNotNull(principal);
        assertEquals(nameWithNewline, principal.getName());
    }

    @Test
    void testConstructorWithTabCharacters() {
        // Arrange
        String nameWithTabs = "user\twith\ttabs";

        // Act
        StompPrincipal principal = new StompPrincipal(nameWithTabs);

        // Assert
        assertNotNull(principal);
        assertEquals(nameWithTabs, principal.getName());
    }
}
