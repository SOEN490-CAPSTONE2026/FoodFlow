// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        nav: {
          home: 'Home',
          howItWorks: 'How it works',
          about: 'About Us',
          faqs: 'FAQs',
          contact: 'Contact Us',
          login: 'Login',
          register: 'Register',
          returnToDashboard: 'Return to Dashboard',
          logout: 'Logout',
        },
        language: {
          select: 'Select Language',
          english: 'English',
          french: 'Français',
          spanish: 'Español',
          chinese: '中文',
          arabic: 'العربية',
          portuguese: 'Português',
        },
        auth: {
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          forgotPassword: 'Forgot Password?',
          dontHaveAccount: "Don't have an account?",
          alreadyHaveAccount: 'Already have an account?',
          signIn: 'Sign In',
          signUp: 'Sign Up',
          invalidEmailPassword: 'Invalid email or password',
          passwordMismatch: 'Passwords do not match',
          emailRequired: 'Email is required',
          passwordRequired: 'Password is required',
          passwordTooShort: 'Password must be at least 8 characters',
          resetPassword: 'Reset Password',
          sendResetLink: 'Send Reset Link',
          enterEmail: 'Enter your email address',
        },
        registration: {
          registerAsDonor: 'Register as Donor',
          registerAsReceiver: 'Register as Receiver',
          selectRole: 'Select Your Role',
          firstName: 'First Name',
          lastName: 'Last Name',
          organizationName: 'Organization Name',
          phone: 'Phone Number',
          address: 'Address',
          city: 'City',
          zipCode: 'Zip Code',
          country: 'Country',
          fullName: 'Full Name',
          acceptTerms: 'I accept the Terms of Service',
          privacyPolicy: 'Privacy Policy',
          termsOfService: 'Terms of Service',
          registrationSuccess: 'Registration successful',
          registrationError: 'Registration error',
        },
        registerType: {
          title: 'Join FoodFlow',
          subtitle: 'Choose your role to start making an impact.',
          donor: {
            heading: "I'm Donating",
            description:
              'For restaurants, grocery stores, and event organizers with surplus food to share.',
            benefit1: "Post what's available",
            benefit2: 'Connect with nearby charities',
            benefit3: 'Watch your impact grow',
            button: 'Register as a Donor',
          },
          receiver: {
            heading: "I'm Receiving",
            description:
              'For charities, shelters, and community kitchens that serve people in need.',
            benefit1: 'Accept fresh donations nearby',
            benefit2: 'Connect directly with food donors',
            benefit3: 'Feed your community efficiently',
            button: 'Register as a Receiver',
          },
        },
        common: {
          save: 'Save',
          cancel: 'Cancel',
          close: 'Close',
          submit: 'Submit',
          back: 'Back',
          next: 'Next',
          finish: 'Finish',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          warning: 'Warning',
          info: 'Information',
          yes: 'Yes',
          no: 'No',
          confirm: 'Confirm',
          delete: 'Delete',
          edit: 'Edit',
          update: 'Update',
          create: 'Create',
          add: 'Add',
          remove: 'Remove',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          export: 'Export',
          import: 'Import',
          settings: 'Settings',
          help: 'Help',
          about: 'About',
          logout: 'Logout',
          profile: 'Profile',
          download: 'Download',
          hidePassword: 'Hide password',
          showPassword: 'Show password',
          time: 'Time',
          location: 'Location',
        },
        landing: {
          home: {
            title1: 'Connect surplus with',
            title2: 'those in need',
            title3: 'Receive quality food',
            title4: 'for your community',
            description:
              "Connecting food businesses with community organizations. Turn surplus into impact—whether it's event leftovers, restaurant excess, or grocery overstock.",
            joinUs: 'Join Us Now',
          },
          about: {
            title: 'About FoodFlow',
            subtitle:
              'Our platform connects food donors with verified organizations to reduce waste and fight hunger through smart technology and community collaboration.',
            verifiedOrgs: {
              title: 'Verified Organizations',
              content:
                'All our partner organizations undergo thorough verification and background checks to ensure safety, legitimacy, and compliance with food safety standards.',
            },
            realTimeNotifications: {
              title: 'Real-Time Notifications',
              content:
                'Instant alerts when food donations become available. Our system tracks temperature, pickup times, and compliance automatically for complete transparency.',
            },
            smartMatching: {
              title: 'Smart Matching',
              content:
                'Our intelligent algorithm matches food type, quantity, and location with the most suitable nearby organization to maximize efficiency and impact.',
            },
          },
          howItWorks: {
            title: 'How FoodFlow Works',
            subtitle:
              'Surplus food reaches charities in minutes, not hours. Our smart matching prevents good food from going to waste.',
            step1: {
              number: '01',
              title: 'Post Surplus Instantly',
              text: 'Restaurants, events, and stores post surplus food with quantity, pickup location, and time window before it spoils.',
            },
            step2: {
              number: '02',
              title: 'Smart Instant Matching',
              text: 'Our algorithm instantly alerts the nearest verified charity, shelter, or volunteer who can pick up within the time window.',
            },
            step3: {
              number: '03',
              title: 'Tracked Safe Pickup',
              text: 'Built-in food safety tracking logs temperature, expiry dates, and pickup times for compliance while ensuring meals reach people fast.',
            },
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: {
              question: 'How can I use FoodFlow to donate my surplus food?',
              answer:
                'Donating surplus food through FoodFlow is simple! First, create an account on our platform. Once logged in, you can quickly post available surplus food by providing details like food type, quantity, pickup location, and time window. Nearby charities and community organizations will be instantly notified and can claim the donation.',
            },
            q2: {
              question:
                'What kind of organizations can receive food through FoodFlow?',
              answer:
                'FoodFlow works with verified charitable organizations including food banks, homeless shelters, community kitchens, schools, and non-profits serving vulnerable populations. All receiving organizations undergo a verification process to ensure they can properly handle and distribute food according to safety standards.',
            },
            q3: {
              question: 'Is there any cost to use FoodFlow?',
              answer:
                "FoodFlow is completely free for both food donors and receiving organizations. Our mission is to reduce food waste and help communities, so we've designed the platform to be accessible to everyone.",
            },
            q4: {
              question: 'How does FoodFlow ensure food safety?',
              answer:
                'Food safety is our top priority. Our platform includes built-in safety guidelines and tracking features. Donors provide information about storage conditions, preparation time, and expiration dates. We also provide temperature logging for perishable items and ensure all pickups happen within safe time windows.',
            },
          },
        },
        login: {
          title: 'Log in to your account',
          backHome: '← Back Home',
          emailLabel: 'Email address',
          emailPlaceholder: 'Enter your email',
          passwordLabel: 'Password',
          passwordPlaceholder: 'Enter your password',
          forgotPassword: 'Forgot password?',
          loggingIn: 'Logging in…',
          logIn: 'LOG IN',
          dontHaveAccount: "Don't have an account?",
          signUp: 'Sign up',
        },
        donorWelcome: {
          welcomeBack: 'Welcome back, {{name}}',
          totalDonations: 'Total Donations',
          mealsServed: 'Meals Served',
          co2Saved: 'CO₂ Saved',
          donateFood: {
            title: 'Donate Food',
            description:
              'Submit a new donation to share with community organizations',
            button: 'Create Donation',
          },
          impactReports: {
            title: 'Impact Reports',
            description: 'View detailed statistics about your donation impact',
            button: 'View Reports',
          },
          recentDonations: 'Recent Donations',
          viewAll: 'View All',
          noDonationsYet:
            'No donations yet. Create your first donation to get started!',
          noNameYet: 'No name yet',
          foodDonation: 'Food donation',
          status: {
            available: 'Available',
            claimed: 'Claimed',
            completed: 'Completed',
            readyForPickup: 'Ready for Pickup',
            notCompleted: 'Not Completed',
            expired: 'Expired',
          },
        },
        donorListFood: {
          edit: 'Edit',
          delete: 'Delete',
          reschedule: 'RESCHEDULE',
          enterPickupCode: 'ENTER PICKUP CODE',
          thankYou: 'THANK YOU',
          openChat: 'OPEN CHAT',
          postDeletedSuccess: 'Post deleted successfully.',
          postDeleteFailed: 'Failed to delete post',
          rescheduleComingSoon: 'Reschedule functionality coming soon!',
          loading: 'Loading your donations...',
          sortByDate: 'Sort by Date',
          sortByStatus: 'Sort by Status',
          donateMore: 'Donate More',
          emptyStateTitle: "You haven't posted anything yet",
          emptyStateDescription:
            'Create your first donation post to start helping your community reduce food waste.',
          status: {
            available: 'Available',
            readyForPickup: 'Ready for Pickup',
            claimed: 'Claimed',
            notCompleted: 'Not Completed',
            completed: 'Completed',
            expired: 'Expired',
          },
          expires: 'Expires',
          pickup: 'Pickup',
          notSpecified: 'Not specified',
          addressNotSpecified: 'Address not specified',
          confirmDelete: 'Are you sure you want to delete this post?',
          failedToFetch: 'Failed to fetch posts',
          editFunctionality:
            'Opening edit form for: {{title}}\n(Edit functionality to be implemented)',
        },
        donorDashboardHome: {
          dashboard: 'Dashboard',
          subtitle: 'Overview of your donations',
          noData: 'No data provided.',
          metrics: {
            totalListedItems: 'Total Listed Items',
            completedRequests: 'Completed Requests',
            pendingRequests: 'Pending Requests',
            rejectedRequests: 'Rejected Requests',
          },
          tiles: {
            totalListedFood: 'Total Listed Food',
            takeAwayCompleted: 'Take Away / Request Completed',
            rejectedRequests: 'Rejected Requests',
            allRequests: 'All Requests',
            newRequests: 'New Requests',
            tips: 'Tips',
            tipsText: 'Keep listings up to date for faster matching.',
          },
          charts: {
            analyticsInsights: 'Analytics & Insights',
            monthlyDonationActivity: 'Monthly Donation Activity',
            requestStatusDistribution: 'Request Status Distribution',
            requestTrends: 'Request Trends',
            foodCategories: 'Food Categories',
            total: 'Total',
            distribution: 'Distribution',
          },
        },
        donorSearch: {
          title: 'Search',
          description: 'Find organizations and receivers (coming soon).',
        },
        donorRequests: {
          title: 'Requests',
          description:
            'Manage incoming requests for your donations (coming soon).',
        },
        donorLayout: {
          home: 'Home',
          dashboard: 'Dashboard',
          donateNow: 'Donate Now',
          requestsClaims: 'Requests & Claims',
          pickupSchedule: 'Pickup Schedule',
          messages: 'Messages',
          settings: 'Settings',
          help: 'Help',
          logout: 'Logout',
          pageTitles: {
            donorDashboard: 'Donor Dashboard',
            donateNow: 'Donate Now',
            requestsClaims: 'Requests & Claims',
            pickupSchedule: 'Pickup Schedule',
            messages: 'Messages',
            settings: 'Settings',
            help: 'Help',
            donor: 'Donor',
          },
          pageDescriptions: {
            donorDashboard: 'Overview and quick actions',
            donateNow: 'Create and manage donation listings',
            requestsClaims: 'Incoming requests and status',
            pickupSchedule: 'Recent activity and history',
            messages: 'Incoming communications',
            settings: 'Manage your preferences and account settings',
            help: 'Guides and support',
            donorPortal: 'FoodFlow Donor Portal',
          },
          notifications: {
            newClaim: 'New Claim',
            claimCancelled: 'Claim Cancelled',
            hasClaimed: '{{receiverName}} has claimed your "{{foodTitle}}"',
            cancelledClaim:
              '{{receiverName}} cancelled their claim on "{{foodTitle}}"',
          },
        },
        receiverWelcome: {
          title: 'Find Food Near You',
          subtitle:
            'We help organizations connect with available food—quickly and reliably. Start with the map to see nearby donations and request what you need today.',
          tip: 'Tip: Set your pickup hours and capacity to get matched faster.',
          searchMap: {
            title: 'Search the map',
            description:
              'Browse current listings and filter by category or expiry to quickly find the items your organization needs.',
            button: 'Open map & search',
          },
          needAssistance: {
            title: 'Need assistance?',
            description:
              "Email us at {{email}} and we'll help you coordinate a pickup.",
            newHere: 'New here? Read common questions.',
            button: 'View FAQs',
          },
        },
        receiverBrowse: {
          confirmClaim: 'Are you sure you want to claim this donation?',
          claimSuccess: 'Successfully claimed donation',
          claimFailed: 'Failed to claim donation',
          title: 'Explore Available Donations',
          sortBy: 'Sort by:',
          relevance: 'Relevance',
          datePosted: 'Date Posted',
          loading: 'Loading donations...',
          failedToLoad: 'Failed to load available donations',
          failedToLoadFiltered: 'Failed to load donations with applied filters',
          noDonations: 'No donations available right now.',
          checkBackSoon: 'Check back soon for new surplus food!',
          status: {
            available: 'Available',
            readyForPickup: 'Ready for Pickup',
            claimed: 'Claimed',
            notCompleted: 'Not Completed',
            completed: 'Completed',
            expired: 'Expired',
          },
          expires: 'Expires',
          locationNotSpecified: 'Location not specified',
          donatedBy: 'Donated by {{donorName}}',
          localBusiness: 'Local Business',
          quantity: 'Quantity',
          items: 'items',
          pickupTime: 'Pickup Time',
          description: 'Description',
          claim: 'Claim',
          viewDetails: 'View Details',
          close: 'Close',
          matchScore: 'Match Score',
          justNow: 'Just now',
          hourAgo: '1 hour ago',
          hoursAgo: '{{hours}} hours ago',
          dayAgo: '1 day ago',
          daysAgo: '{{days}} days ago',
          failedToClaim: 'Failed to claim. It may have already been claimed.',
          claimDonation: 'Claim Donation',
          claiming: 'Claiming...',
          more: 'More',
          less: 'Less',
          donorsNote: "Donor's Note",
          posted: 'Posted',
          choosePickupSlot: 'Choose a pickup slot',
          noProposedSlots: 'No proposed slots available.',
          confirming: 'Confirming...',
          confirmAndClaim: 'Confirm & Claim',
        },
        receiverMyClaims: {
          readyForPickup: 'Ready for Pickup',
          completed: 'Completed',
          notCompleted: 'Not Completed',
          claimed: 'Claimed',
          title: 'My Claimed Donations',
          subtitle:
            'Track your donations and get ready for pickup — every claim helps reduce waste and feed our community.',
          loading: 'Loading your claims...',
          failedToLoad: 'Failed to load your claimed donations',
          sortByDate: 'Sort by Date',
          sortByStatus: 'Sort by Status',
          filters: {
            all: 'All',
            claimed: 'Claimed',
            ready: 'Ready',
            completed: 'Completed',
            notCompleted: 'Not Completed',
          },
          noClaimsYet:
            "You haven't claimed any donations yet. Browse available donations to make your first claim!",
          noDonationsForFilter:
            'No donations found for the "{{filter}}" filter.',
          viewDetails: 'View Details',
          cancelClaim: 'Cancel Claim',
          cancel: 'Cancel',
          confirmCancel: 'Are you sure you want to cancel this claim?',
          confirmCancelMessage:
            'Are you sure you want to cancel your claim on "{{postTitle}}"? This action cannot be undone.',
          keepClaim: 'Keep Claim',
          yesCancelClaim: 'Yes, Cancel Claim',
          claimCancelled: 'Claim Cancelled',
          claimCancelledMessage:
            'Your claim on "{{postTitle}}" has been cancelled',
          cancelFailed: 'Failed to cancel claim. Please try again.',
          notSpecified: 'Not specified',
          pickup: 'Pickup',
          untitledDonation: 'Untitled Donation',
        },
        receiverLayout: {
          donations: 'Donations',
          myClaims: 'My Claims',
          savedDonations: 'Saved Donations',
          settings: 'Settings',
          preferences: 'Preferences',
          help: 'Help',
          logout: 'Logout',
          hello: 'Hello {{name}}!',
          user: 'User',
          account: 'Account',
          pageTitles: {
            receiverDashboard: 'Receiver Dashboard',
            welcome: 'Welcome',
            browse: 'Browse Available Food',
            messages: 'Messages',
            settings: 'Settings',
            default: 'Receiver Dashboard',
          },
          pageDescriptions: {
            receiverDashboard: 'Overview of nearby food and your activity',
            welcome: 'Start here: search the map or browse nearby food',
            browse: 'Browse available food listings',
            messages: 'Communicate with donors and other users',
            settings: 'Manage your preferences and account settings',
            default: 'FoodFlow Receiver Portal',
          },
        },
        messaging: {
          failedToLoad: 'Failed to load conversations',
          messages: 'Messages',
          connectAndCoordinate: 'Connect and coordinate here!',
          startNewConversation: 'Start new conversation',
          all: 'All',
          unread: 'Unread',
          noConversationsYet: 'No conversations yet',
          clickToStart: 'Click + to start a new conversation',
          justNow: 'Just now',
          minutesAgo: '{{count}}m ago',
          hoursAgo: '{{count}}h ago',
          daysAgo: '{{count}}d ago',
          newConversationTitle: 'Start New Conversation',
          recipientEmailLabel: 'Recipient Email Address',
          recipientEmailPlaceholder: 'Enter email address',
          recipientEmailHint:
            'Enter the email address of the user you want to message',
          cancel: 'Cancel',
          starting: 'Starting...',
          startConversation: 'Start Conversation',
          emailRequired: 'Please enter an email address',
          userNotFound: 'User not found or invalid email',
          conversationFailed: 'Failed to start conversation. Please try again.',
        },
        confirmPickup: {
          title: 'Confirm Pickup',
          subtitle: 'Enter the 6-digit code shown by the receiver:',
          codeRequired: 'Please enter the complete 6-digit code',
          invalidDonation: 'Invalid donation item',
          verifyFailed: 'Failed to verify code',
          info: 'The receiver can find this code in their account:',
          myClaims: 'My Claims',
          cancel: 'Cancel',
          verifying: 'Verifying...',
          confirm: 'Confirm Pickup',
        },
        surplusForm: {
          title: 'Add New Donation',
          cancelConfirm: 'Cancel donation creation?',
          titleLabel: 'Title',
          titlePlaceholder: 'e.g., Vegetable Lasagna',
          foodCategoriesLabel: 'Food Categories',
          foodCategoriesPlaceholder: 'Select categories',
          expiryDateLabel: 'Expiry Date',
          expiryDatePlaceholder: 'Select expiry date',
          quantityLabel: 'Quantity',
          quantityPlaceholder: '0',
          unitLabel: 'Unit',
          unitPlaceholder: 'Select unit',
          pickupTimeSlotsLabel: 'Pickup Time Slots',
          addAnotherSlot: 'Add Another Slot',
          slot: 'Slot',
          dateLabel: 'Date',
          datePlaceholder: 'Select date',
          startTimeLabel: 'Start Time',
          startTimePlaceholder: 'Start',
          endTimeLabel: 'End Time',
          endTimePlaceholder: 'End',
          notesLabel: 'Notes (optional)',
          notesPlaceholder: 'e.g., Use back entrance, Ask for manager',
          pickupLocationLabel: 'Pickup Location',
          pickupLocationPlaceholder: 'Start typing address...',
          descriptionLabel: 'Description',
          descriptionPlaceholder:
            'Describe the food (ingredients, freshness, etc.)',
          cancel: 'Cancel',
          createDonation: 'Create Donation',
          success: 'Success! Post created with ID: {{id}}',
          failed: 'Failed to create surplus post',
          foodTypes: {
            preparedMeals: 'Prepared Meals',
            bakeryPastry: 'Bakery & Pastry',
            fruitsVegetables: 'Fruits & Vegetables',
            packagedPantry: 'Packaged / Pantry Items',
            dairyCold: 'Dairy & Cold Items',
            frozen: 'Frozen Food',
          },
          units: {
            kilogram: 'kg',
            item: 'items',
            liter: 'liters',
            pound: 'lbs',
            box: 'boxes',
          },
        },
        footer: {
          description:
            'Discover a charity shop platform designed to revolutionize food distribution. Connect charities with food sources across distances, enhance communications and ensure fresh food reaches those in need. FoodFlow boosts an intuitive and user-friendly interface.',
          company: 'Company',
          home: 'Home',
          howItWorks: 'How it works',
          about: 'About Us',
          faqs: 'FAQs',
          contact: 'Contact',
          email: 'foodflow.group@gmail.com',
          phone: '1-800-122-4567',
          copyright: 'Copyright © 2025. All right reserved to FoodFlow',
          privacyPolicy: 'Privacy Policy',
          termsConditions: 'Terms & Conditions',
        },
        admin: {
          dashboard: 'Admin Dashboard',
          analytics: 'Analytics',
          calendar: 'Calendar',
          messages: 'Messages',
          help: 'Help',
          overview: 'Overview and quick actions',
          metrics: 'Metrics and insights',
          events: 'Events and schedules',
          communications: 'Incoming communications',
          guides: 'Guides and support',
          administration: 'Administration',
        },
        claimedView: {
          claimed: 'Claimed',
          untitledDonation: 'Untitled Donation',
          pickupSteps: 'Pickup Steps',
          reviewPickup: {
            title: 'Review pickup time and location',
            description:
              'Be on time to ensure your organization receives this donation.',
          },
          timeUnits: {
            day: 'day',
            days: 'days',
            hrs: 'hrs',
            min: 'min',
            sec: 'sec',
          },
        },
        notifications: {
          newMessageFrom: 'New message from {{senderName}}',
          claimConfirmed: 'Claim Confirmed',
          claimStatus: 'Claim Status',
          successfullyClaimed:
            'Successfully claimed "{{foodTitle}}" from {{donorName}}',
          readyForPickup:
            '"{{foodTitle}}" is ready for pickup! Check your claims for details.',
          claimCancelled: 'Your claim on "{{foodTitle}}" has been cancelled',
        },
        chat: {
          noConversationSelected: 'No conversation selected',
          selectConversation:
            'Select a conversation from the sidebar or start a new one',
          with: 'with',
          claimed: 'Claimed',
          viewPost: 'View Post',
          noMessagesYet: 'No messages yet. Start the conversation!',
          today: 'Today',
          yesterday: 'Yesterday',
          typeMessage: 'Type your message here...',
          sendMessage: 'Send message',
          failedToSend: 'Failed to send message',
        },
        filtersPanel: {
          title: 'Filter Donations',
          foodTypeLabel: 'Food Type',
          selectFoodTypes: 'Select food types...',
          bestBeforeLabel: 'Best before',
          selectDate: 'Select date',
          distanceLabel: 'Distance:',
          km: 'km',
          locationLabel: 'Location',
          enterLocation: 'Enter location...',
          clearAll: 'Clear All',
          applyFilters: 'Apply Filters',
          selectedCount: '{{count}} selected',
          tagBefore: 'Before:',
          tagWithin: 'Within:',
          tagNear: 'Near:',
          foodCategories: {
            fruitsVegetables: 'Fruits & Vegetables',
            bakeryPastry: 'Bakery & Pastry',
            packagedPantry: 'Packaged / Pantry Items',
            dairyCold: 'Dairy & Cold Items',
            frozen: 'Frozen Food',
            preparedMeals: 'Prepared Meals',
          },
        },
        donorRegistration: {
          emailExistsError: 'An account with this email already exists',
          passwordMismatch: 'Passwords do not match',
          emailExists: 'An account with this email already exists',
          phoneExists: 'An account with this phone number already exists',
          emailRequired: 'Email is required',
          emailInvalid: 'Invalid email format',
          passwordRequired: 'Password is required',
          passwordMinLength: 'Password must be at least 8 characters',
          confirmPasswordRequired: 'Confirm password is required',
          organizationNameRequired: 'Organization name is required',
          organizationTypeRequired: 'Organization type is required',
          verificationRequired:
            'Either business license or supporting document is required',
          streetAddressRequired: 'Street address is required',
          cityRequired: 'City is required',
          postalCodeRequired: 'Postal code is required',
          postalCodeInvalid: 'Invalid postal code format',
          provinceRequired: 'Province/State is required',
          countryRequired: 'Country is required',
          contactPersonRequired: 'Contact person name is required',
          phoneRequired: 'Phone number is required',
          phoneInvalid: 'Invalid phone number format',
          errorBeforeProceeding: 'Please fix all errors before proceeding',
          emailValidationError: 'Error validating email',
          fileTypeError: 'Invalid file type. Please upload PDF, JPG, or PNG',
          fileSizeError: 'File size exceeds 10MB limit',
        },
        receiverRegistration: {
          emailExistsError: 'An account with this email already exists',
          emailExists: 'An account with this email already exists',
          phoneExists: 'An account with this phone number already exists',
          phoneExistsError: 'An account with this phone number already exists',
          passwordMismatch: 'Passwords do not match',
          emailRequired: 'Email is required',
          emailInvalid: 'Invalid email format',
          passwordRequired: 'Password is required',
          passwordMinLength: 'Password must be at least 8 characters',
          confirmPasswordRequired: 'Confirm password is required',
          organizationNameRequired: 'Organization name is required',
          organizationTypeRequired: 'Organization type is required',
          verificationRequired:
            'Either registration number or supporting document is required',
          streetAddressRequired: 'Street address is required',
          cityRequired: 'City is required',
          postalCodeRequired: 'Postal code is required',
          postalCodeInvalid: 'Invalid postal code format',
          provinceRequired: 'Province/State is required',
          countryRequired: 'Country is required',
          contactPersonRequired: 'Contact person name is required',
          phoneRequired: 'Phone number is required',
          phoneInvalid: 'Invalid phone number format',
          capacityRequired: 'Daily capacity is required',
          capacityInvalid: 'Capacity must be a positive number',
          confirmAccuracyRequired: 'Please confirm the information is accurate',
          errorBeforeProceeding: 'Please fix all errors before proceeding',
          emailValidationError: 'Error validating email',
          phoneValidationError: 'Error validating phone number',
          registrationFailed: 'Registration failed. Please try again.',
          fileTypeError: 'Invalid file type. Please upload PDF, JPG, or PNG',
          fileSizeError: 'File size exceeds 10MB limit',
        },
      },
    },
  },
});

// Mock Google Maps API
global.google = {
  maps: {
    places: {
      AutocompleteService: jest.fn(),
      PlacesService: jest.fn(),
    },
    Geocoder: jest.fn(),
    Map: jest.fn(),
    Marker: jest.fn(),
    LatLng: jest.fn(),
    LatLngBounds: jest.fn(),
  },
};

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock window.alert
global.alert = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock axios globally to handle ES module imports
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(url => {
        // Mock the user profile/region endpoint to prevent TimezoneContext from making API calls
        if (url === '/user/profile/region') {
          return Promise.resolve({
            data: { timezone: 'America/Toronto', region: 'CA' },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
    get: jest.fn(url => {
      if (url === '/user/profile/region') {
        return Promise.resolve({
          data: { timezone: 'America/Toronto', region: 'CA' },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: jest.fn(() => ({
    isLoaded: true,
    loadError: null,
  })),
  GoogleMap: jest.fn(({ children }) => (
    <div data-testid="google-map">{children}</div>
  )),
  Marker: jest.fn(() => <div data-testid="marker" />),
  Autocomplete: jest.fn(({ children }) => (
    <div data-testid="autocomplete">{children}</div>
  )),
}));

// Mock recommendation API and all other APIs
jest.mock('./services/api', () => ({
  recommendationAPI: {
    getBrowseRecommendations: jest.fn(() => Promise.resolve({})),
    getRecommendationForPost: jest.fn(() => Promise.resolve(null)),
    getTopRecommendations: jest.fn(() => Promise.resolve([])),
    getMyRating: jest.fn(() =>
      Promise.resolve({ data: { rating: 0, totalReviews: 0 } })
    ),
  },
  surplusAPI: {
    list: jest.fn(() => Promise.resolve({ data: [] })),
    search: jest.fn(() => Promise.resolve({ data: [] })),
    claim: jest.fn(() => Promise.resolve({})),
    create: jest.fn(() => Promise.resolve({ data: { id: 1 } })),
    getMyPosts: jest.fn(() => Promise.resolve({ data: [] })),
    getPost: jest.fn(() => Promise.resolve({ data: {} })),
    updatePost: jest.fn(() => Promise.resolve({ data: {} })),
    deletePost: jest.fn(() => Promise.resolve({})),
    verifyPickupCode: jest.fn(() => Promise.resolve({})),
    getClaimedPosts: jest.fn(() => Promise.resolve({ data: [] })),
    cancelClaim: jest.fn(() => Promise.resolve({})),
  },
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(() => Promise.resolve({})),
    resetPassword: jest.fn(() => Promise.resolve({})),
  },
  userAPI: {
    getProfile: jest.fn(() => Promise.resolve({ data: {} })),
    updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
    getPreferences: jest.fn(() => Promise.resolve({ data: {} })),
    updatePreferences: jest.fn(() => Promise.resolve({ data: {} })),
  },
  messageAPI: {
    getConversations: jest.fn(() => Promise.resolve({ data: [] })),
    getMessages: jest.fn(() => Promise.resolve({ data: [] })),
    sendMessage: jest.fn(() => Promise.resolve({ data: {} })),
    markAsRead: jest.fn(() => Promise.resolve({})),
  },
  notificationAPI: {
    getNotifications: jest.fn(() => Promise.resolve({ data: [] })),
    markAsRead: jest.fn(() => Promise.resolve({})),
    markAllAsRead: jest.fn(() => Promise.resolve({})),
  },
  analyticsAPI: {
    getDonorStats: jest.fn(() =>
      Promise.resolve({
        data: { totalDonations: 0, mealsServed: 0, co2Saved: 0 },
      })
    ),
    getReceiverStats: jest.fn(() => Promise.resolve({ data: {} })),
  },
  claimsAPI: {
    myClaims: jest.fn(() => Promise.resolve({ data: [] })),
    cancel: jest.fn(() => Promise.resolve({})),
  },
}));

// Mock Firebase
jest.mock('./services/firebase', () => ({
  app: {
    name: '[DEFAULT]',
    options: {
      apiKey: 'AIzaSyCJBJqzAUkzs9Hb_6cbBT5TTaEo4KKUbVc',
      authDomain: 'foodflow-2026.firebaseapp.com',
      projectId: 'foodflow-2026',
      storageBucket: 'foodflow-2026.firebasestorage.app',
      messagingSenderId: '75633139386',
      appId: '1:75633139386:web:3cc7e8ddd208bf52dbec83',
      measurementId: 'G-NNSDLTMQ29',
    },
  },
  analytics: {
    app: { name: '[DEFAULT]' },
  },
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
  firestore: jest.fn(),
  storage: jest.fn(),
}));

// Mock socket service
jest.mock('./services/socket', () => ({
  connectToUserQueue: jest.fn(),
  disconnectWebSocket: jest.fn(),
  getStompClient: jest.fn(() => null),
}));
