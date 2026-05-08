import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, Button, Alert, CircularProgress, Dialog, 
    DialogTitle, DialogContent, DialogActions, Box, Chip, IconButton, 
    Tooltip, alpha, Fade, Divider
} from '@mui/material';
import {
    DeleteOutlined as DeleteIcon,
    VisibilityOutlined as VisibilityIcon,
    HistoryOutlined as HistoryIcon,
    CheckCircleOutlined as VerifiedIcon,
    HourglassEmptyOutlined as PendingIcon,
    ImageOutlined as ImageIcon
} from '@mui/icons-material';

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem lịch sử.');
            setLoading(false);
            return;
        }

        try {
            try {
                const res = await axios.get('http://localhost:8080/api/history-with-reviews', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data || []);
                setLoading(false);
                return;
            } catch (err) {
                console.log("Sử dụng fallback endpoint...");
            }

            const res = await axios.get('http://localhost:8080/api/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const deleteItem = async (id) => {
        const token = localStorage.getItem('token');
        if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
        try {
            await axios.delete(`http://localhost:8080/api/history/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(history.filter(item => item.id !== id));
        } catch (err) {
            alert('Xóa thất bại');
        }
    };

    const clearAllHistory = async () => {
        const token = localStorage.getItem('token');
        if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ lịch sử. Tiếp tục?')) return;
        try {
            await axios.delete('http://localhost:8080/api/history/clear', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory([]);
        } catch (err) {
            alert('Xóa toàn bộ thất bại');
        }
    };

    const openDetail = (record) => setSelectedRecord(record);

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
            <CircularProgress color="success" />
            <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Đang tải hồ sơ bệnh án...</Typography>
        </Box>
    );

    return (
        <Fade in={true}>
            <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Box sx={{ bgcolor: '#10b981', p: 1, borderRadius: '12px', display: 'flex' }}>
                                <HistoryIcon sx={{ color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-1px' }}>
                                Lịch sử chẩn đoán
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', ml: 6 }}>
                            Quản lý và xem lại các kết quả kiểm tra X-quang của bạn
                        </Typography>
                    </Box>
                    
                    {history.length > 0 && (
                        <Button
                            variant="text"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={clearAllHistory}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}
                        >
                            Xóa tất cả
                        </Button>
                    )}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                {history.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
                        <Box sx={{ mb: 2, opacity: 0.3 }}><HistoryIcon sx={{ fontSize: 60 }} /></Box>
                        <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>Chưa có dữ liệu lịch sử</Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Các kết quả chẩn đoán AI sẽ xuất hiện tại đây.</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thời gian thực hiện</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Hình ảnh</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Kết quả AI</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Trạng thái xác minh</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', pr: 4 }}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((item) => (
                                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ 
                                                width: 60, height: 60, borderRadius: '12px', overflow: 'hidden', 
                                                mx: 'auto', border: '2px solid #f1f5f9', cursor: 'pointer' 
                                            }} onClick={() => openDetail(item)}>
                                                <img
                                                    src={`http://localhost:8080${item.imagePath}`}
                                                    alt="X-ray"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'} 
                                                variant="soft"
                                                sx={{ 
                                                    fontWeight: 800, 
                                                    fontSize: '0.75rem',
                                                    bgcolor: item.label === 'Pneumonia' ? alpha('#ef4444', 0.1) : alpha('#10b981', 0.1),
                                                    color: item.label === 'Pneumonia' ? '#ef4444' : '#10b981'
                                                }}
                                            />
                                            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#94a3b8', fontWeight: 600 }}>
                                                {(item.confidence * 100).toFixed(1)}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {item.reviewed ? (
                                                <Chip 
                                                    icon={<VerifiedIcon style={{ color: '#059669', fontSize: '1rem' }} />} 
                                                    label="Bác sĩ đã duyệt" 
                                                    sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.7rem' }}
                                                />
                                            ) : (
                                                <Chip 
                                                    icon={<PendingIcon style={{ fontSize: '1rem' }} />} 
                                                    label="Đang chờ duyệt" 
                                                    variant="outlined"
                                                    sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', borderStyle: 'dashed' }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 3 }}>
                                            <Tooltip title="Xem chi tiết">
                                                <IconButton onClick={() => openDetail(item)} sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05), mr: 1 }}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa bản ghi">
                                                <IconButton onClick={() => deleteItem(item.id)} sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog 
                    open={!!selectedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                    maxWidth="md" 
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', pb: 1 }}>
                        Báo cáo chẩn đoán chi tiết
                    </DialogTitle>
                    
                    <DialogContent>
                        {selectedRecord && (
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ImageIcon fontSize="small" /> Hình ảnh X-quang
                                        </Typography>
                                        <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
                                            <img
                                                src={`http://localhost:8080${selectedRecord.imagePath}`}
                                                alt="X-ray detail"
                                                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                            />
                                        </Paper>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Kết quả AI</Typography>
                                            <Typography variant="h5" sx={{ 
                                                fontWeight: 900, 
                                                color: selectedRecord.label === 'Pneumonia' ? '#ef4444' : '#10b981' 
                                            }}>
                                                {selectedRecord.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                Độ tin cậy: <strong>{(selectedRecord.confidence * 100).toFixed(2)}%</strong>
                                            </Typography>
                                        </Box>

                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: selectedRecord.reviewed ? alpha('#10b981', 0.05) : '#fffbeb', border: '1px solid', borderColor: selectedRecord.reviewed ? '#10b981' : '#fef3c7' }}>
                                            <Typography variant="overline" sx={{ color: selectedRecord.reviewed ? '#059669' : '#b45309', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {selectedRecord.reviewed ? <VerifiedIcon sx={{ fontSize: 16 }} /> : <PendingIcon sx={{ fontSize: 16 }} />}
                                                Ý kiến chuyên gia
                                            </Typography>
                                            
                                            {selectedRecord.reviewed ? (
                                                <>
                                                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 1, color: '#1e293b' }}>
                                                        Kết luận: {selectedRecord.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#475569' }}>
                                                        "{selectedRecord.doctorComment || 'Bác sĩ không để lại lời nhắn.'}"
                                                    </Typography>
                                                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                                        Bác sĩ: <strong>{selectedRecord.doctorName}</strong>
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="body2" sx={{ mt: 1, color: '#92400e' }}>
                                                    Kết quả đang chờ bác sĩ xác nhận.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button 
                            onClick={() => setSelectedRecord(null)}
                            variant="contained"
                            disableElevation
                            sx={{ borderRadius: '10px', bgcolor: '#1e293b', px: 4, '&:hover': { bgcolor: '#0f172a' } }}
                        >
                            Đóng báo cáo
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
}

export default History;