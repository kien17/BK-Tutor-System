import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal'; // Tận dụng Modal để làm form Upload

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    
    // State cho Upload Modal
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

    // Xử lý Upload
    const handleUpload = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        // Dùng FormData để gửi file
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('subject', uploadForm.subject);
        formData.append('description', uploadForm.description);
        formData.append('file', uploadForm.file);

        try {
            await axios.post('http://localhost:5000/api/documents', formData, {
                headers: { 
                    Authorization: token,
                    'Content-Type': 'multipart/form-data' // Bắt buộc khi up file
                }
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

    // Hàm copy link chia sẻ
    const shareDoc = (url) => {
        const fullUrl = `http://localhost:5000/${url}`;
        navigator.clipboard.writeText(fullUrl);
        alert("📋 Đã copy link tài liệu! Gửi cho bạn bè ngay.");
    };

    return (
        <div className="dashboard-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                <h2 style={{color: '#004aad'}}>📚 Kho Tài Liệu BK</h2>
                
                {/* Chỉ Tutor mới thấy nút Upload */}
                {user && user.role === 'tutor' && (
                    <button onClick={() => setShowUpload(true)} className="btn-primary" style={{width:'auto'}}>
                        ☁️ Tải lên tài liệu mới
                    </button>
                )}
            </div>

            {/* Thanh tìm kiếm */}
            <div style={{marginBottom: 20}}>
                <input 
                    type="text" placeholder="🔍 Tìm kiếm theo tên tài liệu, môn học..." 
                    value={search} onChange={handleSearch}
                    style={{width:'100%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc', fontSize: 16}}
                />
            </div>

            {/* Danh sách tài liệu (Card View) */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                {docs.map(doc => (
                    <div key={doc.DocID} style={{background:'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #004aad'}}>
                        <h4 style={{margin: '0 0 5px 0', color: '#333'}}>{doc.Title}</h4>
                        <div style={{fontSize: 12, color: '#666', marginBottom: 10}}>
                            <span style={{background:'#e9ecef', padding:'2px 6px', borderRadius:4, marginRight: 5}}>{doc.Subject}</span>
                            bởi <strong>{doc.UploaderName}</strong>
                        </div>
                        <p style={{fontSize: 14, color: '#555', height: 40, overflow:'hidden'}}>{doc.Description}</p>
                        
                        <div style={{marginTop: 15, display:'flex', gap: 10}}>
                           <a 
                                href={`http://localhost:5000/api/download/${doc.Url.split('/').pop()}`} 
                                className="btn-download" // Thêm class để style nếu thích
                                style={{
                                    textDecoration:'none', background:'#004aad', color:'white', 
                                    padding:'8px 12px', borderRadius: 4, fontSize: 13, flex: 1, textAlign:'center',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                }}
                            >
                                📥 Tải Ngay
                            </a>
                            <button onClick={() => shareDoc(doc.Url)} style={{background:'#17a2b8', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>🔗 Share</button>
                            
                            {/* Chỉ hiện nút xóa nếu là Tutor và là file của chính mình */}
                            {user && user.role === 'tutor' && user.id === doc.UploaderID && (
                                <button onClick={() => handleDelete(doc.DocID)} style={{background:'#dc3545', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>🗑</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL UPLOAD */}
            <BookingModal isOpen={showUpload} onClose={() => setShowUpload(false)} title="☁️ Tải lên tài liệu" actions={<button onClick={handleUpload} className="btn-primary">Upload Ngay</button>}>
                <div className="form-group"><label>Tiêu đề:</label><input value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm, title: e.target.value})} /></div>
                <div className="form-group"><label>Môn học:</label><input value={uploadForm.subject} onChange={e=>setUploadForm({...uploadForm, subject: e.target.value})} placeholder="VD: Giải tích 1" /></div>
                <div className="form-group">
                    <label>Mô tả:</label>
                    <textarea 
                        value={uploadForm.description} 
                        onChange={e=>setUploadForm({...uploadForm, description: e.target.value})} 
                        // Tăng chiều cao lên 120px và cho phép kéo giãn
                        style={{
                            width: '100%', 
                            height: '120px', 
                            padding: '10px', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            resize: 'vertical' // Cho phép người dùng tự kéo to nhỏ
                        }} 
                        placeholder="Nhập mô tả chi tiết về tài liệu..."
                    />
                </div>
                <div className="form-group">
                    <label>File (PDF, Word, Ảnh...):</label>
                    <input type="file" onChange={e=>setUploadForm({...uploadForm, file: e.target.files[0]})} style={{border:'none'}} />
                </div>
            </BookingModal>
        </div>
    );
};

export default Documents;