
import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './UI';
import { ShieldCheckIcon, UserIcon, InboxArrowDownIcon, Cog6ToothIcon, XMarkIcon, PaperAirplaneIcon, QuestionMarkCircleIcon, BeakerIcon } from '@heroicons/react/24/solid';
import emailjs from '@emailjs/browser';

interface AuthProps {
  onLogin: (username: string, isAdmin: boolean, email?: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [error, setError] = useState('');

  // EmailJS Config State
  const [emailConfig, setEmailConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  
  // Test Config State
  const [testEmail, setTestEmail] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('emailjs_config');
    if (savedConfig) {
      setEmailConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('emailjs_config', JSON.stringify(emailConfig));
    setShowConfig(false);
    setError('');
    setTestStatus(null);
    alert('Email Configuration Saved!');
  };
  
  const handleTestConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus(null);

    if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
        setTestStatus({ type: 'error', msg: 'Please fill in Service ID, Template ID, and Public Key first.' });
        return;
    }
    if (!testEmail || !testEmail.includes('@')) {
        setTestStatus({ type: 'error', msg: 'Please enter a valid recipient email for the test.' });
        return;
    }

    setIsTestLoading(true);
    try {
        // We send the data in multiple variable formats to maximize compatibility
        await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templateId,
            {
                to_email: testEmail,
                email: testEmail,
                recipient: testEmail,
                user_email: testEmail,
                to_name: "Test User",
                name: "Test User",
                from_name: "Nova Trade AI",
                
                // Variables for OTP
                passcode: "123456",       // Requested by user
                otp: "123456",            
                code: "123456",           
                verification_code: "123456", 
                
                // Variables for Time/Message
                time: new Date().toLocaleString(), // Requested by user
                message: "This is a test email from Nova Trade AI. Your code is 123456.", 
                my_html: "This is a test email. Your code is <b>123456</b>."
            },
            emailConfig.publicKey
        );
        setTestStatus({ type: 'success', msg: 'Test Email Sent Successfully! Check your inbox to ensure you see "123456".' });
    } catch (err: any) {
        console.error("Test Failed", err);
        setTestStatus({ type: 'error', msg: `Test Failed: ${err.text || 'Unknown Error'}. Check the "To Email" field in your EmailJS Template.` });
    }
    setIsTestLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSimulationMessage(null);
    
    if (!username || !password || !email) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    // Check if real email is configured
    if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
      try {
        await emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId,
          {
            to_email: email.trim(),
            email: email.trim(),
            recipient: email.trim(),
            user_email: email.trim(),
            to_name: username,
            name: username,
            from_name: "Nova Trade AI",
            
            // OTP Variables
            passcode: code,         // Requested by user
            otp: code,              
            code: code,             
            verification_code: code,
            
            // Time/Message Variables
            time: new Date().toLocaleString(), // Requested by user
            message: `Your NovaTrade AI verification code is ${code}`, 
            my_html: `Your NovaTrade AI verification code is <b>${code}</b>`
          },
          emailConfig.publicKey
        );
        
        setIsOtpSent(true);
        setIsLoading(false);
        alert(`Verification code sent to ${email}`);
      } catch (err: any) {
        console.error("EmailJS Error:", err);
        setIsLoading(false);
        setError(`Email Failed: ${err.text || 'Check config'}. Falling back to simulation.`);
        
        // Fallback to simulation after error
        setTimeout(() => {
          setSimulationMessage(`From: Nova Trade AI <security@novatrade.ai>\nSubject: Verification Code\n\nHello ${username},\n\nYour verification code is: ${code}`);
          setIsOtpSent(true);
        }, 1000);
      }
    } else {
      // Simulate email sending delay if no config
      setTimeout(() => {
        setIsOtpSent(true);
        setIsLoading(false);
        
        // Display the code in the UI instead of alert for better UX
        setSimulationMessage(`From: Nova Trade AI <security@novatrade.ai>\nSubject: Verification Code\n\nHello ${username},\n\nYour verification code is: ${code}\n\n(Note: Configure EmailJS in settings for real delivery)`);
      }, 1500);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (isAdminMode) {
      // Mock Admin Credentials
      if (username === 'admin' && password === 'admin123') {
        setTimeout(() => onLogin(username, true), 500);
      } else {
        setError("Invalid Admin Credentials (Try: admin / admin123)");
      }
      return;
    }

    // Standard Login
    setTimeout(() => onLogin(username, false), 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp !== generatedOtp) {
      setError("Invalid OTP. Please check the email/message above.");
      return;
    }

    // Success
    setTimeout(() => onLogin(username, false, email), 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />

      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setShowConfig(true)}
          className="bg-slate-800/50 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
          title="Configure Real Email"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <Card className="w-full max-w-md border-accent shadow-2xl shadow-accent/20 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-accent" /> Email Service Setup
                </h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-slate-900 p-3 rounded mb-4 border border-slate-700">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                  <QuestionMarkCircleIcon className="h-4 w-4 text-yellow-400" /> No Code in Email?
                </h4>
                <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-1">
                   <li>Go to <a href="https://dashboard.emailjs.com/admin/templates" target="_blank" className="text-accent underline">EmailJS Templates</a> and edit your template.</li>
                   <li><strong>Supported Variables:</strong> <span className="font-mono text-emerald-400 bg-slate-950 px-1 rounded">{'{{passcode}}'}</span>, <span className="font-mono text-emerald-400 bg-slate-950 px-1 rounded">{'{{otp}}'}</span>, <span className="font-mono text-emerald-400 bg-slate-950 px-1 rounded">{'{{time}}'}</span></li>
                   <li>Example Body: "Your code is {'{{passcode}}'} sent at {'{{time}}'}".</li>
                   <li>Also ensure "To Email" field has <span className="font-mono text-emerald-400 bg-slate-950 px-1 rounded">{'{{to_email}}'}</span>.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Service ID</label>
                  <Input 
                    value={emailConfig.serviceId} 
                    onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})} 
                    placeholder="service_xxxx" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Template ID</label>
                  <Input 
                    value={emailConfig.templateId} 
                    onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})} 
                    placeholder="template_xxxx" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Public Key</label>
                  <Input 
                    value={emailConfig.publicKey} 
                    onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})} 
                    placeholder="public_key_xxxx" 
                  />
                </div>

                <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                      <BeakerIcon className="h-3 w-3 text-purple-400" /> Test Configuration
                    </h4>
                    <div className="flex gap-2">
                       <Input 
                          value={testEmail} 
                          onChange={e => setTestEmail(e.target.value)} 
                          placeholder="Test recipient email..."
                          className="text-xs h-8" 
                       />
                       <Button 
                          onClick={handleTestConfig} 
                          disabled={isTestLoading}
                          variant="secondary"
                          className="whitespace-nowrap px-2 h-8 text-xs"
                       >
                          {isTestLoading ? 'Sending...' : 'Test Send'}
                       </Button>
                    </div>
                    {testStatus && (
                       <div className={`mt-2 text-xs p-2 rounded ${testStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {testStatus.msg}
                       </div>
                    )}
                </div>

                <Button onClick={handleSaveConfig} className="w-full mt-2">Save Configuration</Button>
              </div>
           </Card>
        </div>
      )}

      <Card className="w-full max-w-md relative z-10 border-slate-800 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-center gap-4 mb-6">
           <button 
             onClick={() => { setIsAdminMode(false); setIsLogin(true); setIsOtpSent(false); setError(''); setSimulationMessage(null); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${!isAdminMode ? 'bg-accent text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-800'}`}
           >
             <UserIcon className="h-4 w-4" /> Trader
           </button>
           <button 
             onClick={() => { setIsAdminMode(true); setIsLogin(true); setIsOtpSent(false); setError(''); setSimulationMessage(null); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isAdminMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-slate-500 hover:bg-slate-800'}`}
           >
             <ShieldCheckIcon className="h-4 w-4" /> Admin
           </button>
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold bg-clip-text text-transparent ${isAdminMode ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-400 to-emerald-400'}`}>
            {isAdminMode ? 'Nova Admin' : 'NovaTrade AI'}
          </h1>
          <p className="text-slate-400 mt-2">
            {isAdminMode ? 'System Management Console' : (isLogin ? 'Welcome back, trader.' : 'Create your secure account.')}
          </p>
        </div>

        {/* Login Form */}
        {isLogin && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <Input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
              <Input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center animate-shake">{error}</p>}

            <Button 
              type="submit" 
              className={`w-full mt-4 ${isAdminMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20' : ''}`}
            >
              {isAdminMode ? 'Access Dashboard' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Sign Up Flow */}
        {!isLogin && (
          <form onSubmit={isOtpSent ? handleRegisterSubmit : handleSendOtp} className="space-y-4 animate-fade-in">
             <div className="mb-2 flex justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                   <span className={!isOtpSent ? "text-accent" : ""}>Step 1: Details</span>
                   <span className="text-slate-700">→</span>
                   <span className={isOtpSent ? "text-emerald-400" : ""}>Step 2: Verify</span>
                </div>
             </div>

             {!isOtpSent ? (
               <>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                    <Input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                    <Input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                    <Input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>
               </>
             ) : (
               <div className="space-y-4 py-2">
                  {/* Simulation Notification */}
                  {simulationMessage && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase mb-1">
                        <InboxArrowDownIcon className="h-4 w-4" /> Simulated Email Inbox
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-blue-200 bg-slate-950/50 p-2 rounded border border-blue-500/10">
                        {simulationMessage}
                      </pre>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-slate-300 mb-2">
                      {emailConfig.serviceId ? 'Code sent via Nova Trade AI to ' : 'Simulating sending to '}
                      <span className="text-white font-bold">{email}</span>
                    </p>
                    <Input 
                      type="text" 
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter OTP Code"
                      className="text-center tracking-[0.5em] font-mono text-lg"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <div className="text-center">
                    <button 
                      type="button" 
                      onClick={() => { setIsOtpSent(false); setSimulationMessage(null); }}
                      className="text-xs text-accent hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
               </div>
             )}

             {error && <p className="text-red-400 text-sm text-center animate-shake">{error}</p>}

             <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending Code...' : (isOtpSent ? 'Verify & Create Account' : 'Send Verification Code')}
              </Button>
          </form>
        )}

        {!isAdminMode && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setIsOtpSent(false); setSimulationMessage(null); }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
