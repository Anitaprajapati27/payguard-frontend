import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBalance, addMoney, transferMoney, getTransactions, getFraudAlerts } from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Transfer form
  const [transferForm, setTransferForm] = useState({ email: '', amount: '' });
  const [transferMsg, setTransferMsg] = useState('');
  const [transferError, setTransferError] = useState('');

  // Add money form
  const [addAmount, setAddAmount] = useState('');
  const [addMsg, setAddMsg] = useState('');

  // Fetch balance on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, txnRes, fraudRes] = await Promise.all([
        getBalance(),
        getTransactions(),
        getFraudAlerts()
      ]);
      setBalance(balRes.data);
      setTransactions(txnRes.data.transactions || []);
      setFraudAlerts(fraudRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferMsg('');
    setTransferError('');
    try {
      const idempotencyKey = `txn-${Date.now()}`;
      const res = await transferMoney(
        transferForm.email,
        transferForm.amount,
        idempotencyKey
      );
      setTransferMsg(`✅ ₹${transferForm.amount} sent successfully!`);
      setTransferForm({ email: '', amount: '' });
      fetchData();
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Transfer failed');
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    setAddMsg('');
    try {
      await addMoney(addAmount);
      setAddMsg(`✅ ₹${addAmount} added successfully!`);
      setAddAmount('');
      fetchData();
    } catch (err) {
      setAddMsg('❌ Failed to add money');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">💳 PayGuard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-6">
        {['home', 'transfer', 'add-money', 'transactions', 'fraud-alerts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="px-6 py-6">

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-8 text-center">
              <p className="text-green-100 text-sm mb-2">Wallet Balance</p>
              <h2 className="text-5xl font-bold text-white">
                ₹{balance?.balanceInRupees?.toFixed(2)}
              </h2>
              <p className="text-green-100 text-xs mt-2">{user}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-3xl font-bold text-white mt-1">{transactions.length}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Fraud Alerts</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{fraudAlerts.length}</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="font-semibold text-white">Recent Transactions</h3>
              </div>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {transactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="px-5 py-4 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">
                          Txn #{txn.id}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(txn.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">
                          ₹{(txn.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{txn.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSFER TAB */}
        {activeTab === 'transfer' && (
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-6">Send Money</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">
                    Receiver Email
                  </label>
                  <input
                    type="email"
                    placeholder="priya@example.com"
                    value={transferForm.email}
                    onChange={(e) => setTransferForm({ ...transferForm, email: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>

                {transferMsg && (
                  <div className="bg-green-900 text-green-300 px-4 py-3 rounded-lg text-sm">
                    {transferMsg}
                  </div>
                )}
                {transferError && (
                  <div className="bg-red-900 text-red-300 px-4 py-3 rounded-lg text-sm">
                    🚨 {transferError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-all"
                >
                  Send Money
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADD MONEY TAB */}
        {activeTab === 'add-money' && (
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-6">Add Money</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <form onSubmit={handleAddMoney} className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount to add"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>

                {addMsg && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    addMsg.includes('✅')
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {addMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg"
                >
                  Add Money
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Transaction History</h2>
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="px-5 py-4 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">Transaction #{txn.id}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Sender: {txn.senderWalletId} → Receiver: {txn.receiverWalletId}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(txn.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          ₹{(txn.amount / 100).toFixed(2)}
                        </p>
                        <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FRAUD ALERTS TAB */}
        {activeTab === 'fraud-alerts' && (
          <div>
            <h2 className="text-xl font-bold mb-6">
              Fraud Alerts
              {fraudAlerts.length > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {fraudAlerts.length}
                </span>
              )}
            </h2>
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              {fraudAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  ✅ No fraud alerts — all transactions are clean!
                </p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {fraudAlerts.map((alert) => (
                    <div key={alert.id} className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full font-medium">
                            🚨 {alert.ruleTriggered}
                          </span>
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-red-400 font-bold">
                          ₹{(alert.amountInPaise / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}