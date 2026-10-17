import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SectionHeading from '../../components/common/SectionHeading';
import { ShieldCheck, Mail, MapPin, FileText, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function StaticInfoPage() {
  const { pathname } = useLocation();
  const { t, language } = useLanguage();

  const pageConfig = {
    '/about': {
      titleHindi: 'हमारे बारे में (About Us)',
      titleEnglish: 'About Azaad Samachar',
      desc: 'आज़ाद समाचार भारत का अग्रणी स्वतंत्र और निष्पक्ष डिजिटल ब्रॉडशीट समाचार पत्र है।',
      content: `आज़ाद समाचार (Azaad Samachar) की स्थापना सत्य, निर्भीकता और निष्पक्षता के उच्च नैतिक पत्रकारिता मूल्यों के साथ की गई है। 

हमारा उद्देश्य देश और राज्यों के हर कोने की ज़मीनी हकीकत, प्रशासनिक फैसले, आर्थिक विश्लेषण और जनसरोकार की आवाज़ को बिना किसी दबाव या पक्षपात के जनता तक पहुंचाना है।

आज़ाद समाचार प्रेस काउंसिल ऑफ इंडिया (PCI) की आचार संहिता के तहत संचालित होता है और डिजिटल पत्रकारिता के सभी विधिक व संपादकीय मानकों का अक्षरशः पालन करता है।`,
    },
    '/contact': {
      titleHindi: 'संपर्क सूत्र (Contact Us)',
      titleEnglish: 'Contact Editorial Desk',
      desc: 'संपादकीय विभाग, समाचार विज्ञप्ति या सुझावों के लिए हमसे संपर्क करें।',
      content: `मुख्यालय पता:
प्रेस एन्क्लेव, बहादुर शाह जफर मार्ग, आईटीओ, नई दिल्ली - 110002

संपादकीय डेस्क ईमेल: editor@azaadsamachar.com
प्रेस रिलीज एवं विज्ञप्ति: press@azaadsamachar.com
फोन नंबर: +91 11 2345 6789 / +91 11 2345 6790

प्रादेशिक केंद्र:
हजरतगंज, लखनऊ, उत्तर प्रदेश - 226001`,
    },
    '/advertise': {
      titleHindi: 'विज्ञापन दरें (Advertise With Us)',
      titleEnglish: 'Advertising & Commercial Solutions',
      desc: 'डिजिटल बैनर, प्रायोजित आलेख और वीडियो विज्ञापनों की आधिकारिक दरें व संपर्क।',
      content: `आज़ाद समाचार डिजिटल नेटवर्क प्रतिमाह 1.5 करोड़ से अधिक जागरूक पाठकों और नीति-निर्माताओं तक पहुंच प्रदान करता है।

हमारे विज्ञापन प्रारूपों में डिस्प्ले ब्रॉडशीट बैनर, नेटिव प्रायोजित विश्लेषण, न्यूज़लेटर स्पॉन्सरशिप और वीडियो बुलेटिन इन-स्ट्रीम विज्ञापन शामिल हैं।

वाणिज्यिक पूछताछ हेतु संपर्क: ads@azaadsamachar.com`,
    },
    '/editorial-policy': {
      titleHindi: 'संपादकीय नीति (Editorial Policy)',
      titleEnglish: 'Journalistic Code & Ethics',
      desc: 'सत्यता, स्वतंत्रता और निष्पक्षता के प्रति हमारी संस्थागत प्रतिबद्धता।',
      content: `1. निष्पक्षता एवं स्वतंत्रता: हम किसी भी राजनीतिक दल, औद्योगिक घराने या दबाव समूह के प्रभाव से पूर्णतः मुक्त पत्रकारिता करते हैं।
2. दोहरे स्रोतों का सत्यापन: किसी भी संवेदनशील समाचार को प्रकाशित करने से पूर्व कम से कम दो स्वतंत्र आधिकारिक स्रोतों से पुष्टि अनिवार्य है।
3. त्रुटि सुधार नीति: यदि किसी रिपोर्ट में अनजाने में तथ्यात्मक त्रुटि होती है, तो उसे त्वरित रूप से पारदर्शी शुद्धिपत्र (Corrigendum) के साथ सुधारा जाता है।`,
    },
    '/privacy-policy': {
      titleHindi: 'गोपनीयता नीति (Privacy Policy)',
      titleEnglish: 'Reader Data & Privacy Standards',
      desc: 'पाठकों के डेटा की सुरक्षा और गोपनीयता से संबंधित हमारे नियम।',
      content: `हम अपने पाठकों की गोपनीयता का पूर्ण सम्मान करते हैं। हम किसी भी तृतीय पक्ष को आपकी व्यक्तिगत जानकारी विक्रय नहीं करते हैं। हमारी वेबसाइट पर उपयोग किए जाने वाले कुकीज़ केवल उपयोगकर्ता अनुभव को बेहतर बनाने और भाषा/थीम प्राथमिकताओं को याद रखने के लिए उपयोग किए जाते हैं।`,
    },
    '/terms-and-conditions': {
      titleHindi: 'नियम एवं शर्तें (Terms and Conditions)',
      titleEnglish: 'Terms of Service',
      desc: 'आज़ाद समाचार डिजिटल पोर्टल का उपयोग करने संबंधी विधिक नियम।',
      content: `आज़ाद समाचार पोर्टल पर प्रकाशित समस्त आलेख, छायाचित्र, वीडियो और संपादकीय सामग्री कॉपीराइट कानून के तहत संरक्षित हैं। किसी भी सामग्री का अनधिकृत पुनर्प्रकाशन या व्यावसायिक उपयोग कॉपीराइट अधिनियम के तहत वर्जित है। उचित संदर्भ और श्रेय के साथ अंश साझा किए जा सकते हैं।`,
    },
    '/fact-check-policy': {
      titleHindi: 'सत्यता जांच नीति (Fact-Checking Policy)',
      titleEnglish: 'Misinformation & Verification Protocol',
      desc: 'भ्रामक सूचनाओं और फर्जी खबरों के विरुद्ध हमारा कठोर सत्यापन तंत्र।',
      content: `आज़ाद समाचार का समर्पित 'सत्यमेव' फैक्ट-चेक सेल सोशल मीडिया पर प्रसारित होने वाले दावों, फर्जी वीडियो और भ्रामक बयानों की फोरेंसिक व दस्तावेजी जांच करता है। हमारे फैक्ट-चेकर प्राथमिक साक्ष्यों और अधिकृत डेटाबेसों के आधार पर सत्यता की पुष्टि करते हैं।`,
    },
    '/grievance': {
      titleHindi: 'शिकायत निवारण (Grievance Redressal)',
      titleEnglish: 'Grievance Officer Information',
      desc: 'डिजिटल मीडिया आचार संहिता 2021 के तहत नामित शिकायत निवारण अधिकारी।',
      content: `सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम 2021 के अनुपालन में:

शिकायत निवारण अधिकारी:
श्री राजीव नयन शर्मा
ईमेल: grievance@azaadsamachar.com
पता: लीगल विंग, आज़ाद समाचार, प्रेस एन्क्लेव, आईटीओ, नई दिल्ली - 110002
समय सीमा: शिकायत प्राप्ति के 24 घंटे में पावती और 15 दिनों में निवारण।`,
    },
  };

  const current = pageConfig[pathname] || {
    titleHindi: 'संपादकीय सूचना',
    titleEnglish: 'Editorial Notice',
    desc: 'आज़ाद समाचार आधिकारिक सूचना पृष्ठ',
    content: 'सामग्री जल्द ही अपडेट की जाएगी।',
  };

  return (
    <Container className="py-4 sm:py-6 px-3 sm:px-6">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-inter text-xs font-bold text-secondary hover:text-primary-container"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>मुख्य पृष्ठ पर वापस जाएं</span>
        </Link>
      </div>

      <div className="bg-paper-canvas p-6 sm:p-8 md:p-10 border border-border-rule max-w-4xl mx-auto space-y-6">
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
          <span>आधिकारिक संपादकीय संपादन • नई दिल्ली</span>
          <span className="font-mono text-[11px]">अद्यतन: 2025</span>
        </div>
      </div>
    </Container>
  );
}
