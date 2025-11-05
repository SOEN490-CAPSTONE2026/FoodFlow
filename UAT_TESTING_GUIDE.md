# FoodFlow User Acceptance Testing (UAT) Guide

## 🎯 Overview
This guide explains how to conduct usability testing for FoodFlow using Hotjar tracking and custom event monitoring.

---

## 📊 Metrics Being Tracked

### 1. **Task Completion Rate**
- Percentage of users who successfully complete key tasks
- Automatically tracked via `startTask()` and `completeTask()` functions

### 2. **Time on Task**
- How long it takes users to complete each task
- Measured from task start to completion
- Stored in browser sessionStorage

### 3. **Error Rate**
- Number of errors users encounter
- Tracked via `trackError()` function

### 4. **User Satisfaction**
- Can be collected via `trackSatisfaction()` function
- Optional: Add rating prompts after key tasks

### 5. **Navigation Patterns**
- Hotjar automatically records user flows
- Heatmaps show where users click
- Session recordings capture full user journey

---

## 🔧 Setup Instructions

### Running the App for UAT Testing

**Option 1: Development with UAT Tracking Enabled**
```bash
cd frontend
REACT_APP_ENV=uat npm start
```

**Option 2: Production Build**
```bash
cd frontend
npm run build
# Deploy the build folder to your hosting
```

---

## 📋 Key Tasks Being Tracked

### Donor Tasks
| Task ID | Description | Tracking Points |
|---------|-------------|-----------------|
| `DONOR_REGISTER` | Complete donor registration | Start: Page load<br>Success: Registration submitted<br>Failure: Validation errors |
| `DONOR_CREATE_POST` | Create a surplus food post | Start: Click "Create Post"<br>Success: Post created<br>Failure: Form errors |
| `DONOR_MANAGE_CLAIM` | Accept/reject receiver claims | Start: View claims<br>Success: Claim processed |
| `DONOR_SEND_MESSAGE` | Send message to receiver | Start: Open chat<br>Success: Message sent |

### Receiver Tasks
| Task ID | Description | Tracking Points |
|---------|-------------|-----------------|
| `RECEIVER_REGISTER` | Complete receiver registration | Start: Page load<br>Success: Registration submitted |
| `RECEIVER_BROWSE_DONATIONS` | Browse available donations | Automatic via page views |
| `RECEIVER_FILTER_SEARCH` | Use filters to find donations | Start: Click "Apply Filters"<br>Success: Results loaded<br>Failure: API error |
| `RECEIVER_CLAIM_DONATION` | Claim a food donation | Start: Click "Claim"<br>Success: Claim confirmed<br>Failure: Already claimed/error |
| `RECEIVER_VIEW_CLAIMS` | View my claimed donations | Automatic via page views |
| `RECEIVER_SEND_MESSAGE` | Contact donor via messaging | Start: Open chat<br>Success: Message sent |

### Admin Tasks
| Task ID | Description | Tracking Points |
|---------|-------------|-----------------|
| `ADMIN_LOGIN` | Admin authentication | Start: Page load<br>Success: Login complete |
| `ADMIN_VERIFY_USER` | Verify donor/receiver accounts | Start: Click verify<br>Success: User verified |
| `ADMIN_VIEW_ANALYTICS` | View system analytics | Automatic via page views |

---

## 🔍 Viewing Results in Hotjar

### 1. Access Hotjar Dashboard
- Go to: https://insights.hotjar.com/
- Login with your credentials
- Select "FoodFlow" site (ID: 6567728)

### 2. Session Recordings
- **Recordings** tab shows full user sessions
- Filter by:
  - User role (donor/receiver/admin)
  - Date range
  - Specific events (e.g., "task_donor_register_completed")

### 3. Heatmaps
- **Heatmaps** tab shows:
  - Click maps (where users click)
  - Move maps (mouse movement patterns)
  - Scroll maps (how far users scroll)
- Create heatmaps for key pages:
  - Donor Registration
  - Receiver Browse Donations
  - Create Surplus Post

### 4. Funnels (Optional)
- Create conversion funnels for:
  - Registration → First Post (donors)
  - Browse → Claim → Message (receivers)

### 5. Custom Events
- Go to **Events** tab
- View frequency of:
  - `task_*_completed` (successful completions)
  - `task_*_failed` (failed attempts)
  - `error_*` (specific errors)
  - `feature_*` (feature usage)

---

## 📈 Analyzing Metrics

### Task Completion Rate
```
Completion Rate = (task_completed events) / (task_started events) × 100%
```

**Example:**
- `task_donor_register_started`: 50 events
- `task_donor_register_completed`: 45 events
- **Completion Rate: 90%**

### Time on Task
Check browser console logs (for development):
```javascript
// Example log output:
"Task RECEIVER_CLAIM_DONATION: 12340ms (success)"
```

For production, you can export session recordings and manually time tasks.

### Error Rate
```
Error Rate = (error events) / (task attempts) × 100%
```

---

## 🧪 Test Scenarios for UAT Participants

### Scenario 1: New Donor Registration & First Post
**Goal:** Register as a donor and create your first surplus food post

**Steps:**
1. Navigate to registration page
2. Select "Register as Donor"
3. Fill out all required fields
4. Submit registration
5. Navigate to "Create Post"
6. Fill out surplus food details
7. Submit post

**Success Criteria:**
- Registration completes in < 3 minutes
- Post creation completes in < 2 minutes
- No critical errors encountered

---

### Scenario 2: Receiver Browse and Claim
**Goal:** Find and claim a donation that matches your needs

**Steps:**
1. Register as a receiver
2. Browse available donations
3. Apply filters (food type, location, expiry date)
4. View donation details
5. Claim a donation
6. Confirm pickup time

**Success Criteria:**
- Finding suitable donation in < 2 minutes
- Successfully claim donation
- Understand pickup process

---

### Scenario 3: Donor-Receiver Communication
**Goal:** Coordinate pickup via messaging

**Steps:**
1. Receiver claims a donation
2. Receiver sends message to donor
3. Donor responds with pickup details
4. Exchange 2-3 messages

**Success Criteria:**
- Messages send successfully
- Clear communication established
- < 1 minute to send first message

---

## 🐛 Common Issues to Watch For

### Registration Issues
- Form validation errors
- Unclear required fields
- Password requirements not obvious

### Browsing/Claiming Issues
- Filters not working as expected
- Donation details unclear
- Claim button not obvious
- Already claimed donations still showing

### Messaging Issues
- Messages not sending
- Notifications not received
- Conversation list confusing

---

## 📊 Data Collection Checklist

✅ Hotjar recording 10+ sessions per user role  
✅ Heatmaps generated for all key pages  
✅ Task completion events firing correctly  
✅ Error events capturing failures  
✅ User identification working (userId tracked)  
✅ Session recordings showing full user journeys  

---

## 🎬 After Testing

### 1. Export Hotjar Data
- Download session recordings
- Export heatmap images
- Export event data to CSV

### 2. Analyze Results
- Calculate task completion rates
- Identify common error patterns
- Review session recordings for usability issues
- Note user confusion points from heatmaps

### 3. Create Action Items
- Document bugs found
- List UX improvements needed
- Prioritize fixes based on severity

---

## 🔗 Useful Resources

- **Hotjar Dashboard:** https://insights.hotjar.com/sites/6567728
- **Hotjar Help Center:** https://help.hotjar.com/
- **React App (Development):** http://localhost:3000
- **Custom Tracking Utilities:** `frontend/src/utils/usabilityTracking.js`

---

## 💡 Tips for Effective UAT

1. **Test with Real Users:** Get actual donors, receivers, and admins
2. **Think Aloud Protocol:** Ask users to verbalize their thoughts
3. **Don't Interfere:** Let users struggle a bit to identify pain points
4. **Record Notes:** Document observations beyond what Hotjar captures
5. **Test Edge Cases:** Try to break the system
6. **Multiple Devices:** Test on desktop, tablet, mobile
7. **Different Browsers:** Chrome, Firefox, Safari, Edge

---

## 📞 Support

For technical issues with tracking:
- Check browser console for errors
- Verify Hotjar script is loaded (F12 → Network tab)
- Ensure `REACT_APP_ENV=uat` is set correctly

For Hotjar account issues:
- Contact: support@hotjar.com
