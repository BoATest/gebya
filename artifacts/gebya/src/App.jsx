import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Users, Calendar, Settings, Trash2, Pencil, Calculator, Share2 } from 'lucide-react';
import db from './db';
import { PrivacyProvider, usePrivacy } from './context/PrivacyContext';
import { LangProvider, useLang } from './context/LangContext';
import ProfitCard from './components/ProfitCard';
import TransactionForm from './components/TransactionForm';
import EditTransactionSheet from './components/EditTransactionSheet';
import MerroList from './components/MerroList';
import CreditDetail from './components/CreditDetail';
import HistoryView from './components/HistoryView';
import SettingsPage from './components/SettingsPage';
import OnboardingScreen from './components/OnboardingScreen';
import ProfitCalculatorModal from './components/ProfitCalculatorModal';
import { ToastContainer, fireToast } from './components/Toast';
import { DEFAULT_PROVIDERS } from './components/PaymentTypeChips';
import { getCurrentEthiopianDate, formatEthiopian } from './utils/ethiopianCalendar';
import { fmt } from './utils/format';
import { checkAndAwardBadges } from './utils/badges';

const P = {
  bg: '#fdf8f0',
  header: '#7c3d12',
  actionBar: '#9a4c18',
  amber: '#c47c1a',
  amberLight: '#fef3c7',
  border: '#f0e6d4',
};

function AppInner() {
  const { hidden } = usePrivacy();
  const { lang, toggleLang, t } = useLang();
  const [transactions, setTransactions] = useState([]);
  const [creditRecords, setCreditRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [shopProfile, setShopProfile] = useState(null);
  const [enabledProviders, setEnabledProviders] = useState(DEFAULT_PROVIDERS);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [lastPayment, setLastPayment] = useState({
    sale:    { type: 'cash', provider: '', bankProvider: '', walletProvider: '' },
    expense: { type: 'cash', provider: '', bankProvider: '', walletProvider: '' },
  });
  const [usageStats, setUsageStats] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [bestDayTotal, setBestDayTotal] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [txns, credits, nameRow, phoneRow, epRow, reRow, telegramRow] = await Promise.all([
        db.transactions.toArray(),
        db.credit_records.toArray(),
        db.settings.get('shop_name'),
        db.settings.get('shop_phone'),
        db.settings.get('enabled_payment_methods'),
        db.settings.get('recurring_expenses'),
        db.settings.get('shop_telegram'),
      ]);
      txns.sort((a, b) => b.created_at - a.created_at);
      setTransactions(txns);
      setCreditRecords(credits);
      setShopProfile({
        name: nameRow?.value || null,
        phone: phoneRow?.value || '',
        telegram: telegramRow?.value || '',
      });
      try { setEnabledProviders(epRow ? JSON.parse(epRow.value) : DEFAULT_PROVIDERS); } catch { setEnabledProviders(DEFAULT_PROVIDERS); }
      try { setRecurringExpenses(reRow ? JSON.parse(reRow.value) : []); } catch { setRecurringExpenses([]); }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const trackSession = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [scRow, ladRow, sdRow, lsdRow, daRow, fcRow, fudRow, bdtRow, crRow] = await Promise.all([
        db.analytics.get('session_count'),
        db.analytics.get('last_active_date'),
        db.analytics.get('streak_days'),
        db.analytics.get('longest_streak'),
        db.analytics.get('days_active'),
        db.analytics.get('feature_counts'),
        db.analytics.get('first_used_date'),
        db.analytics.get('best_day_total'),
        db.analytics.get('credits_repaid'),
      ]);

      const sessionCount = (scRow?.value || 0) + 1;
      const lastDate = ladRow?.value || null;
      const isNewDay = lastDate !== todayStr;

      let streak = sdRow?.value || 1;
      let longestStreak = lsdRow?.value || 1;
      if (isNewDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        streak = lastDate === yesterdayStr ? streak + 1 : 1;
        longestStreak = Math.max(longestStreak, streak);
      }

      let daysActive = [];
      try { daysActive = daRow ? JSON.parse(daRow.value) : []; } catch { daysActive = []; }
      if (isNewDay && !daysActive.includes(todayStr)) daysActive = [...daysActive, todayStr];

      let featureCounts = { sales: 0, expenses: 0, credits: 0 };
      try { featureCounts = fcRow ? JSON.parse(fcRow.value) : featureCounts; } catch { /* keep default */ }

      const firstUsed = fudRow?.value || todayStr;
      const bdt = bdtRow?.value || 0;
      const creditsRepaid = crRow?.value || 0;

      setBestDayTotal(bdt);

      await Promise.all([
        db.analytics.put({ key: 'session_count',   value: sessionCount }),
        db.analytics.put({ key: 'last_active_date', value: todayStr }),
        db.analytics.put({ key: 'streak_days',      value: streak }),
        db.analytics.put({ key: 'longest_streak',   value: longestStreak }),
        db.analytics.put({ key: 'days_active',      value: JSON.stringify(daysActive) }),
        db.analytics.put({ key: 'feature_counts',   value: JSON.stringify(featureCounts) }),
        db.analytics.put({ key: 'first_used_date',  value: firstUsed }),
      ]);

      const stats = { sessionCount, streak, longestStreak, daysActive, featureCounts, firstUsed, bestDayTotal: bdt, creditsRepaid };
      setUsageStats(stats);

      const badges = await checkAndAwardBadges(stats, lang);
      setEarnedBadges(badges);
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  }, [lang]);

  useEffect(() => { trackSession(); }, [trackSession]);

  const checkBestDay = useCallback(async (todayTotal) => {
    try {
      const bdtRow = await db.analytics.get('best_day_total');
      const prevBest = bdtRow?.value || 0;
      const bdFiredRow = await db.analytics.get('best_day_fired_date');
      const todayStr = new Date().toISOString().split('T')[0];

      if (todayTotal > prevBest && bdFiredRow?.value !== todayStr) {
        await db.analytics.put({ key: 'best_day_total', value: todayTotal });
        await db.analytics.put({ key: 'best_day_fired_date', value: todayStr });
        setBestDayTotal(todayTotal);
        fireToast(`${t.newBestDay} ${fmt(todayTotal)} ${t.birr}`, 3000);
        setUsageStats(prev => prev ? { ...prev, bestDayTotal: todayTotal } : prev);
        const bdStats = { ...(usageStats || {}), bestDayTotal: todayTotal };
        const badges = await checkAndAwardBadges(bdStats, lang);
        setEarnedBadges(badges);
      }
    } catch { /* non-critical */ }
  }, [t, lang, usageStats]);

  const handleAddTransaction = async (transaction) => {
    try {
      const now = new Date(transaction.created_at);
      const newTxn = {
        ...transaction,
        ethiopian_date: formatEthiopian(now),
        customer_name: transaction.type === 'credit' ? transaction.item_name : null,
      };

      if (transaction.type === 'credit') {
        const customerId = await db.customers.add({
          name: transaction.item_name,
          phone: transaction.customer_phone || null,
          total_debt: transaction.amount,
        });
        await db.credit_records.add({
          customer_id: customerId,
          customer_name: transaction.item_name,
          customer_phone: transaction.customer_phone || null,
          original_amount: transaction.amount,
          paid_amount: 0,
          remaining_amount: transaction.amount,
          due_date: transaction.due_date,
          status: 'active',
          created_at: transaction.created_at,
          direction: transaction.direction || 'owes_me',
        });
      }

      const id = await db.transactions.add(newTxn);
      const saved = await db.transactions.get(id);

      setTransactions(prev => {
        const updated = [saved, ...prev];
        const todayStr = new Date().toDateString();
        const todayTotal = updated
          .filter(t2 => new Date(t2.created_at).toDateString() === todayStr && t2.type === 'sale')
          .reduce((s, t2) => s + (t2.amount || 0), 0);
        checkBestDay(todayTotal);
        return updated;
      });

      if (transaction.type === 'credit') {
        setCreditRecords(await db.credit_records.toArray());
      }

      if (transaction.type === 'sale' || transaction.type === 'expense') {
        const pType = transaction.payment_type || 'cash';
        const pProvider = transaction.payment_provider || '';
        setLastPayment(prev => {
          const prev_cat = prev[transaction.type] || {};
          return {
            ...prev,
            [transaction.type]: {
              type: pType,
              provider: pProvider,
              bankProvider:   pType === 'bank'   ? pProvider : (prev_cat.bankProvider   || ''),
              walletProvider: pType === 'wallet' ? pProvider : (prev_cat.walletProvider || ''),
            },
          };
        });
      }

      const fcKey = { sale: 'sales', expense: 'expenses', credit: 'credits' }[transaction.type];
      if (fcKey) {
        try {
          const fcRow = await db.analytics.get('feature_counts');
          let fc = { sales: 0, expenses: 0, credits: 0 };
          try { fc = fcRow ? JSON.parse(fcRow.value) : fc; } catch { /* keep default */ }
          fc[fcKey] = (fc[fcKey] || 0) + 1;
          await db.analytics.put({ key: 'feature_counts', value: JSON.stringify(fc) });
          setUsageStats(prev => {
            if (!prev) return prev;
            const updated = { ...prev, featureCounts: fc };
            checkAndAwardBadges(updated, lang).then(setEarnedBadges);
            return updated;
          });
        } catch { /* non-critical */ }
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Could not save. Please try again.');
      throw err;
    }
  };

  const handleUpdateTransaction = async (id, updates) => {
    try {
      await db.transactions.update(id, { ...updates, updated_at: Date.now() });
      const updated = await db.transactions.get(id);
      setTransactions(prev => prev.map(t2 => t2.id === id ? updated : t2));

      if (updated?.type === 'credit' && updated.customer_name) {
        const matching = await db.credit_records.where('customer_name').equals(updated.customer_name).first();
        if (matching) {
          const creditUpdates = {
            customer_name: updates.item_name || matching.customer_name,
            customer_phone: updates.customer_phone ?? matching.customer_phone,
            due_date: updates.due_date ?? matching.due_date,
            direction: updates.direction ?? matching.direction,
          };
          if (updates.amount !== undefined && updates.amount !== matching.original_amount) {
            const diff = updates.amount - matching.original_amount;
            const newOriginal = updates.amount;
            const newRemaining = Math.max(0, matching.remaining_amount + diff);
            creditUpdates.original_amount = newOriginal;
            creditUpdates.remaining_amount = newRemaining;
            creditUpdates.status = newRemaining <= 0 ? 'paid' : 'active';
          }
          await db.credit_records.update(matching.id, creditUpdates);
          setCreditRecords(await db.credit_records.toArray());
        }
      }
    } catch (err) {
      console.error('Failed to update:', err);
      alert('Could not update. Please try again.');
      throw err;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await db.transactions.delete(id);
      setTransactions(prev => prev.filter(t2 => t2.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handlePartialPayment = async (creditId, amount) => {
    try {
      const record = await db.credit_records.get(creditId);
      if (!record) return;
      const newPaid = (record.paid_amount || 0) + amount;
      const newRemaining = record.original_amount - newPaid;
      const newStatus = newRemaining <= 0 ? 'paid' : 'active';
      await db.credit_records.update(creditId, {
        paid_amount: newPaid,
        remaining_amount: Math.max(0, newRemaining),
        status: newStatus,
      });
      const credits = await db.credit_records.toArray();
      setCreditRecords(credits);
      if (selectedCredit?.id === creditId) {
        const updated = credits.find(c => c.id === creditId);
        setSelectedCredit(newStatus === 'paid' ? null : (updated || null));
      }

      if (newStatus === 'paid') {
        try {
          const crRow = await db.analytics.get('credits_repaid');
          const newCount = (crRow?.value || 0) + 1;
          await db.analytics.put({ key: 'credits_repaid', value: newCount });
          setUsageStats(prev => {
            if (!prev) return prev;
            const updated2 = { ...prev, creditsRepaid: newCount };
            checkAndAwardBadges(updated2, lang).then(setEarnedBadges);
            return updated2;
          });
        } catch { /* non-critical */ }
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const handleFullPayment = async (creditId) => {
    try {
      const record = await db.credit_records.get(creditId);
      if (!record) return;
      await db.credit_records.update(creditId, {
        paid_amount: record.original_amount,
        remaining_amount: 0,
        status: 'paid',
      });
      setCreditRecords(await db.credit_records.toArray());
      setSelectedCredit(null);

      try {
        const crRow = await db.analytics.get('credits_repaid');
        const newCount = (crRow?.value || 0) + 1;
        await db.analytics.put({ key: 'credits_repaid', value: newCount });
        setUsageStats(prev => {
          if (!prev) return prev;
          const updated = { ...prev, creditsRepaid: newCount };
          checkAndAwardBadges(updated, lang).then(setEarnedBadges);
          return updated;
        });
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Failed to mark paid:', err);
    }
  };

  const handleProfileSave = async (name, phone, telegram) => {
    await db.settings.put({ key: 'shop_name', value: name });
    await db.settings.put({ key: 'shop_phone', value: phone });
    await db.settings.put({ key: 'shop_telegram', value: telegram || '' });
    setShopProfile({ name, phone, telegram: telegram || '' });
  };

  const todayTransactions = transactions.filter(
    t2 => new Date(t2.created_at).toDateString() === new Date().toDateString()
  );

  const todaySales = todayTransactions.filter(t2 => t2.type === 'sale');
  const todayExpenses = todayTransactions.filter(t2 => t2.type === 'expense');
  const todaySalesTotal = todaySales.reduce((s, t2) => s + (t2.amount || 0), 0);
  const todayExpensesTotal = todayExpenses.reduce((s, t2) => s + (t2.amount || 0), 0);

  const topProducts = (() => {
    const counts = {};
    todaySales.forEach(t2 => {
      const name = t2.item_name || 'Unknown';
      counts[name] = (counts[name] || 0) + (t2.quantity || 1);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, qty]) => ({ name, qty }));
  })();

  const sparklineData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const total = transactions
        .filter(t2 => new Date(t2.created_at).toDateString() === ds && t2.type === 'sale')
        .reduce((s, t2) => s + (t2.amount || 0), 0);
      const dayIndex = d.getDay();
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayLabelsAm = ['እሁድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
      days.push({
        label: lang === 'am' ? dayLabelsAm[dayIndex] : dayLabels[dayIndex],
        total,
        isToday: i === 0,
      });
    }
    return days;
  })();

  const sparklineMax = Math.max(...sparklineData.map(d => d.total), 1);

  const handleShareReport = async () => {
    const profit = todaySalesTotal - todayExpensesTotal;
    const topStr = topProducts.length > 0
      ? topProducts.map((p, i) => `  ${i + 1}. ${p.name} (x${p.qty})`).join('\n')
      : '  —';
    const summary = [
      `📊 ${shopProfile?.name || 'Shop'} — Daily Report`,
      `📅 ${new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      ``,
      `💰 Sales:    ${fmt(todaySalesTotal)} birr`,
      `🛒 Expenses: ${fmt(todayExpensesTotal)} birr`,
      `📈 Profit:   ${fmt(profit)} birr`,
      ``,
      `🏆 Top Items Sold:`,
      topStr,
      ``,
      `Sent via ገበያ (Gebya)`,
    ].join('\n');

    const telegram = shopProfile?.telegram?.trim();

    if (navigator.share) {
      try {
        await navigator.share({ title: `${shopProfile?.name || 'Shop'} Report`, text: summary });
        return;
      } catch { /* fall through */ }
    }

    if (telegram) {
      const encoded = encodeURIComponent(summary);
      const handle = telegram.startsWith('@') ? telegram.slice(1) : telegram;
      window.open(`https://t.me/${handle}?text=${encoded}`, '_blank');
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      fireToast('📋 ' + t.copiedToClipboard, 2500);
    } catch { /* ignore */ }
  };

  const hid = (n) => hidden ? '••••' : fmt(n);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="text-center">
          <div className="text-5xl mb-3">📒</div>
          <h1 className="text-2xl font-black" style={{ color: P.header }}>ገበያ</h1>
          <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>Loading your notebook…</p>
        </div>
      </div>
    );
  }

  if (!shopProfile || !shopProfile.name) {
    return (
      <OnboardingScreen
        onComplete={(profile) => setShopProfile(profile)}
      />
    );
  }

  const tabs = [
    { id: 'today',    label: t.todayLabel, sub: t.today,   icon: BookOpen },
    { id: 'merro',    label: t.creditLabel, sub: t.credit,  icon: Users },
    { id: 'history',  label: t.report,                       icon: Calendar },
    { id: 'settings', label: t.settings,                     icon: Settings },
  ];

  const typeEmoji = { sale: '💰', expense: '🛒', credit: '👥' };
  const typeColor = { sale: '#15803d', expense: '#dc2626', credit: '#c47c1a' };
  const typeBorderColor = { sale: '#86efac', expense: '#fca5a5', credit: '#fcd34d' };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative" style={{ background: P.bg }}>

      <header className="flex-shrink-0 px-4 pt-10 pb-4" style={{ background: P.header }}>
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-white tracking-tight">ገበያ</h1>
            <p className="text-sm font-black text-white truncate" style={{ fontSize: '0.95rem' }}>
              {shopProfile.name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              {usageStats?.streak > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                >
                  🔥 {usageStats.streak}d
                </span>
              )}
              <button
                onClick={toggleLang}
                className="text-xs font-bold px-2 py-1 rounded-full border transition-all min-h-[28px]"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.12)' }}
              >
                {lang === 'en' ? 'አማ' : 'EN'}
              </button>
            </div>
            <p className="text-xs font-semibold text-white">{getCurrentEthiopianDate()}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="flex gap-2">
            {[
              { label: t.sales, val: todaySalesTotal, color: '#bbf7d0', text: '#14532d' },
              { label: t.spent, val: todayExpensesTotal, color: '#fecaca', text: '#991b1b' },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: s.color }}>
                <div className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</div>
                <div className="font-black text-sm" style={{ color: s.text }}>{hid(s.val)} {t.birr}</div>
              </div>
            ))}
          </div>
        )}
      </header>

      {activeTab === 'today' && (
        <div className="px-3 py-3 flex gap-2 flex-shrink-0" style={{ background: P.actionBar }}>
          {[
            { type: 'sale',    label: t.iSoldLabel, sub: t.iSold,  bg: '#14532d', shadow: '#052e16' },
            { type: 'expense', label: t.iSpentLabel, sub: t.iSpent, bg: '#991b1b', shadow: '#450a0a' },
            { type: 'credit',  label: t.creditBtnLabel, sub: t.creditBtn,  bg: '#92400e', shadow: '#431407' },
          ].map(b => (
            <button key={b.type} onClick={() => setShowForm(b.type)}
              className="flex-1 py-3 rounded-2xl text-center active:opacity-80 transition-all"
              style={{ background: b.bg, boxShadow: `0 4px 0 ${b.shadow}` }}>
              <div className="font-black text-white text-lg leading-none">+</div>
              <div className="font-bold text-white text-sm">{b.label}</div>
              <div className="text-white text-xs opacity-70">{b.sub}</div>
            </button>
          ))}
          <button
            onClick={() => setShowCalculator(true)}
            className="py-3 px-3 rounded-2xl text-center active:opacity-80 transition-all flex flex-col items-center justify-center gap-0.5"
            style={{ background: '#7c5c20', boxShadow: '0 4px 0 #5a3f10', minWidth: '48px' }}
            aria-label={t.calculator}
          >
            <Calculator className="w-5 h-5 text-white" />
            <span className="text-white text-xs opacity-80" style={{ fontSize: '0.6rem' }}>Calc</span>
          </button>
        </div>
      )}

      {activeTab === 'today' && usageStats && (
        <div className="px-4 pt-3 pb-0">
          <div className="rounded-2xl px-4 py-2.5 flex items-center gap-4" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
            <div className="text-center flex-shrink-0">
              <div className="text-lg font-black" style={{ color: '#c2410c' }}>🔥 {usageStats.streak}</div>
              <div className="text-xs text-gray-500">{t.dayStreak}</div>
            </div>
            <div className="w-px h-8" style={{ background: '#fed7aa' }} />
            <div className="text-center flex-shrink-0">
              <div className="text-lg font-black text-green-700">📅 {usageStats.daysActive?.length || 1}</div>
              <div className="text-xs text-gray-500">{t.daysActive}</div>
            </div>
            <div className="w-px h-8" style={{ background: '#fed7aa' }} />
            <div className="text-center flex-1 min-w-0">
              <div className="text-sm font-black text-gray-700">
                {(usageStats.featureCounts?.sales || 0) + (usageStats.featureCounts?.expenses || 0)} <span className="text-xs font-normal text-gray-500">{t.totalEntries}</span>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {t.since} {usageStats.firstUsed ? (() => { try { return formatEthiopian(new Date(usageStats.firstUsed)); } catch { return usageStats.firstUsed; } })() : '—'}
              </div>
            </div>
            <button
              onClick={handleShareReport}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl min-h-[44px] min-w-[44px] justify-center"
              style={{ background: '#c47c1a' }}
              aria-label={t.shareReport}
            >
              <Share2 className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold" style={{ fontSize: '0.6rem' }}>Share</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-3 pb-28">

        {activeTab === 'today' && (
          <div className="space-y-3">
            <ProfitCard transactions={todayTransactions} />

            {sparklineData.some(d => d.total > 0) && (
              <div className="rounded-2xl px-4 pt-3 pb-2" style={{ background: '#fff', border: '1px solid #f0e6d4' }}>
                <p className="text-xs font-bold text-gray-500 mb-2">{t.weekTrend}</p>
                <div className="flex items-end gap-1" style={{ height: '48px' }}>
                  {sparklineData.map((d, i) => {
                    const h = Math.max(4, Math.round((d.total / sparklineMax) * 44));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${h}px`,
                            background: d.isToday ? P.amber : '#e8d5b0',
                            minHeight: '4px',
                          }}
                        />
                        <span className="text-gray-400" style={{ fontSize: '0.55rem', lineHeight: 1 }}>
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {topProducts.length > 0 && (
              <div className="rounded-2xl px-4 py-3" style={{ background: '#fff', border: '1px solid #f0e6d4' }}>
                <p className="text-xs font-bold text-gray-500 mb-2">🏆 {t.topProducts}</p>
                <div className="space-y-1.5">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-sm flex-shrink-0">{['🥇', '🥈', '🥉'][i]}</span>
                      <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{p.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: P.amberLight, color: P.amber }}>
                        ×{p.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: '#fff', borderColor: P.border }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: P.border }}>
                <h3 className="font-bold text-gray-700 text-sm">
                  {t.todaysEntries}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: P.amberLight, color: P.amber }}>
                    {todayTransactions.length}
                  </span>
                </h3>
              </div>

              {todayTransactions.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>{t.noEntries}</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#fef9ec' }}>
                  {todayTransactions.map(tx => (
                    <div key={tx.id}
                      className="px-3 py-3 flex items-center border-l-4"
                      style={{ borderLeftColor: typeBorderColor[tx.type] }}>
                      <span className="text-xl mr-2 flex-shrink-0">{typeEmoji[tx.type]}</span>
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => setEditTarget(tx)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800 text-sm truncate">{tx.item_name}</span>
                          {tx.updated_at && <span className="text-xs" style={{ color: '#c47c1a' }}>{t.edited}</span>}
                        </div>
                        {tx.quantity > 1 && <span className="text-xs text-gray-400">×{tx.quantity}</span>}
                        {tx.payment_type && tx.payment_type !== 'cash' && (
                          <span className="text-xs text-gray-400 block">
                            {[tx.payment_type, tx.payment_provider].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </button>
                      <div className="text-right mr-2 flex-shrink-0">
                        <div className="font-bold text-sm" style={{ color: typeColor[tx.type] }}>
                          {tx.type === 'expense' ? '-' : ''}{fmt(tx.amount || 0)} {t.birr}
                        </div>
                        {tx.profit !== null && tx.profit !== undefined && (
                          <div className={`text-xs ${tx.profit >= 0 ? 'text-green-600' : 'text-red-400'}`}>
                            {tx.profit >= 0 ? '+' : ''}{fmt(tx.profit)} {t.profit}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditTarget(tx)}
                          className="p-2 rounded-xl min-w-[40px] min-h-[44px] flex items-center justify-center"
                          style={{ background: '#fffbeb' }}
                          aria-label="Edit entry"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#c47c1a' }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="p-2 rounded-xl min-w-[40px] min-h-[44px] flex items-center justify-center"
                          style={{ background: '#fff1f2' }}
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'merro' && (
          selectedCredit ? (
            <CreditDetail
              record={selectedCredit}
              onBack={() => setSelectedCredit(null)}
              onPartialPayment={handlePartialPayment}
              onFullPayment={handleFullPayment}
            />
          ) : (
            <MerroList
              creditRecords={creditRecords}
              onSelectCredit={setSelectedCredit}
            />
          )
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            onEdit={setEditTarget}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            transactions={transactions}
            creditRecords={creditRecords}
            shopProfile={shopProfile}
            onProfileSave={handleProfileSave}
            enabledProviders={enabledProviders}
            onProvidersChange={setEnabledProviders}
            recurringExpenses={recurringExpenses}
            onRecurringChange={setRecurringExpenses}
            usageStats={usageStats}
            earnedBadges={earnedBadges}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 border-t"
        style={{ background: '#fff', borderColor: P.border }}>
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedCredit(null); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[60px] transition-colors"
                style={{
                  background: isActive ? P.amberLight : 'transparent',
                  borderBottom: isActive ? `3px solid ${P.amber}` : '3px solid transparent',
                  color: isActive ? P.amber : '#9ca3af',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{tab.label}</span>
                {tab.sub && <span className="text-xs" style={{ opacity: 0.65, fontSize: '0.6rem' }}>{tab.sub}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {showForm && (
        <TransactionForm
          type={showForm}
          onSave={handleAddTransaction}
          onDone={() => setShowForm(null)}
          enabledProviders={enabledProviders}
          recurringExpenses={recurringExpenses}
          initialPaymentType={(showForm === 'sale' || showForm === 'expense') ? lastPayment[showForm]?.type : undefined}
          initialPaymentProvider={(showForm === 'sale' || showForm === 'expense') ? lastPayment[showForm]?.provider : undefined}
          lastPaymentHistory={(showForm === 'sale' || showForm === 'expense') ? {
            bank:   lastPayment[showForm]?.bankProvider   || '',
            wallet: lastPayment[showForm]?.walletProvider || '',
          } : undefined}
        />
      )}

      {editTarget && (
        <EditTransactionSheet
          transaction={editTarget}
          enabledProviders={enabledProviders}
          onUpdate={handleUpdateTransaction}
          onClose={() => setEditTarget(null)}
        />
      )}

      {showCalculator && (
        <ProfitCalculatorModal onClose={() => setShowCalculator(false)} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl text-center mb-3">{typeEmoji[deleteTarget.type]}</div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">{t.deleteEntry}</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              "{deleteTarget.item_name}" · {fmt(deleteTarget.amount || 0)} {t.birr}
            </p>
            <div className="space-y-2">
              <button onClick={() => handleDeleteTransaction(deleteTarget.id)}
                className="w-full p-4 bg-red-500 text-white rounded-2xl font-black min-h-[52px]">
                {t.delete}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="w-full p-4 rounded-2xl font-bold min-h-[52px]"
                style={{ background: '#f5f5f5', color: '#374151' }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <LangProvider>
      <PrivacyProvider>
        <AppInner />
      </PrivacyProvider>
    </LangProvider>
  );
}

export default App;
