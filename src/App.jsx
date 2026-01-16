import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { Heart, MessageCircle, User, LogOut, Send, MapPin, Mail, Edit2, ArrowLeft, CheckCircle, Lock, Link as LinkIcon, KeyRound, Camera, ImageIcon, Image as ImageIcon2, Search, Filter, X, ThumbsUp, XCircle, Check, UserX } from 'lucide-react';

// --- Firebase Initialization ---

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // ここにご自身のFirebase設定を入力します
  apiKey: "AIzaSyDeQy2D7lNeTFEejR81pJWX3oaBqjzRfBE",
  authDomain: "matching-app-908db.firebaseapp.com",
  projectId: "matching-app-908db",
  storageBucket: "matching-app-908db.firebasestorage.app",
  messagingSenderId: "997451653778",
  appId: "1:997451653778:web:4711e1979782c6c832fc4b",
  measurementId: "G-L4CLNCX0Q8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants & Helpers ---
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const UserAvatar = ({ user, className = "w-12 h-12", textSize = "text-lg" }) => {
  if (user?.photoURL) {
    return (
      <img 
        src={user.photoURL} 
        alt={user.displayName} 
        className={`${className} rounded-full object-cover border border-gray-200 bg-white`} 
      />
    );
  }
  return (
    <div className={`${className} rounded-full bg-gray-200 flex items-center justify-center ${textSize} font-bold text-gray-500 border border-gray-100`}>
      {user?.displayName?.[0] || <User size={20} />}
    </div>
  );
};

// --- Custom Components ---

// Dual Range Slider Component
const DualRangeSlider = ({ min, max, onChange, initialMin, initialMax }) => {
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);
  const minValRef = useRef(initialMin);
  const maxValRef = useRef(initialMax);
  const range = useRef(null);

  const getPercent = (value) => Math.round(((value - min) / (max - min)) * 100);

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, min, max]);

  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, min, max]);

  useEffect(() => {
    onChange({ min: minVal, max: maxVal });
  }, [minVal, maxVal]);

  return (
    <div className="relative w-full pt-4 pb-2">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1);
          setMinVal(value);
          minValRef.current = value;
        }}
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 && "5" }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1);
          setMaxVal(value);
          maxValRef.current = value;
        }}
        className="thumb thumb--right"
      />

      <div className="slider">
        <div className="slider__track" />
        <div ref={range} className="slider__range bg-rose-500" />
      </div>
      
      <div className="flex justify-between mt-4 text-sm font-medium text-gray-600">
        <span>{minVal}歳</span>
        <span>{maxVal}歳</span>
      </div>

      <style>{`
        .slider {
          position: relative;
          width: 100%;
          height: 6px;
        }
        .slider__track,
        .slider__range {
          position: absolute;
          border-radius: 3px;
          height: 6px;
        }
        .slider__track {
          background-color: #e5e7eb;
          width: 100%;
          z-index: 1;
        }
        .slider__range {
          z-index: 2;
        }
        .thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
          z-index: 3;
          top: 3px;
        }
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          background-color: #fff;
          border: 2px solid #f43f5e;
          border-radius: 50%;
          box-shadow: 0 0 1px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          height: 20px;
          width: 20px;
          margin-top: 0px;
          pointer-events: all;
          position: relative;
        }
        .thumb::-moz-range-thumb {
          background-color: #fff;
          border: 2px solid #f43f5e;
          border-radius: 50%;
          box-shadow: 0 0 1px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          height: 20px;
          width: 20px;
          pointer-events: all;
          position: relative;
        }
      `}</style>
    </div>
  );
};

// --- Components ---

// 1. Auth Screen
const AuthScreen = () => {
  const [authMethod, setAuthMethod] = useState('link');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMethod === 'link') {
        const actionCodeSettings = {
          url: window.location.href,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setLinkSent(true);
      } else {
        if (isRegister) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = "エラーが発生しました。";
      if (err.code === 'auth/wrong-password') msg = "パスワードが間違っています。";
      if (err.code === 'auth/user-not-found') msg = "ユーザーが見つかりません。";
      if (err.code === 'auth/email-already-in-use') msg = "このメールアドレスは既に使用されています。";
      if (err.code === 'auth/weak-password') msg = "パスワードは6文字以上で設定してください。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (linkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-400 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">認証メールを送信しました</h2>
          <p className="text-gray-600 mb-6">
            <strong>{email}</strong> 宛にメールを送信しました。<br />
            URLをクリックして、パスワード設定とプロフィール登録へ進んでください。
          </p>
          <button 
            onClick={() => setLinkSent(false)}
            className="mt-6 text-rose-500 hover:text-rose-700 font-medium"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-400 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-rose-100 p-4 rounded-full">
            <Heart className="w-10 h-10 text-rose-500 fill-current" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          MatchAppへようこそ
        </h1>
        
        <div className="flex border-b mb-6 mt-4">
          <button
            className={`flex-1 pb-2 text-sm font-medium flex items-center justify-center gap-2 ${authMethod === 'link' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'}`}
            onClick={() => { setAuthMethod('link'); setError(''); }}
          >
            <LinkIcon size={16} /> 新規登録 (メール)
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-medium flex items-center justify-center gap-2 ${authMethod === 'password' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'}`}
            onClick={() => { setAuthMethod('password'); setError(''); }}
          >
            <Lock size={16} /> ログイン
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          {authMethod === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                minLength={6}
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? '処理中...' : (
              authMethod === 'link' ? '認証メールを送信' : (isRegister ? '新規登録' : 'ログイン')
            )}
          </button>
        </form>

        {authMethod === 'link' && (
          <p className="text-xs text-center text-gray-400 mt-4">
            メールアドレス宛にログイン用のリンクを送ります。
          </p>
        )}

        {authMethod === 'password' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-rose-500 hover:text-rose-700 font-medium"
            >
              {isRegister ? 'すでにアカウントをお持ちの方はこちら（ログイン）' : 'パスワードで新規登録する場合はこちら'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Password Setup Screen
const PasswordSetup = ({ user, onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await updatePassword(user, password);
      onComplete();
    } catch (err) {
      console.error(err);
      setError('パスワードの設定に失敗しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <KeyRound className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">ログインパスワード設定</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          次回以降のログインに使用するパスワードを設定してください。
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? '設定中...' : 'パスワードを設定して次へ'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. Onboarding
const Onboarding = ({ user, onComplete, initialData }) => {
  const [formData, setFormData] = useState({
    displayName: initialData?.displayName || '',
    age: initialData?.age || '20',
    gender: initialData?.gender || '未設定',
    prefecture: initialData?.prefecture || '東京都',
    bio: initialData?.bio || '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.photoURL || null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverPhotoURL || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoURL = initialData?.photoURL || '';
      let coverPhotoURL = initialData?.coverPhotoURL || '';

      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      if (coverFile) {
        const storageRef = ref(storage, `coverImages/${user.uid}/${Date.now()}_${coverFile.name}`);
        const snapshot = await uploadBytes(storageRef, coverFile);
        coverPhotoURL = await getDownloadURL(snapshot.ref);
      }

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), {
        ...formData,
        photoURL,
        coverPhotoURL,
        uid: user.uid,
        email: user.email,
        createdAt: initialData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onComplete();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("プロフィールの保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">プロフィール編集</h2>
          <p className="text-sm text-gray-500 mt-1">
            あなたの魅力を伝えましょう
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="relative mb-12">
            <div className="h-32 bg-gray-200 rounded-lg overflow-hidden relative group">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon2 className="w-8 h-8" />
                </div>
              )}
              <label htmlFor="cover-image" className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <div className="bg-white/80 p-2 rounded-full">
                  <Camera className="w-5 h-5 text-gray-700" />
                </div>
                <input 
                  id="cover-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageChange(e, setCoverFile, setCoverPreview)}
                />
              </label>
            </div>

            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-gray-300 w-8 h-8" />
                  )}
                </div>
                <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-rose-500 p-2 rounded-full cursor-pointer hover:bg-rose-600 transition shadow-sm border-2 border-white">
                  <Camera className="text-white w-4 h-4" />
                  <input 
                    id="profile-image" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageChange(e, setImageFile, setImagePreview)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="例: たろう"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                >
                  {Array.from({ length: 80 }, (_, i) => i + 18).map(age => (
                    <option key={age} value={age}>{age}歳</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="未設定">未設定</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お住まいのエリア</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.prefecture}
                onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
              >
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
              <textarea
                required
                className="w-full border rounded-lg p-2 h-24"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="趣味や休日の過ごし方など..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-lg hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存してはじめる'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 4. Main App Components
const Home = ({ profiles, onViewProfile }) => {
  const [filterGender, setFilterGender] = useState('すべて');
  const [filterPrefecture, setFilterPrefecture] = useState('すべて');
  const [filterAgeRange, setFilterAgeRange] = useState({ min: 18, max: 60 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (filterGender !== 'すべて' && profile.gender !== filterGender) return false;
      if (filterPrefecture !== 'すべて' && profile.prefecture !== filterPrefecture) return false;
      const age = parseInt(profile.age, 10);
      if (age < filterAgeRange.min || age > filterAgeRange.max) return false;
      return true;
    });
  }, [profiles, filterGender, filterPrefecture, filterAgeRange]);

  return (
    <div className="pb-20">
      {/* 検索・絞り込みバー */}
      <div className="bg-white sticky top-14 z-10 shadow-sm border-b">
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="w-full flex items-center justify-between p-4 text-gray-700 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <Search size={20} className="text-rose-500" />
            <span className="font-bold text-sm">検索条件を変更する</span>
          </div>
          <Filter size={18} className="text-rose-500" />
        </button>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Filter size={18} /> 検索条件
              </h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* 性別 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">性別</label>
                <div className="flex gap-2">
                  {['すべて', '男性', '女性', 'その他'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFilterGender(g)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition ${filterGender === g ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* エリア */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">エリア</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <select 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none appearance-none"
                    value={filterPrefecture}
                    onChange={(e) => setFilterPrefecture(e.target.value)}
                  >
                    <option value="すべて">全国</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 年齢 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">年齢 ({filterAgeRange.min}歳 - {filterAgeRange.max}歳)</label>
                <div className="px-2 pt-2 pb-6">
                  <DualRangeSlider 
                    min={18} 
                    max={80} 
                    initialMin={filterAgeRange.min}
                    initialMax={filterAgeRange.max}
                    onChange={setFilterAgeRange} 
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
               <button 
                onClick={() => {
                  setFilterGender('すべて');
                  setFilterPrefecture('すべて');
                  setFilterAgeRange({ min: 18, max: 60 });
                }}
                className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition text-sm"
              >
                リセット
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Search size={18} /> この条件で検索
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>条件に一致するユーザーが見つかりませんでした</p>
            <button 
              onClick={() => {
                setFilterGender('すべて');
                setFilterPrefecture('すべて');
                setFilterAgeRange({ min: 18, max: 60 });
              }}
              className="mt-4 text-rose-500 text-sm font-medium hover:underline"
            >
              条件をリセットする
            </button>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div 
              key={profile.uid} 
              className="bg-white rounded-xl shadow overflow-hidden flex flex-col cursor-pointer transition hover:shadow-md"
              onClick={() => onViewProfile(profile)}
            >
              <div className="h-24 bg-gray-200 relative">
                {profile.coverPhotoURL ? (
                  <img src={profile.coverPhotoURL} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-100" />
                )}
                <div className="absolute -bottom-6 left-4">
                  <UserAvatar user={profile} className="w-16 h-16" textSize="text-2xl" />
                </div>
              </div>
              <div className="pt-8 px-4 pb-4 flex-grow">
                <h3 className="text-lg font-bold text-gray-800">{profile.displayName}</h3>
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5"><MapPin size={14} /> {profile.prefecture}</span>
                  <span className="flex items-center gap-0.5"><User size={14} /> {profile.age}歳</span>
                </div>
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // カードクリックと重複しないようにする
                    // Homeから直接いいねできないようにする場合、ここは削除か別の処理
                    onViewProfile(profile);
                  }}
                  className="w-full bg-rose-50 text-rose-600 font-semibold py-2 rounded-lg hover:bg-rose-100 transition flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> 詳細をみる
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Likes List (Incoming Likes)
const LikesList = ({ currentUser, likes, profiles, onAnswer }) => {
  if (likes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Heart size={48} className="mx-auto mb-2 opacity-20" />
        <p>まだ「いいね」は届いていません</p>
      </div>
    );
  }

  return (
    <div className="pb-20 p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 border-l-4 border-rose-500">あなたへのいいね</h2>
      {likes.map(like => {
        const profile = profiles.find(p => p.uid === like.from);
        if (!profile) return null;
        return (
          <div key={like.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={profile} className="w-12 h-12" />
              <div>
                <h3 className="font-bold text-gray-800">{profile.displayName} <span className="text-xs font-normal text-gray-500">({profile.age}歳)</span></h3>
                <p className="text-xs text-gray-500">{profile.prefecture}</p>
              </div>
            </div>
            
            {like.message && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                "{like.message}"
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => onAnswer(like, false)}
                className="flex-1 border border-gray-300 text-gray-500 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-gray-100"
              >
                <XCircle size={16} /> ごめんなさい
              </button>
              <button 
                onClick={() => onAnswer(like, true)}
                className="flex-1 bg-rose-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-rose-600"
              >
                <Check size={16} /> マッチング
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MessageDetail = ({ currentUser, targetUser, onClose, messages, onUnmatch }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);

  const chatHistory = useMemo(() => {
    return messages.filter(m => 
      (m.from === currentUser.uid && m.to === targetUser.uid) ||
      (m.from === targetUser.uid && m.to === currentUser.uid)
    ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [messages, currentUser.uid, targetUser.uid]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        from: currentUser.uid,
        to: targetUser.uid,
        content: newMessage,
        createdAt: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <UserAvatar user={targetUser} className="w-10 h-10" />
        <div className="flex-grow">
          <h3 className="font-bold text-gray-800">{targetUser.displayName}</h3>
          <p className="text-xs text-gray-500">{targetUser.prefecture}</p>
        </div>
        <button 
          onClick={() => setShowUnmatchModal(true)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
          title="さようなら（マッチング解除）"
        >
          <UserX size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>メッセージ履歴はありません。</p>
            <p>最初のメッセージを送りましょう！</p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isMe = msg.from === currentUser.uid;
            return (
              <div key={msg.id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          className="flex-grow border rounded-full px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
          placeholder="メッセージを入力..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Unmatch Confirmation Modal */}
      {showUnmatchModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-fade-in-up text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <UserX className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">マッチングを解除しますか？</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              相手とのメッセージは全て見られなくなり、元に戻すことはできません。本当によろしいですか？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUnmatchModal(false)}
                className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                キャンセル
              </button>
              <button 
                onClick={() => {
                  onUnmatch(targetUser.uid);
                  setShowUnmatchModal(false);
                }}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition shadow-md"
              >
                解除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MessagesList = ({ currentUser, matches, profiles, onSelectChat }) => {
  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
        <p>まだマッチングした相手がいません</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <h2 className="px-4 py-3 text-lg font-bold text-gray-800 border-b">メッセージ</h2>
      <div className="divide-y">
        {matches.map((match) => {
          const otherUid = match.from === currentUser.uid ? match.to : match.from;
          const user = profiles.find(p => p.uid === otherUid);
          if (!user) return null;

          return (
            <div
              key={match.id}
              onClick={() => onSelectChat(user)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
            >
              <UserAvatar user={user} className="w-12 h-12 flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-800 truncate">{user.displayName}</h3>
                  <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">MATCHED</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  チャットを始めましょう
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Profile = ({ profile, isSelf, onEdit, onLogout, onClose, onLike }) => {
  const [likeMessage, setLikeMessage] = useState('');
  const [isLikeModalOpen, setIsLikeModalOpen] = useState(false);

  if (!profile) return null;

  const handleLikeSubmit = () => {
    if (onLike) {
      onLike(profile, likeMessage);
      setIsLikeModalOpen(false);
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen relative">
      {!isSelf && onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 z-20 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition backdrop-blur-sm"
        >
          <X size={20} />
        </button>
      )}

      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {profile.coverPhotoURL ? (
          <img src={profile.coverPhotoURL} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-rose-200" />
        )}
      </div>
      <div className="px-4 -mt-12 mb-4 relative z-10">
        <div className="flex justify-between items-end">
          <div className="p-1 bg-white rounded-full shadow-md">
            <UserAvatar user={profile} className="w-24 h-24" textSize="text-4xl" />
          </div>
          {isSelf ? (
            <button onClick={onEdit} className="bg-white border text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm mb-2">
              <Edit2 size={14} /> 編集
            </button>
          ) : (
            <button 
              onClick={() => setIsLikeModalOpen(true)}
              className="bg-rose-500 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-rose-600 flex items-center gap-2 shadow-md mb-2 transform transition active:scale-95"
            >
              <ThumbsUp size={18} /> いいね！
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {profile.displayName}
            <span className="text-lg font-normal text-gray-500">({profile.age})</span>
          </h1>
          <p className="text-rose-500 text-sm font-medium mt-1">{profile.gender} • {profile.prefecture}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">自己紹介</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {profile.bio || "自己紹介文がありません"}
          </p>
        </div>
        
        {isSelf && (
           <button
             onClick={onLogout}
             className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50 mt-8"
           >
             <LogOut size={18} /> ログアウト
           </button>
        )}
      </div>

      {isLikeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <ThumbsUp className="text-rose-500" /> いいね！を送る
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              相手にメッセージを添えてアピールしましょう（1通のみ送れます）。
            </p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none mb-4 h-24"
              placeholder="はじめまして！プロフィールを見て気になりました..."
              value={likeMessage}
              onChange={(e) => setLikeMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsLikeModalOpen(false)}
                className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition"
              >
                キャンセル
              </button>
              <button 
                onClick={handleLikeSubmit}
                className="flex-1 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition shadow-md"
              >
                送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Container
export default function App() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [allProfiles, setAllProfiles] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirePasswordSetup, setRequirePasswordSetup] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);

  // 1. Authentication Logic
  useEffect(() => {
    const handleAuth = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('確認のため、メールアドレスをもう一度入力してください');
        }
        
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
            setRequirePasswordSetup(true);
          } catch (error) {
            console.error("Link sign-in error:", error);
            alert("ログインに失敗しました。リンクの有効期限が切れている可能性があります。");
          }
        }
      }
    };
    handleAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setMyProfile(null);
        setRequirePasswordSetup(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;

    const unsubMyProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMyProfile(docSnap.data());
        setRequirePasswordSetup(false);
      } else {
        setMyProfile(null);
      }
    });

    const qProfiles = query(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'));
    const unsubProfiles = onSnapshot(qProfiles, (snapshot) => {
      const profiles = [];
      snapshot.forEach(doc => {
        if (doc.id !== user.uid) profiles.push(doc.data());
      });
      setAllProfiles(profiles);
    });

    const qMessages = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setAllMessages(msgs);
    });

    const qInteractions = query(collection(db, 'artifacts', appId, 'public', 'data', 'interactions'));
    const unsubInteractions = onSnapshot(qInteractions, (snapshot) => {
      const inters = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.from === user.uid || data.to === user.uid) {
          inters.push({ id: doc.id, ...data });
        }
      });
      setInteractions(inters);
    });

    return () => {
      unsubMyProfile();
      unsubProfiles();
      unsubMessages();
      unsubInteractions();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
    setRequirePasswordSetup(false);
  };

  useEffect(() => {
    setViewingProfile(null);
    setChatTarget(null);
    setIsEditing(false);
  }, [activeTab]);

  const homeProfiles = useMemo(() => {
    return allProfiles.filter(p => {
      const exists = interactions.some(i => (i.from === user?.uid && i.to === p.uid) || (i.from === p.uid && i.to === user?.uid));
      return !exists;
    });
  }, [allProfiles, interactions, user]);

  const incomingLikes = useMemo(() => {
    return interactions.filter(i => i.to === user?.uid && i.status === 'pending');
  }, [interactions, user]);

  const myMatches = useMemo(() => {
    return interactions.filter(i => i.status === 'matched');
  }, [interactions]);

  const sendLike = async (targetProfile, message) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'interactions'), {
        from: user.uid,
        to: targetProfile.uid,
        type: 'like',
        status: 'pending',
        message: message,
        createdAt: serverTimestamp()
      });
      alert('いいねを送りました！');
      setViewingProfile(null);
    } catch (e) {
      console.error(e);
      alert('エラーが発生しました');
    }
  };

  const answerLike = async (interaction, isYes) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'interactions', interaction.id);
      if (isYes) {
        await updateDoc(docRef, { status: 'matched' });
        if (interaction.message) {
           await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
            from: interaction.from,
            to: interaction.to,
            content: interaction.message,
            createdAt: serverTimestamp(),
            read: false
          });
        }
        alert('マッチングしました！メッセージ画面からチャットできます。');
      } else {
        await updateDoc(docRef, { status: 'rejected' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnmatch = async (targetUid) => {
    // Find interaction between current user and targetUid
    const interaction = interactions.find(i => 
      (i.from === user.uid && i.to === targetUid) || 
      (i.from === targetUid && i.to === user.uid)
    );

    if (interaction) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'interactions', interaction.id);
        await updateDoc(docRef, { status: 'rejected' }); // Or 'goodbye' status
        setChatTarget(null); // Close chat
      } catch (e) {
        console.error("Unmatch error:", e);
        alert("解除に失敗しました。");
      }
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center text-rose-500">Loading...</div>;

  if (!user) return <AuthScreen />;

  if (requirePasswordSetup && !myProfile) return <PasswordSetup user={user} onComplete={() => setRequirePasswordSetup(false)} />;

  if (!myProfile && !isEditing) return <Onboarding user={user} onComplete={() => setMyProfile({})} />;

  if (isEditing) {
    return (
      <div className="relative">
        <button onClick={() => setIsEditing(false)} className="absolute top-4 left-4 z-10 p-2 bg-gray-200 rounded-full shadow-md">
          <ArrowLeft size={20}/>
        </button>
        <Onboarding user={user} initialData={myProfile} onComplete={() => setIsEditing(false)} />
      </div>
    );
  }

  if (viewingProfile) {
    return (
      <Profile 
        profile={viewingProfile} 
        isSelf={false} 
        onClose={() => setViewingProfile(null)}
        onLike={sendLike}
      />
    );
  }

  if (chatTarget) {
    return (
      <MessageDetail 
        currentUser={user} 
        targetUser={chatTarget} 
        messages={allMessages} 
        onClose={() => setChatTarget(null)}
        onUnmatch={handleUnmatch}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            profiles={homeProfiles} 
            onViewProfile={(u) => setViewingProfile(u)}
            onSelectUser={() => {}} 
          />
        );
      case 'likes':
        return (
          <LikesList 
            currentUser={user}
            likes={incomingLikes}
            profiles={allProfiles}
            onAnswer={answerLike}
          />
        );
      case 'messages':
        return (
          <MessagesList 
            currentUser={user} 
            matches={myMatches}
            messages={allMessages} 
            profiles={allProfiles}
            onSelectChat={(u) => setChatTarget(u)} 
          />
        );
      case 'profile':
        return (
          <Profile 
            profile={myProfile} 
            isSelf={true} 
            onEdit={() => setIsEditing(true)}
            onLogout={handleLogout} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen max-w-md mx-auto shadow-2xl relative bg-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold text-rose-500 flex items-center gap-1">
          <Heart className="fill-current" size={24} /> MatchApp
        </h1>
      </header>
      <main className="min-h-screen bg-white">
        {renderContent()}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t py-2 px-6 flex justify-between items-center z-20">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium">さがす</span>
        </button>
        <button 
          onClick={() => setActiveTab('likes')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'likes' ? 'text-rose-500' : 'text-gray-400'} relative`}
        >
          <Heart size={24} />
          <span className="text-[10px] font-medium">お相手から</span>
          {incomingLikes.length > 0 && (
             <span className="absolute top-0 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-rose-500' : 'text-gray-400'} relative`}
        >
          <MessageCircle size={24} />
          <span className="text-[10px] font-medium">メッセージ</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
             <UserAvatar user={myProfile} className="w-full h-full" textSize="text-[10px]" />
          </div>
          <span className="text-[10px] font-medium">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
