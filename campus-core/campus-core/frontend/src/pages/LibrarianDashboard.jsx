import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BookOpen, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function LibrarianDashboard({ activeTab }) {
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newRfid, setNewRfid] = useState('');

  const [studentRfid, setStudentRfid] = useState('');
  const [bookRfid, setBookRfid] = useState('');
  const [loanDays, setLoanDays] = useState('14');

  const [returnRfid, setReturnRfid] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(false);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const booksData = await api.get('/library/books');
      setBooks(booksData);

      const loansData = await api.get('/library/loans');
      setLoans(loansData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setProcessing(true);

    try {
      await api.post('/library/books', {
        rfid_uid: newRfid,
        title: newTitle,
        author: newAuthor,
        isbn: newIsbn
      });
      setMessage({ type: 'success', text: `Book "${newTitle}" added to catalog.` });
      setNewTitle('');
      setNewAuthor('');
      setNewIsbn('');
      setNewRfid('');
      fetchLibraryData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setProcessing(true);

    try {
      const data = await api.post('/library/loans/issue', {
        student_rfid: studentRfid,
        book_rfid: bookRfid,
        loan_days: parseInt(loanDays, 10)
      });
      setMessage({ type: 'success', text: `Success: Issued "${data.book_title}" to ${data.student_name}.` });
      setStudentRfid('');
      setBookRfid('');
      fetchLibraryData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnBook = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setProcessing(true);

    try {
      const data = await api.post('/library/loans/return', { book_rfid: returnRfid });
      const fineMsg = data.fine > 0 ? ` Overdue fine: Rs. ${data.fine.toFixed(2)}.` : ' No overdue fine.';
      setMessage({ type: 'success', text: `Success: Returned "${data.book_title}".${fineMsg}` });
      setReturnRfid('');
      fetchLibraryData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Digital Library Desk</h2>
          <p className="text-sm text-slate-400">Manage book registries, issue cards, track return due dates and calculate overdue fines</p>
        </div>
        <button
          onClick={fetchLibraryData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-2 border text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalog Roster */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Book Catalog Registry</h3>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Author</th>
                    <th className="pb-3 font-semibold">ISBN</th>
                    <th className="pb-3 font-semibold">RFID Tag</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-b border-slate-850 hover:bg-slate-900/10">
                      <td className="py-2.5 font-medium">{book.title}</td>
                      <td className="py-2.5 text-slate-400">{book.author}</td>
                      <td className="py-2.5 text-slate-400">{book.isbn || 'N/A'}</td>
                      <td className="py-2.5 font-mono text-xs text-blue-400">{book.rfid_uid}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          book.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {book.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Book Form */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <PlusCircle className="h-4.5 w-4.5 text-blue-400" />
              <span>Catalog New Book RFID</span>
            </h3>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">RFID UID Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOOK_UID_06"
                  value={newRfid}
                  onChange={(e) => setNewRfid(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating System Concepts"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Author</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silberschatz"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">ISBN</label>
                <input
                  type="text"
                  placeholder="e.g. 978-0470128725"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                Add Book to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue & Return Desk forms */}
          <div className="space-y-6 lg:col-span-1">
            {/* Issue Book Form */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                <span>Issue Book Checkout</span>
              </h3>
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Student RFID Card UID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 83A2C51B"
                    value={studentRfid}
                    onChange={(e) => setStudentRfid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Book RFID Tag UID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOOK_UID_01"
                    value={bookRfid}
                    onChange={(e) => setBookRfid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Loan Duration (Days)</label>
                  <input
                    type="number"
                    value={loanDays}
                    onChange={(e) => setLoanDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  Confirm Checkout Issue
                </button>
              </form>
            </div>

            {/* Return Book Form */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
                <ArrowDownLeft className="h-5 w-5 text-indigo-400" />
                <span>Return Book Desk</span>
              </h3>
              <form onSubmit={handleReturnBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Book RFID Tag UID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOOK_UID_01"
                    value={returnRfid}
                    onChange={(e) => setReturnRfid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  Process Return
                </button>
              </form>
            </div>
          </div>

          {/* Active Loans ledger */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Active Book Loans Ledger</h3>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Book Title</th>
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} className="border-b border-slate-850 hover:bg-slate-900/10">
                      <td className="py-2.5 font-medium">{loan.title}</td>
                      <td className="py-2.5 text-slate-350">{loan.first_name} {loan.last_name}</td>
                      <td className="py-2.5 text-slate-400">{new Date(loan.issue_date).toLocaleDateString()}</td>
                      <td className="py-2.5 text-slate-400">{new Date(loan.due_date).toLocaleDateString()}</td>
                      <td className="py-2.5 text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.return_date ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {loan.return_date ? 'RETURNED' : 'ISSUED'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-rose-450">
                        {loan.fine_amount > 0 ? `Rs. ${parseFloat(loan.fine_amount).toFixed(2)}` : 'Rs. 0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
