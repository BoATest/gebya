import { createContext, useContext, useState } from 'react';

// NOTE FOR NATIVE-SPEAKER REVIEW:
// All strings in the AM (Amharic) object below were machine-translated.
// Before public launch, every Amharic string should be reviewed and corrected
// by a native Amharic speaker, especially financial/business terms.
// Strings particularly needing review are marked with: // ⚠️ REVIEW

const EN = {
  appName: 'ገበያ',
  loading: 'Loading your notebook…',
  today: 'Today',
  todayLabel: 'ዛሬ',
  credit: 'Credit',
  creditLabel: 'ብድር',
  report: 'Report',
  settings: 'Settings',
  sales: 'Sales',
  spent: 'Spent',
  iSold: 'I Sold',
  iSoldLabel: 'ሸጠሁ',
  iSpent: 'I Spent',
  iSpentLabel: 'ወጪ',
  creditBtn: 'Credit',
  creditBtnLabel: 'ብድር',
  calc: 'Calc',
  todaysEntries: "Today's Entries",
  noEntries: 'No entries yet. Use the buttons above to start!',
  profit: 'profit',
  edited: 'edited',
  editEntry: 'Edit entry',
  deleteEntryLabel: 'Delete entry',
  calculator: 'Profit Calculator',
  calcCost: 'Cost Price',
  calcSell: 'Selling Price',
  calcProfit: 'Profit',
  calcMargin: 'Margin',
  calcPlaceholder: 'Enter amount…',
  topProducts: 'Top Sold Today',
  weekTrend: '7-Day Trend',
  shareReport: 'Share Report',
  shareReportBtn: 'Share Today',
  shareTitle: 'Share Daily Report',
  shareDailyReport: 'Daily Report',
  shareTopItems: 'Top Items Sold',
  shareSentVia: 'Sent via ገበያ (Gebya)',
  shareViaDevice: 'Share via Device',
  openTelegram: 'Open in Telegram',
  copyText: 'Copy Text',
  usageInsights: 'Usage Insights',
  dayStreak: 'day streak',
  best: 'best',
  daysActive: 'days active',
  since: 'since',
  totalEntries: 'entries',
  sessions: 'sessions opened',
  shareMyStats: 'Share My Stats 📤',
  copiedToClipboard: 'Copied to clipboard!',
  shopProfile: 'Shop Profile',
  shopName: 'Shop Name',
  phoneNumber: 'Phone Number',
  telegramLabel: 'Telegram / Contact',
  telegramPlaceholder: '@username or phone (for Telegram share)',
  saveChanges: 'Save Changes',
  saved: 'Saved!',
  privacy: 'Privacy',
  hideAmounts: 'Hide amounts',
  totalsHidden: 'Totals are hidden — tap to show',
  totalsVisible: 'Totals are visible — tap to hide',
  paymentMethods: 'Payment Methods',
  banks: 'Banks',
  mobileWallets: 'Mobile Wallets',
  onlyEnabled: 'Only enabled methods appear as options in the form',
  recurringExpenses: 'Recurring Expenses',
  recurringHint: 'Quick-fill shortcuts for expenses you enter often',
  addRecurring: 'Add recurring expense',
  cancel: 'Cancel',
  add: 'Add',
  yourData: 'Your Data',
  storedOnDevice: 'Stored on this device',
  exportCSV: 'Export to CSV',
  exportHint: 'Download a spreadsheet backup',
  clearAll: 'Clear all data',
  clearHint: 'Permanently deletes everything — export first!',
  about: 'About',
  privacyNote: 'Your data never leaves this device. No account needed.',
  worksOffline: 'Works offline · Data stays on your phone · Free',
  achievementBadges: 'Achievement Badges',
  badgesEarned: 'earned',
  noBadges: 'Complete milestones to earn badges!',
  clearConfirm: 'Clear all data?',
  clearConfirmMsg: 'This will permanently delete all {count} entries and {credits} credit records. This cannot be undone.',
  yesDelete: 'Yes, delete everything',
  dataCleared: 'Data cleared',
  reloading: 'Reloading…',
  deleteEntry: 'Delete this entry?',
  delete: 'Delete',
  newBestDay: '🏆 New best day!',
  birr: 'birr',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  expenseName: 'Expense name (e.g. Rent)',
  amount: 'Amount',
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

const AM = {
  appName: 'ገበያ',
  loading: 'ማስታወሻ እየጫነ…', // ⚠️ REVIEW
  today: 'ዛሬ',
  todayLabel: 'ዛሬ',
  credit: 'ብድር',
  creditLabel: 'ብድር',
  report: 'ሪፖርት', // ⚠️ REVIEW
  settings: 'ቅንብሮች', // ⚠️ REVIEW
  sales: 'ሽያጭ',
  spent: 'ወጪ',
  iSold: 'ሸጠሁ',
  iSoldLabel: 'ሸጠሁ',
  iSpent: 'ወጪ',
  iSpentLabel: 'ወጪ',
  creditBtn: 'ብድር',
  creditBtnLabel: 'ብድር',
  calc: 'ሒሳብ', // ⚠️ REVIEW
  todaysEntries: 'የዛሬ ግቤቶች',
  noEntries: 'እስካሁን ምንም ግቤት የለም። ለመጀመር ከላይ ያሉትን ቁልፎች ይጠቀሙ!',
  profit: 'ትርፍ',
  edited: 'ተስተካክሏል',
  editEntry: 'ግቤት አስተካክል', // ⚠️ REVIEW
  deleteEntryLabel: 'ግቤት ሰርዝ', // ⚠️ REVIEW
  calculator: 'የትርፍ ካልኩሌተር', // ⚠️ REVIEW
  calcCost: 'የዋጋ ቅናሽ', // ⚠️ REVIEW
  calcSell: 'የሽያጭ ዋጋ',
  calcProfit: 'ትርፍ',
  calcMargin: 'ትርፍ (%)', // ⚠️ REVIEW
  calcPlaceholder: 'መጠን ያስገቡ…',
  topProducts: 'ዛሬ ምርጥ ሽያጭ',
  weekTrend: 'የ7 ቀን አዝማሚያ', // ⚠️ REVIEW
  shareReport: 'ሪፖርት አጋራ',
  shareReportBtn: 'ዛሬን አጋራ',
  shareTitle: 'ዕለታዊ ሪፖርት አጋራ', // ⚠️ REVIEW
  shareDailyReport: 'ዕለታዊ ሪፖርት',
  shareTopItems: 'ምርጥ ሽያጭ', // ⚠️ REVIEW
  shareSentVia: 'በ ገበያ (Gebya) ተልኳል',
  shareViaDevice: 'በስልክ አጋራ', // ⚠️ REVIEW
  openTelegram: 'ቴሌግራም ክፈት', // ⚠️ REVIEW
  copyText: 'ጽሑፍ ቅዳ', // ⚠️ REVIEW
  usageInsights: 'የአጠቃቀም ዝርዝር',
  dayStreak: 'ቀን ተከታታይ', // ⚠️ REVIEW
  best: 'ምርጥ',
  daysActive: 'ንቁ ቀናት',
  since: 'ጀምሮ',
  totalEntries: 'ግቤቶች',
  sessions: 'ክፍለ ጊዜ', // ⚠️ REVIEW
  shareMyStats: 'ስታቲስቲክሴን አጋራ 📤', // ⚠️ REVIEW
  copiedToClipboard: 'ተቀድቷል!',
  shopProfile: 'የሱቅ መገለጫ',
  shopName: 'የሱቅ ስም',
  phoneNumber: 'ስልክ ቁጥር',
  telegramLabel: 'ቴሌግራም / ግንኙነት', // ⚠️ REVIEW
  telegramPlaceholder: '@username ወይም ስልክ',
  saveChanges: 'ለውጦችን አስቀምጥ',
  saved: 'ተቀምጧል!',
  privacy: 'ግላዊነት', // ⚠️ REVIEW
  hideAmounts: 'ቁጥሮችን ደብቅ',
  totalsHidden: 'ጠቅላላዎቹ ተደብቀዋል — ለማሳየት ተጭኑ',
  totalsVisible: 'ጠቅላላዎቹ ይታያሉ — ለመደበቅ ተጭኑ',
  paymentMethods: 'የክፍያ ዘዴዎች', // ⚠️ REVIEW
  banks: 'ባንኮች',
  mobileWallets: 'ሞባይል ዋሌት',
  onlyEnabled: 'የነቁ ዘዴዎች ብቻ በቅጹ ውስጥ ይታያሉ',
  recurringExpenses: 'ተደጋጋሚ ወጪዎች',
  recurringHint: 'ብዙ ጊዜ ለሚያስገቡዋቸው ወጪዎች ፈጣን ቅጽ',
  addRecurring: 'ተደጋጋሚ ወጪ አክል',
  cancel: 'ሰርዝ',
  add: 'አክል',
  yourData: 'ያንዎ ውሂብ', // ⚠️ REVIEW
  storedOnDevice: 'በዚህ ስልክ ላይ ተቀምጧል',
  exportCSV: 'CSV ወደ ውጭ ላክ', // ⚠️ REVIEW
  exportHint: 'ሰነድ ምትኬ ያውርዱ',
  clearAll: 'ሁሉንም ውሂብ አጥፋ',
  clearHint: 'ሁሉም ነገር ሙሉ በሙሉ ይሰረዛል — መጀመሪያ ይልኩ!',
  about: 'ስለ ፕሮግራሙ',
  privacyNote: 'ውሂቡ ከዚህ ስልክ አይወጣም። ምዝገባ አያስፈልግም።',
  worksOffline: 'ያለ ኢንተርኔት ይሰራል · ውሂቡ በስልክዎ ላይ ይቆያል · ነፃ',
  achievementBadges: 'የስኬት ባጆች', // ⚠️ REVIEW
  badgesEarned: 'ተገኝቷል', // ⚠️ REVIEW
  noBadges: 'ባጆች ለማግኘት ኢላማዎቹን ያሟሉ!',
  clearConfirm: 'ሁሉንም ውሂብ አጥፋ?',
  clearConfirmMsg: 'ይህ ሁሉን {count} ግቤቶችና {credits} የብድር መዝገቦችን ሙሉ በሙሉ ይሰርዛል። ሊቀለበስ አይችልም።',
  yesDelete: 'አዎ፣ ሁሉንም ሰርዝ',
  dataCleared: 'ውሂቡ ተሰርዟል',
  reloading: 'እንደገና እየጫነ…',
  deleteEntry: 'ይህን ግቤት ትሰርዛለህ?',
  delete: 'ሰርዝ',
  newBestDay: '🏆 አዲስ ምርጥ ቀን!', // ⚠️ REVIEW
  birr: 'ብር',
  daily: 'ዕለታዊ',
  weekly: 'ሳምንታዊ',
  monthly: 'ወርሃዊ',
  expenseName: 'የወጪ ስም (ለምሳሌ ኪራይ)',
  amount: 'መጠን',
  sun: 'እሁድ', mon: 'ሰኞ', tue: 'ማክሰ', wed: 'ረቡዕ', thu: 'ሐሙስ', fri: 'አርብ', sat: 'ቅዳሜ',
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('gebya_lang') || 'en');

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'am' : 'en';
      localStorage.setItem('gebya_lang', next);
      return next;
    });
  };

  const t = lang === 'am' ? AM : EN;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
