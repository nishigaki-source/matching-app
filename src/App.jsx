import React, { useState, useEffect, useMemo } from 'react';
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
import { Heart, MessageCircle, User, LogOut, Send, MapPin, Mail, Edit2, ArrowLeft, CheckCircle, Lock, Link as LinkIcon, KeyRound, Camera, ImageIcon, Image as ImageIcon2 } from 'lucide-react';

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

// 3. Onboarding (Enhanced with Cover Image)
const Onboarding = ({ user, onComplete, initialData }) => {
  const [formData, setFormData] = useState({
    displayName: initialData?.displayName || '',
    age: initialData?.age || '20',
    gender: initialData?.gender || '未設定',
    prefecture: initialData?.prefecture || '東京都',
    bio: initialData?.bio || '',
  });
  
  // Profile Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.photoURL || null);

  // Cover Image
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverPhotoURL || null);

  const [loading, setLoading] = useState(false);

  // Generic Image Handler
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

      // Upload Profile Image
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      // Upload Cover Image
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
          
          {/* Cover & Profile Image Area */}
          <div className="relative mb-12">
            {/* Cover Image */}
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

            {/* Profile Image (Overlay) */}
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
const Home = ({ profiles, onSelectUser }) => (
  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
    {profiles.length === 0 ? (
      <div className="col-span-full text-center text-gray-500 py-10">
        ユーザーが見つかりませんでした
      </div>
    ) : (
      profiles.map((profile) => (
        <div key={profile.uid} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
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
              onClick={() => onSelectUser(profile)}
              className="w-full bg-rose-50 text-rose-600 font-semibold py-2 rounded-lg hover:bg-rose-100 transition flex items-center justify-center gap-2"
            >
              <Mail size={18} /> メッセージを送る
            </button>
          </div>
        </div>
      ))
    )}
  </div>
);

const MessageDetail = ({ currentUser, targetUser, onClose, messages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

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
        <div>
          <h3 className="font-bold text-gray-800">{targetUser.displayName}</h3>
          <p className="text-xs text-gray-500">{targetUser.prefecture}</p>
        </div>
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
    </div>
  );
};

const MessagesList = ({ currentUser, messages, profiles, onSelectChat }) => {
  const conversationUserIds = useMemo(() => {
    const ids = new Set();
    messages.forEach(m => {
      if (m.from === currentUser.uid) ids.add(m.to);
      if (m.to === currentUser.uid) ids.add(m.from);
    });
    return Array.from(ids);
  }, [messages, currentUser.uid]);

  const conversations = useMemo(() => {
    return conversationUserIds.map(uid => {
      const user = profiles.find(p => p.uid === uid);
      if (!user) return null;
      
      const lastMsg = messages
        .filter(m => (m.from === uid && m.to === currentUser.uid) || (m.from === currentUser.uid && m.to === uid))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
        
      return { user, lastMsg };
    }).filter(Boolean).sort((a, b) => (b.lastMsg?.createdAt?.seconds || 0) - (a.lastMsg?.createdAt?.seconds || 0));
  }, [conversationUserIds, profiles, messages, currentUser.uid]);

  return (
    <div className="pb-20">
      <h2 className="px-4 py-3 text-lg font-bold text-gray-800 border-b">メッセージ</h2>
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Mail size={48} className="mx-auto mb-2 opacity-20" />
          <p>まだメッセージはありません</p>
          <p className="text-sm mt-2">気になる相手にメッセージを送ってみましょう</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map(({ user, lastMsg }) => (
            <div
              key={user.uid}
              onClick={() => onSelectChat(user)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
            >
              <UserAvatar user={user} className="w-12 h-12 flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-800 truncate">{user.displayName}</h3>
                  <span className="text-xs text-gray-400">
                    {lastMsg?.createdAt ? new Date(lastMsg.createdAt.seconds * 1000).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {lastMsg?.from === currentUser.uid ? <span className="text-gray-400 mr-1">あなた:</span> : ''}
                  {lastMsg?.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Profile = ({ profile, isSelf, onEdit, onLogout }) => {
  if (!profile) return null;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="h-32 bg-gray-200 relative overflow-hidden">
        {profile.coverPhotoURL ? (
          <img src={profile.coverPhotoURL} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-rose-200" />
        )}
      </div>
      <div className="px-4 -mt-10 mb-4">
        <div className="flex justify-between items-end">
          <div className="p-1 bg-white rounded-full relative z-10">
            <UserAvatar user={profile} className="w-24 h-24" textSize="text-4xl" />
          </div>
          {isSelf && (
            <button onClick={onEdit} className="bg-white border text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm">
              <Edit2 size={14} /> 編集
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

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">自己紹介</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {profile.bio || "自己紹介文がありません"}
          </p>
        </div>

        {isSelf && (
           <button
             onClick={onLogout}
             className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50"
           >
             <LogOut size={18} /> ログアウト
           </button>
        )}
      </div>
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
  const [chatTarget, setChatTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirePasswordSetup, setRequirePasswordSetup] = useState(false);

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

    return () => {
      unsubMyProfile();
      unsubProfiles();
      unsubMessages();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
    setRequirePasswordSetup(false);
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center text-rose-500">Loading...</div>;

  if (!user) {
    return <AuthScreen />;
  }

  if (requirePasswordSetup && !myProfile) {
    return (
      <PasswordSetup 
        user={user} 
        onComplete={() => setRequirePasswordSetup(false)} 
      />
    );
  }

  if (!myProfile && !isEditing) {
    return (
      <Onboarding 
        user={user} 
        onComplete={() => setMyProfile({})}
      />
    );
  }

  if (isEditing) {
    return (
      <div className="relative">
        <button onClick={() => setIsEditing(false)} className="absolute top-4 left-4 z-10 p-2 bg-gray-200 rounded-full shadow-md">
          <ArrowLeft size={20}/>
        </button>
        {/* 編集時に既存データを渡す */}
        <Onboarding user={user} initialData={myProfile} onComplete={() => setIsEditing(false)} />
      </div>
    );
  }

  if (chatTarget) {
    return (
      <MessageDetail 
        currentUser={user} 
        targetUser={chatTarget} 
        messages={allMessages} 
        onClose={() => setChatTarget(null)} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home profiles={allProfiles} onSelectUser={(u) => setChatTarget(u)} />;
      case 'messages':
        return (
          <MessagesList 
            currentUser={user} 
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
        return <Home profiles={allProfiles} onSelectUser={(u) => setChatTarget(u)} />;
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
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-rose-500' : 'text-gray-400'} relative`}
        >
          <MessageCircle size={24} />
          <span className="text-[10px] font-medium">メッセージ</span>
          {allMessages.some(m => m.to === user.uid && !m.read && m.from !== user.uid) && (
             <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
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
