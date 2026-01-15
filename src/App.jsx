import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
import { Heart, MessageCircle, User, LogOut, Send, MapPin, Mail, Edit2, ArrowLeft, CheckCircle, Lock, Link as LinkIcon } from 'lucide-react';

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

const AVATAR_COLORS = [
  "bg-red-200", "bg-blue-200", "bg-green-200", "bg-yellow-200",
  "bg-purple-200", "bg-pink-200", "bg-indigo-200", "bg-orange-200"
];

// --- Components ---

// 1. Auth Screen (Supports both Link & Password)
const AuthScreen = () => {
  const [authMethod, setAuthMethod] = useState('link'); // 'link' or 'password'
  const [isRegister, setIsRegister] = useState(false); // Only for password mode
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState('');

  // 認証ハンドラ
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMethod === 'link') {
        // --- メールリンク認証 ---
        const actionCodeSettings = {
          url: window.location.href,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setLinkSent(true);

      } else {
        // --- パスワード認証 ---
        if (isRegister) {
          // 新規登録
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          // ログイン
          await signInWithEmailAndPassword(auth, email, password);
        }
        // 成功すれば onAuthStateChanged が発火して画面遷移する
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

  // リンク送信完了画面
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
            メール内のリンクをクリックして、本登録へ進んでください。
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
        
        {/* 認証方法切り替えタブ */}
        <div className="flex border-b mb-6 mt-4">
          <button
            className={`flex-1 pb-2 text-sm font-medium flex items-center justify-center gap-2 ${authMethod === 'link' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'}`}
            onClick={() => { setAuthMethod('link'); setError(''); }}
          >
            <LinkIcon size={16} /> パスワードレス
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-medium flex items-center justify-center gap-2 ${authMethod === 'password' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'}`}
            onClick={() => { setAuthMethod('password'); setError(''); }}
          >
            <Lock size={16} /> パスワード
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
            メールアドレス宛にログイン用のリンクを送ります。<br/>パスワードを覚える必要はありません。
          </p>
        )}

        {authMethod === 'password' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-rose-500 hover:text-rose-700 font-medium"
            >
              {isRegister ? 'すでにアカウントをお持ちの方はこちら（ログイン）' : '初めての方はこちら（新規登録）'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Onboarding (Initial Profile Setup)
const Onboarding = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    age: '20',
    gender: '未設定',
    prefecture: '東京都',
    bio: '',
    avatarColor: AVATAR_COLORS[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), {
        ...formData,
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
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
          <h2 className="text-2xl font-bold text-gray-800">プロフィール作成</h2>
          <p className="text-sm text-gray-500 mt-1">
            利用を開始するためにユーザー情報を登録してください
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">アイコンカラー</label>
            <div className="flex gap-2 justify-center flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarColor: color })}
                  className={`w-10 h-10 rounded-full ${color} ${formData.avatarColor === color ? 'ring-4 ring-rose-400' : ''}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2 focus:ring-rose-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-lg hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? '保存中...' : '利用を開始する'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. Main App Components
const Home = ({ profiles, onSelectUser }) => (
  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
    {profiles.length === 0 ? (
      <div className="col-span-full text-center text-gray-500 py-10">
        ユーザーが見つかりませんでした
      </div>
    ) : (
      profiles.map((profile) => (
        <div key={profile.uid} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <div className={`h-24 ${profile.avatarColor || 'bg-gray-200'} relative`}>
            <div className="absolute -bottom-6 left-4 bg-white p-1 rounded-full">
              <div className={`w-16 h-16 rounded-full ${profile.avatarColor || 'bg-gray-300'} flex items-center justify-center text-2xl`}>
                {profile.displayName?.[0]}
              </div>
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
        <div className={`w-10 h-10 rounded-full ${targetUser.avatarColor} flex items-center justify-center text-gray-700 font-bold`}>
          {targetUser.displayName?.[0]}
        </div>
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
              <div className={`w-12 h-12 rounded-full ${user.avatarColor} flex-shrink-0 flex items-center justify-center text-lg font-bold text-gray-700`}>
                {user.displayName?.[0]}
              </div>
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
      <div className={`h-32 ${profile.avatarColor || 'bg-gray-300'}`}></div>
      <div className="px-4 -mt-10 mb-4">
        <div className="flex justify-between items-end">
          <div className={`w-24 h-24 rounded-full border-4 border-white ${profile.avatarColor || 'bg-gray-300'} flex items-center justify-center text-4xl shadow-md`}>
            {profile.displayName?.[0]}
          </div>
          {isSelf && (
            <button onClick={onEdit} className="bg-white border text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
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

  // 1. Authentication Logic
  useEffect(() => {
    // メールリンク認証のコールバック処理
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('確認のため、メールアドレスをもう一度入力してください');
      }
      
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((error) => {
            console.error("Link sign-in error:", error);
            alert("ログインに失敗しました。リンクの有効期限が切れている可能性があります。");
          });
      }
    }

    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setMyProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;

    // Fetch My Profile
    const unsubMyProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMyProfile(docSnap.data());
      } else {
        setMyProfile(null); // Profile doesn't exist yet -> trigger Onboarding
      }
    });

    // Fetch All Profiles
    const qProfiles = query(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'));
    const unsubProfiles = onSnapshot(qProfiles, (snapshot) => {
      const profiles = [];
      snapshot.forEach(doc => {
        if (doc.id !== user.uid) profiles.push(doc.data());
      });
      setAllProfiles(profiles);
    });

    // Fetch Messages
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
  };

  // Rendering Flow
  if (authLoading) return <div className="flex h-screen items-center justify-center text-rose-500">Loading...</div>;

  // 1. Not Logged In
  if (!user) {
    return <AuthScreen />;
  }

  // 2. Logged In but No Profile
  if (!myProfile && !isEditing) {
    return (
      <Onboarding 
        user={user} 
        onComplete={() => setMyProfile({})} // Optimistic update
      />
    );
  }

  // 3. Profile Editing
  if (isEditing) {
    return (
      <div className="relative">
        <button onClick={() => setIsEditing(false)} className="absolute top-4 left-4 z-10 p-2 bg-gray-200 rounded-full">
          <ArrowLeft size={20}/>
        </button>
        <Onboarding user={user} onComplete={() => setIsEditing(false)} />
      </div>
    );
  }

  // 4. Chat Overlay
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

  // 5. Main Content
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
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold text-rose-500 flex items-center gap-1">
          <Heart className="fill-current" size={24} /> MatchApp
        </h1>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-white">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
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
             {myProfile?.avatarColor && (
               <div className={`w-full h-full ${myProfile.avatarColor} flex items-center justify-center text-[10px]`}>
                 {myProfile.displayName?.[0]}
               </div>
             )}
          </div>
          <span className="text-[10px] font-medium">マイページ</span>
        </button>
      </nav>
    </div>
  );
}
