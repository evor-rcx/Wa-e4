
import React, { useEffect, useState } from 'react';
import { Send, Plus, X, Trash2, ReceiptText, MessageCircle, Printer, Gamepad2, RefreshCw, Search, Smartphone, BookUser } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query } from 'firebase/firestore';
import { auth, db, signIn, handleFirestoreError, OperationType } from './firebase';
import { PULSA_OPTIONS } from './data_pulsa';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Contact {
  id: string;
  name: string;
  phone: string;
  created?: any;
  userId: string;
}

const FIXED_CONTACTS = [
  { id: 'static1', name: 'Reza', phone: '85347819706', initial: 'R' },
  { id: 'static2', name: 'Adi bonzain', phone: '83844462601', initial: 'A' },
  { id: 'static3', name: 'Rafil', phone: '895705096335', initial: 'R' },
  { id: 'static4', name: 'aqila', phone: '89611092557', initial: 'A' }
];

const FIXED_NUMBERS = FIXED_CONTACTS.map(c => c.phone);

const NOMINAL_OPTIONS = [
  { label: 'PLN 20.000 (Harga 25.000)', pembelian: '20.000', harga: '25000' },
  { label: 'PLN 25.000 (Harga 30.000)', pembelian: '25.000', harga: '30000' },
  { label: 'PLN 50.000 (Harga 55.000)', pembelian: '50.000', harga: '55000' },
  { label: 'PLN 100.000 (Harga 105.000)', pembelian: '100.000', harga: '105000' },
  { label: 'PLN 200.000 (Harga 206.000)', pembelian: '200.000', harga: '206000' },
  { label: 'PLN 500.000 (Harga 510.000)', pembelian: '500.000', harga: '510000' },
];

const FREE_FIRE_OPTIONS = [
  { label: 'Free Fire 24 Diamond (Rp 5.000)', item: '24 Diamond', harga: '5000' },
  { label: 'Free Fire 50 Diamond (Rp 8.000)', item: '50 Diamond', harga: '8000' },
  { label: 'Free Fire 70 Diamond (Rp 11.000)', item: '70 Diamond', harga: '11000' },
  { label: 'Free Fire 80 Diamond (Rp 13.000)', item: '80 Diamond', harga: '13000' },
  { label: 'Free Fire 100 Diamond (Rp 16.000)', item: '100 Diamond', harga: '16000' },
  { label: 'Free Fire 140 Diamond (Rp 21.000)', item: '140 Diamond', harga: '21000' },
  { label: 'Free Fire 160 Diamond (Rp 24.000)', item: '160 Diamond', harga: '24000' },
  { label: 'Free Fire 210 Diamond (Rp 31.000)', item: '210 Diamond', harga: '31000' },
  { label: 'Free Fire 280 Diamond (Rp 40.000)', item: '280 Diamond', harga: '40000' },
  { label: 'Free Fire 355 Diamond (Rp 50.000)', item: '355 Diamond', harga: '50000' },
  { label: 'Free Fire 425 Diamond (Rp 60.000)', item: '425 Diamond', harga: '60000' },
  { label: 'Free Fire 860 Diamond (Rp 120.000)', item: '860 Diamond', harga: '120000' },
  { label: 'Free Fire 1075 Diamond (Rp 151.000)', item: '1075 Diamond', harga: '151000' },
  { label: 'Free Fire 1450 Diamond (Rp 200.000)', item: '1450 Diamond', harga: '200000' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'wa' | 'nota' | 'pasca' | 'game' | 'pulsa' | 'cart'>('wa');
  const [targetPhone, setTargetPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('LUNAS');

  // Keranjang Belanja State
  interface CartItem {
    id: string;
    title: string;
    details: { label: string; value: string }[];
    harga: number;
    sub?: number;
    customerName?: string;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartPayments, setCartPayments] = useState<{id: string, amount: string}[]>([{id: '1', amount: ''}]);
  
  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const [message, setMessage] = useState('');

  // Custom Products State
  const [plnProducts, setPlnProducts] = useState(NOMINAL_OPTIONS);
  const [pulsaProducts, setPulsaProducts] = useState<any[]>(PULSA_OPTIONS);
  const [pdamProducts, setPdamProducts] = useState<any[]>([]);
  const [listrikPascaProducts, setListrikPascaProducts] = useState<any[]>([]);
  
  const [ffProducts, setFfProducts] = useState(FREE_FIRE_OPTIONS);
  const [ffMemberProducts, setFfMemberProducts] = useState<any[]>([]);
  const [mlbbProducts, setMlbbProducts] = useState<any[]>([]);
  const [mlbbMemberProducts, setMlbbMemberProducts] = useState<any[]>([]);
  
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [productType, setProductType] = useState<string>('pln');

  // Nota PLN State
  const generateOrderId = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const [notaOrderId, setNotaOrderId] = useState(generateOrderId);
  const [notaTanggal, setNotaTanggal] = useState('');
  const [notaIdPel, setNotaIdPel] = useState('');
  const [notaNama, setNotaNama] = useState('');
  const [notaPemesan, setNotaPemesan] = useState('');
  const [notaMeter, setNotaMeter] = useState('');
  const [notaToken, setNotaToken] = useState('');
  const [notaDaya, setNotaDaya] = useState('');
  const [notaPembelian, setNotaPembelian] = useState('');
  const [notaSubtotal, setNotaSubtotal] = useState('');
  const [notaTotal, setNotaTotal] = useState('');

  // Nota Game State
  const [notaGameOrderId, setNotaGameOrderId] = useState(generateOrderId);
  const [notaGameUserId, setNotaGameUserId] = useState('');
  const [notaGameNickname, setNotaGameNickname] = useState('');
  const [notaGamePemesan, setNotaGamePemesan] = useState('');
  const [notaGameItem, setNotaGameItem] = useState('');
  const [notaGameHarga, setNotaGameHarga] = useState('');
  const [notaGameTotal, setNotaGameTotal] = useState('');

  // Nota Pulsa State
  const [notaPulsaOrderId, setNotaPulsaOrderId] = useState(generateOrderId);
  const [notaPulsaPhone, setNotaPulsaPhone] = useState('');
  const [notaPulsaItem, setNotaPulsaItem] = useState('');
  const [notaPulsaPemesan, setNotaPulsaPemesan] = useState('');
  const [notaPulsaSN, setNotaPulsaSN] = useState('');
  const [notaPulsaHarga, setNotaPulsaHarga] = useState('');
  const [notaPulsaTotal, setNotaPulsaTotal] = useState('');
  
  // Nota Pasca State
  const [pascaType, setPascaType] = useState<'pln'|'pdam'>('pln');
  const [pascaIdPel, setPascaIdPel] = useState('');
  const [pascaNama, setPascaNama] = useState('');
  const [pascaPemesan, setPascaPemesan] = useState('');
  const [pascaPeriode, setPascaPeriode] = useState('');
  const [pascaStand, setPascaStand] = useState('');
  const [pascaTagihan, setPascaTagihan] = useState('');
  const [pascaAdmin, setPascaAdmin] = useState('');
  const [pascaTotal, setPascaTotal] = useState('');
  const [cartPrintTarget, setCartPrintTarget] = useState<string | null>(null);

  const [isCheckingPasca, setIsCheckingPasca] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  const handleCheckPasca = async () => {
    if (!pascaIdPel) return alert('Masukkan ID Pelanggan terlebih dahulu');
    setIsCheckingPasca(true);
    
    let isSuccess = false;
    let finalName = '';

    const apis = [
      `https://api.vreden.my.id/api/plnpasca?no=${pascaIdPel}`,
      `https://api.isan.my.id/api/pln/check?id=${pascaIdPel}`,
      `https://api.azz.my.id/api/pln?id=${pascaIdPel}`,
    ];

    const proxies = [
      (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const apiUrl of apis) {
      if (isSuccess) break;
      for (const proxyFn of proxies) {
        if (isSuccess) break;
        try {
          const proxiedUrl = proxyFn(apiUrl);
          const res = await fetch(proxiedUrl);
          if (!res.ok) continue;
          
          let data;
          const text = await res.text();
          try { data = JSON.parse(text); } catch (e) { continue; }

          if (data.contents) {
            try { data = JSON.parse(data.contents); } catch (e) { continue; }
          }
          if (data.Error) continue;

          // Check if name field exists in standard formats
          const foundName = data.name || data.nama || (data.data && data.data.name);
          if (foundName) {
            finalName = foundName;
            isSuccess = true;
          }
        } catch (err) {
          // ignore error
        }
      }
    }

    setIsCheckingPasca(false);

    if (isSuccess && finalName) {
      setPascaNama(finalName);
    } else {
      alert("Gagal mengecek nama otomatis (API publik sedang offline atau ID salah).\n\nSilahkan isi nama secara manual.");
    }
  };

  const handleCheckNickname = async () => {
    if (!notaGameUserId) return alert("Masukkan User ID terlebih dahulu");
    setIsCheckingNickname(true);
    
    let isSuccess = false;
    let finalNickname = '';

    const apis = [
      `https://api.ryzendesu.vip/api/game/freefire?id=${notaGameUserId}`,
      `https://api.isan.my.id/api/ff/check?id=${notaGameUserId}`
    ];

    // Coba langsung tanpa proxy (kalau ada API yang support CORS nati)
    // Coba dengan beberapa proxy
    const proxies = [
      (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const apiUrl of apis) {
      if (isSuccess) break;
      
      for (const proxyFn of proxies) {
        if (isSuccess) break;
        
        try {
          const proxiedUrl = proxyFn(apiUrl);
          const res = await fetch(proxiedUrl);
          
          if (!res.ok) continue;
          
          let data;
          const text = await res.text();
          
          try {
            data = JSON.parse(text);
          } catch (e) { continue; /* Not JSON, possibly fingerprint loop */ }

          // Handle response format allorigins
          if (data.contents) {
            try {
              data = JSON.parse(data.contents);
            } catch (e) { continue; }
          }
          
          // Handle response format codetabs error
          if (data.Error) continue;

          // Check if nickname field exists (various formats)
          const foundNickname = data.nickname || data.name || data.userName || data.username;
          if (foundNickname) {
            finalNickname = foundNickname;
            isSuccess = true;
          }
        } catch (err) {
          // just ignore and try next
        }
      }
    }

    setIsCheckingNickname(false);

    if (isSuccess && finalNickname) {
      setNotaGameNickname(finalNickname);
    } else {
      alert("Sistem pengecekan nickname (API public) sedang offline/perbaikan.\n\nSilahkan ketik nickname manual untuk sementara waktu.");
    }
  };

  const [isAutoTime, setIsAutoTime] = useState(true);

  const handleResetNota = () => {
    setNotaOrderId(generateOrderId());
    fillCurrentDate();
    setNotaIdPel('');
    setNotaNama('');
    setNotaPemesan('');
    setNotaMeter('');
    setNotaToken('');
    setNotaDaya('');
    setNotaPembelian('');
    setNotaSubtotal('');
    setNotaTotal('');
  };

  const handleAddNotaToCart = () => {
    if (!notaTotal) return alert("Harap isi Total harga sebelum menambah ke keranjang!");
    setCart([...cart, {
      id: generateOrderId(),
      title: 'TOKEN LISTRIK PLN',
      details: [
        { label: 'ID Pelanggan', value: notaIdPel },
        { label: 'Nama', value: notaNama },
        { label: 'Nomor Meter', value: notaMeter },
        { label: 'Token', value: notaToken },
        { label: 'Daya', value: notaDaya },
        { label: 'Pembelian', value: notaPembelian },
      ].filter(d => d.value),
      harga: Number(notaTotal),
      sub: Number(notaSubtotal || 0),
      customerName: notaPemesan || notaNama
    }]);
    handleResetNota();
    setActiveTab('cart');
  };

  const handleResetGame = () => {
    setNotaGameOrderId(generateOrderId());
    fillCurrentDate();
    setNotaGameUserId('');
    setNotaGameNickname('');
    setNotaGamePemesan('');
    setNotaGameItem('');
    setNotaGameHarga('');
    setNotaGameTotal('');
  };

  const handleResetPulsa = () => {
    setNotaPulsaOrderId(generateOrderId());
    fillCurrentDate();
    setNotaPulsaPhone('');
    setNotaPulsaItem('');
    setNotaPulsaPemesan('');
    setNotaPulsaSN('');
    setNotaPulsaHarga('');
    setNotaPulsaTotal('');
  };

  const handleAddGameToCart = () => {
    if (!notaGameTotal) return alert("Harap isi Total harga sebelum menambah ke keranjang!");
    setCart([...cart, {
      id: generateOrderId(),
      title: 'TOP UP INTERNET / GAME',
      details: [
        { label: 'User ID / No', value: notaGameUserId },
        { label: 'Nickname', value: notaGameNickname },
        { label: 'Item / Paket', value: notaGameItem }
      ].filter(d => d.value),
      harga: Number(notaGameTotal),
      customerName: notaGamePemesan || notaGameNickname
    }]);
    handleResetGame();
    setActiveTab('cart');
  };

  const handleAddPulsaToCart = () => {
    if (!notaPulsaTotal) return alert("Harap isi Total harga sebelum menambah ke keranjang!");
    setCart([...cart, {
      id: generateOrderId(),
      title: 'PULSA & DATA',
      details: [
        { label: 'No. HP', value: notaPulsaPhone },
        { label: 'Produk', value: notaPulsaItem },
        { label: 'SN/Ref', value: notaPulsaSN }
      ].filter(d => d.value),
      harga: Number(notaPulsaTotal),
      customerName: notaPulsaPemesan || 'Pemesan Pulsa/Data'
    }]);
    handleResetPulsa();
    setActiveTab('cart');
  };

  const parsePLNText = (text: string) => {
    if (!text) return;
    const parts = text.split('/');
    if (parts.length >= 3) {
      const tokenRaw = parts[0];
      const cleaned = tokenRaw.replace(/[^0-9a-zA-Z*]/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' - ') || cleaned;
      setNotaToken(formatted);
      setNotaNama(parts[1] || '');
      
      const daya1 = parts[2] || '';
      const daya2 = parts[3] ? parts[3].replace('VA', '') : '';
      setNotaDaya(`${daya1}/${daya2}`);
      
      const idpelPart = parts.find(p => p.startsWith('IDPEL:'));
      if (idpelPart) {
        setNotaMeter(idpelPart.replace('IDPEL:', ''));
      }

      const rptoken = parts.find(p => p.startsWith('RPTOKEN:'));
      if (rptoken) {
         const rp = parseInt(rptoken.replace('RPTOKEN:', '').replace(',00', '').replace(/\./g, ''), 10);
         const ppjPart = parts.find(p => p.startsWith('PPJ:'));
         const ppj = ppjPart ? parseInt(ppjPart.replace('PPJ:', '').replace(',00', '').replace(/\./g, ''), 10) : 0;
         const materaiPart = parts.find(p => p.startsWith('MATERAI:'));
         const materai = materaiPart ? parseInt(materaiPart.replace('MATERAI:', '').replace(',00', '').replace(/\./g, ''), 10) : 0;
         const ppnPart = parts.find(p => p.startsWith('PPN:'));
         const ppn = ppnPart ? parseInt(ppnPart.replace('PPN:', '').replace(',00', '').replace(/\./g, ''), 10) : 0;
         const pembelian = rp + ppj + materai + ppn;
         if (pembelian > 0) {
           setNotaPembelian(pembelian.toString());
         }
      }
    }
  };

  const parsePascaText = (text: string) => {
    if (!text) return;
    
    // First try '/' separated logic
    const parts = text.split('/');
    if (parts.length >= 3 && !text.toLowerCase().includes('id pelanggan')) {
       setPascaIdPel(parts[0] || '');
       setPascaNama(parts[1] || '');
       if (parts[2]) setPascaPeriode(parts[2]);
       if (parts[3] && parts[3].includes('-')) setPascaStand(parts[3]);
       return;
    }

    // Try key-value parsing
    const lines = text.split('\n');
    let total = '';
    let tagihan = '';
    let admin = '';
    for (const line of lines) {
      const lower = line.toLowerCase();
      
      const getValue = (str: string) => {
         // Match : or = or multiple spaces separating key and value
         const match = str.match(/[:=]\s*(.+)/) || str.match(/\s{2,}(.+)/);
         return match ? match[1].trim() : '';
      };

      const getNumber = (str: string) => {
         const match = str.match(/Rp[\s.]*([0-9.,]+)/i) || str.match(/[:=][\sA-Za-zRp]*([0-9.,]+)/) || str.match(/\s{2,}(?:Rp)?[\s.]*([0-9.,]+)/i);
         if (match) return match[1].replace(/[^0-9]/g, '');
         return '';
      };

      if (lower.includes('id pel') || lower.includes('idpel') || lower.includes('no meter')) {
         const val = getValue(line) || line.replace(/[^0-9]/g, '');
         if (val) setPascaIdPel(val.replace(/[^0-9]/g, ''));
      } else if (lower.includes('nama')) {
         const val = getValue(line) || line.replace(/n\s*a\s*m\s*a\s*/i, '').replace(/[:=]/g, '').trim();
         if (val) setPascaNama(val);
      } else if (lower.includes('bln') || lower.includes('bulan') || lower.includes('periode')) {
         const val = getValue(line) || line.replace(/periode/i, '').replace(/bulan\/thn/i, '').replace(/bln\/thn/i, '').replace(/[:=]/g, '').trim();
         if (val) setPascaPeriode(val);
      } else if (lower.includes('stand')) {
         const val = getValue(line) || line.replace(/stand\smeter/i, '').replace(/stand/i, '').replace(/[:=]/g, '').trim();
         if (val) setPascaStand(val);
      } else if ((lower.includes('total') && !lower.includes('sub')) || lower.includes('total bayar') || lower.includes('total tagihan')) {
         const nb = getNumber(line);
         if (nb) total = nb;
      } else if (lower.includes('sub total') || lower.includes('tagihan') || lower.includes('jml tagihan') || lower.includes('tag pln') || (lower.includes('pascabayar') && lower.includes('rp'))) {
         const nb = getNumber(line);
         if (nb) tagihan = nb;
      } else if (lower.includes('admin') || lower.includes('biaya admin')) {
         const nb = getNumber(line);
         if (nb) admin = nb;
      }
    }

    if (tagihan) setPascaTagihan(tagihan);
    if (admin) setPascaAdmin(admin);
    if (total) setPascaTotal(total);
    else if (tagihan && admin) setPascaTotal((parseInt(tagihan) + parseInt(admin)).toString());
    else if (tagihan && !admin) setPascaTotal(tagihan);
  };

  const fillCurrentDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    setNotaTanggal(formatter.format(now));
  };

  useEffect(() => {
    if ((activeTab === 'nota' || activeTab === 'game' || activeTab === 'pulsa') && isAutoTime) {
      fillCurrentDate();
      const interval = setInterval(fillCurrentDate, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isAutoTime]);

  useEffect(() => {
    // Authentication bypassed - everyone can read/write as anonymous due to public rules
    setUser({ uid: 'anonymous' } as User);
  }, []);

  useEffect(() => {
    const contactsQuery = query(collection(db, 'contacts'));
    const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
      const docs: Contact[] = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() } as Contact);
      });
      // Sort in memory to fallback if created is null
      docs.sort((a, b) => {
        const timeA = a.created?.toMillis?.() || a.created || 0;
        const timeB = b.created?.toMillis?.() || b.created || 0;
        return timeB - timeA;
      });
      setContacts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contacts');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load PLN Products
    const plnQuery = query(collection(db, 'products_pln'));
    const unsubPln = onSnapshot(plnQuery, (snapshot) => {
      if (!snapshot.empty) setPlnProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load Pulsa
    const pulsaQuery = query(collection(db, 'products_pulsa'));
    const unsubPulsa = onSnapshot(pulsaQuery, (snapshot) => {
      if (!snapshot.empty) setPulsaProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load PDAM
    const pdamQuery = query(collection(db, 'products_pdam'));
    const unsubPdam = onSnapshot(pdamQuery, (snapshot) => {
      setPdamProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load Listrik Pasca
    const pascaQuery = query(collection(db, 'products_listrik_pasca'));
    const unsubPasca = onSnapshot(pascaQuery, (snapshot) => {
      setListrikPascaProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load FF Products
    const ffQuery = query(collection(db, 'products_ff'));
    const unsubFf = onSnapshot(ffQuery, (snapshot) => {
      if (!snapshot.empty) setFfProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load FF Member
    const ffMemQuery = query(collection(db, 'products_ff_member'));
    const unsubFfMem = onSnapshot(ffMemQuery, (snapshot) => {
      setFfMemberProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load MLBB
    const mlbbQuery = query(collection(db, 'products_mlbb'));
    const unsubMlbb = onSnapshot(mlbbQuery, (snapshot) => {
      setMlbbProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load MLBB Member
    const mlbbMemQuery = query(collection(db, 'products_mlbb_member'));
    const unsubMlbbMem = onSnapshot(mlbbMemQuery, (snapshot) => {
      setMlbbMemberProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Product logic
    return () => { 
      unsubPln(); unsubPulsa(); unsubPdam(); unsubPasca();
      unsubFf(); unsubFfMem(); unsubMlbb(); unsubMlbbMem();
    };
  }, []);

  const handleSaveContact = async () => {
    const name = newName.trim();
    let phone = newPhone.trim();

    if (!name || !phone) return alert("Lengkapi nama dan nomor!");

    setIsSaving(true);
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.startsWith('62')) phone = phone.substring(2);

    try {
      await addDoc(collection(db, 'contacts'), {
        name,
        phone,
        created: serverTimestamp(),
        userId: user.uid
      });
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contacts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Hapus kontak ini dari cloud?")) {
      try {
        await deleteDoc(doc(db, 'contacts', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `contacts/${id}`);
      }
    }
  };

  const handleReadContacts = async () => {
    try {
      const { Contacts } = await import('@capacitor-community/contacts');
      const permission = await Contacts.requestPermissions();
      if (permission.contacts !== 'granted') {
        alert("Izin kontak ditolak.");
        return;
      }
      const result = await Contacts.getContacts({
        projection: { name: true, phones: true }
      });
      const contacts = result.contacts.filter((c: any) => c.phones && c.phones.length > 0);
      if (contacts.length === 0) {
        alert("Tidak ada kontak dengan nomor telepon.");
        return;
      }
      const options = contacts.slice(0, 50).map((c: any) => {
        const name = c.name?.display || c.name?.given || "Tanpa Nama";
        const phone = c.phones[0].number || "";
        return `${name} - ${phone}`;
      });
      const choice = window.prompt("Pilih kontak (ketik nomor urut 1-" + options.length + "):\n" + options.map((o: string, i: number) => `${i+1}. ${o}`).join("\n"));
      if (!choice) return;
      const idx = parseInt(choice) - 1;
      if (isNaN(idx) || idx < 0 || idx >= contacts.length) {
        alert("Nomor tidak valid.");
        return;
      }
      let p = contacts[idx].phones[0].number || "";
      p = p.replace(/\D/g, "");
      if (p.startsWith("0")) p = "62" + p.substring(1);
      if (!p.startsWith("62")) p = "62" + p;
      setTargetPhone(p);
    } catch (ex) {
      alert("Error: " + ex);
    }
  };

  const handleSendWA = () => {
    let p = targetPhone;
    const m = message;
    if (!p) return alert("Pilih nomor tujuan dulu!");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const generateWaNotaText = () => {
    const formattedSub = notaSubtotal ? Number(notaSubtotal).toLocaleString('id-ID') : '0';
    const formattedTotal = notaTotal ? Number(notaTotal).toLocaleString('id-ID') : '0';
    const formattedBeli = notaPembelian ? Number(notaPembelian).toLocaleString('id-ID') : '0';

    const greeting = notaNama ? `Hallo "${notaNama}" pesanan "${notaNama}" sudah di proses\n\n` : '';

    return `${greeting}Pesanan Anda:

*E4 STORE*
Jl. Zamrud Depan Zamrud 2 RT 42
WA: 6285169949218
------------------------------------
Order ID      : #${notaOrderId}
Tanggal       : ${notaTanggal}
ID Pelanggan  : ${notaIdPel}
Nama          : ${notaNama}
Nomor Meter   : ${notaMeter}
------------------------------------
Token         : ${notaToken}
------------------------------------
Daya          : ${notaDaya}
Pembelian     : ${formattedBeli}
------------------------------------
Sub total     : Rp${formattedSub}
Total         : Rp${formattedTotal}
------------------------------------
Status        : ${paymentStatus}
------------------------------------
_Melalui WhatsApp ini, Anda akan menerima informasi berupa notifikasi terkait transaksi Anda di *E4 Store*_
------------------------------------
Terimakasih telah berbelanja di E4
------------------------------------`;
  };

  const handlePrint = async (targetName?: string) => {
    try {
      setCartPrintTarget(targetName || null);
      await new Promise(r => setTimeout(r, 300));
      const el = document.querySelector(".print\\:block") as HTMLElement;
      const notaText = el ? el.innerText : "Nota tidak ditemukan";
      const { BleClient } = await import("@capacitor-community/bluetooth-le");

      await BleClient.initialize({ androidNeverForLocation: true });
      const device = await BleClient.requestDevice({
        services: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });
      await BleClient.connect(device.deviceId);
      const SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
      const CHAR = "00002af1-0000-1000-8000-00805f9b34fb";
      let text = "\x1B\x40\x1B\x61\x01\x1B\x45\x01E4 STORE\n\x1B\x45\x00";
      text += "--------------------------------\n\x1B\x61\x00";
      text += notaText;
      text += "\n\n\n\n";
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      for (let i = 0; i < data.length; i += 20) {
        const chunk = data.slice(i, i + 20);
        await BleClient.write(device.deviceId, SERVICE, CHAR, new DataView(chunk.buffer));
      }
      await BleClient.disconnect(device.deviceId);
      alert("Berhasil print!");
    } catch (e: any) {
      alert("Error print: " + e.message);
    } finally {
      setCartPrintTarget(null);
    }
  };

  const handleSendNotaWa = () => {
    let p = targetPhone;
    if (!p) return alert("Pilih nomor tujuan dulu (di tab Pesan WA atau ketik nomornya)");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const m = generateWaNotaText();
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const handleResetPasca = () => {
    setPascaIdPel('');
    setPascaNama('');
    setPascaPemesan('');
    setPascaPeriode('');
    setPascaStand('');
    setPascaTagihan('');
    setPascaAdmin('');
    setPascaTotal('');
  };

  const handleAddPascaToCart = () => {
    if (!pascaTotal) return alert("Harap isi Tagihan (Total) sebelum menambah ke keranjang!");
    setCart([...cart, {
      id: generateOrderId(),
      title: pascaType === 'pln' ? 'TAGIHAN LISTRIK PASCA BAYAR' : 'TAGIHAN PASCABAYAR PDAM',
      details: [
        { label: 'ID Pelanggan', value: pascaIdPel },
        { label: 'Nama', value: pascaNama },
        { label: 'Bulan/Thn', value: pascaPeriode },
        ...(pascaType === 'pln' ? [{ label: 'Stand Meter', value: pascaStand }] : [])
      ].filter(d => d.value),
      harga: Number(pascaTotal),
      customerName: pascaPemesan || pascaNama
    }]);
    handleResetPasca();
    setActiveTab('cart');
  };

  const generateWaPascaText = () => {
    const formattedTotal = pascaTotal ? Number(pascaTotal).toLocaleString('id-ID') : '0';

    const greeting = pascaNama ? `Hallo "${pascaNama}" pesanan "${pascaNama}" sudah di proses\n\n` : '';

    return `${greeting}Pesanan Anda:

*E4 STORE*
Jl. Zamrud Depan Zamrud 2 RT 42
WA: 6285169949218
------------------------------------
Order ID      : #${generateOrderId()}
Tanggal       : ${notaTanggal}
------------------------------------
${pascaType === 'pln' ? '*TAGIHAN LISTRIK PASCA BAYAR*' : '*TAGIHAN PASCABAYAR PDAM*'}
ID Pelanggan  : ${pascaIdPel}
Nama          : ${pascaNama}
Bulan/Thn     : ${pascaPeriode}
${pascaType === 'pln' ? `Stand Meter   : ${pascaStand}\n` : ''}------------------------------------
Tagihan       : Rp${formattedTotal}
------------------------------------
Status        : ${paymentStatus}
------------------------------------
_Melalui WhatsApp ini, Anda akan menerima informasi berupa notifikasi terkait transaksi Anda di *E4 Store*_
------------------------------------
Terimakasih telah berbelanja di E4
------------------------------------`;
  };

  const handleSendPascaWa = () => {
    let p = targetPhone;
    if (!p) return alert("Pilih nomor tujuan dulu!");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const m = generateWaPascaText();
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const generateWaGameNotaText = () => {
    const formattedHarga = Number(notaGameHarga || 0).toLocaleString('id-ID');
    const formattedTotal = Number(notaGameTotal || 0).toLocaleString('id-ID');

    const nama = notaGamePemesan || notaGameNickname;
    const greeting = nama ? `Hallo "${nama}" pesanan "${nama}" sudah di proses\n\n` : '';

    return `${greeting}Pesanan Anda:

*E4 STORE*
Jl. Zamrud Depan Zamrud 2 RT 42
WA: 6285169949218
------------------------------------
Order ID      : #${notaGameOrderId}
Tanggal       : ${notaTanggal}
------------------------------------
User ID       : ${notaGameUserId}
Nickname      : ${notaGameNickname}
Item          : ${notaGameItem}
------------------------------------
Harga         : Rp${formattedHarga}
Total         : Rp${formattedTotal}
------------------------------------
Status        : ${paymentStatus}
------------------------------------
_Melalui WhatsApp ini, Anda akan menerima informasi berupa notifikasi terkait transaksi Anda di *E4 Store*_
------------------------------------
Terimakasih telah berbelanja di E4
------------------------------------`;
  };

  const generateWaPulsaNotaText = () => {
    const formattedHarga = Number(notaPulsaHarga || 0).toLocaleString('id-ID');
    const formattedTotal = Number(notaPulsaTotal || 0).toLocaleString('id-ID');
    
    let snText = notaPulsaSN ? `SN/Ref        : ${notaPulsaSN}\n` : '';

    const nama = notaPulsaPemesan;
    const greeting = nama ? `Hallo "${nama}" pesanan "${nama}" sudah di proses\n\n` : '';

    return `${greeting}Pesanan Anda:

*E4 STORE*
Jl. Zamrud Depan Zamrud 2 RT 42
WA: 6285169949218
------------------------------------
Order ID      : #${notaPulsaOrderId}
Tanggal       : ${notaTanggal}
------------------------------------
No. HP        : ${notaPulsaPhone}
${snText}Produk        : ${notaPulsaItem}
------------------------------------
Harga         : Rp${formattedHarga}
Total         : Rp${formattedTotal}
------------------------------------
Status        : ${paymentStatus}
------------------------------------
_Melalui WhatsApp ini, Anda akan menerima informasi berupa notifikasi terkait transaksi Anda di *E4 Store*_
------------------------------------
Terimakasih telah berbelanja di E4
------------------------------------`;
  };

  const handleSendPulsaWa = () => {
    let p = targetPhone;
    if (!p && notaPulsaPhone) p = notaPulsaPhone;
    if (!p) return alert("Pilih nomor tujuan / isi No HP dulu!");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const m = generateWaPulsaNotaText();
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const handleSendGameNotaWa = () => {
    let p = targetPhone;
    if (!p) return alert("Pilih nomor tujuan dulu!");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const m = generateWaGameNotaText();
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const generateWaCartText = (targetName?: string) => {
    let itemsToProcess = cart;
    if (targetName) {
      itemsToProcess = cart.filter(item => (item.customerName?.trim() || 'Tanpa Nama/Lainnya') === targetName);
    }
    const sumTotal = itemsToProcess.reduce((sum, item) => sum + item.harga, 0);

    const grouped = itemsToProcess.reduce((acc, item) => {
      const name = item.customerName?.trim() || 'Tanpa Nama/Lainnya';
      if (!acc[name]) acc[name] = [];
      acc[name].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    let itemsText = '';
    
    let counter = 1;
    (Object.entries(grouped) as [string, CartItem[]][]).forEach(([name, items]) => {
      itemsText += `*[Pemesan: ${name}]*\n`;
      items.forEach((item) => {
        itemsText += `${counter}. ${item.title}\n`;
        item.details.forEach(l => {
          itemsText += `   ${l.label.padEnd(14, ' ')}: ${l.value}\n`;
        });
        itemsText += `   Harga         : Rp${Number(item.harga).toLocaleString('id-ID')}\n`;
        counter++;
      });
      const subtotal = items.reduce((s, i) => s + i.harga, 0);
      itemsText += `   *Subtotal     : Rp${subtotal.toLocaleString('id-ID')}*\n\n`;
    });
    itemsText = itemsText.trimEnd();

    const cartTotal = sumTotal;
    let endText = '';

    if (targetName) {
      // Don't show cart-level payments if we are sending specifically for one user,
      // as payments apply to the entire cart, not purely their portion.
      endText = `Total : Rp${cartTotal.toLocaleString('id-ID')}`;
    } else {
      const cartPmt = cartPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      if (cartPmt > 0) {
        const isKurang = cartPmt < cartTotal;
        const sisa = Math.abs(cartPmt - cartTotal);
        
        let pmtStr = '';
        if (cartPayments.length > 1) {
          cartPayments.forEach((p, i) => {
            if (p.amount) pmtStr += `Cicilan ${i+1}     : Rp${Number(p.amount).toLocaleString('id-ID')}\n`;
          });
        }
        
        endText = `Total Keseluruhan : Rp${cartTotal.toLocaleString('id-ID')}
${pmtStr}Total Dibayar : Rp${cartPmt.toLocaleString('id-ID')}
${isKurang ? 'Kurang        ' : 'Kembalian     '}: Rp${sisa.toLocaleString('id-ID')}
------------------------------------
Status        : ${paymentStatus}`;
      } else {
        endText = `Total Keseluruhan : Rp${cartTotal.toLocaleString('id-ID')}\n------------------------------------\nStatus        : ${paymentStatus}`;
      }
    }

    const uniqueNames = Object.keys(grouped).filter(n => n !== 'Tanpa Nama/Lainnya');
    let greeting = '';
    if (uniqueNames.length === 1) {
      greeting = `Hallo "${uniqueNames[0]}" pesanan "${uniqueNames[0]}" sudah di proses\n\n`;
    } else if (uniqueNames.length > 1) {
      greeting = `Hallo "${uniqueNames.join(' & ')}" pesanan sudah di proses\n\n`;
    }

    const headerText = targetName ? 'Pesanan Anda:' : 'Pesanan Borongan:';

    return `${greeting}${headerText}\n\n*E4 STORE*\nJl. Zamrud Depan Zamrud 2 RT 42\nWA: 6285169949218\n------------------------------------\nOrder ID      : #${generateOrderId()}\nTanggal       : ${notaTanggal}\n------------------------------------\n${itemsText}\n------------------------------------\n${endText}\n------------------------------------\n_Melalui WhatsApp ini, Anda akan menerima informasi berupa notifikasi terkait transaksi Anda di *E4 Store*_\n------------------------------------\nTerimakasih telah berbelanja di E4\n------------------------------------`;
  };

  const handleSendCartWa = (targetName?: string) => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    let p = targetPhone;
    if (!p) return alert("Pilih nomor tujuan dulu!");
    
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (!p.startsWith('62')) p = '62' + p;
    
    const m = generateWaCartText(targetName);
    const url = `https://api.whatsapp.com/send?phone=${p}&text=${encodeURIComponent(m)}`;
    window.open(url, '_blank');
  };

  const filteredCloudContacts = contacts.filter(c => !FIXED_NUMBERS.includes(c.phone));

  return (
    <>
    <video 
      src="/bg.mp4" 
      autoPlay 
      loop 
      muted 
      playsInline
      className="fixed inset-0 w-full h-full object-cover z-[-1] print:hidden opacity-80"
    />
    <div className="min-h-screen bg-slate-100/60 backdrop-blur-sm pb-10 font-sans print:hidden">
      {/* Header */}
      <div className="bg-[#075E54] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="E4 Logo" className="w-10 h-10 rounded-full object-cover bg-white p-0.5 shadow-sm" />
            <div>
              <h1 className="text-lg font-bold">E4 wa massenger</h1>
              <p className="text-[10px] opacity-60 uppercase tracking-tighter italic">
                {user ? `Cloud Terhubung: ${user.uid.substring(0, 5)}` : 'Sinkronisasi Cloud Aktif'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors active:scale-95"
          >
            {showAddForm ? <X size={22} /> : <Plus size={22} />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm flex px-4 max-w-md mx-auto overflow-x-auto no-scrollbar">
        <button 
          className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'wa' ? 'border-[#25D366] text-[#075E54]' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('wa')}
        >
          <MessageCircle size={18} />
          Pesan WA
        </button>
        <button 
          className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'nota' ? 'border-[#25D366] text-[#075E54]' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('nota')}
        >
          <ReceiptText size={18} />
          Token PLN
        </button>
        <button 
          className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'pasca' ? 'border-[#25D366] text-[#075E54]' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('pasca')}
        >
          <ReceiptText size={18} />
          Pasca Bayar
        </button>
        <button 
          className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'game' ? 'border-[#25D366] text-[#075E54]' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('game')}
        >
          <Gamepad2 size={18} />
          Top-up Game
        </button>
        <button 
          className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'pulsa' ? 'border-[#25D366] text-[#075E54]' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveTab('pulsa')}
        >
          <Smartphone size={18} />
          Pulsa & Data
        </button>
        {cart.length > 0 && (
          <button 
            className={`shrink-0 flex-none px-4 py-4 font-bold text-sm flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'cart' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-yellow-500 hover:text-yellow-600'}`}
            onClick={() => setActiveTab('cart')}
          >
            Keranjang ({cart.length})
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Form Tambah Kontak Baru */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in slide-in-from-top-4 fade-in duration-200">
            <h2 className="font-bold text-gray-800 text-sm italic underline">TAMBAH KONTAK BARU</h2>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nama Kontak" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
              />
              <input 
                type="number" 
                placeholder="Nomor WA (Contoh: 812...)" 
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveContact} 
                disabled={isSaving}
                className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan ke Cloud"}
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-400 font-bold py-4 rounded-2xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wa' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Kirim Pesan */}
            <h2 className="font-bold text-gray-800 text-sm italic underline mb-4">TULIS PESAN BEBAS</h2>
            <textarea 
              rows={3} 
              placeholder="Tulis isi pesan Anda di sini..." 
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-green-500 transition-shadow"
            />
            <button 
              onClick={handleSendWA}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Send size={20} className="ml-1" />
              Kirim via WhatsApp
            </button>
          </div>
        )}

        {activeTab === 'nota' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Nota */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-sm italic underline">BUAT NOTA TOKEN</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsAutoTime(!isAutoTime); if (!isAutoTime) fillCurrentDate(); }} 
                  className={`text-[10px] px-2 py-1 rounded-lg ${isAutoTime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} active:scale-95 transition-colors font-bold`}
                >
                  {isAutoTime ? 'Update Waktu Aktif' : 'Mulai Update Waktu'}
                </button>
                <button onClick={handleResetNota} className="p-1.5 text-gray-400 hover:text-[#25D366] transition-colors bg-gray-50 rounded-full hover:bg-green-50 border border-gray-100" title="Kosongkan Form">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#0088cc] uppercase tracking-widest ml-1 animate-pulse">⚡ Auto-Fill Resi</label>
                <textarea 
                  rows={2}
                  onChange={e => {
                    parsePLNText(e.target.value);
                    setTimeout(() => { e.target.value = ''; }, 1000);
                  }}
                  className="w-full p-3 bg-[#f0f7ff] border border-[#cce5ff] rounded-xl outline-none focus:ring-1 focus:ring-[#0088cc] text-xs text-gray-700 placeholder-[#99ccff]" 
                  placeholder="Paste resi dari aplikasi (cth: 0940-2220-6786.../JAHRAH/...)" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Order ID</label>
                  <input type="text" value={notaOrderId} onChange={e => setNotaOrderId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="#" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input type="text" value={notaTanggal} onChange={e => { setNotaTanggal(e.target.value); setIsAutoTime(false); }} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-xs" placeholder="29 April 2026..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Id Pelanggan</label>
                  <input type="text" value={notaIdPel} onChange={e => setNotaIdPel(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nomor Meter</label>
                  <input type="text" value={notaMeter} onChange={e => setNotaMeter(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama</label>
                <input type="text" value={notaNama} onChange={e => setNotaNama(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Pemesan (Opsional untuk Keranjang)</label>
                <input type="text" value={notaPemesan} onChange={e => setNotaPemesan(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Nama Pemesan..." />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Token (20 Angka)</label>
                <input 
                  type="text" 
                  value={notaToken} 
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9a-zA-Z*]/g, '');
                    if (val.length > 20) val = val.substring(0, 20);
                    let formatted = val.match(/.{1,4}/g)?.join(' - ') || val;
                    setNotaToken(formatted);
                  }} 
                  className="w-full p-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-bold tracking-widest outline-none focus:ring-1 focus:ring-green-500 text-center" 
                  placeholder="XXXX - XXXX - XXXX - XXXX - XXXX" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Daya</label>
                  <input type="text" value={notaDaya} onChange={e => setNotaDaya(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="R1M/900VA" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Paket PLN</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm"
                    onChange={e => {
                      const selected = plnProducts.find(opt => opt.pembelian === e.target.value);
                      if (selected) {
                        setNotaPembelian(selected.pembelian);
                        setNotaSubtotal(selected.harga);
                        setNotaTotal(selected.harga);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Pilih Paket Otomatis...</option>
                    {plnProducts.map((opt, i) => (
                      <option key={opt.id || i} value={opt.pembelian}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pembelian (Manual)</label>
                <input type="text" value={notaPembelian} onChange={e => setNotaPembelian(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="20.000" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sub Total (Rp)</label>
                  <input type="number" value={notaSubtotal} onChange={e => setNotaSubtotal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="22000" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Total (Rp)</label>
                  <input type="number" value={notaTotal} onChange={e => setNotaTotal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm font-bold" placeholder="22000" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAddNotaToCart}
                className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                + Keranjang
              </button>
              <button 
                onClick={handleSendNotaWa}
                className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} />
                Send WA
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pasca' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Nota Pasca */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-sm italic underline">BUAT NOTA PASCABAYAR</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsAutoTime(!isAutoTime); if (!isAutoTime) fillCurrentDate(); }} 
                  className={`text-[10px] px-2 py-1 rounded-lg ${isAutoTime ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'} active:scale-95 transition-colors font-bold`}
                >
                  {isAutoTime ? 'Update Waktu Aktif' : 'Mulai Update Waktu'}
                </button>
                <button onClick={handleResetPasca} className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors bg-gray-50 rounded-full hover:bg-yellow-50 border border-gray-100" title="Kosongkan Form">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setPascaType('pln')} 
                className={`flex-1 py-3 rounded-lg font-bold text-xs transition-colors shadow-sm ${pascaType === 'pln' ? 'bg-white text-yellow-600 border border-yellow-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                PLN Pasca Bayar
              </button>
              <button 
                onClick={() => setPascaType('pdam')} 
                className={`flex-1 py-3 rounded-lg font-bold text-xs transition-colors shadow-sm ${pascaType === 'pdam' ? 'bg-white text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                PDAM
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#0088cc] uppercase tracking-widest ml-1 animate-pulse">⚡ Auto-Fill Resi</label>
                <textarea 
                  rows={2}
                  onChange={e => {
                    parsePascaText(e.target.value);
                    setTimeout(() => { e.target.value = ''; }, 1000);
                  }}
                  className="w-full p-3 bg-[#f0f7ff] border border-[#cce5ff] rounded-xl outline-none focus:ring-1 focus:ring-[#0088cc] text-xs text-gray-700 placeholder-[#99ccff]" 
                  placeholder="Paste resi (cth: 32822.../NAMA/PERIODE atau rincian teks)" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">ID Pelanggan</label>
                  <div className="flex gap-2 w-full">
                    <input type="text" value={pascaIdPel} onChange={e => setPascaIdPel(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                    {pascaType === 'pln' && (
                      <button 
                        onClick={handleCheckPasca} 
                        disabled={isCheckingPasca}
                        className="bg-yellow-100 text-yellow-600 px-3 rounded-xl disabled:opacity-50 hover:bg-yellow-200"
                        title="Cek Nama (Khusus PLN)"
                      >
                        {isCheckingPasca ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bulan/Thn</label>
                  <input type="text" value={pascaPeriode} onChange={e => setPascaPeriode(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" placeholder="Agt25" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama</label>
                <input type="text" value={pascaNama} onChange={e => setPascaNama(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Pemesan (Opsional untuk Keranjang)</label>
                <input type="text" value={pascaPemesan} onChange={e => setPascaPemesan(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" placeholder="Nama Pemesan..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={pascaType === 'pln' ? '' : 'col-span-2'}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preset Biaya (Admin)</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                    onChange={e => {
                      const selected = (pascaType === 'pln' ? listrikPascaProducts : pdamProducts).find(opt => opt.pembelian === e.target.value);
                      if (selected) {
                        setPascaAdmin(selected.harga);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Pilih (Opsional)...</option>
                    {(pascaType === 'pln' ? listrikPascaProducts : pdamProducts).map((opt, i) => (
                      <option key={opt.id || i} value={opt.pembelian}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {pascaType === 'pln' && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Stand Meter</label>
                    <input type="text" value={pascaStand} onChange={e => setPascaStand(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" placeholder="102931-103001" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tagihan (Rp)</label>
                  <input type="number" value={pascaTagihan} onChange={e => {
                    setPascaTagihan(e.target.value);
                    const tag = Number(e.target.value) || 0;
                    const adm = Number(pascaAdmin) || 0;
                    setPascaTotal((tag + adm).toString());
                  }} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin (Rp)</label>
                  <input type="number" value={pascaAdmin} onChange={e => {
                    setPascaAdmin(e.target.value);
                    const tag = Number(pascaTagihan) || 0;
                    const adm = Number(e.target.value) || 0;
                    setPascaTotal((tag + adm).toString());
                  }} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Total (Rp)</label>
                  <input type="number" value={pascaTotal} onChange={e => setPascaTotal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm font-bold text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAddPascaToCart}
                className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                + Keranjang
              </button>
              <button 
                onClick={handleSendPascaWa}
                className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} />
                Send WA
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        )}

        {activeTab === 'game' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Nota Game */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-sm italic underline">BUAT NOTA GAME</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsAutoTime(!isAutoTime); if (!isAutoTime) fillCurrentDate(); }} 
                  className={`text-[10px] px-2 py-1 rounded-lg ${isAutoTime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} active:scale-95 transition-colors font-bold`}
                >
                  {isAutoTime ? 'Update Waktu Aktif' : 'Mulai Update Waktu'}
                </button>
                <button onClick={handleResetGame} className="p-1.5 text-gray-400 hover:text-[#25D366] transition-colors bg-gray-50 rounded-full hover:bg-green-50 border border-gray-100" title="Kosongkan Form">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Order ID</label>
                  <input type="text" value={notaGameOrderId} onChange={e => setNotaGameOrderId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="#" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input type="text" value={notaTanggal} onChange={e => { setNotaTanggal(e.target.value); setIsAutoTime(false); }} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-xs" placeholder="29 April 2026..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">User ID (FF)</label>
                  <div className="mt-1 flex gap-2">
                    <input type="text" value={notaGameUserId} onChange={e => setNotaGameUserId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="ID..." />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nickname</label>
                  <div className="mt-1 flex gap-2">
                    <input type="text" value={notaGameNickname} onChange={e => setNotaGameNickname(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Auto / Manual..." />
                    <button 
                      onClick={handleCheckNickname} 
                      disabled={isCheckingNickname || !notaGameUserId}
                      className="px-3 bg-green-100 text-green-700 font-bold rounded-xl active:scale-95 transition-all text-xs disabled:opacity-50 whitespace-nowrap"
                    >
                      {isCheckingNickname ? 'Cek...' : 'Cek'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Pemesan (Opsional untuk Keranjang)</label>
                <input type="text" value={notaGamePemesan} onChange={e => setNotaGamePemesan(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Nama Pemesan..." />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Produk</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  onChange={e => {
                    const selected = ffProducts.find(opt => opt.item === e.target.value);
                    if (selected) {
                      setNotaGameItem(selected.item);
                      setNotaGameHarga(selected.harga);
                      setNotaGameTotal(selected.harga);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih Paket Free Fire...</option>
                  {ffProducts.map((opt, i) => (
                    <option key={opt.id || i} value={opt.item}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Produk (Manual)</label>
                <input type="text" value={notaGameItem} onChange={e => setNotaGameItem(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Free Fire 140 Diamond" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                  <input type="number" value={notaGameHarga} onChange={e => setNotaGameHarga(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="21000" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Total (Rp)</label>
                  <input type="number" value={notaGameTotal} onChange={e => setNotaGameTotal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm font-bold" placeholder="21000" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAddGameToCart}
                className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                + Keranjang
              </button>
              <button 
                onClick={handleSendGameNotaWa}
                className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} />
                Send WA
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pulsa' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Nota Pulsa */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-sm italic underline">BUAT NOTA PULSA & DATA</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsAutoTime(!isAutoTime); if (!isAutoTime) fillCurrentDate(); }} 
                  className={`text-[10px] px-2 py-1 rounded-lg ${isAutoTime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} active:scale-95 transition-colors font-bold`}
                >
                  {isAutoTime ? 'Update Waktu Aktif' : 'Mulai Update Waktu'}
                </button>
                <button onClick={handleResetPulsa} className="p-1.5 text-gray-400 hover:text-[#25D366] transition-colors bg-gray-50 rounded-full hover:bg-green-50 border border-gray-100" title="Kosongkan Form">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Order ID</label>
                  <input type="text" value={notaPulsaOrderId} onChange={e => setNotaPulsaOrderId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="#" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input type="text" value={notaTanggal} onChange={e => { setNotaTanggal(e.target.value); setIsAutoTime(false); }} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-xs" placeholder="29 April 2026..." />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">No. HP Pelanggan</label>
                <input type="number" value={notaPulsaPhone} onChange={e => setNotaPulsaPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="0812..." />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Pemesan (Opsional untuk Keranjang)</label>
                <input type="text" value={notaPulsaPemesan} onChange={e => setNotaPulsaPemesan(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Nama Pemesan..." />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">SN / Ref (Opsional)</label>
                <input type="text" value={notaPulsaSN} onChange={e => setNotaPulsaSN(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="0123456789..." />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Produk (+3000)</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  onChange={e => {
                    const selected = pulsaProducts.find(opt => opt.item === e.target.value);
                    if (selected) {
                      setNotaPulsaItem(selected.item);
                      setNotaPulsaHarga(selected.harga);
                      setNotaPulsaTotal(selected.harga);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih Paket Pulsa/Data...</option>
                  {pulsaProducts.map((opt, i) => (
                    <option key={opt.id || i} value={opt.item}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Produk (Manual)</label>
                <input type="text" value={notaPulsaItem} onChange={e => setNotaPulsaItem(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="Telkomsel 50.000" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                  <input type="number" value={notaPulsaHarga} onChange={e => setNotaPulsaHarga(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm" placeholder="53000" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Total (Rp)</label>
                  <input type="number" value={notaPulsaTotal} onChange={e => setNotaPulsaTotal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-green-500 text-sm font-bold" placeholder="53000" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAddPulsaToCart}
                className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                + Keranjang
              </button>
              <button 
                onClick={handleSendPulsaWa}
                className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} />
                Send WA
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-sm italic underline">KERANJANG PESANAN</h2>
              <button onClick={() => setCart([])} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">Kosongkan</button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-bold text-sm">
                Belum ada item di keranjang
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  cart.reduce((acc, item, index) => {
                    const name = item.customerName?.trim() || 'Tanpa Nama/Lainnya';
                    if (!acc[name]) acc[name] = [];
                    acc[name].push({ item, index });
                    return acc;
                  }, {} as Record<string, {item: CartItem, index: number}[]>)
                ).map(([name, groupedItems]) => (
                  <div key={name} className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 font-bold text-gray-700 text-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#0088cc]"></div>
                        Pemesan: {name}
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                           onClick={() => handleSendCartWa(name)}
                           className="flex items-center gap-1 text-[10px] bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded outline-none active:scale-95 transition-colors"
                        >
                          <Send size={12} /> WA
                        </button>
                        <button 
                           onClick={() => handlePrint(name)}
                           className="flex items-center gap-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white px-2 py-1.5 rounded outline-none active:scale-95 transition-colors"
                        >
                          <Printer size={12} /> Print
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-3">
                      {groupedItems.map(({ item, index }, subIdx) => (
                        <div key={item.id} className="bg-white border border-gray-100 p-3 rounded-2xl relative shadow-sm">
                          <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="absolute top-3 right-3 text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="font-bold text-xs text-[#0088cc] mb-2">{subIdx + 1}. {item.title}</div>
                          <div className="space-y-1 mb-2">
                             {item.details.map((d, i) => (
                               <div key={i} className="flex text-[11px] text-gray-600">
                                 <div className="w-24 font-bold">{d.label}</div>
                                 <div className="w-2">:</div>
                                 <div className="flex-1 truncate">{d.value}</div>
                               </div>
                             ))}
                          </div>
                          <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-gray-500 w-12">Pemesan:</label>
                              <input 
                                type="text" 
                                placeholder="Nama Pemesan/Note"
                                value={item.customerName || ''}
                                onChange={(e) => {
                                  const newCart = [...cart];
                                  newCart[index].customerName = e.target.value;
                                  setCart(newCart);
                                }}
                                className="flex-1 p-1 px-2 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-gray-500 w-12">Harga:</label>
                              <div className="flex-1 flex items-center justify-between border border-transparent rounded px-2 py-1 bg-gray-50">
                                <span className="text-xs text-gray-800 font-bold w-full text-right">
                                  Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 px-2 border-t border-dashed border-gray-200 mt-2">
                        <div className="text-xs font-bold text-gray-500">Subtotal {name}</div>
                        <div className="text-sm font-bold text-[#0088cc]">Rp {groupedItems.reduce((s, {item}) => s + item.harga, 0).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>
                ))}
                  
                <div className="space-y-3 pt-4 border-t-4 border-gray-100">
                  <div className="flex justify-between items-center py-3 px-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <div className="font-bold text-yellow-800 text-sm">Total Keseluruhan</div>
                    <div className="font-bold text-yellow-600 text-lg">Rp {cart.reduce((s, i) => s + i.harga, 0).toLocaleString('id-ID')}</div>
                  </div>
                  
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pembayaran (Cicilan)</label>
                        <button 
                          onClick={() => setCartPayments([...cartPayments, { id: generateOrderId(), amount: '' }])}
                          className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold hover:bg-yellow-200 transition-colors"
                        >
                          + Tambah
                        </button>
                      </div>
                      
                      {cartPayments.map((p, index) => (
                        <div key={p.id} className="flex items-center gap-2 mb-2 relative group">
                          <span className="text-xs font-bold text-gray-400 w-16">
                            {cartPayments.length > 1 ? `Cicilan ${index + 1}` : 'Bayar'}
                          </span>
                          <input 
                            type="number" 
                            value={p.amount}
                            onChange={(e) => {
                              const newPmts = [...cartPayments];
                              newPmts[index].amount = e.target.value;
                              setCartPayments(newPmts);
                            }}
                            className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm font-bold text-green-600"
                            placeholder="Contoh: 50000"
                          />
                          {cartPayments.length > 1 && (
                            <button 
                              onClick={() => setCartPayments(cartPayments.filter(cp => cp.id !== p.id))}
                              className="text-red-400 opacity-50 hover:opacity-100 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {(() => {
                      const totalDibayar = cartPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                      const totalBelanja = cart.reduce((s, i) => s + i.harga, 0);
                      
                      if (totalDibayar > 0) {
                        const isKurang = totalDibayar < totalBelanja;
                        return (
                          <div className={`flex justify-between items-center p-3 rounded-xl border ${!isKurang ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className={`font-bold text-xs ${!isKurang ? 'text-green-800' : 'text-red-800'}`}>
                              {!isKurang ? 'Kembalian' : 'Kurang'}
                            </div>
                            <div className={`font-bold text-sm ${!isKurang ? 'text-green-600' : 'text-red-600'}`}>
                              Rp {Math.abs(totalDibayar - totalBelanja).toLocaleString('id-ID')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleSendCartWa()}
                  className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                >
                  <Send size={18} />
                  Kirim WA Semua
                </button>
                <button 
                  onClick={() => handlePrint()}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Printer size={18} />
                  Print Semua
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment Status (Shared) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status Pembayaran</label>
          <select 
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-yellow-500 text-sm font-bold"
          >
            <option value="LUNAS">LUNAS</option>
            <option value="BELUM LUNAS">BELUM LUNAS</option>
          </select>
        </div>

        {/* Target Phone Input (Shared) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between items-center ml-1 mb-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Nomor WA</label>
            <button
               onClick={handleReadContacts}
               className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1 font-bold"
               title="Pilih langsung dari kontak HP Anda"
            >
              <BookUser size={12} /> Buka Kontak
            </button>
          </div>
          <input 
            type="number" 
            placeholder="Pilih kontak di bawah" 
            value={targetPhone}
            onChange={e => setTargetPhone(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-xl text-green-600 focus:ring-2 focus:ring-green-500 transition-shadow"
          />
        </div>

        {/* Daftar Kontak Tetap */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Kontak Dari Gambar</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {FIXED_CONTACTS.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => {
                  setTargetPhone(contact.phone);
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }} 
                className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-white hover:border-green-100 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold">
                    {contact.initial}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{contact.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium">+62 {contact.phone}</div>
                  </div>
                </div>
                <div className="text-[9px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">FOTO</div>
              </div>
            ))}
          </div>

          {/* Kontak Tambahan dari Cloud */}
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 pt-4">Kontak Cloud (Tersimpan)</h2>
          <div className="space-y-3">
            {!user ? (
              <div className="italic text-gray-400 text-xs text-center py-4">Memuat data cloud...</div>
            ) : filteredCloudContacts.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs">Belum ada kontak cloud tambahan.</div>
            ) : (
              filteredCloudContacts.map(c => (
                 <div 
                  key={c.id}
                  onClick={() => {
                    setTargetPhone(c.phone);
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }} 
                  className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-white hover:border-green-100 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold uppercase">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">+62 {c.phone}</div>
                    </div>
                  </div>
                   {c.userId === user.uid && (
                    <button 
                      onClick={(e) => handleDeleteContact(c.id, e)} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* PRINT ONLY SECTION */}
    {activeTab === 'nota' && (
      <div className="hidden print:block font-mono text-[11px] text-black w-full" style={{ maxWidth: '80mm', margin: '0 0' }}>
        <div className="text-center font-bold text-lg mb-1">E4 STORE</div>
        <div className="text-center mb-3">
          Jl. Zamrud Depan Zamrud 2 RT 42<br />
          WA: 6285169949218
        </div>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Order ID</td>
              <td className="px-1">:</td>
              <td>#{notaOrderId}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Tanggal</td>
              <td className="px-1">:</td>
              <td>{notaTanggal}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">ID Pelanggan</td>
              <td className="px-1">:</td>
              <td>{notaIdPel}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Nama</td>
              <td className="px-1">:</td>
              <td>{notaNama}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Nomor Meter</td>
              <td className="px-1">:</td>
              <td>{notaMeter}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <div className="mb-2 text-center text-sm font-bold tracking-widest break-all">
          TOKEN:<br/>
          {notaToken}
        </div>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Daya</td>
              <td className="px-1">:</td>
              <td>{notaDaya}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Pembelian</td>
              <td className="px-1">:</td>
              <td>{notaPembelian ? Number(notaPembelian).toLocaleString('id-ID') : '0'}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2"></div>

        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Sub total</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaSubtotal || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr className="font-bold">
              <td className="align-top whitespace-nowrap">Total</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaTotal || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          Status: {paymentStatus}<br/>
          Terimakasih telah berbelanja di E4
        </div>
      </div>
    )}

    {/* PRINT ONLY SECTION - GAME */}
    {activeTab === 'game' && (
      <div className="hidden print:block font-mono text-[11px] text-black w-full" style={{ maxWidth: '80mm', margin: '0 0' }}>
        <div className="text-center font-bold text-lg mb-1">E4 STORE</div>
        <div className="text-center mb-3">
          Jl. Zamrud Depan Zamrud 2 RT 42<br />
          WA: 6285169949218
        </div>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Order ID</td>
              <td className="px-1">:</td>
              <td>#{notaGameOrderId}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Tanggal</td>
              <td className="px-1">:</td>
              <td>{notaTanggal}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">User ID</td>
              <td className="px-1">:</td>
              <td>{notaGameUserId}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Nickname</td>
              <td className="px-1">:</td>
              <td>{notaGameNickname}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <div className="mb-2 text-center text-sm font-bold tracking-widest break-all">
          ITEM:<br/>
          {notaGameItem}
        </div>

        <div className="border-t border-b border-black py-1 my-2"></div>

        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Harga</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaGameHarga || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr className="font-bold">
              <td className="align-top whitespace-nowrap">Total</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaGameTotal || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          Status: {paymentStatus}<br/>
          Terimakasih telah berbelanja di E4
        </div>
      </div>
    )}

    {/* PRINT ONLY SECTION - PULSA */}
    {activeTab === 'pulsa' && (
      <div className="hidden print:block font-mono text-[11px] text-black w-full" style={{ maxWidth: '80mm', margin: '0 0' }}>
        <div className="text-center font-bold text-lg mb-1">E4 STORE</div>
        <div className="text-center mb-3">
          Jl. Zamrud Depan Zamrud 2 RT 42<br />
          WA: 6285169949218
        </div>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          Struk Pengisian Pulsa / Data
        </div>
        
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Order ID</td>
              <td className="px-1">:</td>
              <td>#{notaPulsaOrderId}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Tanggal</td>
              <td className="px-1">:</td>
              <td>{notaTanggal}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">No. HP</td>
              <td className="px-1">:</td>
              <td>{notaPulsaPhone}</td>
            </tr>
            {notaPulsaSN && (
              <tr>
                <td className="align-top whitespace-nowrap">SN/Ref</td>
                <td className="px-1">:</td>
                <td>{notaPulsaSN}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2"></div>
        
        <div className="mb-2 text-center text-sm font-bold tracking-widest break-all">
          PRODUK:<br/>
          {notaPulsaItem}
        </div>

        <div className="border-t border-b border-black py-1 my-2"></div>

        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Harga</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaPulsaHarga || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr className="font-bold">
              <td className="align-top whitespace-nowrap">Total</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(notaPulsaTotal || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          Status: {paymentStatus}<br/>
          Terimakasih telah berbelanja di E4
        </div>
      </div>
    )}

    {/* PRINT ONLY SECTION - PASCA */}
    {activeTab === 'pasca' && (
      <div className="hidden print:block font-mono text-[11px] text-black w-full" style={{ maxWidth: '80mm', margin: '0 0' }}>
        <div className="text-center font-bold text-lg mb-1">E4 STORE</div>
        <div className="text-center mb-3">
          Jl. Zamrud Depan Zamrud 2 RT 42<br />
          WA: 6285169949218
        </div>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          {pascaType === 'pln' ? 'TAGIHAN LISTRIK PASCA BAYAR' : 'TAGIHAN PASCABAYAR PDAM'}
        </div>
        
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Order ID</td>
              <td className="px-1">:</td>
              <td>#{generateOrderId()}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Tanggal</td>
              <td className="px-1">:</td>
              <td>{notaTanggal}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">ID Pelanggan</td>
              <td className="px-1">:</td>
              <td>{pascaIdPel}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Nama</td>
              <td className="px-1">:</td>
              <td>{pascaNama}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Bulan/Thn</td>
              <td className="px-1">:</td>
              <td>{pascaPeriode}</td>
            </tr>
            {pascaType === 'pln' && (
            <tr>
              <td className="align-top whitespace-nowrap">Stand Meter</td>
              <td className="px-1">:</td>
              <td>{pascaStand}</td>
            </tr>
            )}
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2"></div>

        <table className="w-full mb-2">
          <tbody>
            <tr className="font-bold">
              <td className="align-top whitespace-nowrap">Tagihan</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {Number(pascaTotal || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
           Status: {paymentStatus}<br/>
           Terimakasih telah berbelanja di E4
        </div>
      </div>
    )}

    {/* PRINT ONLY SECTION - CART */}
    {activeTab === 'cart' && (() => {
      const itemsToPrint = cartPrintTarget ? cart.filter(item => (item.customerName?.trim() || 'Tanpa Nama/Lainnya') === cartPrintTarget) : cart;
      const printGrandTotal = itemsToPrint.reduce((sum, item) => sum + item.harga, 0);

      return (
      <div className="hidden print:block font-mono text-[11px] text-black w-full" style={{ maxWidth: '80mm', margin: '0 0' }}>
        <div className="text-center font-bold text-lg mb-1">E4 STORE</div>
        <div className="text-center mb-3">
          Jl. Zamrud Depan Zamrud 2 RT 42<br />
          WA: 6285169949218
        </div>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
          {cartPrintTarget ? 'NOTA TRANSAKSI' : 'NOTA BORONGAN'}
        </div>
        
        <table className="w-full mb-4">
          <tbody>
            <tr>
              <td className="align-top whitespace-nowrap">Order ID</td>
              <td className="px-1">:</td>
              <td>#{generateOrderId()}</td>
            </tr>
            <tr>
              <td className="align-top whitespace-nowrap">Tanggal</td>
              <td className="px-1">:</td>
              <td>{notaTanggal}</td>
            </tr>
          </tbody>
        </table>

        {(Object.entries(itemsToPrint.reduce((acc, item) => {
          const name = item.customerName?.trim() || 'Tanpa Nama/Lainnya';
          if (!acc[name]) acc[name] = [];
          acc[name].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>)) as [string, CartItem[]][]).map(([name, items]) => (
          <div key={name} className="mb-4">
            <div className="border-t border-black py-1 font-bold">
              Pemesan: {name}
            </div>
            {items.map((item, idx) => (
              <div key={item.id} className="mb-2 pl-2">
                <div className="font-bold border-b border-dashed border-gray-400 mb-1">
                  {idx + 1}. {item.title}
                </div>
                <table className="w-full text-[10px]">
                  <tbody>
                    {item.details.map((d, i) => (
                       <tr key={i}>
                         <td className="align-top whitespace-nowrap">{d.label}</td>
                         <td className="px-1">:</td>
                         <td className="break-all">{d.value}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right mt-1">
                   Harga: Rp {Number(item.harga).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
            {!cartPrintTarget && (
              <div className="text-right mt-1 font-bold border-t border-dashed border-black pt-1">
                 Subtotal: Rp {items.reduce((s, i) => s + i.harga, 0).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        ))}

        <div className="border-t border-b border-black py-1 my-2"></div>

        <table className="w-full mb-2">
          <tbody>
            <tr className="font-bold text-[12px]">
              <td className="align-top whitespace-nowrap">Total</td>
              <td className="px-1">:</td>
              <td className="text-right">Rp {printGrandTotal.toLocaleString('id-ID')}</td>
            </tr>
            {(!cartPrintTarget && cartPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) > 0) && (
              <>
                {cartPayments.map((p, idx) => {
                  if (!p.amount) return null;
                  return (
                    <tr className="text-[11px]" key={p.id}>
                      <td className="align-top whitespace-nowrap">{cartPayments.length > 1 ? `Cicilan ${idx + 1}` : 'Uang Bayar'}</td>
                      <td className="px-1">:</td>
                      <td className="text-right">Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold text-[11px]">
                  <td className="align-top whitespace-nowrap">
                    {cartPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) >= cart.reduce((sum, item) => sum + item.harga, 0) ? 'Kembalian' : 'Kurang'}
                  </td>
                  <td className="px-1">:</td>
                  <td className="text-right">Rp {Math.abs(cartPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) - cart.reduce((sum, item) => sum + item.harga, 0)).toLocaleString('id-ID')}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
           {!cartPrintTarget && <><br/>Status: {paymentStatus}<br/></>}
           Terimakasih telah berbelanja di E4
        </div>
      </div>
      );
    })}
    </>
  );
}

