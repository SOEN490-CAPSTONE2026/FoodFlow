# Messaging System Implementation Guide

## Overview
A complete conversation-based messaging system has been implemented for FoodFlow, enabling real-time communication between donors and receivers.

## What Was Implemented

### Backend Components

#### 1. Database Layer (Migration V11)
- **conversations** table: Manages user-to-user conversations
- **messages** table: Stores messages within conversations
- Proper foreign key relationships and indexes for performance
- Unique constraint preventing duplicate conversations

#### 2. Domain Models
- `Conversation` entity with helper methods
- `Message` entity updated to reference conversations
- Both entities use JPA relationships

#### 3. Repository Layer
- `ConversationRepository`: Query conversations by user, find between users
- `MessageRepository`: Query messages, count unread messages

#### 4. Service Layer
- `ConversationService`: Manage conversation lifecycle, validation
- `MessageService`: Send messages, mark as read, get conversation messages

#### 5. Controller Layer
- `ConversationController`: REST endpoints for conversation management
- `MessageController`: REST endpoints for messaging

#### 6. DTOs
- `ConversationResponse`: Full conversation details with participant info
- `StartConversationRequest`: Request to start new conversation by email
- `MessageRequest`: Send message request
- `MessageResponse`: Message data with sender info

### Frontend Components

#### 1. Main Component
- `MessagingDashboard`: Container managing conversations and chat

#### 2. Sub-Components
- `ConversationsSidebar`: List of conversations with previews
- `ChatPanel`: Message display and input interface
- `NewConversationModal`: Dialog to start new conversations

#### 3. Styling
- Complete CSS for all components
- Responsive design
- WhatsApp-like chat interface

## API Endpoints

### Conversations
```
GET    /api/conversations              - Get all user's conversations
POST   /api/conversations              - Start new conversation
GET    /api/conversations/{id}         - Get conversation details
GET    /api/conversations/{id}/messages - Get conversation messages
PUT    /api/conversations/{id}/read    - Mark conversation as read
```

### Messages
```
POST   /api/messages                   - Send a message
PUT    /api/messages/{id}/read         - Mark message as read
GET    /api/messages/unread/count      - Get unread count
```

## Integration into Dashboards

### For Donor Dashboard

1. **Update DonorLayout.js** - Add Messages navigation link:
```jsx
import { Link, useLocation } from 'react-router-dom';

// In navigation
<Link 
  to="/donor/messages" 
  className={location.pathname === '/donor/messages' ? 'active' : ''}
>
  Messages
</Link>
```

2. **Update DonorDashboard.js** - Add route:
```jsx
import MessagingDashboard from '../MessagingDashboard/MessagingDashboard';

// In Routes
<Route path="messages" element={<MessagingDashboard />} />
```

### For Receiver Dashboard

1. **Update ReceiverLayout.js** - Add Messages navigation link:
```jsx
import { Link, useLocation } from 'react-router-dom';

// In navigation
<Link 
  to="/receiver/messages" 
  className={location.pathname === '/receiver/messages' ? 'active' : ''}
>
  Messages
</Link>
```

2. **Update ReceiverDashboard.js** - Add route:
```jsx
import MessagingDashboard from '../MessagingDashboard/MessagingDashboard';

// In Routes
<Route path="messages" element={<MessagingDashboard />} />
```

## How to Use

### Starting a Conversation
1. Click the "+" button in the sidebar
2. Enter the recipient's email address
3. Click "Start Conversation"
4. The conversation will open immediately

### Sending Messages
1. Select a conversation from the sidebar
2. Type your message in the input field at the bottom
3. Press Enter or click "Send"
4. Messages appear in real-time

### Features
- **Conversation List**: Shows all conversations sorted by most recent
- **Unread Badges**: Displays count of unread messages
- **Message Preview**: Shows last message in each conversation
- **Real-time Updates**: Messages update via WebSocket
- **Auto-scroll**: Automatically scrolls to newest messages
- **Mark as Read**: Messages marked as read when conversation is opened

## Testing the System

### 1. Run Database Migrations
```bash
cd backend
mvn flyway:migrate
```

### 2. Start Backend
```bash
cd backend
mvn spring-boot:run
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

### 4. Test Flow
1. Create two test accounts (one donor, one receiver)
2. Log in as donor
3. Navigate to Messages
4. Start conversation with receiver's email
5. Send a message
6. Log in as receiver (different browser/incognito)
7. See the message and reply

## Database Schema

### conversations
- id (BIGSERIAL PRIMARY KEY)
- user1_id (BIGINT, FOREIGN KEY to users)
- user2_id (BIGINT, FOREIGN KEY to users)
- created_at (TIMESTAMP)
- last_message_at (TIMESTAMP)
- UNIQUE constraint on (user1_id, user2_id)
- CHECK constraint ensuring user1_id < user2_id

### messages
- id (BIGSERIAL PRIMARY KEY)
- conversation_id (BIGINT, FOREIGN KEY to conversations)
- sender_id (BIGINT, FOREIGN KEY to users)
- message_body (TEXT)
- created_at (TIMESTAMP)
- read_status (BOOLEAN)

## Next Steps

1. **Integrate into dashboards** following the integration guide above
2. **Test thoroughly** with multiple users
3. **Consider enhancements**:
   - File/image attachments
   - Message search
   - Typing indicators
   - Message reactions
   - Push notifications
   - Message deletion
   - Conversation archiving

## Files Created

### Backend
- `backend/src/main/resources/db/migrations/V11__Create_Conversations_Table.sql`
- `backend/src/main/java/com/example/foodflow/model/entity/Conversation.java`
- `backend/src/main/java/com/example/foodflow/repository/ConversationRepository.java`
- `backend/src/main/java/com/example/foodflow/model/dto/ConversationResponse.java`
- `backend/src/main/java/com/example/foodflow/model/dto/StartConversationRequest.java`
- `backend/src/main/java/com/example/foodflow/service/ConversationService.java`
- `backend/src/main/java/com/example/foodflow/controller/ConversationController.java`

### Backend (Updated)
- `backend/src/main/java/com/example/foodflow/model/entity/Message.java`
- `backend/src/main/java/com/example/foodflow/repository/MessageRepository.java`
- `backend/src/main/java/com/example/foodflow/model/dto/MessageRequest.java`
- `backend/src/main/java/com/example/foodflow/model/dto/MessageResponse.java`
- `backend/src/main/java/com/example/foodflow/service/MessageService.java`
- `backend/src/main/java/com/example/foodflow/controller/MessageController.java`

### Frontend
- `frontend/src/components/MessagingDashboard/MessagingDashboard.js`
- `frontend/src/components/MessagingDashboard/MessagingDashboard.css`
- `frontend/src/components/MessagingDashboard/ConversationsSidebar.js`
- `frontend/src/components/MessagingDashboard/ConversationsSidebar.css`
- `frontend/src/components/MessagingDashboard/ChatPanel.js`
- `frontend/src/components/MessagingDashboard/ChatPanel.css`
- `frontend/src/components/MessagingDashboard/NewConversationModal.js`
- `frontend/src/components/MessagingDashboard/NewConversationModal.css`
