import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  hi: {
    // Top Bar
    city_edition: 'नई दिल्ली',
    samvat: 'संवत् 2081',
    market: 'बाजार',
    nifty: 'निफ्टी',
    sensex: 'सेंसेक्स',
    epaper: 'ई-पेपर',
    about_us: 'हमारे बारे में',
    contact_us: 'संपर्क',
    admin_cms: 'संपादकीय CMS',

    // Header & Tagline
    tagline: 'निष्पक्ष • निर्भीक • सटीक | भारत की स्वतंत्र राष्ट्रीय आवाज़',
    search_placeholder: 'खबरें, शहर या विषय खोजें...',
    search_btn: 'खोजें',
    all_categories: 'सभी श्रेणियां',
    trending_topics: 'ट्रेंडिंग टॉपिक्स',
    live_tv: 'लाइव टीवी',
    video_bulletin: 'वीडियो बुलेटिन',

    // Navigation
    home: 'होम',
    latest: 'ताज़ा खबरें',
    national: 'राष्ट्रीय',
    politics: 'राजनीति',
    uttar_pradesh: 'उत्तर प्रदेश',
    world: 'दुनिया',
    business: 'बिज़नेस',
    sports: 'खेल',
    entertainment: 'मनोरंजन',
    technology: 'टेक्नोलॉजी',
    education: 'शिक्षा',
    jobs: 'नौकरी',
    lifestyle: 'लाइफस्टाइल',
    spirituality: 'धर्म/अध्यात्म',
    more_categories: 'अन्य श्रेणियां +',
    weather_lucknow: 'लखनऊ 31°C',
    live_badge: 'लाइव',

    // Breaking ticker
    breaking_news: 'ब्रेकिंग न्यूज़',
    live_desk: 'लाइव डेस्क',
    quick_alert: 'त्वरित सूचना',

    // Footer
    brand_desc: 'निष्पक्ष, निर्भीक और सटीक पत्रकारिता के संकल्प के साथ भारत का अग्रणी डिजिटल एवं राष्ट्रीय ब्रॉडशीट संस्थान। देश के हर कोने की सच्चाई आप तक पहुंचाना हमारा ध्येय है।',
    slogan: 'सच्ची खबर पक्की खबर',
    rni_reg: 'RNI पंजीकरण संख्या: UPHIN/2012/48902',
    headquarters: 'मुख्यालय',
    hq_address: 'प्रेस एन्क्लेव, आईटीओ, नई दिल्ली - 110002',
    regional_center: 'प्रादेशिक केंद्र',
    regional_address: 'हजरतगंज, लखनऊ, उत्तर प्रदेश - 226001',
    key_categories: 'प्रमुख श्रेणियां',
    special_services: 'विशेष सेवाएं',
    company_policies: 'कंपनी एवं नीतियां',
    advertise_with_us: 'विज्ञापन दरें',
    editorial_policy: 'संपादकीय नीति',
    privacy_policy: 'गोपनीयता नीति',
    terms_conditions: 'नियम एवं शर्तें',
    fact_check_policy: 'फैक्ट चेक नीति',
    grievance_redressal: 'शिकायत निवारण',
    newsletter_title: "सुबह 7 बजे का 'आज़ाद प्रभात' बुलेटिन",
    newsletter_desc: 'हर सुबह आपके इनबॉक्स में दिन की 10 सबसे महत्वपूर्ण खबरें, निष्पक्ष विश्लेषण और बाज़ार का सटीक रुख।',
    subscribe_btn: 'सदस्य बनें',
    email_placeholder: 'अपना ईमेल दर्ज करें',
    copyright_text: 'Azaad Samachar Media Ltd. सर्वाधिकार सुरक्षित। प्रेस काउंसिल ऑफ इंडिया के पत्रकारिता आचार संहिता के तहत संचालित।',
    verified_portal: 'सत्यापित स्वतंत्र समाचार पोर्टल',

    // Mobile Navigation
    menu: 'मेनू',
    close: 'बंद करें',
    follow_us: 'सोशल मीडिया पर फॉलो करें',
  },
  en: {
    // Top Bar
    city_edition: 'New Delhi',
    samvat: 'Samvat 2081',
    market: 'Markets',
    nifty: 'Nifty',
    sensex: 'Sensex',
    epaper: 'E-Paper',
    about_us: 'About Us',
    contact_us: 'Contact',
    admin_cms: 'Editorial CMS',

    // Header & Tagline
    tagline: 'Impartial • Fearless • Accurate | The Independent Voice of India',
    search_placeholder: 'Search news, topics, cities...',
    search_btn: 'Search',
    all_categories: 'All Categories',
    trending_topics: 'Trending Topics',
    live_tv: 'Live TV',
    video_bulletin: 'Video Bulletin',

    // Navigation
    home: 'Home',
    latest: 'Latest News',
    national: 'National',
    politics: 'Politics',
    uttar_pradesh: 'Uttar Pradesh',
    world: 'World',
    business: 'Business',
    sports: 'Sports',
    entertainment: 'Entertainment',
    technology: 'Technology',
    education: 'Education',
    jobs: 'Jobs',
    lifestyle: 'Lifestyle',
    spirituality: 'Spirituality',
    more_categories: 'More Categories +',
    weather_lucknow: 'Lucknow 31°C',
    live_badge: 'LIVE',

    // Breaking ticker
    breaking_news: 'BREAKING NEWS',
    live_desk: 'Live Desk',
    quick_alert: 'Quick Flash',

    // Footer
    brand_desc: 'India’s leading digital broadsheet news publication committed to fearless, truthful, and impartial journalism. Delivering factual reporting from every corner of the nation.',
    slogan: 'Truthful News, Verified News',
    rni_reg: 'RNI Registration: UPHIN/2012/48902',
    headquarters: 'Headquarters',
    hq_address: 'Press Enclave, ITO, New Delhi - 110002',
    regional_center: 'Regional Bureau',
    regional_address: 'Hazratganj, Lucknow, Uttar Pradesh - 226001',
    key_categories: 'Key Categories',
    special_services: 'Special Services',
    company_policies: 'Company & Policies',
    advertise_with_us: 'Advertise With Us',
    editorial_policy: 'Editorial Policy',
    privacy_policy: 'Privacy Policy',
    terms_conditions: 'Terms & Conditions',
    fact_check_policy: 'Fact-Check Policy',
    grievance_redressal: 'Grievance Redressal',
    newsletter_title: "Morning 7 AM 'Azaad Prabhat' Digest",
    newsletter_desc: 'Receive the top 10 verified stories, sharp analytical perspectives, and market movements directly in your inbox.',
    subscribe_btn: 'Subscribe',
    email_placeholder: 'Enter your email address',
    copyright_text: 'Azaad Samachar Media Ltd. All rights reserved. Operating under the Press Council of India Code of Ethics.',
    verified_portal: 'Verified Independent News Portal',

    // Mobile Navigation
    menu: 'Menu',
    close: 'Close',
    follow_us: 'Follow on Social Media',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('azaad_lang') || 'hi';
  });

  useEffect(() => {
    localStorage.setItem('azaad_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    if (lang === 'hi' || lang === 'en') {
      setLanguageState(lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['hi']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
