import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ShieldPlus, Activity, Send, RefreshCw, User, ClipboardList, Wallet, 
  MapPin, Upload, Trash2, LogIn, Database, ChevronRight, FileText,
  AlertCircle, CheckCircle2, Lock
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'user', 'admin', 'login'
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    lifestyle: 'Sedentary',
    conditions: 'None',
    income: 'under 3L',
    city: 'Metro'
  });

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // ... existing admin state ...
  const [adminAuth, setAdminAuth] = useState({ user: '', pass: '' });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [uploadData, setUploadData] = useState({ file: null, insurer: '', policyName: '' });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null); // Track policy being edited

  // Fetch policies when admin view is opened
  useEffect(() => {
    if (isAuthorized && view === 'admin') {
      fetchPolicies();
    }
  }, [isAuthorized, view]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(apiUrl('/admin/policies'), {
        headers: { 'Authorization': 'Basic ' + btoa(`${adminAuth.user}:${adminAuth.pass}`) }
      });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsAuthorized(true);
    setView('admin');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return;

    setUploadLoading(true);
    const fd = new FormData();
    fd.append('file', uploadData.file);
    fd.append('insurer', uploadData.insurer);
    fd.append('policy_name', uploadData.policyName);

    try {
      const response = await fetch(apiUrl('/upload-policy'), {
        method: 'POST',
        body: fd
      });
      if (!response.ok) throw new Error("Upload failed");
      alert("Policy uploaded successfully!");
      setUploadData({ file: null, insurer: '', policyName: '' });
      fetchPolicies();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const deletePolicy = async (filename) => {
    if (!window.confirm(`Delete ${filename}?`)) return;
    try {
      const response = await fetch(apiUrl(`/admin/policy/${filename}`), {
        method: 'DELETE',
        headers: { 'Authorization': 'Basic ' + btoa(`${adminAuth.user}:${adminAuth.pass}`) }
      });
      if (response.ok) fetchPolicies();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl(`/admin/policy/${editingPolicy.filename}`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${adminAuth.user}:${adminAuth.pass}`) 
        },
        body: JSON.stringify({
          insurer: editingPolicy.insurer,
          policy_name: editingPolicy.policy_name,
          upload_date: editingPolicy.upload_date // Keep existing date or update it
        })
      });
      if (response.ok) {
        setEditingPolicy(null);
        fetchPolicies();
        alert("Policy updated!");
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);
    setChatHistory([]); // Clear chat history when new recommendation is generated
    try {
      const payload = { ...formData, conditions: formData.conditions.split(',').map(c => c.trim()) };
      const response = await fetch(apiUrl('/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Server Error");
      setRecommendation(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatQuestion.trim()) return;
    const userMsg = chatQuestion;
    setChatQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch(apiUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg, 
          user_profile: { ...formData, conditions: formData.conditions.split(',').map(c => c.trim()) }
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      alert("Chat error: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
            <Activity className="logo-icon" />
            <div>
              <h1>AarogyaAid AI</h1>
              <p>Trusted Insurance Intelligence</p>
            </div>
          </div>
          <nav>
            <button 
              className={`nav-btn ${view === 'landing' ? 'active' : ''}`} 
              onClick={() => setView('landing')}
            >
              Home
            </button>
            <button 
              className={`nav-btn ${view === 'user' ? 'active' : ''}`} 
              onClick={() => setView('user')}
            >
              <User size={18} /> Get Recommended
            </button>
            <button 
              className={`nav-btn ${view === 'admin' || view === 'login' ? 'active' : ''}`} 
              onClick={() => isAuthorized ? setView('admin') : setView('login')}
            >
              <Lock size={18} /> Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {view === 'landing' && (
          <section className="landing-page fade-in">
            <div className="hero">
              <h2>Smart Health Insurance, <br/>Simplified by AI.</h2>
              <p>Stop guessing. Get personalized health insurance recommendations backed by ground-truth policy data.</p>
              <button className="btn-primary cta-btn" onClick={() => setView('user')}>
                Start Your Free Analysis <ChevronRight size={20} />
              </button>
            </div>

            <div className="features">
              <div className="feature-card">
                <div className="feature-icon"><Database size={24} /></div>
                <h3>Ground-Truth Data</h3>
                <p>We analyze actual policy documents, ensuring your recommendations are based on real coverage details, not generalities.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Activity size={24} /></div>
                <h3>AI-Powered Insights</h3>
                <p>Our advanced AI understands your health profile and lifestyle to find the policy that truly fits your needs.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><ClipboardList size={24} /></div>
                <h3>Deep Comparison</h3>
                <p>Get transparent side-by-side comparisons of premiums, benefits, and waiting periods in seconds.</p>
              </div>
            </div>
          </section>
        )}

        {view === 'login' && (
          <section className="login-screen fade-in">
            <div className="glass-card login-card">
              <h2><LogIn /> Admin Login</h2>
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={adminAuth.user} onChange={e => setAdminAuth({...adminAuth, user: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={adminAuth.pass} onChange={e => setAdminAuth({...adminAuth, pass: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary">Login</button>
              </form>
            </div>
          </section>
        )}

        {view === 'admin' && (
          <div className="admin-dashboard fade-in">
            <section className="glass-card upload-section" style={{ marginBottom: '2rem' }}>
              <h2><Upload /> Upload New Policy</h2>
              <form onSubmit={handleFileUpload} className="upload-grid">
                <div className="form-group" style={{marginBottom: 0}}>
                  <input type="file" accept=".pdf" onChange={e => setUploadData({...uploadData, file: e.target.files[0]})} required />
                </div>
                <div className="form-group" style={{marginBottom: 0}}>
                  <input type="text" placeholder="Insurer" value={uploadData.insurer} onChange={e => setUploadData({...uploadData, insurer: e.target.value})} required />
                </div>
                <div className="form-group" style={{marginBottom: 0}}>
                  <input type="text" placeholder="Policy Name" value={uploadData.policyName} onChange={e => setUploadData({...uploadData, policyName: e.target.value})} required />
                </div>
                <button type="submit" className="btn-primary" disabled={uploadLoading}>
                  {uploadLoading ? "Uploading..." : "Add Policy"}
                </button>
              </form>
            </section>

            <section className="glass-card policies-list">
              <h2><Database /> Knowledge Base</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Insurer</th>
                      <th>Policy</th>
                      <th>Uploaded At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.length > 0 ? policies.map((p, i) => (
                      <tr key={i}>
                        <td><div className="file-cell"><FileText size={14} /> {p.filename}</div></td>
                        <td>
                          {editingPolicy && editingPolicy.filename === p.filename ? (
                            <input 
                              className="edit-input"
                              value={editingPolicy.insurer} 
                              onChange={e => setEditingPolicy({...editingPolicy, insurer: e.target.value})} 
                            />
                          ) : p.insurer}
                        </td>
                        <td>
                          {editingPolicy && editingPolicy.filename === p.filename ? (
                            <input 
                              className="edit-input"
                              value={editingPolicy.policy_name} 
                              onChange={e => setEditingPolicy({...editingPolicy, policy_name: e.target.value})} 
                            />
                          ) : p.policy_name}
                        </td>
                        <td>{p.upload_date}</td>
                        <td>
                          {editingPolicy && editingPolicy.filename === p.filename ? (
                            <div className="edit-actions">
                              <button onClick={handleUpdate} className="save-btn" title="Save">Save</button>
                              <button onClick={() => setEditingPolicy(null)} className="cancel-btn" title="Cancel">Cancel</button>
                            </div>
                          ) : (
                            <div className="action-btns">
                              <button onClick={() => setEditingPolicy({...p})} className="edit-btn" title="Edit Metadata">
                                <RefreshCw size={16} />
                              </button>
                              <button onClick={() => deletePolicy(p.filename)} className="delete-btn" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No policies indexed yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {view === 'user' && (
          <div className="user-view fade-in">
            <section className="glass-card profile-form" style={{ marginBottom: '2rem' }}>
              <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList className="text-secondary" /> Tell us about yourself
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group grid-2">
                  <div>
                    <label><User size={14} /> Full Name</label>
                    <input type="text" placeholder="John Doe" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label>Age</label>
                    <input type="number" placeholder="30" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                </div>
                <div className="form-group grid-2">
                  <div>
                    <label>Lifestyle</label>
                    <select value={formData.lifestyle} onChange={e => setFormData({...formData, lifestyle: e.target.value})}>
                      <option>Sedentary</option><option>Moderate</option><option>Active</option><option>Athlete</option>
                    </select>
                  </div>
                  <div>
                    <label><MapPin size={14} /> City</label>
                    <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                      <option>Metro</option><option>Tier-2</option><option>Tier-3</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Pre-existing Conditions (comma separated)</label>
                  <input type="text" placeholder="None, Diabetes, etc." value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} />
                </div>
                <div className="form-group">
                  <label><Wallet size={14} /> Monthly Income Bracket</label>
                  <select value={formData.income} onChange={e => setFormData({...formData, income: e.target.value})}>
                    <option>under 3L</option><option>3-8L</option><option>8-15L</option><option>15L+</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? <div className="loading-spinner"></div> : <><RefreshCw size={18} /> Generate Recommendation</>}
                </button>
              </form>
            </section>

            <section className="recommendation-output">
              {recommendation ? (
                <div className="glass-card result-card">
                  <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 className="text-accent" /> Your AI Recommendations
                  </h2>
                  
                  <div className="table-container">
                    <h3 style={{ padding: '1rem', fontSize: '0.9rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>6.1 Peer Comparison Table</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Policy Name</th>
                          <th>Insurer</th>
                          <th>Premium (Rs/yr)</th>
                          <th>Cover Amount</th>
                          <th>Waiting Period</th>
                          <th>Key Benefit</th>
                          <th>Suitability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.comparison_table.map((p, i) => (
                          <tr key={i}>
                            <td><strong>{p.policy_name}</strong></td>
                            <td>{p.insurer}</td>
                            <td>{p.premium}</td>
                            <td>{p.cover_amount}</td>
                            <td>{p.waiting_period}</td>
                            <td>{p.key_benefit}</td>
                            <td><div className="score-badge">{p.suitability_score}%</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container">
                    <h3 style={{ padding: '1rem', fontSize: '0.9rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>6.2 Coverage Detail Table</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Inclusions</th>
                          <th>Exclusions</th>
                          <th>Sub-limits</th>
                          <th>Co-pay %</th>
                          <th>Claim Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{recommendation.coverage_details.inclusions}</td>
                          <td>{recommendation.coverage_details.exclusions}</td>
                          <td>{recommendation.coverage_details.sub_limits}</td>
                          <td>{recommendation.coverage_details.copay}</td>
                          <td>{recommendation.coverage_details.claim_type}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="analysis-box">
                    <h3>6.3 "Why This Policy" Explanation</h3>
                    <div className="explanation-content">
                      <ReactMarkdown>{recommendation.why_this_policy}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="chat-interface glass-inset" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} /> Have questions? Ask our AI
                    </h3>
                    <div className="chat-history">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ))}
                      {chatLoading && <div className="chat-bubble ai pulse">Analyzing Knowledge Base...</div>}
                    </div>
                    <div className="chat-input-row">
                      <input 
                        type="text" 
                        value={chatQuestion}
                        onChange={e => setChatQuestion(e.target.value)}
                        placeholder="Ask about specific coverage details..."
                        onKeyDown={e => e.key === 'Enter' && handleChat()}
                      />
                      <button onClick={handleChat} className="send-btn"><Send size={18} /></button>
                    </div>
                    <p className="guardrail-note" style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Note: This AI provides policy comparisons based on indexed documents and does not offer medical or financial advice.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-state glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <ShieldPlus size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                  <h3>Your analysis will appear here</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Complete the profile above to unlock AI-powered health insurance recommendations.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
