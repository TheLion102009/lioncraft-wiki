import { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Mail, BookOpen, Plus, Edit, Trash2, Save, X, Search, LogIn } from 'lucide-react';

export default function MinecraftWikiCMS() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'Regeln',
    image: ''
  });

  const categories = ['Alle', 'Regeln', 'Guides', 'Befehle', 'Events', 'Plugins', 'Sonstiges'];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/wiki/articles');
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Artikel:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwörter stimmen nicht überein!', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin
          ? { username: formData.username, password: formData.password }
          : { username: formData.username, email: formData.email, password: formData.password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: 'success' });

        if (isLogin) {
          setCurrentUser(data.user);
          setShowLoginModal(false);
          handleReset();
        } else {
          setTimeout(() => {
            setIsLogin(true);
            handleReset();
          }, 1500);
        }
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Verbindung zum Server fehlgeschlagen!', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setMessage({ text: '', type: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setIsEditing(false);
    setEditingArticle(null);
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingArticle
          ? `http://localhost:5000/api/wiki/articles/${editingArticle.id}`
          : 'http://localhost:5000/api/wiki/articles';

      const method = editingArticle ? 'PUT' : 'POST';
      const body = editingArticle
          ? articleForm
          : { ...articleForm, authorId: currentUser.id };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        loadArticles();
        setIsEditing(false);
        setEditingArticle(null);
        setArticleForm({ title: '', content: '', category: 'Regeln', image: '' });
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Fehler beim Speichern!', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      image: article.image || ''
    });
    setIsEditing(true);
    setSelectedArticle(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Artikel wirklich löschen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/wiki/articles/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        loadArticles();
        setSelectedArticle(null);
      }
    } catch (error) {
      setMessage({ text: 'Fehler beim Löschen!', type: 'error' });
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'Alle' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">Minecraft Server Wiki</h1>
            </div>
            <div className="flex items-center gap-4">
              {currentUser ? (
                  <>
                    <span className="text-gray-600">👤 {currentUser.username} (Admin)</span>
                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                      Ausloggen
                    </button>
                  </>
              ) : (
                  <button onClick={() => setShowLoginModal(true)} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Admin-Login
                  </button>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {message.text && (
              <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
          )}

          {currentUser && (
              <div className="flex gap-4 mb-6">
                <button onClick={() => { setIsEditing(true); setEditingArticle(null); setSelectedArticle(null); setArticleForm({ title: '', content: '', category: 'Regeln', image: '' }); }} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-lg transition">
                  <Plus className="w-5 h-5" />Neuer Artikel
                </button>
              </div>
          )}

          {currentUser && isEditing && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h2>
                  <button onClick={() => { setIsEditing(false); setEditingArticle(null); }} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleArticleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titel</label>
                    <input type="text" required value={articleForm.title} onChange={(e) => setArticleForm({...articleForm, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="z.B. Server Regeln" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategorie</label>
                    <select value={articleForm.category} onChange={(e) => setArticleForm({...articleForm, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                      {categories.filter(c => c !== 'Alle').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bild-URL (optional)</label>
                    <input type="text" value={articleForm.image} onChange={(e) => setArticleForm({...articleForm, image: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://beispiel.de/bild.png" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Inhalt</label>
                    <textarea required value={articleForm.content} onChange={(e) => setArticleForm({...articleForm, content: e.target.value})} rows="10" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Schreibe hier den Inhalt deines Artikels..." />
                  </div>
                  <button type="submit" disabled={isLoading} style={{ background: 'linear-gradient(to right, #9333ea, #06b6d4)' }} className="w-full text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />{isLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                </form>
              </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Artikel durchsuchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === cat ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    {cat}
                  </button>
              ))}
            </div>
          </div>

          {selectedArticle ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <button onClick={() => setSelectedArticle(null)} className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-2">
                  ← Zurück zur Übersicht
                </button>
                {selectedArticle.image && (
                    <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-96 object-cover rounded-lg mb-6" />
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-sm font-medium">{selectedArticle.category}</span>
                  <span className="text-sm text-gray-500">von {selectedArticle.author}</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">{selectedArticle.title}</h1>
                <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6">{selectedArticle.content}</div>
                {currentUser && (
                    <div className="flex gap-3 pt-6 border-t">
                      <button onClick={() => handleEdit(selectedArticle)} className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
                        <Edit className="w-5 h-5" />Bearbeiten
                      </button>
                      <button onClick={() => handleDelete(selectedArticle.id)} className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5" />Löschen
                      </button>
                    </div>
                )}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map(article => (
                    <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer transform hover:scale-105">
                      {article.image && (<img src={article.image} alt={article.title} className="w-full h-48 object-cover" />)}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">{article.category}</span>
                          <span className="text-sm text-gray-500">von {article.author}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{article.title}</h3>
                        <p className="text-gray-600 line-clamp-3">{article.content}</p>
                      </div>
                    </div>
                ))}
                {filteredArticles.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Keine Artikel gefunden</p>
                      {currentUser && <p className="text-gray-400">Erstelle deinen ersten Artikel!</p>}
                    </div>
                )}
              </div>
          )}
        </div>

        {showLoginModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                  <button onClick={() => { setShowLoginModal(false); handleReset(); }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-4 rounded-full shadow-lg">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    {isLogin ? 'Admin-Login' : 'Registrierung'}
                  </h2>
                  <p className="text-center text-gray-500 mb-8">
                    {isLogin ? 'Melde dich als Admin an' : 'Erstelle ein Admin-Konto'}
                  </p>
                  {message.text && (
                      <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                        {message.text}
                      </div>
                  )}
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Benutzername</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input type="text" required disabled={isLoading} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Benutzername" />
                      </div>
                    </div>
                    {!isLogin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input type="email" required disabled={isLoading} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="email@beispiel.de" />
                          </div>
                        </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input type={showPassword ? "text" : "password"} required disabled={isLoading} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Passwort" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
                          {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    {!isLogin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input type={showConfirmPassword ? "text" : "password"} required disabled={isLoading} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Passwort wiederholen" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3">
                              {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                    )}
                    <button type="submit" disabled={isLoading} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ background: 'linear-gradient(to right, #9333ea, #06b6d4)' }} className="w-full text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition">
                      {isLoading ? '⏳ Laden...' : (isHovered ? '🚀 Los geht\'s!' : (isLogin ? 'Anmelden' : 'Registrieren'))}
                    </button>
                  </form>
                  <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); handleReset(); }} disabled={isLoading} className="text-purple-600 hover:text-purple-800 font-medium">
                      {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}