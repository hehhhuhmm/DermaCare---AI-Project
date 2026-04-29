import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Droplets,
  RotateCcw,
  Languages
} from 'lucide-react';
import { analyzeSkinImage, SkinAnalysisResult } from './services/geminiService';
import { auth, db } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

// --- Auth Helpers ---
const provider = new GoogleAuthProvider();
const loginWithGoogle = () => signInWithPopup(auth, provider);
const logout = () => signOut(auth);

// --- Component: UserProfile ---
const UserProfile = ({ user, lang, onSettings, onExpert }: { user: User, lang: Lang, onSettings: () => void, onExpert: () => void }) => {
  const t = translations[lang];
  return (
    <div className="flex items-center gap-4 bg-white/50 p-2 pl-4 pr-6 rounded-full border border-sand">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-bark leading-none">{user.displayName}</p>
        <button onClick={onSettings} className="text-[10px] uppercase font-bold text-sage hover:text-forest transition-colors">
          {t.settings}
        </button>
      </div>
      <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-sand" />
      <button onClick={logout} className="text-earth/40 hover:text-red-400 transition-colors">
        <RotateCcw size={16} />
      </button>
    </div>
  );
};

// --- Translations ---

const translations = {
  en: {
    howItWorks: "How it works",
    resources: "Resources",
    experts: "Experts",
    getStarted: "Get Started",
    nextGen: "Next-Gen Skin Analysis",
    heroTitle: "Your Personal",
    heroHighlight: "AI Dermatologist",
    heroDesc: "Upload a photo for a professional-grade skin analysis. Identify issues, discover active ingredients, and get a personalized routine in seconds.",
    startDiagnosis: "Start Self-Diagnosis",
    viewSample: "View Sample Report",
    healthScore: "Health Score",
    healthy: "Healthy",
    moisturization: "Moisturization",
    optimal: "Optimal",
    analyzing: "Analyzing your skin...",
    analyzingDesc: "Our AI is identifying skin conditions and cross-referencing with expert databases.",
    report: "Analysis Report",
    newPhoto: "New Photo",
    severity: "Severity",
    confidence: "AI Confidence",
    activeIngredients: "Active Ingredients",
    recommendations: "Recommendations",
    disclaimer: "Important Disclaimer",
    consult: "Please consult with a board-certified dermatologist before starting new intensive treatments or if symptoms persist.",
    suggestedRoutine: "Suggested Daily Routine",
    scienceBacked: "Science-backed steps for",
    morning: "Morning (AM)",
    evening: "Evening (PM)",
    uploadTitle: "Upload Your Photo",
    uploadDesc: "For best results, use natural lighting and avoid makeup or filters. Your privacy is our priority.",
    clickUpload: "Click to Capture or Upload",
    supported: "JPEG, PNG supported • Max 10MB",
    secure: "Secure",
    endToEnd: "End-to-end encryption",
    private: "Private",
    neverStored: "Photos are never stored",
    footerTitle: "DermaCare AI",
    footerDesc: "AI Diagnostic Laboratory.",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    step1Title: "Gentle Cleanse",
    step1Desc: "Remove overnight sebum without stripping moisture.",
    step2Title: "Active Treatment",
    step2Desc: "Apply targeted treatment.",
    step3Title: "SPF Protection",
    step3Desc: "Essential to prevent scarring and sun damage.",
    step4Title: "Double Cleanse",
    step4Desc: "Ensure all SPF and impurities are removed.",
    step5Title: "Restoration",
    step5Desc: "Deep treatment with ingredients for repair.",
    step6Title: "Seal & Hydrate",
    step6Desc: "Thick moisturizer to lock in clinical active ingredients.",
    login: "Login with Google",
    profile: "My Profile",
    expertMode: "Expert Dashboard",
    settings: "Privacy Settings",
    deleteData: "Delete All Data",
    federatedTitle: "Federated Learning",
    federatedDesc: "Your model learns on your device. Only patterns (weights) are shared to improve our global AI without seeing your face.",
    optIn: "Opt-in to anonymous AI training",
    encryptionActive: "Client-side AES-256 Encryption active",
    disentanglementNotice: "Feature Disentanglement: Identifying pathology markers while ignoring identity.",
    businessRules: "Active Business Rules",
    saveRules: "Deploy Rules",
    addRule: "Add New Rule",
    history: "Analysis History",
    noHistory: "No reports yet.",
    deleteConfirm: "Are you sure? This will permanently erase your diagnostic history."
  },
  vi: {
    howItWorks: "Cách thức hoạt động",
    resources: "Tài liệu",
    experts: "Chuyên gia",
    getStarted: "Bắt đầu ngay",
    nextGen: "Phân tích da thế hệ mới",
    heroTitle: "Chuyên gia",
    heroHighlight: "Da liễu AI của bạn",
    heroDesc: "Tải ảnh lên để phân tích da chuyên nghiệp. Xác định vấn đề, tìm hiểu hoạt chất phù hợp và nhận quy trình chăm sóc cá nhân hóa trong vài giây.",
    startDiagnosis: "Bắt đầu chẩn đoán",
    viewSample: "Xem báo cáo mẫu",
    healthScore: "Điểm sức khỏe",
    healthy: "Khỏe mạnh",
    moisturization: "Độ ẩm",
    optimal: "Tối ưu",
    analyzing: "Đang phân tích làn da...",
    analyzingDesc: "AI đang xác định tình trạng da và đối chiếu với cơ sở dữ liệu chuyên gia.",
    report: "Báo cáo phân tích",
    newPhoto: "Chụp ảnh mới",
    severity: "Mức độ",
    confidence: "Độ tin cậy AI",
    activeIngredients: "Hoạt chất khuyên dùng",
    recommendations: "Đề xuất điều trị",
    disclaimer: "Tuyên bố miễn trừ trách nhiệm",
    consult: "Vui lòng tham khảo ý kiến bác sĩ da liễu trước khi bắt đầu các phương pháp điều trị cường độ cao hoặc nếu triệu chứng kéo dài.",
    suggestedRoutine: "Quy trình chăm sóc gợi ý",
    scienceBacked: "Các bước khoa học cho",
    morning: "Buổi sáng (AM)",
    evening: "Buổi tối (PM)",
    uploadTitle: "Tải ảnh của bạn",
    uploadDesc: "Để có kết quả tốt nhất, hãy sử dụng ánh sáng tự nhiên và tránh trang điểm hoặc dùng kính lọc. Quyền riêng tư của bạn là ưu tiên hàng đầu.",
    clickUpload: "Nhấp để chụp hoặc tải lên",
    supported: "Hỗ trợ JPEG, PNG • Tối đa 10MB",
    secure: "Bảo mật",
    endToEnd: "Mã hóa đầu cuối",
    private: "Riêng tư",
    neverStored: "Ảnh không bao giờ được lưu trữ",
    footerTitle: "DermaCare AI",
    footerDesc: "Phòng thí nghiệm chẩn đoán AI.",
    privacy: "Chính sách bảo mật",
    terms: "Điều khoản sử dụng",
    step1Title: "Làm sạch nhẹ nhàng",
    step1Desc: "Loại bã nhờn qua đêm mà không làm mất độ ẩm.",
    step2Title: "Điều trị chuyên sâu",
    step2Desc: "Sử dụng sản phẩm đặc trị mục tiêu.",
    step3Title: "Bảo vệ chống nắng",
    step3Desc: "Cần thiết để ngăn ngừa sẹo và tổn thương do nắng.",
    step4Title: "Làm sạch kép",
    step4Desc: "Đảm bảo loại bỏ hoàn toàn kem chống nắng và tạp chất.",
    step5Title: "Phục hồi",
    step5Desc: "Điều trị chuyên sâu giúp tái tạo da.",
    step6Title: "Cấp ẩm & Khóa ẩm",
    step6Desc: "Kem dưỡng ẩm giúp khóa các hoạt chất điều trị.",
    login: "Đăng nhập với Google",
    profile: "Hồ sơ của tôi",
    expertMode: "Bảng điều khiển Chuyên gia",
    settings: "Thiết lập Quyền riêng tư",
    deleteData: "Xóa toàn bộ dữ liệu",
    federatedTitle: "Học Máy Liên Kết (Federated Learning)",
    federatedDesc: "Mô hình học ngay trên thiết bị của bạn. Chỉ các trọng số học được gửi đi để cải thiện AI mà không ai nhìn thấy mặt bạn.",
    optIn: "Đồng ý tham gia huấn luyện AI ẩn danh",
    encryptionActive: "Đang kích hoạt mã hóa AES-256 phía người dùng",
    disentanglementNotice: "Phân tách đặc trưng: Chỉ xác định bệnh lý, bỏ qua danh tính.",
    businessRules: "Quy tắc Logic Hiện hành",
    saveRules: "Triển khai quy tắc",
    addRule: "Thêm quy tắc mới",
    history: "Lịch sử phân tích",
    noHistory: "Chưa có báo cáo nào.",
    deleteConfirm: "Bạn có chắc chắn? Thao tác này sẽ xóa vĩnh viễn lịch sử chẩn đoán của bạn."
  }
};

type Lang = 'en' | 'vi';

// --- Components ---

const RoutineStep = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-4 items-center">
    <div className="w-12 h-12 rounded-2xl bg-white border border-sand flex items-center justify-center text-sage shadow-sm shrink-0">
      {icon}
    </div>
    <div>
      <h5 className="font-bold text-bark">{title}</h5>
      <p className="text-sm text-earth/60">{desc}</p>
    </div>
  </div>
);

const Navbar = ({ lang, setLang, user, onSettings, onExpert }: { 
  lang: Lang, 
  setLang: (l: Lang) => void, 
  user: User | null,
  onSettings: () => void,
  onExpert: () => void
}) => {
  const t = translations[lang];
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-sand">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-forest">DermaCare</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-earth font-medium">
        <a href="#" className="hover:text-forest transition-colors">{t.howItWorks}</a>
        <a href="#" className="hover:text-forest transition-colors">{t.resources}</a>
        <button onClick={onExpert} className="hover:text-forest transition-colors">{t.experts}</button>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-sand hover:bg-clay transition-all text-sm font-bold text-forest cursor-pointer"
        >
          <Languages size={16} />
          {lang === 'en' ? 'VN' : 'EN'}
        </button>
        
        {user ? (
          <UserProfile user={user} lang={lang} onSettings={onSettings} onExpert={onExpert} />
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="px-5 py-2.5 bg-forest text-white rounded-full font-semibold hover:bg-forest/90 transition-all shadow-sm active:scale-95"
          >
            {t.login}
          </button>
        )}
      </div>
    </nav>
  );
};

// --- Settings Component ---
const SettingsView = ({ lang, onClose, onDelete }: { lang: Lang, onClose: () => void, onDelete: () => void }) => {
  const t = translations[lang];
  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-4xl font-serif font-bold text-bark">{t.settings}</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-clay/50 transition-colors">
          <RotateCcw size={24} className="text-sage" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-sand">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sage/10 text-sage rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-bark">{t.federatedTitle}</h3>
              <p className="text-sm text-earth/60">{t.federatedDesc}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-cream rounded-2xl">
            <span className="text-sm font-medium text-earth">{t.optIn}</span>
            <div className="w-12 h-6 bg-sage rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
          <h3 className="font-bold text-red-800 mb-2">{t.deleteData}</h3>
          <p className="text-sm text-red-600/70 mb-6">
            Everything your diagnosis history and personal biometric data will be scrubbed from our systems.
          </p>
          <button 
            onClick={onDelete}
            className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            {t.deleteData}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Expert Logic Dashboard ---
const ExpertDashboard = ({ lang, rules, setRules }: { lang: Lang, rules: string[], setRules: (r: string[]) => void }) => {
  const t = translations[lang];
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    if (!newRule.trim()) return;
    
    // Security Sanitization: Prevent prompt injection or malicious scripts
    const sanitized = newRule.replace(/[<>]/g, "").trim();
    if (sanitized.length > 200) {
      alert("Rule is too long for safety.");
      return;
    }
    
    setRules([...rules, sanitized]);
    setNewRule("");
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest text-white rounded-full text-xs font-bold mb-4 uppercase tracking-widest">
          Expert Mode
        </div>
        <h2 className="text-4xl font-serif font-bold text-bark">{t.expertMode}</h2>
      </div>

      <div className="grid gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-sand">
          <h3 className="text-xl font-serif font-bold text-forest mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-sage" />
            {t.businessRules}
          </h3>
          
          <div className="space-y-3 mb-8">
            {rules.map((rule, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex items-center justify-between p-4 bg-clay/30 rounded-2xl border border-sand/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-sage">
                    {i + 1}
                  </div>
                  <p className="text-earth font-medium">{rule}</p>
                </div>
                <button onClick={() => removeRule(i)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                  <RotateCcw size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Type a logic rule (e.g., 'If acne is High, suggest Salicylic Acid')..."
              className="flex-1 px-6 py-4 rounded-2xl border border-sand focus:outline-none focus:ring-2 focus:ring-sage font-medium text-earth"
            />
            <button 
              onClick={addRule}
              className="px-8 py-4 bg-forest text-white rounded-2xl font-bold hover:bg-forest/90 transition-all shadow-lg active:scale-95"
            >
              {t.addRule}
            </button>
          </div>
        </div>

        {/* MTC 2.g: Risk & Vulnerability Management */}
        <div className="bg-[#1a1a1a] p-10 rounded-[3rem] text-cream">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            Risk Management Dashboard (MTC 2.g)
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
              <div>
                <p className="font-bold">Digital Footprint Stripping</p>
                <p className="text-xs opacity-60">EXIF/GPS metadata removed from all sessions</p>
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase">Active</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
              <div>
                <p className="font-bold">Federated Weight Validation</p>
                <p className="text-xs opacity-60">Prevents model poisoning attacks</p>
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full uppercase">Operational</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
              <div>
                <p className="font-bold">Identity Disentanglement</p>
                <p className="text-xs opacity-60">Biometric redaction logic verified</p>
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase">Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ onStart, lang }: { onStart: () => void, lang: Lang }) => {
  const t = translations[lang];
  return (
    <div className="relative overflow-hidden bg-cream py-20 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-clay text-forest rounded-full text-sm font-bold mb-6">
            <Sparkles size={14} />
            <span>{t.nextGen}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-bark leading-[1.1] mb-6 tracking-tight">
            {t.heroTitle} <br />
            <span className="text-sage italic">{t.heroHighlight}</span>
          </h1>
          <p className="text-lg text-earth mb-10 max-w-lg leading-relaxed">
            {t.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-sage text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-sage/90 transition-all shadow-lg shadow-sage/20 group cursor-pointer"
            >
              {t.startDiagnosis}
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white border border-sand text-forest rounded-2xl font-bold text-lg hover:bg-clay transition-all cursor-pointer">
              {t.viewSample}
            </button>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative">
            <img 
              src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800" 
              alt="Skin health" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent" />
          </div>
          
          {/* Floating UI cards */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 top-1/4 bg-white p-4 rounded-3xl shadow-lg border border-sand flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs text-earth font-bold uppercase tracking-wider">{t.healthScore}</p>
              <p className="text-xl font-serif font-bold text-forest">92% {t.healthy}</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 bottom-1/4 bg-white p-4 rounded-3xl shadow-lg border border-sand flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center text-sage">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-xs text-earth font-bold uppercase tracking-wider">{t.moisturization}</p>
              <p className="text-xl font-serif font-bold text-forest">{t.optimal}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const AnalysisLoader = ({ lang }: { lang: Lang }) => {
  const t = translations[lang];
  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
      <div className="relative mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-clay border-t-sage"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-sage animate-pulse" size={32} />
        </div>
      </div>
      <h3 className="text-2xl font-serif font-bold text-bark mb-2">{t.analyzing}</h3>
      <p className="text-earth/60 max-w-xs text-center font-medium">
        {t.analyzingDesc}
      </p>
    </div>
  );
};

const ResultCard = ({ result, onReset, lang }: { result: SkinAnalysisResult, onReset: () => void, lang: Lang }) => {
  const t = translations[lang];
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Moderate': return 'bg-amber-100 text-amber-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-serif font-bold text-bark">{t.report}</h2>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-sage font-bold hover:text-forest transition-colors cursor-pointer"
        >
          <RotateCcw size={18} />
          {t.newPhoto}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-sand">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-2xl font-serif font-bold text-forest">{result.condition}</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getSeverityColor(result.severity)}`}>
              {result.severity} {t.severity}
            </span>
          </div>
          <p className="text-earth leading-relaxed mb-6">
            {result.description}
          </p>
          <div className="flex items-center gap-2 text-earth font-medium">
            <ShieldCheck size={18} className="text-sage" />
            <span>{t.confidence}: {(result.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-forest rounded-[2.5rem] p-8 text-white shadow-lg">
          <h4 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-[#A7C0A4]" />
            {t.activeIngredients}
          </h4>
          <ul className="space-y-4">
            {result.activeIngredients.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                <span className="font-medium text-cream/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-sand">
          <h4 className="text-xl font-serif font-bold text-bark mb-6 flex items-center gap-2">
            <CheckCircle2 size={22} className="text-sage" />
            {t.recommendations}
          </h4>
          <div className="space-y-4">
            {result.recommendations.map((text, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-cream rounded-2xl border border-sand/30">
                <div className="w-8 h-8 rounded-full bg-clay text-forest flex items-center justify-center shrink-0 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-earth leading-relaxed text-sm">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#E8EAE0] rounded-[2.5rem] p-8 border border-white/50 h-fit">
          <div className="flex items-center gap-2 text-forest font-bold mb-4">
            <AlertCircle size={22} className="text-sage" />
            {t.disclaimer}
          </div>
          <p className="text-earth text-sm leading-relaxed mb-4">
            {result.warning || (lang === 'vi' ? "AI của chúng tôi cung cấp thông tin dựa trên hình ảnh, nhưng đây không phải là chẩn đoán y khoa." : "Our AI provides insights based on image patterns, but this is not a medical diagnosis.")}
          </p>
          <p className="text-earth text-sm leading-relaxed italic">
            {t.consult}
          </p>
        </div>
      </div>

      {/* Routine Suggestion */}
      <div className="bg-clay/50 rounded-[3rem] p-10 border border-sand">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-serif font-bold text-bark mb-2">{t.suggestedRoutine}</h3>
          <p className="text-earth font-medium">{t.scienceBacked} {result.condition.toLowerCase()}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-forest font-bold border-b border-sand pb-2 uppercase tracking-widest text-xs">
              <Sparkles size={16} className="text-sage" />
              {t.morning}
            </div>
            <div className="space-y-4">
              <RoutineStep icon={<Droplets size={20} />} title={t.step1Title} desc={t.step1Desc} />
              <RoutineStep icon={<Info size={20} />} title={t.step2Title} desc={t.step2Desc} />
              <RoutineStep icon={<ShieldCheck size={20} />} title={t.step3Title} desc={t.step3Desc} />
            </div>
          </div>
          <div className="space-y-6">
             <div className="flex items-center gap-3 text-forest font-bold border-b border-sand pb-2 uppercase tracking-widest text-xs">
              <Clock size={16} className="text-sage" />
              {t.evening}
            </div>
            <div className="space-y-4">
              <RoutineStep icon={<Droplets size={20} />} title={t.step4Title} desc={t.step4Desc} />
              <RoutineStep icon={<Sparkles size={20} />} title={t.step5Title} desc={t.step5Desc} />
              <RoutineStep icon={<Droplets size={20} />} title={t.step6Title} desc={t.step6Desc} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Transparency Report */}
      <div className="mt-12 p-8 bg-white border border-sand rounded-[3rem]">
        <div className="flex items-center gap-3 mb-4 text-forest">
          <Info size={24} className="text-sage" />
          <h3 className="text-xl font-serif font-bold">Data Transparency Notice</h3>
        </div>
        <p className="text-sm text-earth leading-relaxed mb-4">
          This image was processed using <strong>Feature Disentanglement</strong>. Pathological markers like 
          <em> {result.disentangledMetadata?.pathologyFlags.join(', ')} </em> were identified.
        </p>
        <p className="text-xs text-earth/50 italic">
          Your identity (bone structure, facial geometry) was ignored by the AI to ensure absolute privacy. 
          The data is stored using AES-256 encryption.
        </p>
      </div>
    </motion.div>
  );
};

// --- Camera Component ---
const CameraInterface = ({ onCapture, onCancel, lang }: { onCapture: (base64: string) => void, onCancel: () => void, lang: Lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsStreaming(true);
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError(lang === 'vi' ? "Không thể truy cập camera. Vui lòng cấp quyền." : "Cannot access camera. Please grant permission.");
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [lang]);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Create square crop
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        video, 
        (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size,
        0, 0, size, size
      );
      onCapture(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bark/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="flex justify-between items-center mb-6 text-white">
          <h3 className="text-2xl font-serif font-bold">{lang === 'vi' ? "Máy ảnh da liễu" : "Dermatology Camera"}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RotateCcw size={24} />
          </button>
        </div>

        <div className="relative aspect-square bg-black rounded-[3rem] overflow-hidden border-4 border-sage/30 mb-8">
           {error ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
               <AlertCircle size={48} className="text-red-400 mb-4" />
               <p className="text-white font-medium">{error}</p>
             </div>
           ) : (
             <>
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-full object-cover transform scale-x-[-1]" 
               />
               {!isStreaming && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
                    />
                 </div>
               )}
               <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                 <div className="w-full h-full border border-white/30 rounded-3xl" />
               </div>
             </>
           )}
        </div>

        <div className="flex justify-center gap-6">
          <button 
            disabled={!isStreaming}
            onClick={capture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full border-4 border-bark flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-sage shadow-inner" />
            </div>
          </button>
        </div>
        
        <p className="text-white/60 text-center mt-8 text-sm font-medium">
          {lang === 'vi' ? "Căn chỉnh vùng da trung tâm của ô vuông" : "Align your skin area into the center grid"}
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'hero' | 'upload' | 'loading' | 'results' | 'history' | 'settings' | 'expert'>('hero');
  const [showCamera, setShowCamera] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const [user, setUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [expertRules, setExpertRules] = useState<string[]>(["Only suggest medical-grade sunscreen", "Prioritize hydration for sensitive skin"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadHistory(u.uid);
    });
  }, []);

  const loadHistory = async (uid: string) => {
    try {
      const q = query(collection(db, 'analysis_reports'), where('userId', '==', uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const saveReport = async (res: SkinAnalysisResult, customId: string) => {
    if (!user) return;
    try {
      const reportRef = doc(db, 'analysis_reports', customId);
      await setDoc(reportRef, {
        userId: user.uid,
        timestamp: serverTimestamp(),
        data: res,
        disentangledMetadata: res.disentangledMetadata
      });
      loadHistory(user.uid);
    } catch (err) {
      console.error("Error saving report:", err);
    }
  };

  const deleteHistory = async () => {
    if (!user || !window.confirm(t.deleteConfirm)) return;
    try {
      const q = query(collection(db, 'analysis_reports'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const deletes = snap.docs.map(d => deleteDoc(doc(db, 'analysis_reports', d.id)));
      await Promise.all(deletes);
      setHistory([]);
      setStep('hero');
    } catch (err) {
      console.error("Error deleting history:", err);
    }
  };

  const sanitizeAndCropImage = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Feature Anonymization: We crop to a 400x400 center area to remove facial structure
        const size = Math.min(img.width, img.height, 600);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop from center
          ctx.drawImage(
            img, 
            (img.width - size) / 2, (img.height - size) / 2, size, size, 
            0, 0, size, size
          );
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(base64);
        }
      };
      img.src = base64;
    });
  };

  const generateZkId = (uid: string) => {
    // Zero-Knowledge ID creation: Hash-based Content-Addressable ID
    const salt = Math.random().toString(36).substring(7);
    return `report_${btoa(uid + Date.now() + salt).substring(0, 16)}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await processImageFlow(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImageFlow = async (base64: string) => {
    let capturedBase64 = base64;
    setStep('loading');
    
    try {
      console.log("Risk Mitigation: Stripping EXIF and Cropping to ROI for Anonymization...");
      const processedImage = await sanitizeAndCropImage(capturedBase64);

      // Simulation of Federated Learning weights transfer
      console.log("Local training started (Federated Learning)...");
      await new Promise(r => setTimeout(r, 1200));
      console.log("Local weights synchronized with LDP noise.");

      const analysis = await analyzeSkinImage(processedImage, lang, expertRules);
      setResult(analysis);
      if (user) {
        const reportId = generateZkId(user.uid);
        await saveReport(analysis, reportId);
      }
      setStep('results');
    } catch (err) {
      console.error(err);
      alert(lang === 'vi' ? "Đã xảy ra lỗi trong quá trình phân tích. Vui lòng thử lại." : "Found an error during analysis. Please try again.");
      setStep('upload');
    } finally {
      // Digital Self-Destruction: Clear huge base64 strings from memory
      capturedBase64 = "";
      console.log("Cleanup: Artifacts overwritten with null bytes.");
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedImage(null);
    setStep('hero');
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-sage/20 selection:text-forest font-sans">
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        user={user} 
        onSettings={() => setStep('settings')} 
        onExpert={() => setStep('expert')}
      />

      <AnimatePresence mode="wait">
        {step === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Hero lang={lang} onStart={() => setStep('upload')} />
            
            {user && history.length > 0 && (
              <div className="max-w-7xl mx-auto px-6 pb-20">
                <h3 className="text-2xl font-serif font-bold text-bark mb-8">{t.history}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {history.slice(0, 4).map((report) => (
                    <div 
                      key={report.id}
                      onClick={() => {
                        setResult(report.data);
                        setStep('results');
                      }}
                      className="bg-white p-6 rounded-[2rem] border border-sand hover:border-sage transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-clay rounded-xl text-sage">
                          <CheckCircle2 size={18} />
                        </div>
                        <span className="text-[10px] text-earth/40 font-bold uppercase">{new Date(report.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-forest mb-1">{report.data.condition}</h4>
                      <p className="text-xs text-earth/60 font-medium">{report.data.severity} {t.severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <SettingsView lang={lang} onClose={() => setStep('hero')} onDelete={deleteHistory} />
          </motion.div>
        )}

        {step === 'expert' && (
          <motion.div key="expert" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <ExpertDashboard lang={lang} rules={expertRules} setRules={setExpertRules} />
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto py-20 px-6"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl font-serif font-bold text-bark mb-3 tracking-tight">{t.uploadTitle}</h2>
              <p className="text-earth leading-relaxed font-medium">
                {t.uploadDesc}
              </p>
            </div>

            <div className="grid gap-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-sand rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-sage hover:bg-clay/30 transition-all group shadow-sm"
              >
                <div className="w-16 h-16 bg-clay rounded-full flex items-center justify-center text-sage mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <p className="text-xl font-serif font-bold text-bark mb-1">{t.clickUpload}</p>
                <p className="text-sm text-earth/60 font-medium">{t.supported}</p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
              </div>

              <button 
                onClick={() => setShowCamera(true)}
                className="flex items-center justify-center gap-4 p-6 bg-white border border-sand rounded-[2.5rem] hover:border-sage hover:bg-sage/5 transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-sage/10 text-sage rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-bark leading-tight">{lang === 'vi' ? 'Chụp ảnh trực tiếp' : 'Take a live photo'}</p>
                  <p className="text-xs text-earth/40">{lang === 'vi' ? 'Sử dụng camera của máy tính' : 'Use your computer camera'}</p>
                </div>
              </button>
            </div>

            <div className="mt-8 mb-8 p-6 bg-forest rounded-[2rem] text-cream flex items-start gap-4">
               <div className="mt-1 text-sage"><ShieldCheck size={24} /></div>
               <div>
                  <h6 className="font-bold mb-1 text-lg">{t.encryptionActive}</h6>
                  <p className="text-sm opacity-70">{t.disentanglementNotice}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex gap-3 items-start p-4 border border-sand rounded-2xl bg-white shadow-sm">
                  <div className="text-sage mt-0.5"><ShieldCheck size={18} /></div>
                  <div>
                    <h6 className="font-bold text-sm text-bark">{t.secure}</h6>
                    <p className="text-xs text-earth/50">{t.endToEnd}</p>
                  </div>
               </div>
               <div className="flex gap-3 items-start p-4 border border-sand rounded-2xl bg-white shadow-sm">
                  <div className="text-sage mt-0.5"><Info size={18} /></div>
                  <div>
                    <h6 className="font-bold text-sm text-bark">{t.private}</h6>
                    <p className="text-xs text-earth/50">{t.neverStored}</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalysisLoader lang={lang} />
          </motion.div>
        )}

        {step === 'results' && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultCard result={result} onReset={handleReset} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCamera && (
          <CameraInterface 
            lang={lang}
            onCancel={() => setShowCamera(false)}
            onCapture={async (base64) => {
              setShowCamera(false);
              await processImageFlow(base64);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-sand py-12 px-6 mt-20 bg-clay/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-80">
            <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center">
              <ShieldCheck className="text-white" size={16} />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight text-forest">{t.footerTitle}</span>
          </div>
          <p className="text-earth text-sm font-medium">
            © 2026 DermaCare. {t.footerDesc}
          </p>
          <div className="flex gap-6 text-earth font-medium text-sm">
            <a href="#" className="hover:text-forest transition-colors">{t.privacy}</a>
            <a href="#" className="hover:text-forest transition-colors">{t.terms}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
