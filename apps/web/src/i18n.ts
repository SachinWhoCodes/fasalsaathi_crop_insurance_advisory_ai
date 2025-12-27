import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      reports: 'My Reports',
      insurance: 'Insurance',
      applications: 'My Applications',
        about: 'About',
        settings: 'Settings',
        profile: 'Profile',
        login: 'Login',
        logout: 'Logout',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        welcomeBack: 'Welcome Back',
        loginSubtitle: 'Sign in to continue to FasalSaathi AI',
        email: 'Email',
        password: 'Password',
        enterEmail: 'Enter your email',
        enterPassword: 'Enter your password',
        signingIn: 'Signing in...',
        loginSuccess: 'Login successful!',
        loginError: 'Invalid email or password',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        createAccount: 'Create Account',
        registerSubtitle: 'Join FasalSaathi AI today',
        fullName: 'Full Name',
        enterName: 'Enter your name',
        phone: 'Phone Number',
        enterPhone: 'Enter your phone',
        location: 'Location',
        optional: 'optional',
        detectLocation: 'Detect Location',
        detectingLocation: 'Detecting...',
        creatingAccount: 'Creating account...',
        myProfile: 'My Profile',
        manageAccount: 'Manage your account details',
        edit: 'Edit',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        profileUpdated: 'Profile updated successfully!',
        userId: 'User ID',
        memberSince: 'Member since',
        accountInfo: 'Account Information',
        locationNote: 'Location cannot be changed after registration',
      
      // Home page
      hero_title: 'AI-Powered Crop Insurance Advisory',
      hero_subtitle: 'Get personalized crop risk analysis and insurance recommendations powered by advanced AI',
      cta_onboard: 'Start Onboarding',
      cta_expert: 'Talk to Expert',
      cta_view_reports: 'View Reports',
      
      feature_1_title: 'AI Chat Onboarding',
      feature_1_desc: 'Complete your crop profile through natural conversation',
      feature_2_title: 'Risk Analysis',
      feature_2_desc: 'Get detailed seasonal and stage-wise risk assessments',
      feature_3_title: 'Insurance Matching',
      feature_3_desc: 'Compare schemes and enroll in the best coverage',
      
      // Chat
      chat_placeholder: 'Type your message...',
      chat_send: 'Send',
      discuss_expert: 'Discuss with Expert',
      compare_schemes: 'Compare Schemes',
      view_report: 'View Report',
      
      // Onboarding steps
      step_details: 'Details',
      step_ideals: 'Ideals',
      step_forecast: 'Forecast',
      step_risk: 'Risk',
      step_insurance: 'Insurance',
      step_indexed: 'Indexed',
      step_ready: 'Ready',
      
      // Reports
      no_reports: 'No reports yet',
      create_first: 'Create your first crop report through chat onboarding',
      filter_crop: 'Filter by crop',
      filter_state: 'Filter by state',
      filter_status: 'Filter by status',
      search_reports: 'Search reports...',
      
      // Report detail
      share: 'Share',
      download: 'Download',
      season_risk: 'Season Risk',
      stage_risks: 'Stage-wise Risks',
      what_if: 'What-if Analysis',
      irrigation: 'Irrigation',
      sowing_date: 'Sowing Date',
      
      // Insurance
      insurance_recommendations: 'Insurance Recommendations',
      suggested_schemes: 'Suggested Schemes',
      compare: 'Compare',
      start_enrollment: 'Start Enrollment',
      scheme_name: 'Scheme Name',
      provider: 'Provider',
      premium: 'Premium',
      coverage: 'Coverage',
      subsidy: 'Subsidy',
      
      // Common
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
      submit: 'Submit',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
    }
  },
  hi: {
    translation: {
      // Navigation
      home: 'होम',
      reports: 'मेरी रिपोर्ट',
      insurance: 'बीमा',
      applications: 'मेरे आवेदन',
      about: 'बारे में',
      settings: 'सेटिंग्स',
      profile: 'प्रोफ़ाइल',
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      signIn: 'साइन इन करें',
      signUp: 'साइन अप करें',
      welcomeBack: 'वापस स्वागत है',
      loginSubtitle: 'FasalSaathi AI में जारी रखने के लिए साइन इन करें',
      email: 'ईमेल',
      password: 'पासवर्ड',
      enterEmail: 'अपना ईमेल दर्ज करें',
      enterPassword: 'अपना पासवर्ड दर्ज करें',
      signingIn: 'साइन इन हो रहा है...',
      loginSuccess: 'लॉगिन सफल!',
      loginError: 'अमान्य ईमेल या पासवर्ड',
      noAccount: 'खाता नहीं है?',
      haveAccount: 'पहले से खाता है?',
      createAccount: 'खाता बनाएं',
      registerSubtitle: 'आज FasalSaathi AI में शामिल हों',
      fullName: 'पूरा नाम',
      enterName: 'अपना नाम दर्ज करें',
      phone: 'फोन नंबर',
      enterPhone: 'अपना फोन दर्ज करें',
      location: 'स्थान',
      optional: 'वैकल्पिक',
      detectLocation: 'स्थान का पता लगाएं',
      detectingLocation: 'पता लगा रहे हैं...',
      creatingAccount: 'खाता बनाया जा रहा है...',
      myProfile: 'मेरी प्रोफ़ाइल',
      manageAccount: 'अपने खाते का विवरण प्रबंधित करें',
      edit: 'संपादित करें',
      saveChanges: 'परिवर्तन सहेजें',
      cancel: 'रद्द करें',
      profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!',
      userId: 'उपयोगकर्ता आईडी',
      memberSince: 'से सदस्य',
      accountInfo: 'खाता जानकारी',
      locationNote: 'पंजीकरण के बाद स्थान बदला नहीं जा सकता',
      
      // Home page
      hero_title: 'एआई-संचालित फसल बीमा सलाहकार',
      hero_subtitle: 'उन्नत एआई द्वारा संचालित व्यक्तिगत फसल जोखिम विश्लेषण और बीमा सिफारिशें प्राप्त करें',
      cta_onboard: 'ऑनबोर्डिंग शुरू करें',
      cta_expert: 'विशेषज्ञ से बात करें',
      cta_view_reports: 'रिपोर्ट देखें',
      
      feature_1_title: 'एआई चैट ऑनबोर्डिंग',
      feature_1_desc: 'प्राकृतिक बातचीत के माध्यम से अपनी फसल प्रोफ़ाइल पूरी करें',
      feature_2_title: 'जोखिम विश्लेषण',
      feature_2_desc: 'विस्तृत मौसमी और चरण-वार जोखिम मूल्यांकन प्राप्त करें',
      feature_3_title: 'बीमा मिलान',
      feature_3_desc: 'योजनाओं की तुलना करें और सर्वोत्तम कवरेज में नामांकन करें',
      
      // Chat
      chat_placeholder: 'अपना संदेश टाइप करें...',
      chat_send: 'भेजें',
      discuss_expert: 'विशेषज्ञ से चर्चा करें',
      compare_schemes: 'योजनाओं की तुलना करें',
      view_report: 'रिपोर्ट देखें',
      
      // Onboarding steps
      step_details: 'विवरण',
      step_ideals: 'आदर्श',
      step_forecast: 'पूर्वानुमान',
      step_risk: 'जोखिम',
      step_insurance: 'बीमा',
      step_indexed: 'अनुक्रमित',
      step_ready: 'तैयार',
      
      // Reports
      no_reports: 'अभी तक कोई रिपोर्ट नहीं',
      create_first: 'चैट ऑनबोर्डिंग के माध्यम से अपनी पहली फसल रिपोर्ट बनाएं',
      filter_crop: 'फसल द्वारा फ़िल्टर करें',
      filter_state: 'राज्य द्वारा फ़िल्टर करें',
      filter_status: 'स्थिति द्वारा फ़िल्टर करें',
      search_reports: 'रिपोर्ट खोजें...',
      
      // Report detail
      share: 'साझा करें',
      download: 'डाउनलोड करें',
      season_risk: 'मौसम जोखिम',
      stage_risks: 'चरण-वार जोखिम',
      what_if: 'क्या-होगा विश्लेषण',
      irrigation: 'सिंचाई',
      sowing_date: 'बुवाई की तारीख',
      
      // Insurance
      insurance_recommendations: 'बीमा सिफारिशें',
      suggested_schemes: 'सुझाई गई योजनाएं',
      compare: 'तुलना करें',
      start_enrollment: 'नामांकन शुरू करें',
      scheme_name: 'योजना का नाम',
      provider: 'प्रदाता',
      premium: 'प्रीमियम',
      coverage: 'कवरेज',
      subsidy: 'सब्सिडी',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'कुछ गलत हो गया',
      retry: 'पुनः प्रयास करें',
      submit: 'जमा करें',
      next: 'अगला',
      previous: 'पिछला',
      close: 'बंद करें',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
