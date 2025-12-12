import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);

    const [showUpload, setShowUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', subject: '', description: '', file: null });

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        setUser(u);
        fetchDocs();
    }, []);

    const fetchDocs = async (searchTerm = '') => {
        try {
            const res = await axios.get(`http://localhost:5000/api/documents?search=${searchTerm}`);
            setDocs(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchDocs(e.target.value);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('subject', uploadForm.subject);
        formData.append('description', uploadForm.description);
        formData.append('file', uploadForm.file);

        try {
            await axios.post('http://localhost:5000/api/documents', formData, {
                headers: { Authorization: token, 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Upload thành công!");
            setShowUpload(false);
            fetchDocs();
        } catch (err) { alert("Lỗi upload"); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Xóa tài liệu này?")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/documents/${id}`, { headers: { Authorization: token } });
            fetchDocs();
        } catch (e) { alert("Lỗi xóa (Có thể không phải file của bạn)"); }
    };

    const shareDoc = (url) => {
        const fullUrl = `http://localhost:5000/${url}`;
        navigator.clipboard.writeText(fullUrl);
        alert("📋 Đã copy link tài liệu!");
    };

    return (
        <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h2 style={{ color: '#004aad', margin: 0 }}>📚 Kho Tài Liệu BK</h2>
                {user && user.role === 'tutor' && (
                    <button onClick={() => setShowUpload(true)} style={{
                        background: '#28a745',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: 6,
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>
                        ☁️ Tải lên tài liệu mới
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <div style={{ marginBottom: 25 }}>
                <input 
                    type="text"
                    placeholder="🔍 Tìm kiếm theo tên tài liệu, môn học..."
                    value={search}
                    onChange={handleSearch}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        borderRadius: 8,
                        border: '1px solid #ccc',
                        fontSize: 16,
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* LIST DOCUMENTS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {docs.map(doc => (
                    <div key={doc.DocID} style={{
                        background: 'white',
                        borderRadius: 10,
                        padding: 20,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        borderLeft: '5px solid #004aad',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 12px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.08)'; }}
                    >
                        <div>
                            <h4 style={{ margin: '0 0 6px 0', color: '#004aad' }}>{doc.Title}</h4>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                                <span style={{ background:'#e9ecef', padding:'2px 6px', borderRadius:4, marginRight: 5 }}>{doc.Subject}</span>
                                bởi <strong>{doc.UploaderName}</strong>
                            </div>
                            <p style={{ fontSize: 14, color: '#555', height: 40, overflow:'hidden', textOverflow:'ellipsis' }}>{doc.Description}</p>
                        </div>
                        <div style={{ marginTop: 15, display:'flex', gap: 8 }}>
                            <a 
                                href={`http://localhost:5000/api/download/${doc.Url.split('/').pop()}`} 
                                style={{
                                    flex: 1,
                                    textDecoration:'none',
                                    background:'#004aad',
                                    color:'white',
                                    padding:'8px 10px',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 'bold',
                                    textAlign:'center',
                                    display:'flex',
                                    justifyContent:'center',
                                    alignItems:'center',
                                    gap: 5,
                                    cursor: 'pointer'
                                }}
                            >
                                📥 Tải Ngay
                            </a>
                            <button onClick={() => shareDoc(doc.Url)} style={{
                                flex: 0.8,
                                background:'#17a2b8',
                                color:'white',
                                border:'none',
                                borderRadius:6,
                                fontSize:13,
                                cursor:'pointer'
                            }}>🔗 Share</button>
                            {user && user.role === 'tutor' && user.id === doc.UploaderID && (
                                <button onClick={() => handleDelete(doc.DocID)} style={{
                                    flex: 0.3,
                                    background:'#dc3545',
                                    color:'white',
                                    border:'none',
                                    borderRadius:6,
                                    fontSize:13,
                                    cursor:'pointer'
                                }}>🗑</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* UPLOAD MODAL */}
            <BookingModal isOpen={showUpload} onClose={() => setShowUpload(false)} title="☁️ Tải lên tài liệu" 
                actions={<button onClick={handleUpload} style={{
                    background:'#28a745',
                    color:'white',
                    padding:'10px 16px',
                    borderRadius:6,
                    border:'none',
                    fontWeight:'bold',
                    cursor:'pointer'
                }}>Upload Ngay</button>}>
                <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
                    <div>
                        <label style={{ fontWeight:'bold', marginBottom:5, display:'block' }}>Tiêu đề:</label>
                        <input value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm, title: e.target.value})} style={{ width:'100%', padding:10, borderRadius:6, border:'1px solid #ccc' }} />
                    </div>
                    <div>
                        <label style={{ fontWeight:'bold', marginBottom:5, display:'block' }}>Môn học:</label>
                        <input value={uploadForm.subject} onChange={e=>setUploadForm({...uploadForm, subject: e.target.value})} placeholder="VD: Giải tích 1" style={{ width:'100%', padding:10, borderRadius:6, border:'1px solid #ccc' }} />
                    </div>
                    <div>
                        <label style={{ fontWeight:'bold', marginBottom:5, display:'block' }}>Mô tả:</label>
                        <textarea value={uploadForm.description} onChange={e=>setUploadForm({...uploadForm, description: e.target.value})} 
                            style={{ width:'100%', height:120, padding:10, border:'1px solid #ccc', borderRadius:6, resize:'vertical' }}
                            placeholder="Nhập mô tả chi tiết về tài liệu..." />
                    </div>
                    <div>
                        <label style={{ fontWeight:'bold', marginBottom:5, display:'block' }}>File (PDF, Word, Ảnh...):</label>
                        <input type="file" onChange={e=>setUploadForm({...uploadForm, file: e.target.files[0]})} style={{ border:'none' }} />
                    </div>
                </div>
            </BookingModal>
        </div>
    );
};

export default Documents;
