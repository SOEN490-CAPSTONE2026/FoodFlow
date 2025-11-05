# UAT Quick Reference Card

## 🚀 Quick Start

### Start the App for UAT Testing
```bash
cd C:\Users\haifa\soen490\FoodFlow\frontend
set REACT_APP_ENV=uat
npm start
```

### View Hotjar Dashboard
URL: https://insights.hotjar.com/sites/6567728

---

## ✅ Pre-Test Checklist

- [ ] Hotjar is initialized (check browser console: "Hotjar initialized successfully")
- [ ] App is running on UAT mode
- [ ] Test user accounts ready (donor, receiver, admin)
- [ ] Observer/facilitator ready to take notes
- [ ] Recording setup ready (optional)

---

## 👥 Test Participants Needed

- **3-5 Donors** (restaurants, grocery stores, event organizers)
- **3-5 Receivers** (charities, shelters, community kitchens)
- **1-2 Admins** (for verification workflow)

---

## 📋 Key Metrics to Measure

| Metric | How to Measure | Target |
|--------|---------------|--------|
| **Task Completion Rate** | % of users completing tasks | > 80% |
| **Time on Task** | Average time to complete | < 3 min per task |
| **Error Rate** | # of errors per user session | < 2 errors |
| **User Satisfaction** | Post-task survey (1-5 scale) | > 4.0 average |
| **Navigation Efficiency** | # of clicks to complete task | Minimal backtracking |

---

## 🎯 Critical User Tasks

### Donor Priority Tasks
1. ✅ Register as donor (< 3 min)
2. ✅ Create first surplus post (< 2 min)
3. ✅ View and manage claims
4. ✅ Communicate with receiver

### Receiver Priority Tasks
1. ✅ Register as receiver (< 3 min)
2. ✅ Browse available donations
3. ✅ Use filters to find specific items (< 2 min)
4. ✅ Claim a donation (< 1 min)
5. ✅ Contact donor via messaging

### Admin Priority Tasks
1. ✅ Login to admin panel
2. ✅ Verify pending users
3. ✅ View analytics dashboard

---

## 🔍 What to Observe

### During Testing
- ⚠️ **Confusion points** - Where do users pause or hesitate?
- ⚠️ **Error patterns** - Which fields cause validation errors?
- ⚠️ **Navigation issues** - Do users get lost?
- ⚠️ **Unexpected behavior** - Did the app respond as expected?
- ⚠️ **Accessibility** - Can all elements be reached/clicked?

### After Each Task
- ❓ "How easy was that task?" (1-5 scale)
- ❓ "What was confusing, if anything?"
- ❓ "What would make this easier?"

---

## 📊 Hotjar Features to Review

| Feature | What It Shows | How to Access |
|---------|---------------|---------------|
| **Session Recordings** | Full user journey video | Recordings tab → Filter by date |
| **Heatmaps** | Click/scroll patterns | Heatmaps tab → Select page |
| **Funnels** | Conversion drop-off points | Funnels tab → Create new |
| **Events** | Custom task tracking | Events tab → View all events |

---

## 🐛 Common Issues & Solutions

| Issue | Quick Fix |
|-------|-----------|
| Hotjar not tracking | Check console: `initHotjar()` called? |
| Events not firing | Verify `REACT_APP_ENV=uat` is set |
| Can't see recordings | Wait 5-10 min for processing |
| User stuck on task | Note the issue, allow them to continue |

---

## 📝 Data Collection Form

**Participant ID:** _________  
**Role:** ☐ Donor  ☐ Receiver  ☐ Admin  
**Date/Time:** _________  

### Task Results
| Task | Time | Success | Errors | Satisfaction (1-5) |
|------|------|---------|--------|--------------------|
| Registration | _____ | ☐ | _____ | ☐☐☐☐☐ |
| Primary Task | _____ | ☐ | _____ | ☐☐☐☐☐ |
| Messaging | _____ | ☐ | _____ | ☐☐☐☐☐ |

### Notes:
```
[Space for observations]
```

---

## 🎬 Post-Testing Steps

1. **Export Hotjar Data**
   - Recordings → Download selected sessions
   - Heatmaps → Export as images
   - Events → Export to CSV

2. **Calculate Metrics**
   - Task completion rate: ____%
   - Average time on task: _____
   - Error rate: ____%
   - Average satisfaction: _____/5

3. **Identify Top Issues**
   - Issue #1: ________________
   - Issue #2: ________________
   - Issue #3: ________________

4. **Create Action Plan**
   - High priority fixes: ________________
   - Medium priority: ________________
   - Low priority/nice-to-have: ________________

---

## 📞 Emergency Contacts

**Technical Issues:**
- Check: `C:\Users\haifa\soen490\FoodFlow\frontend\src\services\hotjar.js`
- Browser console for errors
- Restart app if needed

**Hotjar Support:**
- Email: support@hotjar.com
- Help: https://help.hotjar.com/

---

## 💡 Facilitator Tips

✅ **DO:**
- Encourage "thinking aloud"
- Take detailed notes
- Let users struggle briefly (reveals UX issues)
- Ask open-ended questions
- Thank participants for their time

❌ **DON'T:**
- Give hints too quickly
- Blame the user for confusion
- Skip documenting issues
- Rush through tasks
- Forget to get consent for recording

---

## ⏰ Suggested Timeline

- **0:00-0:05** - Welcome & explain test purpose
- **0:05-0:10** - Demographic questions & consent
- **0:10-0:40** - Task execution (6-8 tasks)
- **0:40-0:50** - Post-test questionnaire
- **0:50-1:00** - Debrief & thank you

**Total:** ~1 hour per participant

---

**Prepared for:** FoodFlow UAT  
**Test Version:** User-Acceptance-Testing branch  
**Hotjar Site ID:** 6567728  
