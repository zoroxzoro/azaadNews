import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SEO from '../../components/common/SEO.jsx';
import { ChevronLeft, FileText, Mail, MapPin, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function StaticInfoPage() {
  const { pathname } = useLocation();
  const { t, language } = useLanguage();

  const pageConfig = {
    '/about': {
      titleHindi: 'हमारे बारे में (About Us)',
      titleEnglish: 'About Azad Samachar India',
      desc: 'Azad Samachar India (आज़ाद समाचार इंडिया) — ताज़ा, निष्पक्ष और सटीक समाचार का डिजिटल मंच।',
      content: `Azad Samachar India (आज़ाद समाचार इंडिया) न्यूज़ लेखक और ब्लॉगर द्वारा बनाया गया है। आज़ाद समाचार इंडिया का मुख्य उद्देश्य है ताज़ा जानकारी को सबसे तेज और सबसे पहले रीडर तक पहुँचाना। इस न्यूज़ ब्लॉग को बनाने के लिए कई सारे एक्सपर्ट लेखक दिन रात अथक प्रयास में रहते है।

आज़ाद समाचार इंडिया का मुख्य उद्देश्य, वेब और मोबाइल पर ऑनलाइन समाचार देखने वाले दर्शकों का एक वफादार आधार बनना है। हम राष्ट्रीय, अंतरराष्ट्रीय, उपयोगकर्ता रुचि जानकारी, विशेष समाचार, ज्योतिष समाचार, व्यापार समाचार, खेल समाचार, जीवन शैली समाचार इत्यादि को कवर करने वाले तेज़ और सटीक समाचार प्रदान करने के लिए प्रतिबद्ध हैं।

आज़ाद समाचार इंडिया की कहानी
इस वेबसाइट की योजना के समय ही सभी मालिकों और लेखकों को सभी हद तक तय था की इस न्यूज़ वेबसाइट को क्यों बनाया गया है। सोशल मीडिया के समाचार और टेक्नोलॉजी, उपयोगकर्ता की संतुष्टि हमारी प्राथमिकता है, यही एकमात्र कारण था कि इस दिमागी बच्चे को आकार लेने में लगभग एक वर्ष छह माह का समय लग गया।

आज़ाद समाचार इंडिया का उद्देश्य उपयोगकर्ताओं को ऐसी जानकारी प्रदान करना है जो उन्हें दैनिक जीवन में मदद करती है, साथ ही ऐसी सामग्री जो मनोरंजन प्रदान करती है और पढ़ने की इच्छा को संतुष्ट करती है।

इस वेबसाइट पर आपको हर प्रकार की जानकारी मिलेगी–
• Entertainment News
• TV Shows
• Tech News
• Web-Stories
• Finance
• Gaming
• Cryptocurrency
• Auto Mobile
and more

आज़ाद समाचार इंडिया की टीम
स्वतंत्र शुक्ला azadsamacharindia.com के Founder और Content Strategy Head है। इन्होने Blogging Career की शुरुआत 2023 में किया।

Copyright Notice:
If you have any copyright issues with our news, photos, or videos, please send an email to objection@azadsamacharindia.com for prompt resolution.

सहायता एवं संपर्क (Help & Support):
help@azadsamacharindia.com`,
    },
    '/contact': {
      titleHindi: 'संपर्क सूत्र (Contact Us)',
      titleEnglish: 'Contact Editorial Desk',
      desc: 'संपादकीय विभाग, समाचार विज्ञप्ति या सुझावों के लिए हमसे संपर्क करें।',
      content: `आज़ाद समाचार संपादकीय डेस्क से संपर्क विवरण:

आधिकारिक कार्यालय पता:
कानपुर, उत्तर प्रदेश, भारत

सहायता एवं सामान्य संपर्क (Help & Inquiries):
help@azadsamacharindia.com

कॉपीराइट एवं आपत्ति निवारण (Copyright & Grievances):
objection@azadsamacharindia.com

संपादकीय डेस्क:
help@azadsamacharindia.com

कार्यालय समय:
सोमवार से शनिवार: प्रातः 10:00 बजे से सायं 7:00 बजे तक (IST)`,
    },
    '/advertise': {
      titleHindi: 'विज्ञापन दरें (Advertise With Us)',
      titleEnglish: 'Advertising & Commercial Solutions',
      desc: 'डिजिटल बैनर, प्रायोजित आलेख और वीडियो विज्ञापनों की आधिकारिक दरें व संपर्क।',
      content: `आज़ाद समाचार डिजिटल नेटवर्क प्रतिमाह लाखों जागरूक पाठकों और नीति-निर्माताओं तक निष्पक्ष समाचार पहुंचाता है।

विज्ञापन समाधान:
• डिस्प्ले ब्रॉडशीट बैनर (Desktop & Mobile)
• संपादकीय प्रायोजित आलेख (Sponsored Editorial Features)
• दैनिक डिजिटल न्यूज़लेटर स्पॉन्सरशिप
• वीडियो बुलेटिन इन-स्ट्रीम प्रमोशन्स

वाणिज्यिक पूछताछ एवं विज्ञापन दरों हेतु संपर्क:
ads@azaadsamacharindia.com
(या [आधिकारिक विज्ञापन विभाग फोन: +91-XXXXXXXXXX])`,
    },
    '/editorial-policy': {
      titleHindi: 'संपादकीय नीति (Editorial Policy)',
      titleEnglish: 'Journalistic Code & Ethics',
      desc: 'सत्यता, स्वतंत्रता और निष्पक्षता के प्रति हमारी संस्थागत प्रतिबद्धता।',
      content: `1. निष्पक्षता एवं स्वतंत्रता: हम किसी भी राजनीतिक दल, औद्योगिक घराने या दबाव समूह के प्रभाव से पूर्णतः मुक्त पत्रकारिता करते हैं।
2. दोहरे स्रोतों का सत्यापन: किसी भी संवेदनशील समाचार को प्रकाशित करने से पूर्व कम से कम दो स्वतंत्र आधिकारिक स्रोतों से पुष्टि अनिवार्य है।
3. सत्य एवं संतुलन: विवादित मामलों में सभी पक्षों का दृष्टिकोण न्यायसंगत स्थान के साथ प्रस्तुत किया जाता है।
4. हितों का टकराव: हमारे संवाददाताओं व संपादकों के लिए व्यावसायिक या व्यक्तिगत हितों के टकराव की स्पष्ट घोषणा अनिवार्य है।`,
    },
    '/corrections-policy': {
      titleHindi: 'त्रुटि सुधार एवं शुद्धिपत्र नीति (Corrections Policy)',
      titleEnglish: 'Corrections & Clarifications Policy',
      desc: 'तथ्यात्मक सत्यता, त्वरित सुधार और पारदर्शी शुद्धिपत्र के प्रति हमारी प्रतिज्ञा।',
      content: `आज़ाद समाचार तथ्यों की शुद्धता को सर्वोच्च प्राथमिकता देता है। यदि किसी प्रकाशित समाचार में अनजाने में कोई तथ्यात्मक त्रुटि होती है, तो उसे छिपाने के बजाय पूरी पारदर्शिता से सुधारा जाता है।

सुधार प्रक्रिया:
1. त्रुटि संज्ञान: पाठक, संबंधित पक्ष या संपादकीय टीम द्वारा त्रुटि संज्ञान में लाए जाने पर तुरंत सत्यापन किया जाता है।
2. शुद्धिपत्र (Corrigendum): लेख के शीर्ष या पाद-टिप्पणी में स्पष्ट रूप से बताया जाता है कि क्या संशोधन किया गया है और किस समय किया गया।
3. बड़ा सुधार: यदि लेख के मूल निष्कर्ष या शीर्षक में बड़ा संशोधन हो, तो स्पष्ट 'संपादकीय शुद्धिपत्र' प्रकाशित किया जाता है।

त्रुटि सुधार सूचना हेतु संपर्क:
corrections@azaadsamacharindia.com
(विषय में लेख का लिंक एवं तथ्यात्मक साक्ष्य अवश्य संलग्न करें)`,
    },
    '/privacy-policy': {
      titleHindi: 'गोपनीयता नीति (Privacy Policy)',
      titleEnglish: 'Reader Data & Privacy Standards',
      desc: 'पाठकों के डेटा की सुरक्षा और गोपनीयता से संबंधित हमारे नियम।',
      content: `हम अपने पाठकों की गोपनीयता का पूर्ण सम्मान करते हैं। हम किसी भी तृतीय पक्ष को आपकी व्यक्तिगत जानकारी विक्रय नहीं करते हैं।

• कुकीज़ का उपयोग: हमारी वेबसाइट पर कुकीज़ केवल उपयोगकर्ता अनुभव को बेहतर बनाने, भाषा/थीम प्राथमिकताओं को सहेजने और बुनियादी विश्लेषण के लिए उपयोग की जाती हैं।
• व्यक्तिगत डेटा सुरक्षा: न्यूज़लेटर या संपर्क फॉर्म के माध्यम से स्वेच्छा से दी गई जानकारी सुरक्षित सर्वर पर संरक्षित रहती है।
• अधिकार: पाठक किसी भी समय अपनी डेटा प्राथमिकताओं को संशोधित या हटाने का अनुरोध कर सकते हैं।`,
    },
    '/terms-and-conditions': {
      titleHindi: 'नियम एवं शर्तें (Terms and Conditions)',
      titleEnglish: 'Terms of Service',
      desc: 'आज़ाद समाचार डिजिटल पोर्टल का उपयोग करने संबंधी विधिक नियम।',
      content: `आज़ाद समाचार पोर्टल पर प्रकाशित समस्त आलेख, छायाचित्र, वीडियो और संपादकीय सामग्री कॉपीराइट कानून के तहत संरक्षित हैं।

• अनधिकृत पुनर्प्रकाशन वर्जित: किसी भी सामग्री का अनधिकृत व्यावसायिक उपयोग कॉपीराइट अधिनियम के तहत प्रतिबंधित है।
• उचित संदर्भ (Fair Use): उचित संदर्भ, श्रेय और हाइपरलिंक के साथ अंश साझा किए जा सकते हैं।
• उपयोगकर्ता टिप्पणियां: पाठक अपनी टिप्पणियों की विधिक जिम्मेदारी स्वयं वहन करते हैं; अभद्र या गैरकानूनी टिप्पणियों को बिना पूर्व सूचना के हटाने का अधिकार सुरक्षित है।`,
    },
    '/fact-check-policy': {
      titleHindi: 'सत्यता जांच नीति (Fact-Checking Policy)',
      titleEnglish: 'Misinformation & Verification Protocol',
      desc: 'भ्रामक सूचनाओं और फर्जी खबरों के विरुद्ध हमारा कठोर सत्यापन तंत्र।',
      content: `आज़ाद समाचार का समर्पित 'सत्यमेव' फैक्ट-चेक सेल सोशल मीडिया पर प्रसारित होने वाले दावों, फर्जी वीडियो और भ्रामक बयानों की फोरेंसिक व दस्तावेजी जांच करता है।

जांच के मानक:
• प्राथमिक स्रोत सत्यापन: सरकारी राजपत्र, आधिकारिक प्रेस विज्ञप्ति, अदालती आदेश या प्रत्यक्ष साक्ष्य।
• रिवर्स इमेज व वीडियो फोरेंसिक्स: दृश्य सामग्री की समय-सीमा और संदर्भ की तकनीकी पुष्टि।
• निष्कर्ष वर्गीकरण: सत्य / भ्रामक / असत्य / संदर्भहीन।`,
    },
    '/grievance': {
      titleHindi: 'शिकायत निवारण (Grievance Redressal)',
      titleEnglish: 'Grievance Officer Information',
      desc: 'डिजिटल मीडिया आचार संहिता 2021 के तहत नामित शिकायत निवारण अधिकारी।',
      content: `सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम 2021 के अनुपालन में:

नामित शिकायत निवारण अधिकारी:
[नामित शिकायत निवारण अधिकारी का नाम / Designated Grievance Officer Name]
विधिक एवं अनुपालन प्रकोष्ठ (Legal & Compliance Cell)

ईमेल:
grievance@azaadsamacharindia.com

पता:
[विधिक प्रकोष्ठ, आज़ाद समाचार कार्यालय पता / To be configured by Publisher]

शिकायत निवारण समय सीमा:
• शिकायत प्राप्ति की पावती: 24 घंटे के भीतर
• विधिसम्मत जांच एवं अंतिम निवारण: 15 कार्यदिवसों के भीतर`,
    },
  };

  const current = pageConfig[pathname] || {
    titleHindi: 'संपादकीय सूचना',
    titleEnglish: 'Editorial Notice',
    desc: 'आज़ाद समाचार आधिकारिक सूचना पृष्ठ',
    content: 'सामग्री जल्द ही अपडेट की जाएगी।',
  };

  const currentPath = pathname.replace(/^\//, '');

  return (
    <div className="bg-paper-canvas min-h-screen py-4 sm:py-6">
      <SEO
        title={`${current.titleHindi}`}
        description={current.desc}
        path={currentPath}
      />
      <Container className="px-3 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 font-inter text-xs font-bold text-secondary hover:text-primary-container transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>मुख्य पृष्ठ पर वापस जाएं</span>
          </Link>
        </div>

        {/* Article Broadsheet Container */}
        <div className="bg-paper-canvas p-6 sm:p-8 md:p-10 border border-border-rule max-w-4xl mx-auto space-y-6 shadow-xs">
          <div className="border-b-2 border-primary-container pb-4">
            <span className="font-inter text-xs uppercase font-bold text-secondary tracking-widest block mb-1">
              {current.titleEnglish}
            </span>
            <h1 className="font-mukta text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface">
              {current.titleHindi}
            </h1>
            <p className="font-inter text-xs sm:text-sm text-secondary mt-1">
              {current.desc}
            </p>
          </div>

          <div className="font-inter text-sm sm:text-base text-on-surface leading-relaxed whitespace-pre-line space-y-4">
            {current.content}
          </div>

          <div className="pt-6 border-t border-border-rule flex items-center justify-between text-xs text-secondary font-inter">
            <span>आज़ाद समाचार • डिजिटल ब्रॉडशीट संपादकीय प्रभाग</span>
            <span className="font-mono text-[11px]">अद्यतन: {new Date().getFullYear()}</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
